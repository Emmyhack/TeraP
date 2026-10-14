// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {TeraPToken} from "../contracts/TeraPToken.sol";
import {TeraPCore} from "../contracts/TeraPCore.sol";
import {TeraPSubscription} from "../contracts/TeraPSubscription.sol";
import {TeraPGovernance} from "../contracts/TeraPGovernance.sol";
import {WellnessGameification} from "../contracts/WellnessGameification.sol";

/**
 * @title Upgrade
 * @notice Upgrades one proxy to a freshly deployed implementation.
 *
 * Environment:
 *   PRIVATE_KEY   owner key
 *   CONTRACT      one of: TeraPToken | TeraPCore | TeraPSubscription | TeraPGovernance | WellnessGameification
 *   PROXY         proxy address to upgrade (defaults to deployments/<chainId>.json entry)
 */
contract Upgrade is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        string memory name = vm.envString("CONTRACT");
        address proxy = vm.envOr("PROXY", _fromDeployments(name));
        require(proxy != address(0), "proxy not found");

        vm.startBroadcast(pk);
        address impl;
        bytes32 h = keccak256(bytes(name));
        if (h == keccak256("TeraPToken")) impl = address(new TeraPToken());
        else if (h == keccak256("TeraPCore")) impl = address(new TeraPCore());
        else if (h == keccak256("TeraPSubscription")) impl = address(new TeraPSubscription());
        else if (h == keccak256("TeraPGovernance")) impl = address(new TeraPGovernance());
        else if (h == keccak256("WellnessGameification")) impl = address(new WellnessGameification());
        else revert("unknown CONTRACT");

        UUPSUpgradeable(proxy).upgradeToAndCall(impl, "");
        vm.stopBroadcast();

        console.log("Upgraded", name, "at", proxy);
        console.log("New implementation:", impl);
    }

    function _fromDeployments(string memory name) internal view returns (address) {
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        if (!vm.exists(path)) return address(0);
        string memory json = vm.readFile(path);
        return vm.parseJsonAddress(json, string.concat(".", name));
    }
}
