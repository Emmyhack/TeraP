// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {TeraPToken} from "../contracts/TeraPToken.sol";

contract SimpleTokenTest is Test {
    TeraPToken public token;
    address public owner = address(0x123);
    
    function setUp() public {
        // Deploy and initialize from owner address
        vm.prank(owner);
        token = new TeraPToken();
        
        vm.prank(owner);
        token.initialize("TeraP Test Token", "TEST", owner, owner);
    }
    
    function testTokenInitialization() public view {
        assertEq(token.name(), "TeraP Test Token");
        assertEq(token.symbol(), "TEST");
        assertEq(token.owner(), owner);
    }
    
    function testTokenMinting() public {
        vm.startPrank(owner);
        
        address recipient = address(0x456);
        uint256 amount = 1000 * 10**18;
        
        token.mint(recipient, amount);
        assertEq(token.balanceOf(recipient), amount);
        
        vm.stopPrank();
    }
}