// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/TeraPToken.sol";
import "../contracts/TeraPCore.sol";

/**
 * @title ZetaChain Universal Deployment Script
 * @dev Deploys TeraP Universal contracts following ZetaChain best practices
 */
contract ZetaChainDeploy is Script {
    // ZetaChain Testnet Configuration
    address constant ZETACHAIN_TESTNET_GATEWAY = 0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7;
    address constant ZETACHAIN_TESTNET_TSS = 0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7;
    
    // ZetaChain Mainnet Configuration (update when deploying to mainnet)
    address constant ZETACHAIN_MAINNET_GATEWAY = 0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7;
    address constant ZETACHAIN_MAINNET_TSS = 0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);
        
        // Determine network and gateway
        uint256 chainId = block.chainid;
        address gateway;
        string memory networkName;
        
        if (chainId == 7001) {
            gateway = ZETACHAIN_TESTNET_GATEWAY;
            networkName = "ZetaChain Athens Testnet";
        } else if (chainId == 7000) {
            gateway = ZETACHAIN_MAINNET_GATEWAY;
            networkName = "ZetaChain Mainnet";
        } else {
            revert("Unsupported network. Deploy to ZetaChain only.");
        }

        console.log("=== TeraP Universal ZetaChain Deployment ===");
        console.log("Network:", networkName);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Gateway:", gateway);
        console.log("");

        // Deploy TeraPToken (Universal Token)
        console.log("Deploying TeraPToken...");
        TeraPToken terapToken = new TeraPToken();
        console.log("TeraPToken deployed at:", address(terapToken));

        // Deploy TeraPCore (Universal Contract)
        console.log("Deploying TeraPCore Universal Contract...");
        TeraPCore terapCore = new TeraPCore();
        console.log("TeraPCore deployed at:", address(terapCore));

        // Initialize TeraPToken
        console.log("Initializing TeraPToken...");
        terapToken.initialize(
            "TeraP Universal Token",
            "TERAP",
            deployer, // owner
            deployer  // initial minter
        );
        console.log("TeraPToken initialized successfully");

        // Initialize TeraPCore with ZetaChain Gateway
        console.log("Initializing TeraPCore with ZetaChain Gateway...");
        terapCore.initialize(
            address(terapToken),
            "TeraP Universal Session NFT",
            "TERAP-SESSION", 
            gateway  // ZetaChain Gateway for cross-chain operations
        );
        console.log("TeraPCore initialized with gateway:", gateway);

        // Configure cross-chain permissions
        console.log("Configuring cross-chain permissions...");
        terapToken.updateMinter(address(terapCore));
        console.log("TeraPCore granted minting permissions");

        vm.stopBroadcast();

        // Log deployment summary for ZetaChain CLI integration
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("Network:", networkName);
        console.log("Chain ID:", chainId);
        console.log("Gateway:", gateway);
        console.log("TeraPToken:", address(terapToken));
        console.log("TeraPCore:", address(terapCore));
        console.log("");
        
        // ZetaChain CLI Commands for interaction
        console.log("=== ZetaChain CLI Integration ===");
        console.log("Query contract balance:");
        console.log("  zetachain query balances --evm", address(terapCore), "--network", chainId == 7001 ? "testnet" : "mainnet");
        console.log("");
        console.log("Call contract from Ethereum:");
        console.log("  zetachain evm call --chain-id 11155111 --receiver", address(terapCore), "--types 'string,string,uint256' --values 'therapist,certified,100'");
        console.log("");
        console.log("Deposit from Bitcoin:");
        console.log("  zetachain bitcoin memo deposit --receiver", address(terapCore), "--amount 0.001");
        console.log("");
        console.log("Monitor cross-chain transactions:");
        console.log("  zetachain query cctx --hash <transaction_hash>");
        console.log("");
        
        console.log("TeraP Universal deployment completed successfully!");
        console.log("Cross-chain operations enabled on ZetaChain");
        console.log("See ZETACHAIN_DEPLOYMENT.md for detailed usage guide");
    }

    /**
     * @dev Verify deployment by checking contract initialization
     */
    function verifyDeployment(address tokenAddress, address coreAddress) internal view {
        TeraPToken token = TeraPToken(tokenAddress);
        TeraPCore core = TeraPCore(coreAddress);
        
        require(bytes(token.name()).length > 0, "Token not initialized");
        require(bytes(token.symbol()).length > 0, "Token symbol not set");
        require(address(core.terapToken()) == tokenAddress, "Core-Token link failed");
        
        console.log("All contracts verified successfully");
    }
}