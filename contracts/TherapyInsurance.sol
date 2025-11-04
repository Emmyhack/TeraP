// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./TeraPToken.sol";

contract TherapyInsurance is Initializable, OwnableUpgradeable {
    TeraPToken public terapToken;
    
    struct InsurancePolicy {
        uint256 coverage;
        uint256 premium;
        uint256 expiry;
        bool active;
    }
    
    struct LiquidityProvider {
        uint256 stakedAmount;
        uint256 shares;
        uint256 rewards;
    }
    
    mapping(address => InsurancePolicy) public policies;
    mapping(address => LiquidityProvider) public providers;
    
    uint256 public totalLiquidity;
    uint256 public totalShares;
    uint256 public claimsPaid;
    
    event InsurancePurchased(address indexed user, uint256 coverage);
    event ClaimPaid(address indexed user, uint256 amount);
    event LiquidityStaked(address indexed provider, uint256 amount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _terapToken) public initializer {
        __Ownable_init(msg.sender);
        terapToken = TeraPToken(_terapToken);
    }

    function purchaseInsurance(uint256 coverage) external payable {
        require(coverage > 0, "Invalid coverage");
        uint256 premium = calculatePremium(coverage);
        require(msg.value >= premium, "Insufficient premium");
        
        policies[msg.sender] = InsurancePolicy({
            coverage: coverage,
            premium: premium,
            expiry: block.timestamp + 365 days,
            active: true
        });
        
        emit InsurancePurchased(msg.sender, coverage);
    }

    function claimInsurance(uint256 sessionId, bytes calldata proof) external {
        InsurancePolicy storage policy = policies[msg.sender];
        require(policy.active, "No active policy");
        require(block.timestamp < policy.expiry, "Policy expired");
        
        // Simplified claim verification
        require(proof.length > 0, "Invalid proof");
        
        uint256 claimAmount = policy.coverage / 10; // 10% of coverage per claim
        require(address(this).balance >= claimAmount, "Insufficient liquidity");
        
        payable(msg.sender).transfer(claimAmount);
        claimsPaid += claimAmount;
        
        emit ClaimPaid(msg.sender, claimAmount);
    }

    function stakeLiquidity() external payable returns (uint256 shares) {
        require(msg.value > 0, "Must stake ETH");
        
        shares = totalShares == 0 ? msg.value : (msg.value * totalShares) / totalLiquidity;
        
        providers[msg.sender].stakedAmount += msg.value;
        providers[msg.sender].shares += shares;
        
        totalLiquidity += msg.value;
        totalShares += shares;
        
        emit LiquidityStaked(msg.sender, msg.value);
        return shares;
    }

    function calculatePremium(uint256 coverage) public pure returns (uint256) {
        return coverage / 100; // 1% of coverage as premium
    }

    function withdrawLiquidity(uint256 shares) external {
        LiquidityProvider storage provider = providers[msg.sender];
        require(provider.shares >= shares, "Insufficient shares");
        
        uint256 amount = (shares * totalLiquidity) / totalShares;
        require(address(this).balance >= amount, "Insufficient balance");
        
        provider.shares -= shares;
        provider.stakedAmount -= amount;
        totalShares -= shares;
        totalLiquidity -= amount;
        
        payable(msg.sender).transfer(amount);
    }
}