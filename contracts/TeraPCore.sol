// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {UniversalContractBase, MessageContext} from "./UniversalContract.sol";
import {TeraPToken} from "./TeraPToken.sol";
import {TeraPSubscription} from "./TeraPSubscription.sol";

/**
 * @title TeraPCore
 * @notice Universal contract for the TeraP wellness platform on ZetaChain.
 *
 * Responsibilities
 * - Therapist registry with anonymous profiles, credential commitments and DAO verification
 * - Session booking with escrow (TERAP, a prepaid subscription, or a ZRC-20 stablecoin from any chain)
 * - Wellness circles with stake-to-join membership
 * - Governor role so {TeraPGovernance} can verify therapists, move treasury funds and tune parameters
 * - Soulbound ERC-721 credentials (for verified therapists) and session receipts (for clients)
 *
 * Payment tokens are treated as 1:1 with TERAP for pricing (rates are quoted per hour in TERAP /
 * USD-pegged units); which ZRC-20s are accepted is a governance decision.
 */
contract TeraPCore is
    Initializable,
    UniversalContractBase,
    ERC721Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;
    using Strings for uint256;

    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    struct TherapistProfile {
        address therapist;
        string anonymousId;
        string[] specializations;
        string credentials; // encrypted credential blob / pointer (e.g. IPFS CID)
        uint256 hourlyRate; // TERAP (18 decimals) per hour
        bool isVerified;
        bool isActive;
        uint256 totalSessions;
        uint256 rating; // average rating, 0-100 (stars * 20)
        uint256 ratingCount;
        uint256 verificationTimestamp;
        bytes32 credentialHash; // commitment to credential documents
        bytes32 encryptionPublicKey; // X25519 public key for E2E session messaging
    }

    enum SessionStatus {
        None,
        Booked,
        Completed,
        Cancelled
    }

    struct TherapySession {
        uint256 sessionId;
        address therapist;
        address client;
        uint256 duration; // minutes
        uint256 cost; // in paymentToken units
        address paymentToken;
        uint256 scheduledAt; // unix time the session starts
        uint256 createdAt;
        SessionStatus status;
        bool paidBySubscription;
        uint8 clientRating; // 1-5, 0 when not rated
        string encryptedNotes;
        uint256 sourceChainId; // 0 for native bookings
    }

    struct WellnessCircle {
        uint256 circleId;
        string name;
        string description;
        address facilitator;
        uint256 memberCount;
        uint256 entryStake;
        bool isActive;
        uint256 createdAt;
    }

    /// @dev Parameter ids for {setParameter}
    uint8 public constant PARAM_PLATFORM_FEE_BPS = 0;
    uint8 public constant PARAM_CLAIM_DELAY = 1;
    uint8 public constant PARAM_LATE_CANCEL_FEE_BPS = 2;

    /// @dev Cross-chain message actions: message = abi.encode(uint8 action, bytes payload)
    uint8 public constant ACTION_BOOK_SESSION = 1; // payload: (address therapist, uint256 duration, uint256 scheduledAt, string notes)
    uint8 public constant ACTION_DONATE = 2; // payload: empty
    uint8 public constant ACTION_JOIN_CIRCLE = 3; // payload: (uint256 circleId); zrc20 must be TERAP

    /// @dev NFT kinds
    uint8 public constant TOKEN_KIND_CREDENTIAL = 1;
    uint8 public constant TOKEN_KIND_SESSION_RECEIPT = 2;

    uint256 public constant BPS = 10_000;
    uint256 public constant LATE_CANCEL_WINDOW = 24 hours;
    uint256 public constant MAX_PLATFORM_FEE_BPS = 2_000; // 20%

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    TeraPToken public terapToken;
    TeraPSubscription public subscription;
    /// @notice DAO contract allowed to perform governor actions alongside the owner
    address public governance;

    mapping(address => TherapistProfile) private _therapists;
    address[] private _therapistList;
    mapping(address => bool) public verifiedTherapists;
    mapping(address => uint256[]) private _therapistSessions;
    mapping(address => uint256[]) private _clientSessions;
    mapping(address => uint256) public userReputationScores;

    mapping(uint256 => TherapySession) private _sessions;
    mapping(uint256 => WellnessCircle) private _circles;
    mapping(uint256 => mapping(address => bool)) private _circleMembers;
    mapping(uint256 => mapping(address => uint256)) private _circleStakes;
    mapping(uint256 => mapping(address => uint256)) private _circleReputation;

    uint256 public nextSessionId;
    uint256 public nextCircleId;
    uint256 public nextTokenId;
    mapping(uint256 => uint8) public tokenKind;
    mapping(uint256 => uint256) public sessionReceiptToken; // sessionId => tokenId
    mapping(address => uint256) public credentialToken; // therapist => tokenId
    string private _baseTokenURI;

    /// @notice Platform fees and donations held per token
    mapping(address => uint256) public treasuryBalances;
    mapping(address => bool) public supportedPaymentTokens;

    uint256 public platformFeeBps; // 250 = 2.5%
    uint256 public sessionClaimDelay; // seconds after session end before therapist can self-claim
    uint256 public lateCancelFeeBps; // share of cost kept by therapist on late client cancellation

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event TherapistRegistered(address indexed therapist, string anonymousId);
    event TherapistUpdated(address indexed therapist);
    event TherapistVerified(address indexed therapist, uint256 timestamp);
    event TherapistRevoked(address indexed therapist);
    event SessionBooked(uint256 indexed sessionId, address indexed therapist, address indexed client);
    event SessionCompleted(uint256 indexed sessionId, uint8 clientRating);
    event SessionCancelled(uint256 indexed sessionId, address indexed by, uint256 refund, uint256 therapistFee);
    event WellnessCircleCreated(uint256 indexed circleId, string name, address facilitator);
    event CircleMemberJoined(uint256 indexed circleId, address indexed member);
    event CircleMemberLeft(uint256 indexed circleId, address indexed member);
    event CircleStatusChanged(uint256 indexed circleId, bool isActive);
    event CrossChainPaymentReceived(address indexed from, address indexed token, uint256 amount, uint256 chainId);
    event TreasuryWithdrawn(address indexed token, address indexed to, uint256 amount);
    event PaymentTokenUpdated(address indexed token, bool supported);
    event ParameterChanged(uint8 indexed param, uint256 value);
    event SubscriptionUpdated(address indexed subscription);
    event GovernanceUpdated(address indexed governance);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error AlreadyRegistered();
    error NotRegistered();
    error AlreadyVerified();
    error NotVerified();
    error InvalidInput();
    error NotParticipant();
    error NotClient();
    error NotTherapist();
    error InvalidSessionState();
    error SessionNotStarted();
    error ClaimTooEarly(uint256 claimableAt);
    error InvalidRating();
    error CircleInactive();
    error AlreadyMember();
    error NotMember();
    error NotFacilitator();
    error NotGovernor();
    error UnsupportedPaymentToken();
    error InsufficientPayment(uint256 required, uint256 provided);
    error InsufficientTreasury();
    error UnknownAction();
    error Soulbound();

    // ---------------------------------------------------------------------
    // Initialization
    // ---------------------------------------------------------------------

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address terapToken_,
        address subscription_,
        string memory name_,
        string memory symbol_,
        address gateway_,
        address owner_
    ) external initializer {
        if (terapToken_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        __ERC721_init(name_, symbol_);
        __Ownable_init(owner_);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        terapToken = TeraPToken(terapToken_);
        subscription = TeraPSubscription(subscription_);
        gateway = gateway_;
        supportedPaymentTokens[terapToken_] = true;

        platformFeeBps = 250; // 2.5%
        sessionClaimDelay = 7 days;
        lateCancelFeeBps = 5_000; // 50%

        nextSessionId = 1;
        nextCircleId = 1;
        nextTokenId = 1;
    }

    /// @dev Owner or the DAO governance contract.
    modifier onlyGovernor() {
        if (msg.sender != owner() && msg.sender != governance) revert NotGovernor();
        _;
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setGateway(address gateway_) external override onlyOwner {
        if (gateway_ == address(0)) revert InvalidGateway();
        gateway = gateway_;
        emit GatewayUpdated(gateway_);
    }

    function setSubscription(address subscription_) external onlyOwner {
        subscription = TeraPSubscription(subscription_);
        emit SubscriptionUpdated(subscription_);
    }

    function setGovernance(address governance_) external onlyOwner {
        governance = governance_;
        emit GovernanceUpdated(governance_);
    }

    function setSupportedPaymentToken(address token, bool supported) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        supportedPaymentTokens[token] = supported;
        emit PaymentTokenUpdated(token, supported);
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        _baseTokenURI = uri;
    }

    /// @notice Update a platform parameter (owner or DAO).
    function setParameter(uint8 param, uint256 value) external onlyGovernor {
        if (param == PARAM_PLATFORM_FEE_BPS) {
            if (value > MAX_PLATFORM_FEE_BPS) revert InvalidInput();
            platformFeeBps = value;
        } else if (param == PARAM_CLAIM_DELAY) {
            sessionClaimDelay = value;
        } else if (param == PARAM_LATE_CANCEL_FEE_BPS) {
            if (value > BPS) revert InvalidInput();
            lateCancelFeeBps = value;
        } else {
            revert InvalidInput();
        }
        emit ParameterChanged(param, value);
    }

    function pause() external onlyGovernor {
        _pause();
    }

    function unpause() external onlyGovernor {
        _unpause();
    }

    /// @notice Move treasury funds (owner or DAO).
    function withdrawTreasury(address token, address to, uint256 amount) external onlyGovernor nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (treasuryBalances[token] < amount) revert InsufficientTreasury();
        treasuryBalances[token] -= amount;
        IERC20(token).safeTransfer(to, amount);
        emit TreasuryWithdrawn(token, to, amount);
    }

    // ---------------------------------------------------------------------
    // Cross-chain entry point
    // ---------------------------------------------------------------------

    /**
     * @notice Entry point for cross-chain calls delivered by the ZetaChain gateway.
     * @dev Non-EVM senders (Bitcoin, Solana, ...) are attributed to a deterministic address derived
     *      from their raw sender bytes so sessions and donations remain queryable per user.
     */
    function onCall(MessageContext calldata context, address zrc20, uint256 amount, bytes calldata message)
        external
        override
        onlyGateway
        whenNotPaused
        nonReentrant
    {
        address user = context.senderEVM != address(0)
            ? context.senderEVM
            : address(uint160(uint256(keccak256(abi.encodePacked(context.chainID, context.sender)))));

        (uint8 action, bytes memory payload) = abi.decode(message, (uint8, bytes));

        if (action == ACTION_BOOK_SESSION) {
            _bookCrossChain(user, zrc20, amount, payload, context.chainID);
        } else if (action == ACTION_JOIN_CIRCLE) {
            if (zrc20 != address(terapToken)) revert UnsupportedPaymentToken();
            uint256 circleId = abi.decode(payload, (uint256));
            _joinCircle(user, circleId, amount, true);
        } else if (action == ACTION_DONATE) {
            treasuryBalances[zrc20] += amount;
            userReputationScores[user] += amount / 100 ether; // 1 point per 100 tokens
        } else {
            revert UnknownAction();
        }

        emit CrossChainPaymentReceived(user, zrc20, amount, context.chainID);
    }

    // ---------------------------------------------------------------------
    // Therapists
    // ---------------------------------------------------------------------

    function registerTherapist(
        string calldata anonymousId,
        string[] memory specializations,
        string calldata encryptedCredentials,
        uint256 hourlyRate,
        bytes32 credentialHash,
        bytes32 encryptionPublicKey
    ) external whenNotPaused {
        if (_therapists[msg.sender].therapist != address(0)) revert AlreadyRegistered();
        if (bytes(anonymousId).length == 0 || hourlyRate == 0) revert InvalidInput();

        TherapistProfile storage p = _therapists[msg.sender];
        p.therapist = msg.sender;
        p.anonymousId = anonymousId;
        p.specializations = specializations;
        p.credentials = encryptedCredentials;
        p.hourlyRate = hourlyRate;
        p.isActive = true;
        p.credentialHash = credentialHash;
        p.encryptionPublicKey = encryptionPublicKey;
        _therapistList.push(msg.sender);

        emit TherapistRegistered(msg.sender, anonymousId);
    }

    function updateTherapistProfile(
        string[] memory specializations,
        string calldata encryptedCredentials,
        uint256 hourlyRate,
        bytes32 credentialHash,
        bytes32 encryptionPublicKey,
        bool isActive
    ) external {
        TherapistProfile storage p = _therapists[msg.sender];
        if (p.therapist == address(0)) revert NotRegistered();
        if (hourlyRate == 0) revert InvalidInput();
        p.specializations = specializations;
        p.credentials = encryptedCredentials;
        p.hourlyRate = hourlyRate;
        p.credentialHash = credentialHash;
        p.encryptionPublicKey = encryptionPublicKey;
        p.isActive = isActive;
        emit TherapistUpdated(msg.sender);
    }

    /// @notice Verify a therapist (owner or DAO via TherapistVerification proposal). Mints a credential NFT.
    function verifyTherapist(address therapist) external onlyGovernor {
        TherapistProfile storage p = _therapists[therapist];
        if (p.therapist == address(0)) revert NotRegistered();
        if (p.isVerified) revert AlreadyVerified();
        p.isVerified = true;
        p.verificationTimestamp = block.timestamp;
        verifiedTherapists[therapist] = true;

        uint256 tokenId = nextTokenId++;
        tokenKind[tokenId] = TOKEN_KIND_CREDENTIAL;
        credentialToken[therapist] = tokenId;
        _mint(therapist, tokenId);

        emit TherapistVerified(therapist, block.timestamp);
    }

    /// @notice Revoke verification and burn the credential NFT (owner or DAO).
    function revokeTherapist(address therapist) external onlyGovernor {
        TherapistProfile storage p = _therapists[therapist];
        if (!p.isVerified) revert NotVerified();
        p.isVerified = false;
        p.isActive = false;
        verifiedTherapists[therapist] = false;
        uint256 tokenId = credentialToken[therapist];
        if (tokenId != 0) {
            credentialToken[therapist] = 0;
            _burn(tokenId);
        }
        emit TherapistRevoked(therapist);
    }

    function isRegisteredTherapist(address therapist) external view returns (bool) {
        return _therapists[therapist].therapist != address(0);
    }

    function getTherapistProfile(address therapist) external view returns (TherapistProfile memory) {
        return _therapists[therapist];
    }

    function getTherapistCount() external view returns (uint256) {
        return _therapistList.length;
    }

    /// @notice Paginated therapist addresses in registration order.
    function getTherapists(uint256 offset, uint256 limit) external view returns (address[] memory list) {
        uint256 total = _therapistList.length;
        if (offset >= total) return new address[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        list = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            list[i - offset] = _therapistList[i];
        }
    }

    function getTherapistSessions(address therapist) external view returns (uint256[] memory) {
        return _therapistSessions[therapist];
    }

    function getClientSessions(address client) external view returns (uint256[] memory) {
        return _clientSessions[client];
    }

    // ---------------------------------------------------------------------
    // Sessions
    // ---------------------------------------------------------------------

    function calculateSessionCost(address therapist, uint256 duration) public view returns (uint256) {
        TherapistProfile storage p = _therapists[therapist];
        if (!p.isVerified || !p.isActive) revert NotVerified();
        if (duration == 0) revert InvalidInput();
        return (p.hourlyRate * duration) / 60;
    }

    /**
     * @notice Book a session. Pays with TERAP (requires prior approval) or, when `useSubscription` is
     *         true, draws minutes and funds from the caller's prepaid subscription.
     * @param scheduledAt Unix time the session starts; 0 means now.
     */
    function bookSession(
        address therapist,
        uint256 duration,
        uint256 scheduledAt,
        string calldata encryptedNotes,
        bool useSubscription
    ) external whenNotPaused nonReentrant returns (uint256 sessionId) {
        uint256 cost = calculateSessionCost(therapist, duration);
        if (useSubscription) {
            if (address(subscription) == address(0)) revert InvalidInput();
            subscription.reserve(msg.sender, duration, cost);
        } else {
            IERC20(address(terapToken)).safeTransferFrom(msg.sender, address(this), cost);
        }
        sessionId = _createSession(
            msg.sender, therapist, duration, scheduledAt, cost, address(terapToken), useSubscription, encryptedNotes, 0
        );
    }

    /// @notice Client confirms the session took place, rates it, releases payment and mints a receipt.
    function completeSession(uint256 sessionId, uint8 rating) external nonReentrant {
        TherapySession storage s = _sessions[sessionId];
        if (s.client != msg.sender) revert NotClient();
        if (s.status != SessionStatus.Booked) revert InvalidSessionState();
        if (block.timestamp < s.scheduledAt) revert SessionNotStarted();
        if (rating < 1 || rating > 5) revert InvalidRating();

        s.status = SessionStatus.Completed;
        s.clientRating = rating;
        _settleSession(s);
        _updateTherapistRating(s.therapist, rating);
        userReputationScores[s.client] += 10;
        userReputationScores[s.therapist] += 20;
        _mintSessionReceipt(s);

        emit SessionCompleted(sessionId, rating);
    }

    /// @notice Therapist claims payment for a delivered session the client never confirmed.
    function claimSessionPayment(uint256 sessionId) external nonReentrant {
        TherapySession storage s = _sessions[sessionId];
        if (s.therapist != msg.sender) revert NotTherapist();
        if (s.status != SessionStatus.Booked) revert InvalidSessionState();
        uint256 claimableAt = s.scheduledAt + s.duration * 60 + sessionClaimDelay;
        if (block.timestamp < claimableAt) revert ClaimTooEarly(claimableAt);

        s.status = SessionStatus.Completed;
        _settleSession(s);
        userReputationScores[s.therapist] += 20;
        _mintSessionReceipt(s);

        emit SessionCompleted(sessionId, 0);
    }

    /**
     * @notice Cancel a booked session. Therapist cancellations refund in full. Client cancellations
     *         within {LATE_CANCEL_WINDOW} of the start time forfeit {lateCancelFeeBps} to the therapist.
     *         Cross-chain bookings are refunded to the treasury-held balance of the attributed user.
     */
    function cancelSession(uint256 sessionId) external nonReentrant {
        TherapySession storage s = _sessions[sessionId];
        if (msg.sender != s.client && msg.sender != s.therapist) revert NotParticipant();
        if (s.status != SessionStatus.Booked) revert InvalidSessionState();

        s.status = SessionStatus.Cancelled;
        uint256 therapistFee;
        if (msg.sender == s.client && s.scheduledAt < block.timestamp + LATE_CANCEL_WINDOW) {
            therapistFee = (s.cost * lateCancelFeeBps) / BPS;
        }
        uint256 refund = s.cost - therapistFee;

        IERC20 token = IERC20(s.paymentToken);
        if (therapistFee > 0) token.safeTransfer(s.therapist, therapistFee);
        if (refund > 0) {
            if (s.paidBySubscription) {
                token.safeTransfer(address(subscription), refund);
                subscription.refund(s.client, s.duration, refund);
            } else if (s.sourceChainId != 0) {
                // Cannot push funds back across chains from here; credit the user via the treasury so
                // governance can return them.
                treasuryBalances[s.paymentToken] += refund;
            } else {
                token.safeTransfer(s.client, refund);
            }
        }

        emit SessionCancelled(sessionId, msg.sender, refund, therapistFee);
    }

    function getSession(uint256 sessionId) external view returns (TherapySession memory) {
        return _sessions[sessionId];
    }

    // ---------------------------------------------------------------------
    // Wellness circles
    // ---------------------------------------------------------------------

    function createWellnessCircle(string calldata name, string calldata description, uint256 entryStake)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 circleId)
    {
        if (bytes(name).length == 0) revert InvalidInput();
        circleId = nextCircleId++;
        WellnessCircle storage c = _circles[circleId];
        c.circleId = circleId;
        c.name = name;
        c.description = description;
        c.facilitator = msg.sender;
        c.entryStake = entryStake;
        c.isActive = true;
        c.createdAt = block.timestamp;

        emit WellnessCircleCreated(circleId, name, msg.sender);

        if (entryStake > 0) {
            IERC20(address(terapToken)).safeTransferFrom(msg.sender, address(this), entryStake);
        }
        _addMember(circleId, msg.sender, entryStake, 100);
    }

    function joinWellnessCircle(uint256 circleId) external whenNotPaused nonReentrant {
        _joinCircle(msg.sender, circleId, _circles[circleId].entryStake, false);
    }

    /// @notice Leave a circle and recover the entry stake. Facilitators cannot leave their own circle.
    function leaveWellnessCircle(uint256 circleId) external nonReentrant {
        WellnessCircle storage c = _circles[circleId];
        if (!_circleMembers[circleId][msg.sender]) revert NotMember();
        if (c.facilitator == msg.sender) revert NotMember();

        uint256 stake = _circleStakes[circleId][msg.sender];
        _circleMembers[circleId][msg.sender] = false;
        _circleStakes[circleId][msg.sender] = 0;
        c.memberCount--;
        if (stake > 0) IERC20(address(terapToken)).safeTransfer(msg.sender, stake);

        emit CircleMemberLeft(circleId, msg.sender);
    }

    function setCircleActive(uint256 circleId, bool isActive) external {
        WellnessCircle storage c = _circles[circleId];
        if (c.facilitator != msg.sender && msg.sender != owner()) revert NotFacilitator();
        c.isActive = isActive;
        emit CircleStatusChanged(circleId, isActive);
    }

    function getCircle(uint256 circleId) external view returns (WellnessCircle memory) {
        return _circles[circleId];
    }

    function getCircleCount() external view returns (uint256) {
        return nextCircleId - 1;
    }

    function isCircleMember(uint256 circleId, address user) external view returns (bool) {
        return _circleMembers[circleId][user];
    }

    function getCircleReputation(uint256 circleId, address user) external view returns (uint256) {
        return _circleReputation[circleId][user];
    }

    /// @notice TERAP held as DAO treasury (fees + donations).
    function daoTreasury() external view returns (uint256) {
        return treasuryBalances[address(terapToken)];
    }

    // ---------------------------------------------------------------------
    // NFT
    // ---------------------------------------------------------------------

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseURI();
        if (bytes(base).length == 0) return "";
        return string.concat(base, uint256(tokenKind[tokenId]).toString(), "/", tokenId.toString());
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    function _createSession(
        address client,
        address therapist,
        uint256 duration,
        uint256 scheduledAt,
        uint256 cost,
        address paymentToken,
        bool paidBySubscription,
        string memory encryptedNotes,
        uint256 sourceChainId
    ) private returns (uint256 sessionId) {
        if (scheduledAt == 0) scheduledAt = block.timestamp;
        if (scheduledAt < block.timestamp) revert InvalidInput();

        sessionId = nextSessionId++;
        TherapySession storage s = _sessions[sessionId];
        s.sessionId = sessionId;
        s.therapist = therapist;
        s.client = client;
        s.duration = duration;
        s.cost = cost;
        s.paymentToken = paymentToken;
        s.scheduledAt = scheduledAt;
        s.createdAt = block.timestamp;
        s.status = SessionStatus.Booked;
        s.paidBySubscription = paidBySubscription;
        s.encryptedNotes = encryptedNotes;
        s.sourceChainId = sourceChainId;

        _therapistSessions[therapist].push(sessionId);
        _clientSessions[client].push(sessionId);

        emit SessionBooked(sessionId, therapist, client);
    }

    function _bookCrossChain(address user, address zrc20, uint256 amount, bytes memory payload, uint256 chainId)
        private
    {
        if (!supportedPaymentTokens[zrc20]) revert UnsupportedPaymentToken();
        (address therapist, uint256 duration, uint256 scheduledAt, string memory notes) =
            abi.decode(payload, (address, uint256, uint256, string));
        uint256 cost = calculateSessionCost(therapist, duration);
        if (amount < cost) revert InsufficientPayment(cost, amount);
        // Overpayment cannot be returned cross-chain; it is kept as a donation.
        if (amount > cost) treasuryBalances[zrc20] += amount - cost;
        _createSession(user, therapist, duration, scheduledAt, cost, zrc20, false, notes, chainId);
    }

    function _settleSession(TherapySession storage s) private {
        uint256 fee = (s.cost * platformFeeBps) / BPS;
        uint256 payout = s.cost - fee;
        treasuryBalances[s.paymentToken] += fee;
        _therapists[s.therapist].totalSessions++;
        if (payout > 0) IERC20(s.paymentToken).safeTransfer(s.therapist, payout);
    }

    function _mintSessionReceipt(TherapySession storage s) private {
        uint256 tokenId = nextTokenId++;
        tokenKind[tokenId] = TOKEN_KIND_SESSION_RECEIPT;
        sessionReceiptToken[s.sessionId] = tokenId;
        _mint(s.client, tokenId);
    }

    function _updateTherapistRating(address therapist, uint8 stars) private {
        TherapistProfile storage p = _therapists[therapist];
        uint256 scaled = uint256(stars) * 20; // 1-5 stars -> 20-100
        p.rating = (p.rating * p.ratingCount + scaled) / (p.ratingCount + 1);
        p.ratingCount++;
    }

    function _joinCircle(address member, uint256 circleId, uint256 stakeAmount, bool prefunded) private {
        WellnessCircle storage c = _circles[circleId];
        if (!c.isActive) revert CircleInactive();
        if (_circleMembers[circleId][member]) revert AlreadyMember();
        if (stakeAmount < c.entryStake) revert InsufficientPayment(c.entryStake, stakeAmount);
        if (!prefunded && stakeAmount > 0) {
            IERC20(address(terapToken)).safeTransferFrom(member, address(this), stakeAmount);
        }
        _addMember(circleId, member, stakeAmount, 50);
    }

    function _addMember(uint256 circleId, address member, uint256 stakeAmount, uint256 reputation) private {
        _circleMembers[circleId][member] = true;
        _circleStakes[circleId][member] = stakeAmount;
        _circleReputation[circleId][member] = reputation;
        _circles[circleId].memberCount++;
        emit CircleMemberJoined(circleId, member);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @dev Credentials and receipts are soulbound: mint and burn only.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
