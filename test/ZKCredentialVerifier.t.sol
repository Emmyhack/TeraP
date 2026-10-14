// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ZKCredentialVerifier} from "../contracts/ZKCredentialVerifier.sol";

contract ZKCredentialVerifierTest is Test {
    ZKCredentialVerifier v;
    address owner = makeAddr("owner");
    address attester = makeAddr("attester");
    address user = makeAddr("user");
    bytes32 c = keccak256("doc|salt");

    function setUp() public {
        v = new ZKCredentialVerifier(owner);
        vm.prank(owner);
        v.setAttester(attester, true);
    }

    function testSubmitAttestRevoke() public {
        vm.prank(user);
        v.submitCredentialCommitment(c);
        assertFalse(v.isCredentialValid(c));
        assertFalse(v.isUserVerified(user));

        vm.prank(user);
        vm.expectRevert(ZKCredentialVerifier.NotAttester.selector);
        v.attestCredential(c);

        vm.prank(attester);
        v.attestCredential(c);
        assertTrue(v.isCredentialValid(c));
        assertTrue(v.isUserVerified(user));

        vm.prank(owner);
        v.revokeCredential(c);
        assertFalse(v.isUserVerified(user));
    }

    function testDuplicateAndUnknown() public {
        vm.prank(user);
        v.submitCredentialCommitment(c);
        vm.prank(user);
        vm.expectRevert(ZKCredentialVerifier.AlreadySubmitted.selector);
        v.submitCredentialCommitment(c);
        vm.prank(attester);
        vm.expectRevert(ZKCredentialVerifier.UnknownCommitment.selector);
        v.attestCredential(keccak256("other"));
    }
}
