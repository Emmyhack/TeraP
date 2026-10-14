// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {
    ERC20VotesUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Checkpoints} from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title TeraPToken (TERAP)
 * @notice Governance and utility token of the TeraP wellness DAO.
 *
 * - ERC-20 with on-chain vote checkpoints (ERC20Votes)
 * - Capped supply (100M)
 * - Role-based minting for platform modules (rewards, gamification)
 * - Native staking: locked tokens earn 5% APY and count double towards voting power
 * - Staked balances are checkpointed so governance can snapshot total voting power per proposal
 * - First-time recipients are auto-delegated to themselves so liquid balances count as votes
 * - UUPS upgradeable, owned by the DAO
 */
contract TeraPToken is Initializable, ERC20Upgradeable, ERC20VotesUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    using Checkpoints for Checkpoints.Trace208;
    using SafeCast for uint256;

    /// @notice Hard cap on total supply (100M TERAP)
    uint256 public constant MAX_SUPPLY = 100_000_000 ether;
    /// @notice Supply minted to the DAO treasury/owner at initialization (20M TERAP)
    uint256 public constant INITIAL_SUPPLY = 20_000_000 ether;
    /// @notice Minimum lock before a stake can be withdrawn
    uint256 public constant MIN_STAKE_PERIOD = 30 days;
    /// @notice Staking reward, in basis points per year (500 = 5% APY)
    uint256 public constant STAKING_APY_BPS = 500;
    /// @notice Voting-power multiplier applied to staked tokens
    uint256 public constant STAKE_VOTE_MULTIPLIER = 2;

    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
    }

    /// @notice Addresses allowed to mint (platform modules such as gamification rewards)
    mapping(address => bool) public minters;
    /// @notice Total tokens a user currently has staked
    mapping(address => uint256) public stakedBalances;
    /// @notice Total staked across all users
    uint256 public totalStaked;
    /// @notice Individual stake positions per user
    mapping(address => StakeInfo[]) private _stakes;
    /// @dev Historical staked balance per user, keyed by {clock}
    mapping(address => Checkpoints.Trace208) private _stakedCheckpoints;

    event TokensStaked(address indexed user, uint256 indexed stakeIndex, uint256 amount, uint256 timestamp);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 reward);
    event MinterUpdated(address indexed minter, bool allowed);

    error NotMinter();
    error MaxSupplyExceeded();
    error ZeroAmount();
    error InvalidStakeIndex();
    error StakeLocked(uint256 unlockTime);
    error ZeroAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @param name_   Token name
     * @param symbol_ Token symbol
     * @param owner_  DAO owner; receives the initial supply
     * @param minter_ Initial minter (may be zero)
     */
    function initialize(string memory name_, string memory symbol_, address owner_, address minter_)
        external
        initializer
    {
        if (owner_ == address(0)) revert ZeroAddress();
        __ERC20_init(name_, symbol_);
        __EIP712_init(name_, "1");
        __ERC20Votes_init();
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();

        if (minter_ != address(0)) {
            minters[minter_] = true;
            emit MinterUpdated(minter_, true);
        }
        _mint(owner_, INITIAL_SUPPLY);
    }

    // ---------------------------------------------------------------------
    // Minting
    // ---------------------------------------------------------------------

    /// @notice Mint new tokens, respecting {MAX_SUPPLY}. Callable by the owner or an approved minter.
    function mint(address to, uint256 amount) external {
        if (msg.sender != owner() && !minters[msg.sender]) revert NotMinter();
        _mintCapped(to, amount);
    }

    /// @notice Grant or revoke minting rights.
    function setMinter(address minter, bool allowed) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        minters[minter] = allowed;
        emit MinterUpdated(minter, allowed);
    }

    /// @notice Burn tokens from the caller.
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // Staking
    // ---------------------------------------------------------------------

    /// @notice Lock `amount` TERAP for at least {MIN_STAKE_PERIOD} to earn rewards and boosted votes.
    function stake(uint256 amount) external returns (uint256 stakeIndex) {
        if (amount == 0) revert ZeroAmount();
        _transfer(msg.sender, address(this), amount);

        stakeIndex = _stakes[msg.sender].length;
        _stakes[msg.sender].push(StakeInfo({amount: amount, timestamp: block.timestamp}));
        stakedBalances[msg.sender] += amount;
        totalStaked += amount;
        _stakedCheckpoints[msg.sender].push(clock(), stakedBalances[msg.sender].toUint208());

        emit TokensStaked(msg.sender, stakeIndex, amount, block.timestamp);
    }

    /**
     * @notice Withdraw a stake position and mint its accrued reward.
     * @dev Uses swap-and-pop, so the index of the last position changes after a withdrawal.
     */
    function unstake(uint256 stakeIndex) external {
        StakeInfo[] storage positions = _stakes[msg.sender];
        if (stakeIndex >= positions.length) revert InvalidStakeIndex();

        StakeInfo memory info = positions[stakeIndex];
        uint256 unlockTime = info.timestamp + MIN_STAKE_PERIOD;
        if (block.timestamp < unlockTime) revert StakeLocked(unlockTime);

        uint256 reward = _rewardFor(info);

        positions[stakeIndex] = positions[positions.length - 1];
        positions.pop();
        stakedBalances[msg.sender] -= info.amount;
        totalStaked -= info.amount;
        _stakedCheckpoints[msg.sender].push(clock(), stakedBalances[msg.sender].toUint208());

        _transfer(address(this), msg.sender, info.amount);
        if (reward > 0) {
            // Rewards are best-effort: never revert an unstake because the cap was reached.
            uint256 room = MAX_SUPPLY - totalSupply();
            reward = reward > room ? room : reward;
            if (reward > 0) _mint(msg.sender, reward);
        }

        emit TokensUnstaked(msg.sender, info.amount, reward);
    }

    /// @notice Reward accrued by a stake position (zero before the minimum period).
    function calculateStakingReward(address user, uint256 stakeIndex) external view returns (uint256) {
        if (stakeIndex >= _stakes[user].length) revert InvalidStakeIndex();
        return _rewardFor(_stakes[user][stakeIndex]);
    }

    /// @notice All stake positions of `user`.
    function getStakes(address user) external view returns (StakeInfo[] memory) {
        return _stakes[user];
    }

    /// @notice Number of stake positions of `user`.
    function stakeCount(address user) external view returns (uint256) {
        return _stakes[user].length;
    }

    /**
     * @notice Governance weight used by TeraPCore: liquid balance plus staked balance times
     *         {STAKE_VOTE_MULTIPLIER}.
     */
    function getVotingPower(address account) external view returns (uint256) {
        return getVotes(account) + stakedBalances[account] * STAKE_VOTE_MULTIPLIER;
    }

    /**
     * @notice Governance weight of `account` at a past {clock} value (block number). Used by TeraPCore
     *         to snapshot voting power when a proposal is created.
     */
    function getPastVotingPower(address account, uint256 timepoint) external view returns (uint256) {
        return getPastVotes(account, timepoint)
            + uint256(_stakedCheckpoints[account].upperLookupRecent(timepoint.toUint48())) * STAKE_VOTE_MULTIPLIER;
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    function _rewardFor(StakeInfo memory info) private view returns (uint256) {
        uint256 duration = block.timestamp - info.timestamp;
        if (duration < MIN_STAKE_PERIOD) return 0;
        return (info.amount * STAKING_APY_BPS * duration) / (10_000 * 365 days);
    }

    function _mintCapped(address to, uint256 amount) private {
        if (totalSupply() + amount > MAX_SUPPLY) revert MaxSupplyExceeded();
        _mint(to, amount);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        // Auto self-delegate first-time holders so plain balances count towards governance.
        if (to != address(0) && to != address(this) && delegates(to) == address(0)) {
            _delegate(to, to);
        }
        super._update(from, to, value);
    }
}
