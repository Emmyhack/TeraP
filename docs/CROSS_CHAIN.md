# Cross-chain payments

`TeraPCore` implements ZetaChain's `UniversalContract.onCall`. A user on any connected chain (Ethereum, BSC, Polygon, Bitcoin, Solana, …) can book a session or donate to the treasury without holding ZETA or TERAP: they deposit a supported asset to the ZetaChain gateway on their chain with a message, the gateway mints the matching ZRC-20 to `TeraPCore` on ZetaChain and calls `onCall`.

## Message format

```
message = abi.encode(uint8 action, bytes payload)
```

| action | payload | effect |
|---|---|---|
| `1` book session | `abi.encode(address therapist, uint256 durationMinutes, uint256 scheduledAt, string encryptedNotes)` | creates a Booked session paid in the deposited ZRC-20. `amount` must be ≥ `calculateSessionCost(therapist, duration)`; any excess is kept as a treasury donation (it cannot be returned cross-chain). |
| `2` donate | empty | adds `amount` of the ZRC-20 to the treasury and credits reputation to the sender. |
| `3` join circle | `abi.encode(uint256 circleId)` | only when the deposited asset is TERAP; stakes `amount` into the circle. |

The deposited ZRC-20 must be enabled with `setSupportedPaymentToken`. Rates are treated as 1:1 with TERAP (i.e. quoted in USD-pegged units), so only stablecoin ZRC-20s should be enabled.

Non-EVM senders (Bitcoin, Solana) are attributed to a deterministic address derived from `keccak256(chainID, senderBytes)`; their sessions appear under that address.

## From an EVM chain

Using the ZetaChain GatewayEVM on the source chain (addresses in the [ZetaChain docs](https://www.zetachain.com/docs/reference/network/contracts/)):

```solidity
IGatewayEVM(gateway).depositAndCall(
    terapCore,                 // receiver on ZetaChain
    amount,                    // ERC-20 amount (approve first)
    usdc,                      // ERC-20 on the source chain
    abi.encode(uint8(1), abi.encode(therapist, 60, scheduledAt, "")),
    RevertOptions({ revertAddress: msg.sender, callOnRevert: false, abortAddress: address(0), revertMessage: "", onRevertGasLimit: 0 })
);
```

Or with the ZetaChain CLI:

```bash
npx zetachain evm deposit-and-call \
  --chain-id 11155111 --receiver <TeraPCore> --erc20 <USDC> --amount 100 \
  --types uint8 bytes --values 1 <encodedPayloadHex>
```

The frontend's "Pay from another chain" panel (`components/wallet/CrossChainTransaction.tsx`) produces the encoded payload for a chosen therapist and duration.

## From Bitcoin / Solana

Follow the ZetaChain docs for `depositAndCall` from Bitcoin (inscription memo) or Solana (gateway program) with the same `message` bytes.

## Refunds

If `onCall` reverts (unsupported token, underpayment, therapist not verified, platform paused) the gateway reverts the deposit according to the sender's `RevertOptions`. Cancelled cross-chain sessions cannot push funds back across chains; the refund is credited to the treasury and the DAO returns it with a `FundingAllocation` proposal.
