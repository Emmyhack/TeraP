// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {TeraPToken} from "../contracts/TeraPToken.sol";
import {TeraPCore} from "../contracts/TeraPCore.sol";
import {TeraPSubscription} from "../contracts/TeraPSubscription.sol";
import {TeraPGovernance} from "../contracts/TeraPGovernance.sol";
import {WellnessGameification} from "../contracts/WellnessGameification.sol";
import {MockZRC20} from "./mocks/MockZRC20.sol";

/// @dev Shared fixture: full proxy deployment mirroring script/Deploy.s.sol.
abstract contract BaseTest is Test {
    TeraPToken internal token;
    TeraPCore internal core;
    TeraPSubscription internal subscription;
    TeraPGovernance internal governance;
    WellnessGameification internal game;
    MockZRC20 internal usdc;

    address internal owner = makeAddr("owner");
    address internal therapist = makeAddr("therapist");
    address internal client = makeAddr("client");
    address internal voter = makeAddr("voter");
    address internal gateway = makeAddr("gateway");

    uint256 internal constant RATE = 100 ether; // 100 TERAP / hour

    function setUp() public virtual {
        vm.startPrank(owner);

        token = TeraPToken(
            address(
                new ERC1967Proxy(
                    address(new TeraPToken()),
                    abi.encodeCall(TeraPToken.initialize, ("TeraP Token", "TERAP", owner, address(0)))
                )
            )
        );
        subscription = TeraPSubscription(
            address(
                new ERC1967Proxy(
                    address(new TeraPSubscription()),
                    abi.encodeCall(TeraPSubscription.initialize, (address(token), owner))
                )
            )
        );
        core = TeraPCore(
            address(
                new ERC1967Proxy(
                    address(new TeraPCore()),
                    abi.encodeCall(
                        TeraPCore.initialize,
                        (address(token), address(subscription), "TeraP Credentials", "TERAP-ID", gateway, owner)
                    )
                )
            )
        );
        game = WellnessGameification(
            address(
                new ERC1967Proxy(
                    address(new WellnessGameification()),
                    abi.encodeCall(WellnessGameification.initialize, (address(token), owner))
                )
            )
        );
        governance = TeraPGovernance(
            address(
                new ERC1967Proxy(
                    address(new TeraPGovernance()),
                    abi.encodeCall(TeraPGovernance.initialize, (address(token), address(core), owner))
                )
            )
        );
        subscription.setCore(address(core));
        core.setGovernance(address(governance));
        token.setMinter(address(game), true);

        usdc = new MockZRC20();
        core.setSupportedPaymentToken(address(usdc), true);

        token.transfer(client, 10_000 ether);
        token.transfer(therapist, 5_000 ether);
        token.transfer(voter, 1_000_000 ether);
        vm.stopPrank();

        // Advance one block so initial balances are visible to snapshot lookups.
        vm.roll(block.number + 1);
        vm.warp(1_700_000_000);
    }

    function _registerAndVerify(address t) internal {
        string[] memory specs = new string[](2);
        specs[0] = "Anxiety";
        specs[1] = "Depression";
        vm.prank(t);
        core.registerTherapist("MindfulHealer", specs, "ipfs://enc", RATE, keccak256("LIC-1"), keccak256("PUBKEY"));
        vm.prank(owner);
        core.verifyTherapist(t);
    }

    function _book(address c, uint256 duration) internal returns (uint256 id) {
        uint256 cost = core.calculateSessionCost(therapist, duration);
        vm.startPrank(c);
        token.approve(address(core), cost);
        id = core.bookSession(therapist, duration, block.timestamp + 2 days, "enc-notes", false);
        vm.stopPrank();
    }
}
