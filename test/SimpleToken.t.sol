// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {TeraPToken} from "../contracts/TeraPToken.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract SimpleTokenTest is Test {
    TeraPToken public token;
    address public owner = address(0x123);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy implementation
        TeraPToken implementation = new TeraPToken();
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            TeraPToken.initialize.selector,
            "TeraP Test Token",
            "TEST",
            owner,
            owner
        );
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        token = TeraPToken(address(proxy));
        
        vm.stopPrank();
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