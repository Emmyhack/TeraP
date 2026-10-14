// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Minimal ERC-20 standing in for a ZRC-20 stablecoin in tests.
contract MockZRC20 is ERC20 {
    constructor() ERC20("Mock USDC.ETH", "USDC.ETH") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
