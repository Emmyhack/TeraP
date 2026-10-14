// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {TeraPToken} from "../contracts/TeraPToken.sol";
import {TeraPCore} from "../contracts/TeraPCore.sol";
import {TeraPSubscription} from "../contracts/TeraPSubscription.sol";
import {TeraPGovernance} from "../contracts/TeraPGovernance.sol";
import {WellnessGameification} from "../contracts/WellnessGameification.sol";
import {ZKCredentialVerifier} from "../contracts/ZKCredentialVerifier.sol";

/**
 * @title Deploy
 * @notice Deploys the full TeraP stack behind UUPS proxies and writes `deployments/<chainId>.json`.
 *
 * Environment:
 *   PRIVATE_KEY        deployer key (becomes owner of every contract)
 *   GATEWAY_ADDRESS    optional override for the ZetaChain GatewayZEVM
 *   OWNER_ADDRESS      optional final owner (e.g. a DAO multisig); defaults to the deployer
 *
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --legacy
 */
contract Deploy is Script {
    // ZetaChain GatewayZEVM (same address on Athens testnet 7001 and mainnet 7000)
    address constant ZETACHAIN_GATEWAY = 0x6c533f7fE93fAE114d0954697069Df33C9B74fD7;

    struct Deployment {
        address token;
        address core;
        address subscription;
        address governance;
        address gamification;
        address credentialVerifier;
        address tokenImpl;
        address coreImpl;
        address subscriptionImpl;
        address governanceImpl;
        address gamificationImpl;
        address gateway;
    }

    function run() external returns (Deployment memory d) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address owner = vm.envOr("OWNER_ADDRESS", deployer);
        address gateway = vm.envOr("GATEWAY_ADDRESS", _defaultGateway());

        console.log("Chain ID:  ", block.chainid);
        console.log("Deployer:  ", deployer);
        console.log("Owner:     ", owner);
        console.log("Gateway:   ", gateway);

        vm.startBroadcast(pk);

        d.tokenImpl = address(new TeraPToken());
        d.token = address(
            new ERC1967Proxy(
                d.tokenImpl, abi.encodeCall(TeraPToken.initialize, ("TeraP Token", "TERAP", deployer, address(0)))
            )
        );

        d.subscriptionImpl = address(new TeraPSubscription());
        d.subscription = address(
            new ERC1967Proxy(d.subscriptionImpl, abi.encodeCall(TeraPSubscription.initialize, (d.token, deployer)))
        );

        d.coreImpl = address(new TeraPCore());
        d.core = address(
            new ERC1967Proxy(
                d.coreImpl,
                abi.encodeCall(
                    TeraPCore.initialize, (d.token, d.subscription, "TeraP Credentials", "TERAP-ID", gateway, deployer)
                )
            )
        );

        d.governanceImpl = address(new TeraPGovernance());
        d.governance = address(
            new ERC1967Proxy(d.governanceImpl, abi.encodeCall(TeraPGovernance.initialize, (d.token, d.core, deployer)))
        );

        d.gamificationImpl = address(new WellnessGameification());
        d.gamification = address(
            new ERC1967Proxy(d.gamificationImpl, abi.encodeCall(WellnessGameification.initialize, (d.token, deployer)))
        );

        d.credentialVerifier = address(new ZKCredentialVerifier(deployer));
        d.gateway = gateway;

        // Wire modules together
        TeraPSubscription(d.subscription).setCore(d.core);
        TeraPCore(d.core).setGovernance(d.governance);
        TeraPToken(d.token).setMinter(d.gamification, true);
        WellnessGameification(d.gamification).setOperator(d.core, true);

        // Default subscription tiers (price per 30 days in TERAP, minutes per 30 days)
        TeraPSubscription sub = TeraPSubscription(d.subscription);
        sub.createTier("Essential Care", 30 ether, 120);
        sub.createTier("Complete Care", 80 ether, 300);
        sub.createTier("Premium Care", 150 ether, 600);
        sub.createTier("Organization Care", 300 ether, 1200);

        // Hand over ownership if a separate owner was requested
        if (owner != deployer) {
            TeraPToken(d.token).transferOwnership(owner);
            TeraPCore(d.core).transferOwnership(owner);
            sub.transferOwnership(owner);
            TeraPGovernance(d.governance).transferOwnership(owner);
            WellnessGameification(d.gamification).transferOwnership(owner);
            ZKCredentialVerifier(d.credentialVerifier).transferOwnership(owner);
        }

        vm.stopBroadcast();

        _log(d);
        _write(d);
    }

    function _defaultGateway() internal view returns (address) {
        if (block.chainid == 7000 || block.chainid == 7001) return ZETACHAIN_GATEWAY;
        return address(0xdead); // local / unknown chains: placeholder, update with setGateway
    }

    function _log(Deployment memory d) internal pure {
        console.log("");
        console.log("=== TeraP deployment ===");
        console.log("TeraPToken            ", d.token);
        console.log("TeraPCore             ", d.core);
        console.log("TeraPSubscription     ", d.subscription);
        console.log("TeraPGovernance       ", d.governance);
        console.log("WellnessGameification ", d.gamification);
        console.log("ZKCredentialVerifier  ", d.credentialVerifier);
        console.log("Gateway               ", d.gateway);
    }

    function _write(Deployment memory d) internal {
        string memory key = "deployment";
        vm.serializeUint(key, "chainId", block.chainid);
        vm.serializeAddress(key, "TeraPToken", d.token);
        vm.serializeAddress(key, "TeraPCore", d.core);
        vm.serializeAddress(key, "TeraPSubscription", d.subscription);
        vm.serializeAddress(key, "TeraPGovernance", d.governance);
        vm.serializeAddress(key, "TeraPGovernanceImpl", d.governanceImpl);
        vm.serializeAddress(key, "WellnessGameification", d.gamification);
        vm.serializeAddress(key, "ZKCredentialVerifier", d.credentialVerifier);
        vm.serializeAddress(key, "Gateway", d.gateway);
        vm.serializeAddress(key, "TeraPTokenImpl", d.tokenImpl);
        vm.serializeAddress(key, "TeraPCoreImpl", d.coreImpl);
        vm.serializeAddress(key, "TeraPSubscriptionImpl", d.subscriptionImpl);
        string memory json = vm.serializeAddress(key, "WellnessGameificationImpl", d.gamificationImpl);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        vm.writeJson(json, path);
        console.log("Wrote", path);
    }
}
