# Contract reference

All contracts are UUPS-upgradeable (`upgradeToAndCall` restricted to the owner) except `ZKCredentialVerifier`. Amounts are 18-decimal TERAP unless stated. Custom errors are used throughout; the frontend decodes them in `services/TeraPContracts.ts`.

## TeraPToken

- `MAX_SUPPLY` 100M, `INITIAL_SUPPLY` 20M minted to the owner at init.
- `mint(to, amount)`: owner or an address with `minters[addr]`; capped.
- `stake(amount) -> index`, `unstake(index)`: 30-day lock, 5% APY paid by minting (best-effort under the cap). Positions use swap-and-pop; `getStakes(user)` lists them.
- `getVotingPower(account) = getVotes(account) + 2 × stakedBalances[account]`; `getPastVotingPower(account, block)` is the checkpointed version used by governance.
- First-time recipients are auto-delegated to themselves so balances count as votes without a separate `delegate` call.

## TeraPCore

### Roles
- `owner`: admin and bootstrap.
- `governance`: `TeraPGovernance`; together with the owner forms the *governor* role for `verifyTherapist`, `revokeTherapist`, `withdrawTreasury`, `setParameter`, `pause`, `unpause`.
- `gateway`: only caller of `onCall`.

### Parameters (`setParameter(id, value)`)
| id | name | default | bounds |
|---|---|---|---|
| 0 | `platformFeeBps` | 250 (2.5%) | ≤ 2000 |
| 1 | `sessionClaimDelay` | 7 days | — |
| 2 | `lateCancelFeeBps` | 5000 (50%) | ≤ 10000 |

### Therapists
`registerTherapist(anonymousId, specializations[], encryptedCredentials, hourlyRate, credentialHash, encryptionPublicKey)` → `updateTherapistProfile(...)` → governor `verifyTherapist` (mints soulbound credential NFT, `tokenKind == 1`) / `revokeTherapist` (burns it). `rating` is 0–100 (stars × 20). Views: `getTherapistProfile`, `getTherapists(offset, limit)`, `getTherapistCount`, `verifiedTherapists`.

### Sessions
- `calculateSessionCost(therapist, minutes) = hourlyRate × minutes / 60`; requires verified + active.
- `bookSession(therapist, minutes, scheduledAt, notes, useSubscription)`: `scheduledAt = 0` means now; escrows TERAP via `transferFrom`, or calls `TeraPSubscription.reserve`.
- `completeSession(id, rating 1–5)`: client only, after `scheduledAt`. Pays therapist `cost − fee`, fee to `treasuryBalances[paymentToken]`, mints a receipt NFT (`tokenKind == 2`) to the client, updates rating and reputation.
- `claimSessionPayment(id)`: therapist only, after `scheduledAt + minutes×60 + sessionClaimDelay`; same settlement, no rating.
- `cancelSession(id)`: client or therapist while Booked. Client cancelling < 24 h before start pays `lateCancelFeeBps` of cost to the therapist. Refund goes to the client, back to the subscription pool (minutes restored), or to the treasury for cross-chain bookings.
- Status enum: `None, Booked, Completed, Cancelled`.

### Wellness circles
`createWellnessCircle(name, description, entryStake)` (creator becomes facilitator, reputation 100), `joinWellnessCircle(id)` (stakes `entryStake`, reputation 50), `leaveWellnessCircle(id)` (stake returned; facilitators cannot leave), `setCircleActive(id, bool)` (facilitator or owner). Views: `getCircle`, `getCircleCount`, `isCircleMember`, `getCircleReputation`.

### Treasury & payments
`treasuryBalances[token]`, `daoTreasury()` (TERAP), `withdrawTreasury(token, to, amount)` (governor), `setSupportedPaymentToken(token, bool)`.

### Cross-chain
See [CROSS_CHAIN.md](CROSS_CHAIN.md).

## TeraPSubscription

- Owner: `createTier(name, pricePerPeriod, minutesPerPeriod)`, `updateTier(...)`, `setCore`, `withdrawRevenue(to, amount)` (only surplus above `poolBalance`).
- Users: `subscribe(tierId, periods)` — pays `price × periods`, grants `minutes × periods`, extends `endTime` by `periods × 30 days`. Unused minutes carry over while active and are dropped when a lapsed plan is renewed.
- Core hooks: `reserve(user, minutes, cost)` moves `cost` from the pool to core and consumes minutes; `refund(user, minutes, cost)` reverses it after a cancellation.

## TeraPGovernance

- Parameters: `proposalThreshold` (1,000 TERAP voting power), `votingPeriod` (7 days, ≥ 1 h), `quorumBps` (400 = 4% of total supply).
- `createProposal(title, description, type, data)`: proposer needs `getVotingPower ≥ threshold`. Snapshot is `block.number − 1`. Data is validated on creation.
- `vote(id, support)`: weight = `getPastVotingPower(voter, snapshot)`; one vote per address.
- `executeProposal(id)`: anyone, after `endTime`, if `votesFor > votesAgainst` and `votesFor + votesAgainst ≥ quorum`.
- `cancelProposal(id)`: proposer or owner.

| type | data | execution |
|---|---|---|
| 0 TherapistVerification | `abi.encode(address)` | `core.verifyTherapist` |
| 1 FundingAllocation | `abi.encode(address token, address to, uint256 amount)` | `core.withdrawTreasury` |
| 2 ParameterChange | `abi.encode(uint8 param, uint256 value)` — `0..2` governance params (threshold, voting period, quorum bps); `100 + coreParam` forwards to `core.setParameter` | local or `core.setParameter` |
| 3 Emergency | `abi.encode(uint8 action, address target)` — `0` pause, `1` unpause, `2` revoke therapist | `core.pause/unpause/revokeTherapist` |

## WellnessGameification

Operators (`setOperator`) attest completions with `completeChallengeFor(user, challengeId)`; users `unlockAchievement(id)` once `lifetimePoints ≥ pointsRequired`, `mintAchievementNFT(id)` (soulbound, once), `redeemPoints(points)` mints `points × terapPerPoint` TERAP (contract must be a token minter).

## ZKCredentialVerifier

`submitCredentialCommitment(bytes32)` by the therapist, `attestCredential` / `revokeCredential` by an attester or the owner, `isCredentialValid(commitment)`, `isUserVerified(user)`. It is a commitment registry with off-chain review, not a SNARK verifier.

## Testing

```bash
forge test            # 71 tests, incl. fuzz
forge test -vvv --match-contract TeraPCoreTest
forge build --sizes   # TeraPCore is ~23.5 KB with via-IR; keep it under 24,576
```
