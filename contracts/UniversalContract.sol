// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title MessageContext
 * @dev Context structure for cross-chain messages in ZetaChain
 */
struct MessageContext {
    bytes origin;
    address sender;
    uint256 chainID;
}

/**
 * @title UniversalContract
 * @dev Interface for universal contracts that can receive cross-chain calls
 */
interface UniversalContract {
    /**
     * @notice Called when the contract receives a cross-chain call
     * @param context Cross-chain message context
     * @param zrc20 ZRC-20 token address for payments
     * @param amount Amount of tokens transferred
     * @param message Encoded message data
     */
    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external;
}

/**
 * @title UniversalContractBase
 * @dev Base implementation with gateway modifier
 */
abstract contract UniversalContractBase is UniversalContract {
    address public gateway;
    
    modifier onlyGateway() {
        require(msg.sender == gateway, "UniversalContract: caller is not gateway");
        _;
    }
    
    function setGateway(address _gateway) external virtual;
}