// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {TeraPCore} from "../contracts/TeraPCore.sol";
import {TeraPGovernance} from "../contracts/TeraPGovernance.sol";

contract TeraPGovernanceTest is BaseTest {
    function _propose(TeraPGovernance.ProposalType t, bytes memory data) internal returns (uint256 id) {
        vm.prank(voter);
        id = governance.createProposal("Title", "Desc", t, data);
        vm.roll(block.number + 1);
    }

    function _pass(uint256 id) internal {
        vm.prank(voter);
        governance.vote(id, true);
        vm.warp(block.timestamp + 7 days);
    }

    function testProposalThreshold() public {
        vm.prank(client);
        token.transfer(voter, 9_500 ether);
        vm.roll(block.number + 1);
        vm.prank(client);
        vm.expectRevert(
            abi.encodeWithSelector(TeraPGovernance.InsufficientVotingPower.selector, 500 ether, 1_000 ether)
        );
        governance.createProposal(
            "t", "d", TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(0), uint256(100))
        );
    }

    function testVerifyTherapistViaProposal() public {
        string[] memory specs;
        vm.prank(therapist);
        core.registerTherapist("H", specs, "", RATE, 0, 0);

        uint256 id = _propose(TeraPGovernance.ProposalType.TherapistVerification, abi.encode(therapist));
        vm.prank(voter);
        governance.vote(id, true);
        assertEq(uint256(governance.proposalState(id)), uint256(TeraPGovernance.ProposalState.Active));

        vm.expectRevert(TeraPGovernance.ProposalNotSucceeded.selector);
        governance.executeProposal(id);

        vm.warp(block.timestamp + 7 days);
        assertEq(uint256(governance.proposalState(id)), uint256(TeraPGovernance.ProposalState.Succeeded));
        governance.executeProposal(id);
        assertTrue(core.verifiedTherapists(therapist));
        assertEq(uint256(governance.proposalState(id)), uint256(TeraPGovernance.ProposalState.Executed));

        vm.expectRevert(TeraPGovernance.ProposalNotSucceeded.selector);
        governance.executeProposal(id);
    }

    function testQuorumRequired() public {
        uint256 id = _propose(TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(0), uint256(100)));
        vm.prank(client); // 10k of 20M supply: below 4% quorum
        governance.vote(id, true);
        vm.warp(block.timestamp + 7 days);
        assertEq(uint256(governance.proposalState(id)), uint256(TeraPGovernance.ProposalState.Defeated));
        assertEq(governance.quorum(), token.totalSupply() * 400 / 10_000);
    }

    function testVoteUsesSnapshot() public {
        uint256 id = _propose(TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(0), uint256(100)));
        vm.prank(voter);
        token.transfer(client, 500_000 ether); // after snapshot
        vm.roll(block.number + 1);

        vm.prank(client);
        governance.vote(id, true);
        vm.prank(voter);
        governance.vote(id, false);
        TeraPGovernance.Proposal memory p = governance.getProposal(id);
        assertEq(p.votesFor, 10_000 ether);
        assertEq(p.votesAgainst, 1_000_000 ether);
        assertTrue(governance.hasVoted(id, client));

        vm.prank(client);
        vm.expectRevert(TeraPGovernance.AlreadyVoted.selector);
        governance.vote(id, true);
    }

    function testStakedTokensCountDouble() public {
        vm.prank(voter);
        token.stake(400_000 ether);
        vm.roll(block.number + 1);
        uint256 id = _propose(TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(0), uint256(100)));
        vm.prank(voter);
        governance.vote(id, true);
        assertEq(governance.getProposal(id).votesFor, 600_000 ether + 800_000 ether);
    }

    function testLocalAndForwardedParameterChange() public {
        uint256 p1 = _propose(TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(2), uint256(1_000)));
        uint256 p2 = _propose(TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(100), uint256(500)));
        vm.startPrank(voter);
        governance.vote(p1, true);
        governance.vote(p2, true);
        vm.stopPrank();
        vm.warp(block.timestamp + 7 days);
        governance.executeProposal(p2);
        governance.executeProposal(p1); // raises quorum to 10% after p2 already passed
        assertEq(governance.quorumBps(), 1_000);
        assertEq(core.platformFeeBps(), 500);
    }

    function testFundingAllocation() public {
        _registerAndVerify(therapist);
        uint256 sid = _book(client, 60);
        vm.warp(block.timestamp + 2 days);
        vm.prank(client);
        core.completeSession(sid, 5);
        uint256 fee = core.daoTreasury();
        assertGt(fee, 0);

        uint256 id = _propose(TeraPGovernance.ProposalType.FundingAllocation, abi.encode(address(token), client, fee));
        _pass(id);
        uint256 before = token.balanceOf(client);
        governance.executeProposal(id);
        assertEq(core.daoTreasury(), 0);
        assertEq(token.balanceOf(client), before + fee);
    }

    function testEmergencyPauseAndRevoke() public {
        _registerAndVerify(therapist);
        uint256 p1 = _propose(TeraPGovernance.ProposalType.Emergency, abi.encode(uint8(0), address(0)));
        uint256 p2 = _propose(TeraPGovernance.ProposalType.Emergency, abi.encode(uint8(2), therapist));
        vm.startPrank(voter);
        governance.vote(p1, true);
        governance.vote(p2, true);
        vm.stopPrank();
        vm.warp(block.timestamp + 7 days);
        governance.executeProposal(p1);
        governance.executeProposal(p2);
        assertTrue(core.paused());
        assertFalse(core.verifiedTherapists(therapist));
    }

    function testCancelProposal() public {
        uint256 id = _propose(TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(0), uint256(100)));
        vm.prank(client);
        vm.expectRevert(TeraPGovernance.NotProposer.selector);
        governance.cancelProposal(id);
        vm.prank(voter);
        governance.cancelProposal(id);
        vm.prank(voter);
        vm.expectRevert(TeraPGovernance.VotingClosed.selector);
        governance.vote(id, true);
        assertEq(uint256(governance.proposalState(id)), uint256(TeraPGovernance.ProposalState.Cancelled));
    }

    function testMalformedProposalsRejected() public {
        vm.startPrank(voter);
        vm.expectRevert(TeraPGovernance.InvalidInput.selector);
        governance.createProposal("t", "d", TeraPGovernance.ProposalType.TherapistVerification, abi.encode(client));
        vm.expectRevert(TeraPGovernance.InvalidInput.selector);
        governance.createProposal(
            "t", "d", TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(7), uint256(1))
        );
        vm.expectRevert(TeraPGovernance.InvalidInput.selector);
        governance.createProposal(
            "t", "d", TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(103), uint256(1))
        );
        vm.expectRevert(TeraPGovernance.InvalidInput.selector);
        governance.createProposal("t", "d", TeraPGovernance.ProposalType.Emergency, abi.encode(uint8(9), address(0)));
        vm.expectRevert(TeraPGovernance.InvalidInput.selector);
        governance.createProposal("", "d", TeraPGovernance.ProposalType.Emergency, abi.encode(uint8(0), address(0)));
        vm.stopPrank();
    }

    function testGovernanceRequiresRoleOnCore() public {
        vm.prank(owner);
        core.setGovernance(address(0));
        uint256 id = _propose(TeraPGovernance.ProposalType.ParameterChange, abi.encode(uint8(100), uint256(500)));
        _pass(id);
        vm.expectRevert(TeraPCore.NotGovernor.selector);
        governance.executeProposal(id);
    }

    function testUpgradeOnlyOwner() public {
        address impl = address(new TeraPGovernance());
        vm.prank(client);
        vm.expectRevert();
        governance.upgradeToAndCall(impl, "");
        vm.prank(owner);
        governance.upgradeToAndCall(impl, "");
    }
}
