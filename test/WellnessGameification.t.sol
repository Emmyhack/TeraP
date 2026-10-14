// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {WellnessGameification} from "../contracts/WellnessGameification.sol";

contract WellnessGameificationTest is BaseTest {
    uint256 challenge;
    uint256 achievement;

    function setUp() public override {
        super.setUp();
        vm.startPrank(owner);
        challenge = game.createChallenge("7-day meditation", 50, 0);
        achievement = game.createAchievement("Mindful Beginner", 50);
        game.setOperator(therapist, true);
        vm.stopPrank();
    }

    function testSelfAttestationRejected() public {
        vm.prank(client);
        vm.expectRevert(WellnessGameification.NotOperator.selector);
        game.completeChallengeFor(client, challenge);
    }

    function testFullFlow() public {
        vm.prank(therapist);
        game.completeChallengeFor(client, challenge);
        assertEq(game.userPoints(client), 50);

        vm.prank(therapist);
        vm.expectRevert(WellnessGameification.AlreadyCompleted.selector);
        game.completeChallengeFor(client, challenge);

        vm.startPrank(client);
        game.unlockAchievement(achievement);
        uint256 tokenId = game.mintAchievementNFT(achievement);
        assertEq(game.ownerOf(tokenId), client);
        vm.expectRevert(WellnessGameification.AlreadyMinted.selector);
        game.mintAchievementNFT(achievement);

        uint256 before = token.balanceOf(client);
        game.redeemPoints(20);
        assertEq(token.balanceOf(client), before + 20 ether);
        assertEq(game.userPoints(client), 30);
        assertEq(game.lifetimePoints(client), 50);

        vm.expectRevert(bytes("WellnessGameification: soulbound"));
        game.transferFrom(client, therapist, tokenId);
        vm.stopPrank();

        (uint256 pts, uint256 life, uint256 ach, uint256 ch) = game.getUserStats(client);
        assertEq(pts, 30);
        assertEq(life, 50);
        assertEq(ach, 1);
        assertEq(ch, 1);
    }

    function testExpiredChallenge() public {
        vm.prank(owner);
        uint256 c = game.createChallenge("timed", 10, block.timestamp + 1 days);
        vm.warp(block.timestamp + 2 days);
        vm.prank(therapist);
        vm.expectRevert(WellnessGameification.ChallengeExpired.selector);
        game.completeChallengeFor(client, c);
    }
}
