// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {Upgrades} from "openzeppelin-foundry-upgrades/Upgrades.sol";
import {TeraPToken} from "../contracts/TeraPToken.sol";
import {TeraPCore} from "../contracts/TeraPCore.sol";

contract DeployWithProxy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy TeraPToken with proxy
        address terapTokenProxy = Upgrades.deployUUPSProxy(
            "TeraPToken.sol",
            abi.encodeCall(
                TeraPToken.initialize,
                ("TeraP Token", "TERAP", deployer, deployer)
            )
        );
        console.log("TeraPToken proxy deployed at:", terapTokenProxy);

        // Deploy TeraPCore with proxy
        address mockGateway = address(0x1234567890123456789012345678901234567890);
        address terapCoreProxy = Upgrades.deployUUPSProxy(
            "TeraPCore.sol", 
            abi.encodeCall(
                TeraPCore.initialize,
                (terapTokenProxy, "TeraP Session NFT", "TERAP-NFT", mockGateway)
            )
        );
        console.log("TeraPCore proxy deployed at:", terapCoreProxy);

        // Update minter to core contract
        TeraPToken token = TeraPToken(terapTokenProxy);
        token.updateMinter(terapCoreProxy);
        console.log("Updated minter to TeraPCore");

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("TeraPToken:", terapTokenProxy);
        console.log("TeraPCore:", terapCoreProxy);
        console.log("Owner:", deployer);
    }
}