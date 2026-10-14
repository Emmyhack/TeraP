// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {TeraPCore} from "../contracts/TeraPCore.sol";
import {UniversalContractBase, MessageContext} from "../contracts/UniversalContract.sol";

contract TeraPCoreTest is BaseTest {
    // ------------------------------------------------------------ therapists

    function testRegisterTherapist() public {
        string[] memory specs = new string[](1);
        specs[0] = "Anxiety";
        vm.prank(therapist);
        core.registerTherapist("Healer", specs, "enc", RATE, keccak256("lic"), keccak256("pk"));

        TeraPCore.TherapistProfile memory p = core.getTherapistProfile(therapist);
        assertEq(p.therapist, therapist);
        assertEq(p.anonymousId, "Healer");
        assertEq(p.hourlyRate, RATE);
        assertFalse(p.isVerified);
        assertTrue(p.isActive);
        assertEq(core.getTherapistCount(), 1);
        assertEq(core.getTherapists(0, 10)[0], therapist);
    }

    function testRegisterTwiceReverts() public {
        _registerAndVerify(therapist);
        string[] memory specs;
        vm.prank(therapist);
        vm.expectRevert(TeraPCore.AlreadyRegistered.selector);
        core.registerTherapist("x", specs, "", RATE, 0, 0);
    }

    function testVerifyMintsSoulboundCredential() public {
        _registerAndVerify(therapist);
        assertTrue(core.verifiedTherapists(therapist));
        uint256 tokenId = core.credentialToken(therapist);
        assertEq(core.ownerOf(tokenId), therapist);
        assertEq(core.tokenKind(tokenId), core.TOKEN_KIND_CREDENTIAL());

        vm.prank(therapist);
        vm.expectRevert(TeraPCore.Soulbound.selector);
        core.transferFrom(therapist, client, tokenId);
    }

    function testVerifyOnlyOwner() public {
        vm.prank(client);
        vm.expectRevert();
        core.verifyTherapist(therapist);
    }

    function testRevokeTherapistBurnsCredential() public {
        _registerAndVerify(therapist);
        uint256 tokenId = core.credentialToken(therapist);
        vm.prank(owner);
        core.revokeTherapist(therapist);
        assertFalse(core.verifiedTherapists(therapist));
        vm.expectRevert();
        core.ownerOf(tokenId);
    }

    function testUpdateProfile() public {
        _registerAndVerify(therapist);
        string[] memory specs = new string[](1);
        specs[0] = "Grief";
        vm.prank(therapist);
        core.updateTherapistProfile(specs, "enc2", 200 ether, keccak256("l2"), keccak256("p2"), false);
        TeraPCore.TherapistProfile memory p = core.getTherapistProfile(therapist);
        assertEq(p.hourlyRate, 200 ether);
        assertFalse(p.isActive);
        vm.expectRevert(TeraPCore.NotVerified.selector);
        core.calculateSessionCost(therapist, 60);
    }

    // ------------------------------------------------------------ sessions

    function testSessionCost() public {
        _registerAndVerify(therapist);
        assertEq(core.calculateSessionCost(therapist, 60), RATE);
        assertEq(core.calculateSessionCost(therapist, 30), RATE / 2);
    }

    function testBookRequiresVerifiedTherapist() public {
        vm.prank(client);
        vm.expectRevert(TeraPCore.NotVerified.selector);
        core.bookSession(therapist, 60, 0, "", false);
    }

    function testBookEscrowsPayment() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);

        TeraPCore.TherapySession memory s = core.getSession(id);
        assertEq(s.client, client);
        assertEq(s.therapist, therapist);
        assertEq(s.cost, RATE);
        assertEq(uint256(s.status), uint256(TeraPCore.SessionStatus.Booked));
        assertEq(token.balanceOf(address(core)), RATE);
        assertEq(core.getClientSessions(client).length, 1);
        assertEq(core.getTherapistSessions(therapist).length, 1);
    }

    function testCompleteSessionPaysTherapistAndMintsReceipt() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);
        uint256 before = token.balanceOf(therapist);

        vm.prank(client);
        vm.expectRevert(TeraPCore.SessionNotStarted.selector);
        core.completeSession(id, 5);

        vm.warp(block.timestamp + 2 days);
        vm.prank(client);
        core.completeSession(id, 4);

        uint256 fee = RATE * 250 / 10_000;
        assertEq(token.balanceOf(therapist), before + RATE - fee);
        assertEq(core.daoTreasury(), fee);
        TeraPCore.TherapistProfile memory p = core.getTherapistProfile(therapist);
        assertEq(p.rating, 80);
        assertEq(p.ratingCount, 1);
        assertEq(p.totalSessions, 1);
        uint256 receipt = core.sessionReceiptToken(id);
        assertEq(core.ownerOf(receipt), client);
        assertEq(core.tokenKind(receipt), core.TOKEN_KIND_SESSION_RECEIPT());
        assertEq(core.userReputationScores(client), 10);
    }

    function testRatingAverages() public {
        _registerAndVerify(therapist);
        uint256 a = _book(client, 60);
        uint256 b = _book(client, 60);
        vm.warp(block.timestamp + 2 days);
        vm.startPrank(client);
        core.completeSession(a, 5);
        core.completeSession(b, 3);
        vm.stopPrank();
        assertEq(core.getTherapistProfile(therapist).rating, 80); // (100 + 60) / 2
    }

    function testCompleteInvalidRating() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);
        vm.warp(block.timestamp + 2 days);
        vm.prank(client);
        vm.expectRevert(TeraPCore.InvalidRating.selector);
        core.completeSession(id, 6);
    }

    function testOnlyClientCompletes() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);
        vm.warp(block.timestamp + 2 days);
        vm.prank(therapist);
        vm.expectRevert(TeraPCore.NotClient.selector);
        core.completeSession(id, 5);
    }

    function testTherapistClaimAfterDelay() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);
        uint256 claimableAt = block.timestamp + 2 days + 60 * 60 + 7 days;

        vm.prank(therapist);
        vm.expectRevert(abi.encodeWithSelector(TeraPCore.ClaimTooEarly.selector, claimableAt));
        core.claimSessionPayment(id);

        vm.warp(claimableAt);
        uint256 before = token.balanceOf(therapist);
        vm.prank(therapist);
        core.claimSessionPayment(id);
        assertEq(token.balanceOf(therapist), before + RATE - RATE * 250 / 10_000);
        assertEq(uint256(core.getSession(id).status), uint256(TeraPCore.SessionStatus.Completed));
    }

    function testClientEarlyCancelFullRefund() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);
        uint256 before = token.balanceOf(client);
        vm.prank(client);
        core.cancelSession(id);
        assertEq(token.balanceOf(client), before + RATE);
        assertEq(uint256(core.getSession(id).status), uint256(TeraPCore.SessionStatus.Cancelled));
    }

    function testClientLateCancelPaysFee() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);
        vm.warp(block.timestamp + 2 days - 1 hours);
        uint256 cBefore = token.balanceOf(client);
        uint256 tBefore = token.balanceOf(therapist);
        vm.prank(client);
        core.cancelSession(id);
        assertEq(token.balanceOf(therapist), tBefore + RATE / 2);
        assertEq(token.balanceOf(client), cBefore + RATE / 2);
    }

    function testTherapistCancelFullRefund() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);
        vm.warp(block.timestamp + 2 days - 1 hours);
        uint256 cBefore = token.balanceOf(client);
        vm.prank(therapist);
        core.cancelSession(id);
        assertEq(token.balanceOf(client), cBefore + RATE);
    }

    function testCancelByStrangerReverts() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);
        vm.prank(voter);
        vm.expectRevert(TeraPCore.NotParticipant.selector);
        core.cancelSession(id);
    }

    function testCannotCompleteCancelled() public {
        _registerAndVerify(therapist);
        uint256 id = _book(client, 60);
        vm.prank(client);
        core.cancelSession(id);
        vm.warp(block.timestamp + 3 days);
        vm.prank(client);
        vm.expectRevert(TeraPCore.InvalidSessionState.selector);
        core.completeSession(id, 5);
    }

    function testBookWithSubscription() public {
        _registerAndVerify(therapist);
        vm.prank(owner);
        uint256 tier = subscription.createTier("Basic", 100 ether, 120);

        vm.startPrank(client);
        token.approve(address(subscription), 100 ether);
        subscription.subscribe(tier, 1);
        uint256 id = core.bookSession(therapist, 60, 0, "", true);
        vm.stopPrank();

        assertEq(subscription.getSubscription(client).minutesRemaining, 60);
        assertEq(subscription.poolBalance(), 0); // 100 TERAP moved to core escrow
        assertEq(token.balanceOf(address(core)), RATE);
        assertTrue(core.getSession(id).paidBySubscription);

        // cancel -> funds and minutes return to the plan
        vm.prank(therapist);
        core.cancelSession(id);
        assertEq(subscription.getSubscription(client).minutesRemaining, 120);
        assertEq(subscription.poolBalance(), 100 ether);
    }

    function testPausedBlocksBooking() public {
        _registerAndVerify(therapist);
        vm.prank(owner);
        core.pause();
        vm.prank(client);
        vm.expectRevert();
        core.bookSession(therapist, 60, 0, "", false);
    }

    // ------------------------------------------------------------ circles

    function testCreateJoinLeaveCircle() public {
        vm.startPrank(therapist);
        token.approve(address(core), 50 ether);
        uint256 id = core.createWellnessCircle("Anxiety Circle", "Weekly support", 50 ether);
        vm.stopPrank();

        TeraPCore.WellnessCircle memory c = core.getCircle(id);
        assertEq(c.facilitator, therapist);
        assertEq(c.memberCount, 1);
        assertEq(core.getCircleReputation(id, therapist), 100);

        vm.startPrank(client);
        token.approve(address(core), 50 ether);
        core.joinWellnessCircle(id);
        vm.expectRevert(TeraPCore.AlreadyMember.selector);
        core.joinWellnessCircle(id);
        vm.stopPrank();
        assertEq(core.getCircle(id).memberCount, 2);
        assertTrue(core.isCircleMember(id, client));

        uint256 before = token.balanceOf(client);
        vm.prank(client);
        core.leaveWellnessCircle(id);
        assertEq(token.balanceOf(client), before + 50 ether);
        assertFalse(core.isCircleMember(id, client));

        vm.prank(therapist);
        vm.expectRevert(TeraPCore.NotMember.selector);
        core.leaveWellnessCircle(id);
    }

    function testInactiveCircleCannotBeJoined() public {
        vm.prank(therapist);
        uint256 id = core.createWellnessCircle("Free", "", 0);
        vm.prank(therapist);
        core.setCircleActive(id, false);
        vm.prank(client);
        vm.expectRevert(TeraPCore.CircleInactive.selector);
        core.joinWellnessCircle(id);
    }

    // ------------------------------------------------------------ cross-chain

    function _ctx(address sender, uint256 chainId) internal pure returns (MessageContext memory) {
        return MessageContext({sender: abi.encodePacked(sender), senderEVM: sender, chainID: chainId});
    }

    function testOnCallOnlyGateway() public {
        vm.expectRevert(UniversalContractBase.NotGateway.selector);
        core.onCall(_ctx(client, 1), address(usdc), 1, abi.encode(uint8(2), bytes("")));
    }

    function testCrossChainBooking() public {
        _registerAndVerify(therapist);
        usdc.mint(address(core), 120 ether); // gateway deposits before calling
        bytes memory payload = abi.encode(therapist, uint256(60), uint256(0), "notes");
        uint8 action = core.ACTION_BOOK_SESSION();
        vm.prank(gateway);
        core.onCall(_ctx(client, 11155111), address(usdc), 120 ether, abi.encode(action, payload));

        TeraPCore.TherapySession memory s = core.getSession(1);
        assertEq(s.client, client);
        assertEq(s.paymentToken, address(usdc));
        assertEq(s.cost, 100 ether);
        assertEq(s.sourceChainId, 11155111);
        assertEq(core.treasuryBalances(address(usdc)), 20 ether); // overpayment kept as donation

        vm.prank(client);
        core.completeSession(1, 5);
        assertEq(usdc.balanceOf(therapist), 100 ether - 2.5 ether);
    }

    function testCrossChainBookingUnderpaid() public {
        _registerAndVerify(therapist);
        bytes memory payload = abi.encode(therapist, uint256(60), uint256(0), "");
        vm.prank(gateway);
        vm.expectRevert(abi.encodeWithSelector(TeraPCore.InsufficientPayment.selector, 100 ether, 50 ether));
        core.onCall(_ctx(client, 1), address(usdc), 50 ether, abi.encode(uint8(1), payload));
    }

    function testCrossChainUnsupportedToken() public {
        _registerAndVerify(therapist);
        bytes memory payload = abi.encode(therapist, uint256(60), uint256(0), "");
        vm.prank(gateway);
        vm.expectRevert(TeraPCore.UnsupportedPaymentToken.selector);
        core.onCall(_ctx(client, 1), address(0xBEEF), 100 ether, abi.encode(uint8(1), payload));
    }

    function testCrossChainDonationFromNonEvmSender() public {
        MessageContext memory ctx = MessageContext({sender: hex"deadbeef", senderEVM: address(0), chainID: 18332});
        vm.prank(gateway);
        core.onCall(ctx, address(usdc), 1_000 ether, abi.encode(uint8(2), bytes("")));
        assertEq(core.treasuryBalances(address(usdc)), 1_000 ether);
        address derived = address(uint160(uint256(keccak256(abi.encodePacked(uint256(18332), hex"deadbeef")))));
        assertEq(core.userReputationScores(derived), 10);
    }

    function testCrossChainJoinCircle() public {
        vm.startPrank(therapist);
        token.approve(address(core), 10 ether);
        uint256 id = core.createWellnessCircle("Staked", "", 10 ether);
        vm.stopPrank();
        vm.prank(owner);
        token.transfer(address(core), 10 ether); // simulate gateway deposit of TERAP
        vm.prank(gateway);
        core.onCall(_ctx(client, 1), address(token), 10 ether, abi.encode(uint8(3), abi.encode(id)));
        assertTrue(core.isCircleMember(id, client));
    }

    // ------------------------------------------------------------ misc

    function testGovernorRole() public {
        vm.prank(client);
        vm.expectRevert(TeraPCore.NotGovernor.selector);
        core.setParameter(0, 100);
        vm.prank(address(governance));
        core.setParameter(0, 100);
        assertEq(core.platformFeeBps(), 100);
        vm.prank(owner);
        vm.expectRevert(TeraPCore.InvalidInput.selector);
        core.setParameter(0, 5_000);
    }

    function testTreasuryWithdrawOnlyGovernor() public {
        vm.prank(client);
        vm.expectRevert(TeraPCore.NotGovernor.selector);
        core.withdrawTreasury(address(token), client, 1);
        vm.prank(owner);
        vm.expectRevert(TeraPCore.InsufficientTreasury.selector);
        core.withdrawTreasury(address(token), client, 1);
    }

    function testTokenURI() public {
        _registerAndVerify(therapist);
        vm.prank(owner);
        core.setBaseURI("https://terap.xyz/nft/");
        assertEq(core.tokenURI(1), "https://terap.xyz/nft/1/1");
    }

    function testUpgradeOnlyOwner() public {
        address impl = address(new TeraPCore());
        vm.prank(client);
        vm.expectRevert();
        core.upgradeToAndCall(impl, "");
        vm.prank(owner);
        core.upgradeToAndCall(impl, "");
        assertEq(address(core.terapToken()), address(token));
    }

    function testFuzzSessionCost(uint64 rate, uint16 duration) public {
        rate = uint64(bound(rate, 1, type(uint64).max));
        duration = uint16(bound(duration, 1, 600));
        string[] memory specs;
        vm.prank(therapist);
        core.registerTherapist("H", specs, "", rate, 0, 0);
        vm.prank(owner);
        core.verifyTherapist(therapist);
        assertEq(core.calculateSessionCost(therapist, duration), uint256(rate) * duration / 60);
    }
}
