// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZKCredentialVerifier
 * @notice On-chain registry of credential commitments.
 *
 * A therapist publishes `commitment = keccak256(credentialDocument || salt)` without revealing the
 * document. A DAO-approved attester, after reviewing the document off-chain, attests the commitment.
 * Consumers (TeraPCore, the frontend) can then check `isCredentialValid(commitment)` without learning
 * anything about the underlying credential.
 *
 * This contract does not verify zero-knowledge proofs on-chain; the privacy comes from the hash
 * commitment plus off-chain review. Plugging in a SNARK verifier is a future upgrade path.
 */
contract ZKCredentialVerifier is Ownable {
    struct Commitment {
        address submitter;
        uint64 submittedAt;
        uint64 attestedAt;
        address attester;
        bool revoked;
    }

    mapping(bytes32 => Commitment) public commitments;
    mapping(address => bytes32) public userCommitments;
    mapping(address => bool) public attesters;

    event CommitmentSubmitted(bytes32 indexed commitment, address indexed submitter);
    event CredentialAttested(bytes32 indexed commitment, address indexed attester);
    event CredentialRevoked(bytes32 indexed commitment, address indexed attester);
    event AttesterUpdated(address indexed attester, bool allowed);

    error NotAttester();
    error AlreadySubmitted();
    error UnknownCommitment();
    error ZeroCommitment();

    modifier onlyAttester() {
        if (!attesters[msg.sender] && msg.sender != owner()) revert NotAttester();
        _;
    }

    constructor(address owner_) Ownable(owner_) {}

    function setAttester(address attester, bool allowed) external onlyOwner {
        attesters[attester] = allowed;
        emit AttesterUpdated(attester, allowed);
    }

    /// @notice Publish a credential commitment. One active commitment per address; resubmitting replaces it.
    function submitCredentialCommitment(bytes32 commitment) external {
        if (commitment == bytes32(0)) revert ZeroCommitment();
        if (commitments[commitment].submitter != address(0)) revert AlreadySubmitted();
        commitments[commitment] = Commitment({
            submitter: msg.sender,
            submittedAt: uint64(block.timestamp),
            attestedAt: 0,
            attester: address(0),
            revoked: false
        });
        userCommitments[msg.sender] = commitment;
        emit CommitmentSubmitted(commitment, msg.sender);
    }

    function attestCredential(bytes32 commitment) external onlyAttester {
        Commitment storage c = commitments[commitment];
        if (c.submitter == address(0)) revert UnknownCommitment();
        c.attestedAt = uint64(block.timestamp);
        c.attester = msg.sender;
        c.revoked = false;
        emit CredentialAttested(commitment, msg.sender);
    }

    function revokeCredential(bytes32 commitment) external onlyAttester {
        Commitment storage c = commitments[commitment];
        if (c.submitter == address(0)) revert UnknownCommitment();
        c.revoked = true;
        emit CredentialRevoked(commitment, msg.sender);
    }

    function isCredentialValid(bytes32 commitment) public view returns (bool) {
        Commitment memory c = commitments[commitment];
        return c.attestedAt != 0 && !c.revoked;
    }

    function isUserVerified(address user) external view returns (bool) {
        bytes32 commitment = userCommitments[user];
        return commitment != bytes32(0) && isCredentialValid(commitment);
    }
}
