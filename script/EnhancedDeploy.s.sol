// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/TeraPToken.sol";
import "../contracts/TeraPTherapist.sol";
import "../contracts/TeraPCoreMinimal.sol";
import "../contracts/ZKCredentialVerifier.sol";
import "../contracts/TherapyInsurance.sol";
import "../contracts/WellnessGameification.sol";
import "../contracts/CrossChainTherapyMarketplace.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract EnhancedDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address gateway = 0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7;

        console.log("=== TeraP Enhanced Platform Deployment ===");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy core contracts
        TeraPToken tokenImpl = new TeraPToken();
        TeraPTherapist therapistImpl = new TeraPTherapist();
        TeraPCoreMinimal coreImpl = new TeraPCoreMinimal();

        // Deploy enhanced contracts
        ZKCredentialVerifier zkVerifier = new ZKCredentialVerifier();
        TherapyInsurance insuranceImpl = new TherapyInsurance();
        
        // Deploy core proxies first
        ERC1967Proxy tokenProxy = new ERC1967Proxy(
            address(tokenImpl), 
            abi.encodeWithSelector(TeraPToken.initialize.selector, "TeraP Token", "TERAP", deployer, deployer)
        );
        
        ERC1967Proxy therapistProxy = new ERC1967Proxy(
            address(therapistImpl),
            abi.encodeWithSelector(TeraPTherapist.initialize.selector)
        );
        
        ERC1967Proxy coreProxy = new ERC1967Proxy(
            address(coreImpl),
            abi.encodeWithSelector(TeraPCoreMinimal.initialize.selector, address(tokenProxy), address(therapistProxy), "TeraP Session NFT", "TERAP-NFT", gateway)
        );
        
        ERC1967Proxy insuranceProxy = new ERC1967Proxy(
            address(insuranceImpl),
            abi.encodeWithSelector(TherapyInsurance.initialize.selector, address(tokenProxy))
        );

        // Configure permissions
        TeraPToken(address(tokenProxy)).updateMinter(address(coreProxy));

        console.log("=== Enhanced Deployment Complete ===");
        console.log("Token:", address(tokenProxy));
        console.log("Therapist:", address(therapistProxy));
        console.log("Core:", address(coreProxy));
        console.log("ZK Verifier:", address(zkVerifier));
        console.log("Insurance:", address(insuranceProxy));

        vm.stopBroadcast();
    }
}