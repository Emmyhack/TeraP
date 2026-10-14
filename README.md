# TeraP Universal

A decentralized therapy and wellness platform built as a **ZetaChain universal app**: clients book sessions with DAO-verified therapists, join stake-to-enter wellness circles, govern the platform with the TERAP token, and can pay from any chain connected to ZetaChain.

> Status: contracts complete and tested (71 Foundry tests), frontend wired to the contracts, not yet deployed to a public network. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) to deploy.

## What's in the box

| Layer | Tech | Where |
|---|---|---|
| Smart contracts | Solidity 0.8, Foundry, OpenZeppelin 5 (UUPS proxies) | `contracts/`, `script/`, `test/` |
| Frontend | Next.js 14 (app router), TypeScript, Tailwind, ethers v6 | `app/`, `components/`, `hooks/`, `services/` |
| Integration | One typed service over the contract ABIs | `services/TeraPContracts.ts`, `hooks/useTeraP.ts`, `config/contracts.ts`, `config/abi/` |

### Contracts

| Contract | Purpose |
|---|---|
| `TeraPToken` | TERAP ERC-20 with vote checkpoints, 100M cap, role-based minting, and 30-day staking (5% APY, staked tokens count 2x in governance). Holders are auto-delegated to themselves. |
| `TeraPCore` | Universal contract. Therapist registry + DAO verification (soulbound credential NFT), session booking with escrow (TERAP, subscription minutes, or a ZRC-20 from another chain via the gateway), completion / cancellation / late-claim rules, session receipt NFTs, wellness circles, treasury. |
| `TeraPSubscription` | Prepaid plans (TERAP per 30 days -> session minutes). `TeraPCore` draws minutes and funds from it when a client books with `useSubscription = true`. |
| `TeraPGovernance` | Proposals with snapshot voting and quorum. Executes against `TeraPCore`: verify/revoke therapists, move treasury funds, change parameters, pause/unpause. |
| `WellnessGameification` | Operator-attested wellness challenges, achievements, soulbound achievement NFTs, points redeemable for TERAP. |
| `ZKCredentialVerifier` | Hash-commitment registry for therapist credentials with attester sign-off (no on-chain SNARK verification yet). |

Full semantics, parameters and proposal encodings: [docs/CONTRACTS.md](docs/CONTRACTS.md). Cross-chain booking: [docs/CROSS_CHAIN.md](docs/CROSS_CHAIN.md).

## Quick start

Prerequisites: Node 18+, [Foundry](https://book.getfoundry.sh/getting-started/installation), git.

```bash
git clone --recurse-submodules https://github.com/Emmyhack/TeraP.git
cd TeraP
npm install
forge build && forge test
```

### Run against a local chain

```bash
# terminal 1
anvil

# terminal 2 — deploy with anvil's first account
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# copy addresses from deployments/31337.json into .env.local
cp .env.example .env.local   # then fill NEXT_PUBLIC_* from the JSON, set NEXT_PUBLIC_CHAIN_ID=31337
npm run dev                  # http://localhost:3000
```

Import the anvil key into MetaMask, add network `http://127.0.0.1:8545` (chain id 31337), and connect. The deployer holds 20M TERAP and is the contract owner, so it can verify therapists and seed tiers.

### Deploy to ZetaChain Athens testnet

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Short version: fund a key with testnet ZETA, then

```bash
PRIVATE_KEY=0x... npm run deploy:testnet
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` / `lint` | `tsc --noEmit` / `next lint` |
| `npm run compile` / `test` | `forge build` / `forge test` |
| `npm run abi` | Rebuild contracts and refresh `config/abi/*.json` |
| `npm run deploy:testnet` / `deploy:mainnet` | `forge script script/Deploy.s.sol` against ZetaChain |

## How the pieces fit

1. A therapist registers (`registerTherapist`) with an anonymous id, encrypted credential pointer, hourly rate, a credential hash and an encryption public key.
2. The DAO verifies them (a `TherapistVerification` proposal, or the owner during bootstrap). They receive a soulbound credential NFT and become bookable.
3. A client books (`bookSession`), paying with TERAP or subscription minutes. Funds are escrowed in `TeraPCore`.
4. After the scheduled time the client completes and rates the session; the therapist is paid minus the platform fee (2.5% default) and the client receives a session receipt NFT. If the client never confirms, the therapist can claim after 7 days. Either side can cancel; late client cancellations forfeit 50%.
5. Fees and donations accumulate in the treasury; TERAP holders stake, propose and vote on how to use them.

## Privacy features (client side)

`services/ZK*.ts`, `services/EncryptedCommunicationService.ts` and `components/identity/*` implement anonymous identities, encrypted session chat and local-only mood/feedback tracking in the browser. They are client-side constructs and are not verified on-chain; see each file's header for what it does and does not guarantee.

## Repository layout

```
contracts/        Solidity sources (+ UniversalContract.sol gateway interface)
script/           Deploy.s.sol, Upgrade.s.sol
test/             Foundry tests (Base.t.sol has the shared fixture)
deployments/      <chainId>.json written by Deploy.s.sol
config/abi/       ABIs exported from the build (npm run abi)
app/              Next.js routes (+ /api read-only endpoints)
components/       UI
services/         TeraPContracts.ts + client-side privacy services
docs/             CONTRACTS.md, DEPLOYMENT.md, CROSS_CHAIN.md
```

## License

MIT
