// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/TeraPToken.sol";
import "../contracts/TeraPCore.sol";

contract DeployTeraP is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);
        
        // Deploy TeraPToken first
        TeraPToken terapToken = new TeraPToken();
        console.log("TeraPToken deployed at:", address(terapToken));

        // Deploy TeraPCore
        TeraPCore terapCore = new TeraPCore();
        console.log("TeraPCore deployed at:", address(terapCore));

        // Initialize TeraPToken
        terapToken.initialize(
            "TeraP Token",
            "TERAP",
            deployer, // owner
            deployer  // initial minter
        );
        console.log("TeraPToken initialized");

        // Initialize TeraPCore with token address
        address mockGateway = address(0x1234567890123456789012345678901234567890); // Replace with actual gateway
        terapCore.initialize(
            address(terapToken),
            "TeraP Session NFT",
            "TERAP-NFT", 
            mockGateway
        );
        console.log("TeraPCore initialized with TeraPToken");

        // Update minter to TeraPCore for platform operations
        terapToken.updateMinter(address(terapCore));
        console.log("TeraPToken minter updated to TeraPCore");

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== TeraP Universal Deployment Summary ===");
        console.log("Network: ZetaChain Testnet");
        console.log("TeraPToken Address:", address(terapToken));
        console.log("TeraPCore Address:", address(terapCore));
        console.log("Deployment completed successfully!");
    }
}