// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./TeraPToken.sol";

contract WellnessGameification is Initializable, ERC721Upgradeable, OwnableUpgradeable {
    TeraPToken public terapToken;
    
    struct Achievement {
        string name;
        uint256 points;
        bytes32 criteria;
        bool exists;
    }
    
    struct Challenge {
        string name;
        uint256 reward;
        uint256 duration;
        bool active;
    }
    
    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(uint256 => bool)) public userAchievements;
    mapping(address => uint256) public userPoints;
    mapping(uint256 => Challenge) public challenges;
    mapping(address => mapping(uint256 => bool)) public completedChallenges;
    
    uint256 public nextAchievementId;
    uint256 public nextChallengeId;
    uint256 public nextTokenId;
    
    event AchievementUnlocked(address indexed user, uint256 achievementId);
    event ChallengeCompleted(address indexed user, uint256 challengeId);
    event NFTMinted(address indexed user, uint256 tokenId);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _terapToken) public initializer {
        __ERC721_init("TeraP Wellness NFT", "TWNFT");
        __Ownable_init(msg.sender);
        terapToken = TeraPToken(_terapToken);
        nextAchievementId = 1;
        nextChallengeId = 1;
        nextTokenId = 1;
    }

    function createAchievement(
        string memory name,
        uint256 points,
        bytes32 criteria
    ) external onlyOwner {
        achievements[nextAchievementId] = Achievement({
            name: name,
            points: points,
            criteria: criteria,
            exists: true
        });
        nextAchievementId++;
    }

    function createChallenge(
        string memory name,
        uint256 reward,
        uint256 duration
    ) external onlyOwner {
        challenges[nextChallengeId] = Challenge({
            name: name,
            reward: reward,
            duration: duration,
            active: true
        });
        nextChallengeId++;
    }

    function completeWellnessChallenge(uint256 challengeId) external {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active, "Challenge not active");
        require(!completedChallenges[msg.sender][challengeId], "Already completed");
        
        completedChallenges[msg.sender][challengeId] = true;
        userPoints[msg.sender] += challenge.reward;
        
        // Mint reward tokens
        terapToken.mint(msg.sender, challenge.reward * 10**18);
        
        emit ChallengeCompleted(msg.sender, challengeId);
    }

    function unlockAchievement(uint256 achievementId) external {
        Achievement storage achievement = achievements[achievementId];
        require(achievement.exists, "Achievement doesn't exist");
        require(!userAchievements[msg.sender][achievementId], "Already unlocked");
        
        // Simplified criteria check
        require(userPoints[msg.sender] >= achievement.points, "Insufficient points");
        
        userAchievements[msg.sender][achievementId] = true;
        userPoints[msg.sender] += achievement.points;
        
        emit AchievementUnlocked(msg.sender, achievementId);
    }

    function mintAchievementNFT(uint256 achievementId) external {
        require(userAchievements[msg.sender][achievementId], "Achievement not unlocked");
        
        _mint(msg.sender, nextTokenId);
        emit NFTMinted(msg.sender, nextTokenId);
        nextTokenId++;
    }

    function redeemWellnessRewards(uint256 points) external {
        require(userPoints[msg.sender] >= points, "Insufficient points");
        
        userPoints[msg.sender] -= points;
        
        // Convert points to TERAP tokens (1:1 ratio)
        terapToken.mint(msg.sender, points * 10**18);
    }

    function getUserStats(address user) external view returns (
        uint256 totalPoints,
        uint256 achievementsCount,
        uint256 challengesCompleted
    ) {
        totalPoints = userPoints[user];
        
        // Count achievements
        for (uint256 i = 1; i < nextAchievementId; i++) {
            if (userAchievements[user][i]) {
                achievementsCount++;
            }
        }
        
        // Count completed challenges
        for (uint256 i = 1; i < nextChallengeId; i++) {
            if (completedChallenges[user][i]) {
                challengesCompleted++;
            }
        }
    }
}