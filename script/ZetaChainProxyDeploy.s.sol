// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/TeraPToken.sol";
import "../contracts/TeraPCore.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title ZetaChain Proxy Deployment Script
 * @dev Deploys TeraP Universal contracts using proxy pattern for proper initialization
 */
contract ZetaChainProxyDeploy is Script {
    // ZetaChain Testnet Configuration
    address constant ZETACHAIN_TESTNET_GATEWAY = 0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7;
    
    // ZetaChain Mainnet Configuration
    address constant ZETACHAIN_MAINNET_GATEWAY = 0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7;

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

        console.log("=== TeraP Universal ZetaChain Proxy Deployment ===");
        console.log("Network:", networkName);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Gateway:", gateway);
        console.log("");

        // Deploy implementation contracts
        console.log("Deploying TeraPToken implementation...");
        TeraPToken tokenImpl = new TeraPToken();
        console.log("TeraPToken implementation:", address(tokenImpl));

        console.log("Deploying TeraPCore implementation...");
        TeraPCore coreImpl = new TeraPCore();
        console.log("TeraPCore implementation:", address(coreImpl));

        // Prepare initialization data for TeraPToken
        bytes memory tokenInitData = abi.encodeWithSelector(
            TeraPToken.initialize.selector,
            "TeraP Universal Token",
            "TERAP",
            deployer,
            deployer
        );

        // Deploy TeraPToken proxy
        console.log("Deploying TeraPToken proxy...");
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenInitData);
        TeraPToken terapToken = TeraPToken(address(tokenProxy));
        console.log("TeraPToken proxy deployed at:", address(terapToken));

        // Prepare initialization data for TeraPCore
        bytes memory coreInitData = abi.encodeWithSelector(
            TeraPCore.initialize.selector,
            address(terapToken),
            "TeraP Universal Session NFT",
            "TERAP-SESSION",
            gateway
        );

        // Deploy TeraPCore proxy
        console.log("Deploying TeraPCore proxy...");
        ERC1967Proxy coreProxy = new ERC1967Proxy(address(coreImpl), coreInitData);
        TeraPCore terapCore = TeraPCore(address(coreProxy));
        console.log("TeraPCore proxy deployed at:", address(terapCore));

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
        console.log("TeraPToken Proxy:", address(terapToken));
        console.log("TeraPCore Proxy:", address(terapCore));
        console.log("TeraPToken Implementation:", address(tokenImpl));
        console.log("TeraPCore Implementation:", address(coreImpl));
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

        // Verify deployment
        verifyDeployment(address(terapToken), address(terapCore));
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