// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @notice Context for an inbound cross-chain call delivered by the ZetaChain GatewayZEVM.
 * @dev Field layout mirrors `@zetachain/protocol-contracts` v2 `MessageContext` so the ABI is
 *      identical to what the gateway sends.
 * @param sender    Raw sender bytes on the source chain (EVM address, BTC script, Solana pubkey, ...)
 * @param senderEVM Sender as an EVM address when the source chain is EVM-compatible, otherwise zero
 * @param chainID   ZetaChain chain id of the source chain
 */
struct MessageContext {
    bytes sender;
    address senderEVM;
    uint256 chainID;
}

/**
 * @title UniversalContract
 * @notice Interface implemented by ZetaChain universal contracts that receive cross-chain calls.
 */
interface UniversalContract {
    /**
     * @notice Called by the gateway when a deposit-and-call or call arrives from a connected chain.
     * @param context Cross-chain message context
     * @param zrc20   ZRC-20 token that was deposited to this contract (zero for plain calls)
     * @param amount  Amount of `zrc20` deposited
     * @param message Application-specific payload
     */
    function onCall(MessageContext calldata context, address zrc20, uint256 amount, bytes calldata message) external;
}

/**
 * @title UniversalContractBase
 * @notice Shared gateway bookkeeping for universal contracts.
 */
abstract contract UniversalContractBase is UniversalContract {
    /// @notice ZetaChain GatewayZEVM allowed to invoke {onCall}
    address public gateway;

    error NotGateway();
    error InvalidGateway();

    event GatewayUpdated(address indexed gateway);

    modifier onlyGateway() {
        if (msg.sender != gateway) revert NotGateway();
        _;
    }

    function setGateway(address _gateway) external virtual;
}
