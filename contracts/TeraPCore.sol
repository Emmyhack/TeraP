// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./UniversalContract.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./TeraPToken.sol";

/**
 * @title TeraPCore
 * @dev Main universal contract for the TeraP wellness platform
 * Handles cross-chain operations, therapist registry, sessions, and payments
 */
contract TeraPCore is 
    Initializable,
    UniversalContractBase, 
    ERC721Upgradeable,
    OwnableUpgradeable 
{
    TeraPToken public terapToken;
    
    // Therapist verification and credentials
    struct TherapistProfile {
        address therapist;
        string anonymousId; // Anonymous identifier instead of real name
        string[] specializations;
        string credentials; // Encrypted credentials
        uint256 hourlyRate; // In TERAP tokens
        bool isVerified;
        bool isActive;
        uint256 totalSessions;
        uint256 rating; // Out of 100
        uint256 ratingCount;
        uint256 verificationTimestamp;
        bytes32 credentialHash; // Hash of credential documents
        bytes32 encryptionPublicKey; // For secure communications
    }
    
    // Therapy session data
    struct TherapySession {
        uint256 sessionId;
        address therapist;
        address client;
        uint256 duration; // In minutes
        uint256 cost; // In TERAP tokens
        uint256 timestamp;
        bool isCompleted;
        bool isPaid;
        uint8 clientRating; // 1-5 stars
        string encryptedNotes; // Encrypted session notes hash
    }
    
    // Wellness circle data
    struct WellnessCircle {
        uint256 circleId;
        string name;
        address facilitator;
        uint256 memberCount;
        uint256 entryStake; // Minimum TERAP tokens to join
        bool isActive;
        mapping(address => bool) members;
        mapping(address => uint256) reputationScores;
    }
    
    // DAO proposal data
    struct Proposal {
        uint256 proposalId;
        string title;
        string description;
        address proposer;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 endTime;
        bool isExecuted;
        ProposalType proposalType;
        bytes proposalData;
        mapping(address => bool) hasVoted;
    }
    
    enum ProposalType {
        TherapistVerification,
        FundingAllocation,
        ParameterChange,
        Emergency
    }
    
    // State variables
    mapping(address => TherapistProfile) public therapists;
    mapping(uint256 => TherapySession) public sessions;
    mapping(uint256 => WellnessCircle) public wellnessCircles;
    mapping(uint256 => Proposal) public proposals;
    
    mapping(address => bool) public verifiedTherapists;
    mapping(address => uint256[]) public therapistSessions;
    mapping(address => uint256[]) public clientSessions;
    mapping(address => uint256) public userReputationScores;
    
    uint256 public nextSessionId;
    uint256 public nextCircleId;
    uint256 public nextProposalId;
    uint256 public nextCredentialTokenId;
    
    // DAO treasury and parameters
    uint256 public daoTreasury;
    uint256 public platformFeePercentage; // Out of 1000 (5% = 50)
    uint256 public proposalThreshold; // Minimum TERAP to create proposal
    uint256 public votingPeriod; // Voting period in blocks
    
    // Cross-chain supported stablecoins for payments
    mapping(address => bool) public supportedPaymentTokens;
    
    // Events
    event TherapistRegistered(address indexed therapist, string anonymousId);
    event TherapistVerified(address indexed therapist, uint256 timestamp);
    event SessionBooked(uint256 indexed sessionId, address indexed therapist, address indexed client);
    event SessionCompleted(uint256 indexed sessionId, uint8 clientRating);
    event WellnessCircleCreated(uint256 indexed circleId, string name, address facilitator);
    event CircleMemberJoined(uint256 indexed circleId, address indexed member);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCasted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event CrossChainPaymentReceived(address indexed from, uint256 amount, uint256 chainId);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _terapToken,
        string memory _name,
        string memory _symbol,
        address _gateway
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init(msg.sender);
        
        terapToken = TeraPToken(_terapToken);
        gateway = _gateway;
        platformFeePercentage = 25; // 2.5%
        proposalThreshold = 1000 * 10**18; // 1000 TERAP
        votingPeriod = 50400; // ~7 days (assuming 12s blocks)
        nextSessionId = 1;
        nextCircleId = 1;
        nextProposalId = 1;
        nextCredentialTokenId = 1;
    }

    /**
     * @notice Set the gateway address (only owner)
     */
    function setGateway(address _gateway) external override onlyOwner {
        require(_gateway != address(0), "TeraPCore: invalid gateway address");
        gateway = _gateway;
    }

    /**
     * @notice Universal contract entry point for cross-chain calls
     * @param context Cross-chain message context
     * @param zrc20 ZRC-20 token address (for payments)
     * @param amount Amount transferred
     * @param message Encoded function call data
     */
    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        // Decode the function selector
        bytes4 selector = bytes4(message[:4]);
        
        if (selector == this.bookSessionCrossChain.selector) {
            (address therapist, uint256 duration, string memory notes) = abi.decode(
                message[4:], 
                (address, uint256, string)
            );
            _bookSessionInternal(context.sender, therapist, duration, amount, notes);
        } else if (selector == this.joinWellnessCircleCrossChain.selector) {
            uint256 circleId = abi.decode(message[4:], (uint256));
            _joinWellnessCircleInternal(context.sender, circleId, amount);
        } else if (selector == this.donateToDAOCrossChain.selector) {
            _donateToDAO(context.sender, amount, context.chainID);
        }
        
        emit CrossChainPaymentReceived(context.sender, amount, context.chainID);
    }

    /**
     * @notice Register as a therapist on the platform with anonymous identity
     */
    function registerTherapist(
        string memory anonymousId,
        string[] memory specializations,
        string memory encryptedCredentials,
        uint256 hourlyRate,
        bytes32 credentialHash,
        bytes32 encryptionPublicKey
    ) external {
        require(!verifiedTherapists[msg.sender], "TeraPCore: already registered");
        require(bytes(anonymousId).length > 0, "TeraPCore: invalid anonymous ID");
        require(hourlyRate > 0, "TeraPCore: invalid hourly rate");
        
        therapists[msg.sender] = TherapistProfile({
            therapist: msg.sender,
            anonymousId: anonymousId,
            specializations: specializations,
            credentials: encryptedCredentials,
            hourlyRate: hourlyRate,
            isVerified: false,
            isActive: true,
            totalSessions: 0,
            rating: 50, // Start with neutral rating
            ratingCount: 0,
            verificationTimestamp: 0,
            credentialHash: credentialHash,
            encryptionPublicKey: encryptionPublicKey
        });
        
        emit TherapistRegistered(msg.sender, anonymousId);
    }

    /**
     * @notice Verify a therapist (DAO governance required)
     */
    function verifyTherapist(address therapist) external onlyOwner {
        require(!verifiedTherapists[therapist], "TeraPCore: already verified");
        require(therapists[therapist].therapist == therapist, "TeraPCore: therapist not registered");
        
        therapists[therapist].isVerified = true;
        therapists[therapist].verificationTimestamp = block.timestamp;
        verifiedTherapists[therapist] = true;
        
        // Mint credential NFT
        _mint(therapist, nextCredentialTokenId);
        nextCredentialTokenId++;
        
        emit TherapistVerified(therapist, block.timestamp);
    }

    /**
     * @notice Book a therapy session
     */
    function bookSession(
        address therapist,
        uint256 duration,
        string memory encryptedNotes
    ) external {
        require(verifiedTherapists[therapist], "TeraPCore: therapist not verified");
        require(duration > 0, "TeraPCore: invalid duration");
        
        uint256 cost = calculateSessionCost(therapist, duration);
        require(terapToken.balanceOf(msg.sender) >= cost, "TeraPCore: insufficient TERAP balance");
        
        _bookSessionInternal(msg.sender, therapist, duration, cost, encryptedNotes);
    }

    /**
     * @notice Internal booking logic
     */
    function _bookSessionInternal(
        address client,
        address therapist,
        uint256 duration,
        uint256 cost,
        string memory encryptedNotes
    ) internal {
        uint256 sessionId = nextSessionId++;
        
        sessions[sessionId] = TherapySession({
            sessionId: sessionId,
            therapist: therapist,
            client: client,
            duration: duration,
            cost: cost,
            timestamp: block.timestamp,
            isCompleted: false,
            isPaid: false,
            clientRating: 0,
            encryptedNotes: encryptedNotes
        });
        
        therapistSessions[therapist].push(sessionId);
        clientSessions[client].push(sessionId);
        
        // Escrow payment
        terapToken.transferFrom(client, address(this), cost);
        
        emit SessionBooked(sessionId, therapist, client);
    }

    /**
     * @notice Complete a therapy session and handle payment
     */
    function completeSession(uint256 sessionId, uint8 rating) external {
        TherapySession storage session = sessions[sessionId];
        require(session.client == msg.sender, "TeraPCore: not session client");
        require(!session.isCompleted, "TeraPCore: session already completed");
        require(rating >= 1 && rating <= 5, "TeraPCore: invalid rating");
        
        session.isCompleted = true;
        session.isPaid = true;
        session.clientRating = rating;
        
        // Calculate platform fee
        uint256 platformFee = (session.cost * platformFeePercentage) / 1000;
        uint256 therapistPayment = session.cost - platformFee;
        
        // Transfer payment to therapist and fee to DAO
        terapToken.transfer(session.therapist, therapistPayment);
        daoTreasury += platformFee;
        
        // Update therapist stats
        therapists[session.therapist].totalSessions++;
        _updateTherapistRating(session.therapist, rating);
        
        // Award reputation points
        userReputationScores[msg.sender] += 10; // Client completion bonus
        userReputationScores[session.therapist] += 20; // Therapist completion bonus
        
        emit SessionCompleted(sessionId, rating);
    }

    /**
     * @notice Create a wellness circle
     */
    function createWellnessCircle(
        string memory name,
        uint256 entryStake
    ) external {
        require(bytes(name).length > 0, "TeraPCore: invalid name");
        require(entryStake > 0, "TeraPCore: invalid entry stake");
        
        uint256 circleId = nextCircleId++;
        WellnessCircle storage circle = wellnessCircles[circleId];
        
        circle.circleId = circleId;
        circle.name = name;
        circle.facilitator = msg.sender;
        circle.memberCount = 1;
        circle.entryStake = entryStake;
        circle.isActive = true;
        circle.members[msg.sender] = true;
        circle.reputationScores[msg.sender] = 100; // Facilitator starts with higher reputation
        
        // Facilitator stakes tokens
        terapToken.transferFrom(msg.sender, address(this), entryStake);
        
        emit WellnessCircleCreated(circleId, name, msg.sender);
    }

    /**
     * @notice Join a wellness circle
     */
    function joinWellnessCircle(uint256 circleId) external {
        _joinWellnessCircleInternal(msg.sender, circleId, wellnessCircles[circleId].entryStake);
    }

    /**
     * @notice Internal join wellness circle logic
     */
    function _joinWellnessCircleInternal(address member, uint256 circleId, uint256 stakeAmount) internal {
        WellnessCircle storage circle = wellnessCircles[circleId];
        require(circle.isActive, "TeraPCore: circle not active");
        require(!circle.members[member], "TeraPCore: already a member");
        require(stakeAmount >= circle.entryStake, "TeraPCore: insufficient stake");
        
        circle.members[member] = true;
        circle.memberCount++;
        circle.reputationScores[member] = 50; // New members start with neutral reputation
        
        // Stake tokens
        terapToken.transferFrom(member, address(this), circle.entryStake);
        
        emit CircleMemberJoined(circleId, member);
    }

    /**
     * @notice Create a DAO proposal
     */
    function createProposal(
        string memory title,
        string memory description,
        ProposalType proposalType,
        bytes memory proposalData
    ) external {
        require(
            terapToken.getVotingPower(msg.sender) >= proposalThreshold,
            "TeraPCore: insufficient voting power"
        );
        
        uint256 proposalId = nextProposalId++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.proposalId = proposalId;
        proposal.title = title;
        proposal.description = description;
        proposal.proposer = msg.sender;
        proposal.endTime = block.timestamp + votingPeriod;
        proposal.proposalType = proposalType;
        proposal.proposalData = proposalData;
        
        emit ProposalCreated(proposalId, msg.sender, title);
    }

    /**
     * @notice Vote on a DAO proposal
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.endTime, "TeraPCore: voting period ended");
        require(!proposal.hasVoted[msg.sender], "TeraPCore: already voted");
        
        uint256 votingPower = terapToken.getVotingPower(msg.sender);
        require(votingPower > 0, "TeraPCore: no voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAgainst += votingPower;
        }
        
        emit VoteCasted(proposalId, msg.sender, support, votingPower);
    }

    /**
     * @notice Calculate session cost based on therapist rate and duration
     */
    function calculateSessionCost(address therapist, uint256 duration) public view returns (uint256) {
        require(verifiedTherapists[therapist], "TeraPCore: therapist not verified");
        uint256 hourlyRate = therapists[therapist].hourlyRate;
        return (hourlyRate * duration) / 60; // Convert minutes to hours
    }

    /**
     * @notice Cross-chain session booking selector
     */
    function bookSessionCrossChain(address, uint256, string memory) external pure {
        // This is just for the selector, actual logic in onCall
        revert("Use cross-chain call");
    }

    /**
     * @notice Cross-chain wellness circle join selector
     */
    function joinWellnessCircleCrossChain(uint256) external pure {
        // This is just for the selector, actual logic in onCall
        revert("Use cross-chain call");
    }

    /**
     * @notice Cross-chain donation selector
     */
    function donateToDAOCrossChain() external pure {
        // This is just for the selector, actual logic in onCall
        revert("Use cross-chain call");
    }

    /**
     * @notice Internal donation logic
     */
    function _donateToDAO(address donor, uint256 amount, uint256 chainId) internal {
        daoTreasury += amount;
        userReputationScores[donor] += amount / 100; // 1 reputation per 100 tokens donated
    }

    /**
     * @notice Update therapist rating
     */
    function _updateTherapistRating(address therapist, uint8 newRating) internal {
        TherapistProfile storage profile = therapists[therapist];
        uint256 totalRating = (profile.rating * profile.ratingCount) + newRating;
        profile.ratingCount++;
        profile.rating = totalRating / profile.ratingCount;
    }

    /**
     * @notice Get therapist profile
     */
    function getTherapistProfile(address therapist) external view returns (TherapistProfile memory) {
        return therapists[therapist];
    }

    /**
     * @notice Get session details
     */
    function getSession(uint256 sessionId) external view returns (TherapySession memory) {
        return sessions[sessionId];
    }

    /**
     * @notice Check if user is member of wellness circle
     */
    function isCircleMember(uint256 circleId, address user) external view returns (bool) {
        return wellnessCircles[circleId].members[user];
    }

    /**
     * @notice Get user reputation in a circle
     */
    function getCircleReputation(uint256 circleId, address user) external view returns (uint256) {
        return wellnessCircles[circleId].reputationScores[user];
    }


}