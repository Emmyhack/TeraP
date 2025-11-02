// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title TeraPToken
 * @dev The native governance and utility token for the TeraP wellness DAO platform
 * Features:
 * - Governance voting rights
 * - Payment for wellness sessions
 * - Rewards for participation
 * - Access to premium features
 */
contract TeraPToken is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20VotesUpgradeable, 
    OwnableUpgradeable 
{
    /// @notice Maximum total supply of TERAP tokens (100M tokens)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    
    /// @notice Address that can mint tokens for rewards and initial distribution
    address public minter;
    
    /// @notice Mapping to track staked balances for enhanced governance
    mapping(address => uint256) public stakedBalances;
    
    /// @notice Total amount of tokens staked
    uint256 public totalStaked;
    
    /// @notice Minimum staking period (30 days)
    uint256 public constant MIN_STAKE_PERIOD = 30 days;
    
    /// @notice Staking records
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }
    
    mapping(address => StakeInfo[]) public stakes;
    
    event TokensStaked(address indexed user, uint256 amount, uint256 timestamp);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardsClaimed(address indexed user, uint256 amount);
    event MinterUpdated(address indexed newMinter);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        address _owner,
        address _minter
    ) public initializer {
        __ERC20_init(name, symbol);
        __ERC20Votes_init();
        __Ownable_init(_owner);
        
        minter = _minter;
        
        // Initial mint for DAO treasury and initial distribution (20M tokens)
        _mint(_owner, 20_000_000 * 10**18);
    }

    /**
     * @notice Mint new tokens (only callable by minter for rewards)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter || msg.sender == owner(), "TeraPToken: not authorized to mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "TeraPToken: max supply exceeded");
        _mint(to, amount);
    }

    /**
     * @notice Stake TERAP tokens for enhanced governance rights and rewards
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external {
        require(amount > 0, "TeraPToken: amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "TeraPToken: insufficient balance");
        
        _transfer(msg.sender, address(this), amount);
        
        stakes[msg.sender].push(StakeInfo({
            amount: amount,
            timestamp: block.timestamp,
            rewardDebt: 0
        }));
        
        stakedBalances[msg.sender] += amount;
        totalStaked += amount;
        
        emit TokensStaked(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Unstake tokens after minimum staking period
     * @param stakeIndex Index of the stake to unstake
     */
    function unstake(uint256 stakeIndex) external {
        require(stakeIndex < stakes[msg.sender].length, "TeraPToken: invalid stake index");
        
        StakeInfo memory stakeInfo = stakes[msg.sender][stakeIndex];
        require(
            block.timestamp >= stakeInfo.timestamp + MIN_STAKE_PERIOD,
            "TeraPToken: minimum staking period not met"
        );
        
        uint256 reward = calculateStakingReward(msg.sender, stakeIndex);
        
        // Remove stake from array
        stakes[msg.sender][stakeIndex] = stakes[msg.sender][stakes[msg.sender].length - 1];
        stakes[msg.sender].pop();
        
        stakedBalances[msg.sender] -= stakeInfo.amount;
        totalStaked -= stakeInfo.amount;
        
        // Transfer tokens back and mint reward
        _transfer(address(this), msg.sender, stakeInfo.amount);
        if (reward > 0) {
            _mint(msg.sender, reward);
        }
        
        emit TokensUnstaked(msg.sender, stakeInfo.amount, reward);
    }

    /**
     * @notice Calculate staking reward based on time and amount
     * @param user Address of the user
     * @param stakeIndex Index of the stake
     */
    function calculateStakingReward(address user, uint256 stakeIndex) public view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[user][stakeIndex];
        
        uint256 stakingDuration = block.timestamp - stakeInfo.timestamp;
        if (stakingDuration < MIN_STAKE_PERIOD) {
            return 0;
        }
        
        // 5% APY for staking rewards
        uint256 annualReward = (stakeInfo.amount * 5) / 100;
        return (annualReward * stakingDuration) / 365 days;
    }

    /**
     * @notice Get total voting power (balance + staked balance with bonus)
     * @param account Address to get voting power for
     */
    function getVotingPower(address account) external view returns (uint256) {
        uint256 balance = balanceOf(account);
        uint256 staked = stakedBalances[account];
        // Staked tokens get 2x voting power
        return balance + (staked * 2);
    }

    /**
     * @notice Update the minter address
     * @param _newMinter New minter address
     */
    function updateMinter(address _newMinter) external onlyOwner {
        require(_newMinter != address(0), "TeraPToken: invalid minter address");
        minter = _newMinter;
        emit MinterUpdated(_newMinter);
    }



    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._update(from, to, value);
    }


}