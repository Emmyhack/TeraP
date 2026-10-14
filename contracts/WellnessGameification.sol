// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {TeraPToken} from "./TeraPToken.sol";

/**
 * @title WellnessGameification
 * @notice Wellness challenges, achievements and reward redemption.
 *
 * Challenge completion is attested by an operator (the DAO, a therapist-facing backend, or TeraPCore)
 * rather than self-reported, so points and TERAP rewards cannot be farmed by anyone calling the contract.
 */
contract WellnessGameification is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    struct Achievement {
        string name;
        uint256 pointsRequired;
        bool exists;
    }

    struct Challenge {
        string name;
        uint256 rewardPoints;
        uint256 deadline; // 0 = no deadline
        bool active;
    }

    TeraPToken public terapToken;
    /// @notice Addresses allowed to attest challenge completion
    mapping(address => bool) public operators;

    mapping(uint256 => Achievement) public achievements;
    mapping(uint256 => Challenge) public challenges;
    mapping(address => mapping(uint256 => bool)) public userAchievements;
    mapping(address => mapping(uint256 => bool)) public completedChallenges;
    mapping(address => mapping(uint256 => bool)) public achievementMinted;
    /// @notice Spendable points
    mapping(address => uint256) public userPoints;
    /// @notice Lifetime points (never decreases; used for achievement thresholds)
    mapping(address => uint256) public lifetimePoints;

    uint256 public nextAchievementId;
    uint256 public nextChallengeId;
    uint256 public nextTokenId;
    /// @notice TERAP (wei) minted per point redeemed
    uint256 public terapPerPoint;
    string private _baseTokenURI;

    event OperatorUpdated(address indexed operator, bool allowed);
    event AchievementCreated(uint256 indexed achievementId, string name, uint256 pointsRequired);
    event ChallengeCreated(uint256 indexed challengeId, string name, uint256 rewardPoints, uint256 deadline);
    event ChallengeCompleted(address indexed user, uint256 indexed challengeId, uint256 points);
    event AchievementUnlocked(address indexed user, uint256 indexed achievementId);
    event AchievementNFTMinted(address indexed user, uint256 indexed achievementId, uint256 tokenId);
    event PointsRedeemed(address indexed user, uint256 points, uint256 terapAmount);

    error NotOperator();
    error ChallengeNotActive();
    error ChallengeExpired();
    error AlreadyCompleted();
    error AchievementNotFound();
    error AlreadyUnlocked();
    error InsufficientPoints(uint256 have, uint256 need);
    error AchievementNotUnlocked();
    error AlreadyMinted();
    error ZeroAddress();

    modifier onlyOperator() {
        if (!operators[msg.sender] && msg.sender != owner()) revert NotOperator();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address terapToken_, address owner_) external initializer {
        if (terapToken_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        __ERC721_init("TeraP Wellness Achievement", "TWA");
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        terapToken = TeraPToken(terapToken_);
        nextAchievementId = 1;
        nextChallengeId = 1;
        nextTokenId = 1;
        terapPerPoint = 1 ether; // 1 point = 1 TERAP
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setOperator(address operator, bool allowed) external onlyOwner {
        if (operator == address(0)) revert ZeroAddress();
        operators[operator] = allowed;
        emit OperatorUpdated(operator, allowed);
    }

    function setTerapPerPoint(uint256 amount) external onlyOwner {
        terapPerPoint = amount;
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        _baseTokenURI = uri;
    }

    function createAchievement(string calldata name, uint256 pointsRequired) external onlyOwner returns (uint256 id) {
        id = nextAchievementId++;
        achievements[id] = Achievement({name: name, pointsRequired: pointsRequired, exists: true});
        emit AchievementCreated(id, name, pointsRequired);
    }

    function createChallenge(string calldata name, uint256 rewardPoints, uint256 deadline)
        external
        onlyOwner
        returns (uint256 id)
    {
        id = nextChallengeId++;
        challenges[id] = Challenge({name: name, rewardPoints: rewardPoints, deadline: deadline, active: true});
        emit ChallengeCreated(id, name, rewardPoints, deadline);
    }

    function setChallengeActive(uint256 challengeId, bool active) external onlyOwner {
        challenges[challengeId].active = active;
    }

    // ---------------------------------------------------------------------
    // Operators
    // ---------------------------------------------------------------------

    /// @notice Attest that `user` completed `challengeId` and credit the reward points.
    function completeChallengeFor(address user, uint256 challengeId) external onlyOperator {
        Challenge memory c = challenges[challengeId];
        if (!c.active) revert ChallengeNotActive();
        if (c.deadline != 0 && block.timestamp > c.deadline) revert ChallengeExpired();
        if (completedChallenges[user][challengeId]) revert AlreadyCompleted();

        completedChallenges[user][challengeId] = true;
        userPoints[user] += c.rewardPoints;
        lifetimePoints[user] += c.rewardPoints;

        emit ChallengeCompleted(user, challengeId, c.rewardPoints);
    }

    // ---------------------------------------------------------------------
    // Users
    // ---------------------------------------------------------------------

    /// @notice Unlock an achievement once lifetime points reach its threshold.
    function unlockAchievement(uint256 achievementId) external {
        Achievement memory a = achievements[achievementId];
        if (!a.exists) revert AchievementNotFound();
        if (userAchievements[msg.sender][achievementId]) revert AlreadyUnlocked();
        if (lifetimePoints[msg.sender] < a.pointsRequired) {
            revert InsufficientPoints(lifetimePoints[msg.sender], a.pointsRequired);
        }
        userAchievements[msg.sender][achievementId] = true;
        emit AchievementUnlocked(msg.sender, achievementId);
    }

    /// @notice Mint the soulbound NFT for an unlocked achievement (once per achievement).
    function mintAchievementNFT(uint256 achievementId) external returns (uint256 tokenId) {
        if (!userAchievements[msg.sender][achievementId]) revert AchievementNotUnlocked();
        if (achievementMinted[msg.sender][achievementId]) revert AlreadyMinted();
        achievementMinted[msg.sender][achievementId] = true;
        tokenId = nextTokenId++;
        _mint(msg.sender, tokenId);
        emit AchievementNFTMinted(msg.sender, achievementId, tokenId);
    }

    /// @notice Convert spendable points into TERAP (requires this contract to be a token minter).
    function redeemPoints(uint256 points) external {
        if (userPoints[msg.sender] < points) revert InsufficientPoints(userPoints[msg.sender], points);
        userPoints[msg.sender] -= points;
        uint256 amount = points * terapPerPoint;
        terapToken.mint(msg.sender, amount);
        emit PointsRedeemed(msg.sender, points, amount);
    }

    function getUserStats(address user)
        external
        view
        returns (uint256 points, uint256 lifetime, uint256 achievementsCount, uint256 challengesCompleted)
    {
        points = userPoints[user];
        lifetime = lifetimePoints[user];
        for (uint256 i = 1; i < nextAchievementId; i++) {
            if (userAchievements[user][i]) achievementsCount++;
        }
        for (uint256 i = 1; i < nextChallengeId; i++) {
            if (completedChallenges[user][i]) challengesCompleted++;
        }
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @dev Achievement NFTs are soulbound: only minting is allowed.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "WellnessGameification: soulbound");
        return super._update(to, tokenId, auth);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
