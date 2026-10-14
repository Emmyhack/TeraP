# Deployment

`script/Deploy.s.sol` deploys the whole stack behind UUPS (ERC-1967) proxies, wires the modules together, seeds four subscription tiers and writes `deployments/<chainId>.json`.

## 1. Prerequisites

- Foundry (`forge`, `cast`)
- A funded deployer key. On Athens testnet get ZETA from https://labs.zetachain.com/get-zeta or the `#faucet` channel on the ZetaChain Discord. Deployment costs roughly 16M gas.

Environment (export or put in `.env` and `source .env`):

| Variable | Required | Meaning |
|---|---|---|
| `PRIVATE_KEY` | yes | deployer; becomes owner unless `OWNER_ADDRESS` is set |
| `OWNER_ADDRESS` | no | final owner of every contract (e.g. a DAO multisig) |
| `GATEWAY_ADDRESS` | no | override for the ZetaChain GatewayZEVM. Auto-selected for chain ids 7000/7001 (`0x6c533f7fE93fAE114d0954697069Df33C9B74fD7`) |

## 2. Deploy

```bash
# Athens testnet (chain id 7001)
forge script script/Deploy.s.sol \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public \
  --broadcast --legacy

# Mainnet (chain id 7000)
forge script script/Deploy.s.sol \
  --rpc-url https://zetachain-evm.blockpi.network/v1/rpc/public \
  --broadcast --legacy
```

`--legacy` is needed because ZetaChain's EVM uses legacy gas pricing. The script prints every address and writes `deployments/7001.json` (or `7000.json`). Commit that file.

Dry run without broadcasting: drop `--broadcast`. Local simulation without an RPC: `PRIVATE_KEY=0x... forge script script/Deploy.s.sol` (uses chain id 31337 and a placeholder gateway).

## 3. Verify on the explorer (optional)

```bash
forge verify-contract <IMPL_ADDRESS> contracts/TeraPCore.sol:TeraPCore \
  --chain-id 7001 --verifier blockscout \
  --verifier-url https://zetachain-athens-3.blockscout.com/api
```

Repeat for each implementation; proxies are standard `ERC1967Proxy` from OpenZeppelin.

## 4. Configure the frontend

Copy the addresses into `.env.local`:

```
NEXT_PUBLIC_CHAIN_ID=7001
NEXT_PUBLIC_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
NEXT_PUBLIC_TERAP_TOKEN_ADDRESS=<TeraPToken>
NEXT_PUBLIC_TERAP_CORE_ADDRESS=<TeraPCore>
NEXT_PUBLIC_TERAP_SUBSCRIPTION_ADDRESS=<TeraPSubscription>
NEXT_PUBLIC_TERAP_GOVERNANCE_ADDRESS=<TeraPGovernance>
NEXT_PUBLIC_TERAP_GAMIFICATION_ADDRESS=<WellnessGameification>
NEXT_PUBLIC_TERAP_CREDENTIAL_VERIFIER_ADDRESS=<ZKCredentialVerifier>
```

Then `npm run build && npm run start` (or deploy to Vercel with the same variables).

## 5. Bootstrap the platform

The deployer/owner should, using `cast send` or the UI:

1. **Accept cross-chain payment tokens**: `TeraPCore.setSupportedPaymentToken(<ZRC20>, true)` for each stablecoin ZRC-20 clients may pay with (e.g. USDC.ETH, USDC.BSC). TERAP itself is accepted by default.
2. **Verify the first therapists** with `TeraPCore.verifyTherapist(addr)` until governance has enough token holders to pass proposals.
3. **Distribute TERAP** (the owner holds the 20M initial supply): transfer to community members, an exchange/LP, or the subscription pool.
4. **Add gamification challenges** with `WellnessGameification.createChallenge(name, points, deadline)` and operators with `setOperator(addr, true)`.
5. **Hand over ownership** to a multisig: `transferOwnership(multisig)` on every contract (or pass `OWNER_ADDRESS` at deploy time).

## 6. Upgrades

All proxies are UUPS; only the owner can upgrade.

```bash
CONTRACT=TeraPCore PRIVATE_KEY=0x... \
  forge script script/Upgrade.s.sol --rpc-url <rpc> --broadcast --legacy
```

`PROXY=<address>` overrides the address read from `deployments/<chainId>.json`. Keep storage layouts append-only when editing an upgradeable contract.

## Notes on earlier deployments

Addresses published in earlier versions of this repository (e.g. `0x00D9…dc37`) pointed at proxies with no code on Athens and used a gateway address with no contract behind it. They are not valid; redeploy with the script above.
