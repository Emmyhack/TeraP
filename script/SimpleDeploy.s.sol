// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/TeraPToken.sol";
import "../contracts/TeraPCore.sol";

contract SimpleDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy implementation contracts
        TeraPToken tokenImpl = new TeraPToken();
        console.log("TeraPToken implementation deployed at:", address(tokenImpl));

        TeraPCore coreImpl = new TeraPCore();  
        console.log("TeraPCore implementation deployed at:", address(coreImpl));

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("TeraPToken Implementation:", address(tokenImpl));
        console.log("TeraPCore Implementation:", address(coreImpl));
        console.log("Deployer:", deployer);
        console.log("\nNOTE: These are implementation contracts.");
        console.log("Initialize them through a proxy or call initialize() directly for testing.");
    }
}