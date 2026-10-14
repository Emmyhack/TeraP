// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {TeraPToken} from "../contracts/TeraPToken.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract TeraPTokenTest is BaseTest {
    function testInitialState() public view {
        assertEq(token.name(), "TeraP Token");
        assertEq(token.symbol(), "TERAP");
        assertEq(token.totalSupply(), token.INITIAL_SUPPLY());
        assertEq(token.owner(), owner);
        assertEq(token.delegates(client), client, "auto self-delegation");
        assertEq(token.getVotes(client), 10_000 ether);
    }

    function testCannotReinitialize() public {
        vm.expectRevert();
        token.initialize("x", "y", owner, owner);
    }

    function testMintByOwnerAndMinter() public {
        vm.prank(owner);
        token.mint(client, 1 ether);
        vm.prank(address(game));
        token.mint(client, 1 ether);
        assertEq(token.balanceOf(client), 10_002 ether);
    }

    function testMintUnauthorizedReverts() public {
        vm.prank(client);
        vm.expectRevert(TeraPToken.NotMinter.selector);
        token.mint(client, 1);
    }

    function testMintRespectsCap() public {
        uint256 room = token.MAX_SUPPLY() - token.totalSupply();
        vm.startPrank(owner);
        token.mint(owner, room);
        vm.expectRevert(TeraPToken.MaxSupplyExceeded.selector);
        token.mint(owner, 1);
        vm.stopPrank();
    }

    function testStakeAndVotingPower() public {
        vm.startPrank(client);
        uint256 idx = token.stake(1_000 ether);
        vm.stopPrank();

        assertEq(idx, 0);
        assertEq(token.stakedBalances(client), 1_000 ether);
        assertEq(token.totalStaked(), 1_000 ether);
        assertEq(token.balanceOf(client), 9_000 ether);
        assertEq(token.getVotingPower(client), 9_000 ether + 2_000 ether);
        assertEq(token.stakeCount(client), 1);
    }

    function testPastVotingPowerSnapshots() public {
        vm.prank(client);
        token.stake(1_000 ether);
        uint256 snap = vm.getBlockNumber();
        vm.roll(block.number + 1);

        // Moving tokens after the snapshot does not change the snapshot weight.
        vm.prank(client);
        token.transfer(voter, 5_000 ether);
        assertEq(token.getPastVotingPower(client, snap), 9_000 ether + 2_000 ether);
        assertEq(token.getPastVotingPower(voter, snap), 1_000_000 ether);
    }

    function testUnstakeBeforeLockReverts() public {
        vm.startPrank(client);
        token.stake(1_000 ether);
        vm.expectRevert(abi.encodeWithSelector(TeraPToken.StakeLocked.selector, block.timestamp + 30 days));
        token.unstake(0);
        vm.stopPrank();
    }

    function testUnstakeAfterLockPaysReward() public {
        vm.startPrank(client);
        token.stake(1_000 ether);
        vm.warp(block.timestamp + 365 days);
        uint256 expected = token.calculateStakingReward(client, 0);
        assertEq(expected, 50 ether); // 5% APY
        token.unstake(0);
        vm.stopPrank();

        assertEq(token.balanceOf(client), 10_050 ether);
        assertEq(token.stakedBalances(client), 0);
        assertEq(token.stakeCount(client), 0);
    }

    function testUnstakeSwapAndPop() public {
        vm.startPrank(client);
        token.stake(100 ether);
        token.stake(200 ether);
        token.stake(300 ether);
        vm.warp(block.timestamp + 31 days);
        token.unstake(0);
        TeraPToken.StakeInfo[] memory s = token.getStakes(client);
        vm.stopPrank();
        assertEq(s.length, 2);
        assertEq(s[0].amount, 300 ether);
        assertEq(s[1].amount, 200 ether);
    }

    function testInvalidStakeIndex() public {
        vm.prank(client);
        vm.expectRevert(TeraPToken.InvalidStakeIndex.selector);
        token.unstake(0);
    }

    function testUpgradeOnlyOwner() public {
        address impl = address(new TeraPToken());
        vm.prank(client);
        vm.expectRevert();
        token.upgradeToAndCall(impl, "");
        vm.prank(owner);
        token.upgradeToAndCall(impl, "");
    }

    function testFuzzStakeReward(uint96 amount, uint32 extra) public {
        amount = uint96(bound(amount, 1, 10_000 ether));
        vm.startPrank(client);
        token.stake(amount);
        vm.warp(block.timestamp + 30 days + extra);
        uint256 reward = token.calculateStakingReward(client, 0);
        assertEq(reward, uint256(amount) * 500 * (30 days + uint256(extra)) / (10_000 * 365 days));
        token.unstake(0);
        vm.stopPrank();
        assertEq(token.stakedBalances(client), 0);
    }
}
