// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {TeraPToken} from "./TeraPToken.sol";
import {TeraPCore} from "./TeraPCore.sol";

/**
 * @title TeraPGovernance
 * @notice Token-weighted DAO for the TeraP platform.
 *
 * Voting power = TERAP votes at the proposal snapshot block + 2x the staked balance at that block
 * (see {TeraPToken.getPastVotingPower}). Passed proposals execute against {TeraPCore}, which grants
 * this contract the governor role.
 */
contract TeraPGovernance is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    enum ProposalType {
        TherapistVerification, // data: abi.encode(address therapist)
        FundingAllocation, // data: abi.encode(address token, address to, uint256 amount)
        ParameterChange, // data: abi.encode(uint8 param, uint256 value)
        Emergency // data: abi.encode(uint8 action, address target)
    }

    enum ProposalState {
        Active,
        Defeated,
        Succeeded,
        Executed,
        Cancelled
    }

    struct Proposal {
        uint256 proposalId;
        string title;
        string description;
        address proposer;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 snapshotBlock;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool cancelled;
        ProposalType proposalType;
        bytes proposalData;
    }

    /// @dev Parameter ids for ParameterChange proposals. 0-2 are governance-local, 100+ forward to core.
    uint8 public constant PARAM_PROPOSAL_THRESHOLD = 0;
    uint8 public constant PARAM_VOTING_PERIOD = 1;
    uint8 public constant PARAM_QUORUM_BPS = 2;
    uint8 public constant PARAM_CORE_OFFSET = 100; // param - 100 is passed to TeraPCore.setParameter

    /// @dev Emergency actions
    uint8 public constant EMERGENCY_PAUSE = 0;
    uint8 public constant EMERGENCY_UNPAUSE = 1;
    uint8 public constant EMERGENCY_REVOKE_THERAPIST = 2;

    uint256 public constant BPS = 10_000;
    uint256 public constant MIN_VOTING_PERIOD = 1 hours;

    TeraPToken public terapToken;
    TeraPCore public core;

    uint256 public nextProposalId;
    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    uint256 public proposalThreshold; // voting power needed to propose
    uint256 public votingPeriod; // seconds
    uint256 public quorumBps; // share of token total supply that must vote

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCasted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event ParameterChanged(uint8 indexed param, uint256 value);

    error ZeroAddress();
    error InvalidInput();
    error InsufficientVotingPower(uint256 have, uint256 need);
    error VotingClosed();
    error AlreadyVoted();
    error ProposalNotSucceeded();
    error ProposalNotActive();
    error NotProposer();
    error UnknownAction();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address terapToken_, address core_, address owner_) external initializer {
        if (terapToken_ == address(0) || core_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        __Ownable_init(owner_);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        terapToken = TeraPToken(terapToken_);
        core = TeraPCore(core_);
        proposalThreshold = 1_000 ether;
        votingPeriod = 7 days;
        quorumBps = 400; // 4%
        nextProposalId = 1;
    }

    // ---------------------------------------------------------------------
    // Proposals
    // ---------------------------------------------------------------------

    function createProposal(
        string calldata title,
        string calldata description,
        ProposalType proposalType,
        bytes calldata proposalData
    ) external returns (uint256 proposalId) {
        uint256 power = terapToken.getVotingPower(msg.sender);
        if (power < proposalThreshold) revert InsufficientVotingPower(power, proposalThreshold);
        if (bytes(title).length == 0) revert InvalidInput();
        _validateProposalData(proposalType, proposalData);

        proposalId = nextProposalId++;
        Proposal storage p = _proposals[proposalId];
        p.proposalId = proposalId;
        p.title = title;
        p.description = description;
        p.proposer = msg.sender;
        p.snapshotBlock = block.number - 1;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + votingPeriod;
        p.proposalType = proposalType;
        p.proposalData = proposalData;

        emit ProposalCreated(proposalId, msg.sender, title);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = _proposals[proposalId];
        if (p.proposer == address(0) || p.cancelled || block.timestamp >= p.endTime) revert VotingClosed();
        if (_hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        uint256 weight = terapToken.getPastVotingPower(msg.sender, p.snapshotBlock);
        if (weight == 0) revert InsufficientVotingPower(0, 1);

        _hasVoted[proposalId][msg.sender] = true;
        if (support) p.votesFor += weight;
        else p.votesAgainst += weight;

        emit VoteCasted(proposalId, msg.sender, support, weight);
    }

    /// @notice Execute a passed proposal. Anyone can call once voting has ended.
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage p = _proposals[proposalId];
        if (proposalState(proposalId) != ProposalState.Succeeded) revert ProposalNotSucceeded();
        p.executed = true;

        if (p.proposalType == ProposalType.TherapistVerification) {
            core.verifyTherapist(abi.decode(p.proposalData, (address)));
        } else if (p.proposalType == ProposalType.FundingAllocation) {
            (address token, address to, uint256 amount) = abi.decode(p.proposalData, (address, address, uint256));
            core.withdrawTreasury(token, to, amount);
        } else if (p.proposalType == ProposalType.ParameterChange) {
            (uint8 param, uint256 value) = abi.decode(p.proposalData, (uint8, uint256));
            if (param >= PARAM_CORE_OFFSET) core.setParameter(param - PARAM_CORE_OFFSET, value);
            else _setParameter(param, value);
        } else {
            (uint8 action, address target) = abi.decode(p.proposalData, (uint8, address));
            if (action == EMERGENCY_PAUSE) core.pause();
            else if (action == EMERGENCY_UNPAUSE) core.unpause();
            else if (action == EMERGENCY_REVOKE_THERAPIST) core.revokeTherapist(target);
            else revert UnknownAction();
        }

        emit ProposalExecuted(proposalId);
    }

    /// @notice Proposer or owner can cancel a proposal that has not executed.
    function cancelProposal(uint256 proposalId) external {
        Proposal storage p = _proposals[proposalId];
        if (p.proposer == address(0) || p.executed || p.cancelled) revert ProposalNotActive();
        if (msg.sender != p.proposer && msg.sender != owner()) revert NotProposer();
        p.cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    function proposalState(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = _proposals[proposalId];
        if (p.cancelled) return ProposalState.Cancelled;
        if (p.executed) return ProposalState.Executed;
        if (block.timestamp < p.endTime) return ProposalState.Active;
        uint256 quorum = (terapToken.totalSupply() * quorumBps) / BPS;
        if (p.votesFor > p.votesAgainst && p.votesFor + p.votesAgainst >= quorum) return ProposalState.Succeeded;
        return ProposalState.Defeated;
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return _proposals[proposalId];
    }

    function getProposalCount() external view returns (uint256) {
        return nextProposalId - 1;
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return _hasVoted[proposalId][voter];
    }

    function quorum() external view returns (uint256) {
        return (terapToken.totalSupply() * quorumBps) / BPS;
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setParameter(uint8 param, uint256 value) external onlyOwner {
        _setParameter(param, value);
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    function _setParameter(uint8 param, uint256 value) private {
        if (param == PARAM_PROPOSAL_THRESHOLD) {
            proposalThreshold = value;
        } else if (param == PARAM_VOTING_PERIOD) {
            if (value < MIN_VOTING_PERIOD) revert InvalidInput();
            votingPeriod = value;
        } else if (param == PARAM_QUORUM_BPS) {
            if (value > BPS) revert InvalidInput();
            quorumBps = value;
        } else {
            revert InvalidInput();
        }
        emit ParameterChanged(param, value);
    }

    /// @dev Reject malformed proposals up front so execution cannot fail on decoding.
    function _validateProposalData(ProposalType proposalType, bytes calldata data) private view {
        if (proposalType == ProposalType.TherapistVerification) {
            address therapist = abi.decode(data, (address));
            if (!core.isRegisteredTherapist(therapist)) revert InvalidInput();
        } else if (proposalType == ProposalType.FundingAllocation) {
            (address token, address to,) = abi.decode(data, (address, address, uint256));
            if (token == address(0) || to == address(0)) revert ZeroAddress();
        } else if (proposalType == ProposalType.ParameterChange) {
            (uint8 param,) = abi.decode(data, (uint8, uint256));
            bool local = param <= PARAM_QUORUM_BPS;
            bool forwarded = param >= PARAM_CORE_OFFSET && param - PARAM_CORE_OFFSET <= core.PARAM_LATE_CANCEL_FEE_BPS();
            if (!local && !forwarded) revert InvalidInput();
        } else {
            (uint8 action,) = abi.decode(data, (uint8, address));
            if (action > EMERGENCY_REVOKE_THERAPIST) revert InvalidInput();
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
