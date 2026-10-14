// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {TeraPSubscription} from "../contracts/TeraPSubscription.sol";

contract TeraPSubscriptionTest is BaseTest {
    uint256 tier;

    function setUp() public override {
        super.setUp();
        vm.prank(owner);
        tier = subscription.createTier("Basic", 100 ether, 120);
    }

    function testTiers() public view {
        TeraPSubscription.Tier[] memory t = subscription.getTiers();
        assertEq(t.length, 1);
        assertEq(t[0].pricePerPeriod, 100 ether);
        assertEq(t[0].minutesPerPeriod, 120);
    }

    function testSubscribeAndExtend() public {
        vm.startPrank(client);
        token.approve(address(subscription), 1_000 ether);
        subscription.subscribe(tier, 2);
        TeraPSubscription.Subscription memory s = subscription.getSubscription(client);
        assertEq(s.minutesRemaining, 240);
        assertEq(s.endTime, block.timestamp + 60 days);
        assertEq(subscription.poolBalance(), 200 ether);
        assertTrue(subscription.isActive(client));

        subscription.subscribe(tier, 1); // extend while active
        s = subscription.getSubscription(client);
        assertEq(s.minutesRemaining, 360);
        assertEq(s.endTime, block.timestamp + 90 days);
        vm.stopPrank();
    }

    function testExpiredMinutesDoNotCarryOver() public {
        vm.startPrank(client);
        token.approve(address(subscription), 1_000 ether);
        subscription.subscribe(tier, 1);
        vm.warp(block.timestamp + 31 days);
        assertFalse(subscription.isActive(client));
        subscription.subscribe(tier, 1);
        assertEq(subscription.getSubscription(client).minutesRemaining, 120);
        vm.stopPrank();
    }

    function testInactiveTierReverts() public {
        vm.prank(owner);
        subscription.updateTier(tier, 100 ether, 120, false);
        vm.prank(client);
        vm.expectRevert(TeraPSubscription.TierInactive.selector);
        subscription.subscribe(tier, 1);
    }

    function testReserveOnlyCore() public {
        vm.prank(client);
        vm.expectRevert(TeraPSubscription.NotCore.selector);
        subscription.reserve(client, 10, 1);
    }

    function testReserveChecks() public {
        vm.prank(address(core));
        vm.expectRevert(TeraPSubscription.NoActiveSubscription.selector);
        subscription.reserve(client, 10, 1);

        vm.startPrank(client);
        token.approve(address(subscription), 100 ether);
        subscription.subscribe(tier, 1);
        vm.stopPrank();

        vm.prank(address(core));
        vm.expectRevert(abi.encodeWithSelector(TeraPSubscription.InsufficientMinutes.selector, 120, 121));
        subscription.reserve(client, 121, 1);

        vm.prank(address(core));
        vm.expectRevert(abi.encodeWithSelector(TeraPSubscription.InsufficientPool.selector, 100 ether, 101 ether));
        subscription.reserve(client, 60, 101 ether);
    }

    function testWithdrawRevenueOnlySurplus() public {
        vm.startPrank(client);
        token.approve(address(subscription), 100 ether);
        subscription.subscribe(tier, 1);
        vm.stopPrank();

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(TeraPSubscription.InsufficientPool.selector, 0, 1));
        subscription.withdrawRevenue(owner, 1);

        // after minutes are consumed the pool shrinks but funds went to core, still no surplus
        vm.prank(address(core));
        subscription.reserve(client, 60, 100 ether);
        assertEq(subscription.poolBalance(), 0);
        assertEq(token.balanceOf(address(subscription)), 0);
    }
}
