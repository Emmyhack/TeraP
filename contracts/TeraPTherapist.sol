// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract TeraPTherapist is Initializable, OwnableUpgradeable {
    struct TherapistProfile {
        address therapist;
        string anonymousId;
        string[] specializations;
        string credentials;
        uint256 hourlyRate;
        bool isVerified;
        bool isActive;
        uint256 totalSessions;
        uint256 rating;
        uint256 ratingCount;
        uint256 verificationTimestamp;
        bytes32 credentialHash;
        bytes32 encryptionPublicKey;
    }
    
    mapping(address => TherapistProfile) public therapists;
    mapping(address => bool) public verifiedTherapists;
    uint256 public nextCredentialTokenId;
    
    event TherapistRegistered(address indexed therapist, string anonymousId);
    event TherapistVerified(address indexed therapist, uint256 timestamp);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        nextCredentialTokenId = 1;
    }

    function registerTherapist(
        string memory anonymousId,
        string[] memory specializations,
        string memory encryptedCredentials,
        uint256 hourlyRate,
        bytes32 credentialHash,
        bytes32 encryptionPublicKey
    ) external {
        require(!verifiedTherapists[msg.sender], "Already registered");
        require(bytes(anonymousId).length > 0, "Invalid ID");
        require(hourlyRate > 0, "Invalid rate");
        
        therapists[msg.sender] = TherapistProfile({
            therapist: msg.sender,
            anonymousId: anonymousId,
            specializations: specializations,
            credentials: encryptedCredentials,
            hourlyRate: hourlyRate,
            isVerified: false,
            isActive: true,
            totalSessions: 0,
            rating: 50,
            ratingCount: 0,
            verificationTimestamp: 0,
            credentialHash: credentialHash,
            encryptionPublicKey: encryptionPublicKey
        });
        
        emit TherapistRegistered(msg.sender, anonymousId);
    }

    function verifyTherapist(address therapist) external onlyOwner {
        require(!verifiedTherapists[therapist], "Already verified");
        require(therapists[therapist].therapist == therapist, "Not registered");
        
        therapists[therapist].isVerified = true;
        therapists[therapist].verificationTimestamp = block.timestamp;
        verifiedTherapists[therapist] = true;
        
        emit TherapistVerified(therapist, block.timestamp);
    }

    function updateTherapistRating(address therapist, uint8 newRating) external onlyOwner {
        TherapistProfile storage profile = therapists[therapist];
        uint256 totalRating = (profile.rating * profile.ratingCount) + newRating;
        profile.ratingCount++;
        profile.rating = totalRating / profile.ratingCount;
        profile.totalSessions++;
    }

    function getTherapistProfile(address therapist) external view returns (TherapistProfile memory) {
        return therapists[therapist];
    }
}