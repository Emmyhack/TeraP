// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/TeraPToken.sol";
import "../contracts/TeraPTherapist.sol";
import "../contracts/TeraPCoreMinimal.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MinimalDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address gateway = 0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7;

        console.log("=== TeraP Minimal Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Gateway:", gateway);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy implementations
        TeraPToken tokenImpl = new TeraPToken();
        TeraPTherapist therapistImpl = new TeraPTherapist();
        TeraPCoreMinimal coreImpl = new TeraPCoreMinimal();

        console.log("Token Implementation:", address(tokenImpl));
        console.log("Therapist Implementation:", address(therapistImpl));
        console.log("Core Implementation:", address(coreImpl));

        // Deploy token proxy
        bytes memory tokenInitData = abi.encodeWithSelector(
            TeraPToken.initialize.selector,
            "TeraP Token",
            "TERAP",
            deployer,
            deployer
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenInitData);
        TeraPToken token = TeraPToken(address(tokenProxy));

        // Deploy therapist proxy
        bytes memory therapistInitData = abi.encodeWithSelector(
            TeraPTherapist.initialize.selector
        );
        ERC1967Proxy therapistProxy = new ERC1967Proxy(address(therapistImpl), therapistInitData);
        TeraPTherapist therapistContract = TeraPTherapist(address(therapistProxy));

        // Deploy core proxy
        bytes memory coreInitData = abi.encodeWithSelector(
            TeraPCoreMinimal.initialize.selector,
            address(token),
            address(therapistContract),
            "TeraP Session NFT",
            "TERAP-NFT",
            gateway
        );
        ERC1967Proxy coreProxy = new ERC1967Proxy(address(coreImpl), coreInitData);
        TeraPCoreMinimal core = TeraPCoreMinimal(address(coreProxy));

        // Configure permissions
        token.updateMinter(address(core));

        console.log("=== Deployment Complete ===");
        console.log("Token Proxy:", address(token));
        console.log("Therapist Proxy:", address(therapistContract));
        console.log("Core Proxy:", address(core));

        vm.stopBroadcast();
    }
}