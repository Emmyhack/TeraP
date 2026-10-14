/**
 * TeraPContracts — the single integration layer between the frontend and the TeraP contracts.
 *
 * Reads go through a JSON-RPC provider for the configured chain; writes require a wallet signer
 * (see hooks/useTeraP.ts). Every method returns plain, serialisable values (bigint for token
 * amounts) so components do not need to know about ethers.
 */
import { Contract, Interface, JsonRpcProvider, Signer, ethers } from 'ethers';
import { ABIS, ADDRESSES, CHAIN, CONTRACTS_CONFIGURED } from '@/config/contracts';

// ---------------------------------------------------------------------------
// Types mirrored from the contracts
// ---------------------------------------------------------------------------

export interface TherapistProfile {
  therapist: string;
  anonymousId: string;
  specializations: string[];
  credentials: string;
  hourlyRate: bigint; // TERAP wei per hour
  isVerified: boolean;
  isActive: boolean;
  totalSessions: number;
  rating: number; // 0-100
  ratingCount: number;
  verificationTimestamp: number;
  credentialHash: string;
  encryptionPublicKey: string;
}

export enum SessionStatus {
  None = 0,
  Booked = 1,
  Completed = 2,
  Cancelled = 3,
}

export interface TherapySession {
  sessionId: number;
  therapist: string;
  client: string;
  duration: number; // minutes
  cost: bigint;
  paymentToken: string;
  scheduledAt: number; // unix seconds
  createdAt: number;
  status: SessionStatus;
  paidBySubscription: boolean;
  clientRating: number;
  encryptedNotes: string;
  sourceChainId: number;
}

export interface WellnessCircle {
  circleId: number;
  name: string;
  description: string;
  facilitator: string;
  memberCount: number;
  entryStake: bigint;
  isActive: boolean;
  createdAt: number;
}

export enum ProposalType {
  TherapistVerification = 0,
  FundingAllocation = 1,
  ParameterChange = 2,
  Emergency = 3,
}

export enum ProposalState {
  Active = 0,
  Defeated = 1,
  Succeeded = 2,
  Executed = 3,
  Cancelled = 4,
}

export interface Proposal {
  proposalId: number;
  title: string;
  description: string;
  proposer: string;
  votesFor: bigint;
  votesAgainst: bigint;
  snapshotBlock: number;
  startTime: number;
  endTime: number;
  executed: boolean;
  cancelled: boolean;
  proposalType: ProposalType;
  proposalData: string;
  state: ProposalState;
}

export interface SubscriptionTierOnChain {
  tierId: number;
  name: string;
  pricePerPeriod: bigint;
  minutesPerPeriod: number;
  active: boolean;
}

export interface SubscriptionOnChain {
  tierId: number;
  startTime: number;
  endTime: number;
  minutesRemaining: number;
  totalPaid: bigint;
  isActive: boolean;
}

export interface StakeInfo {
  index: number;
  amount: bigint;
  timestamp: number;
  unlockTime: number;
  reward: bigint;
}

export interface Challenge {
  challengeId: number;
  name: string;
  rewardPoints: number;
  deadline: number;
  active: boolean;
  completed?: boolean;
}

export interface Achievement {
  achievementId: number;
  name: string;
  pointsRequired: number;
  unlocked?: boolean;
  minted?: boolean;
}

export interface PlatformStats {
  therapists: number;
  verifiedTherapists: number;
  sessions: number;
  circles: number;
  proposals: number;
  treasury: bigint;
  platformFeeBps: number;
  totalStaked: bigint;
  totalSupply: bigint;
}

export interface TxResult {
  hash: string;
  blockNumber: number;
}

/** Core parameter ids (TeraPCore.setParameter) — offset by 100 when used in a governance proposal. */
export const CORE_PARAMS = { PLATFORM_FEE_BPS: 0, CLAIM_DELAY: 1, LATE_CANCEL_FEE_BPS: 2 } as const;
/** Governance-local parameter ids. */
export const GOV_PARAMS = { PROPOSAL_THRESHOLD: 0, VOTING_PERIOD: 1, QUORUM_BPS: 2 } as const;
export const GOV_CORE_PARAM_OFFSET = 100;
export const EMERGENCY_ACTIONS = { PAUSE: 0, UNPAUSE: 1, REVOKE_THERAPIST: 2 } as const;

export class ContractsNotConfiguredError extends Error {
  constructor() {
    super('Contract addresses are not configured. Set NEXT_PUBLIC_TERAP_* in .env.local.');
  }
}

export class SignerRequiredError extends Error {
  constructor() {
    super('Connect a wallet to send transactions.');
  }
}

type ContractName = keyof typeof ABIS;

const abiCoder = ethers.AbiCoder.defaultAbiCoder();
const interfaces: Record<ContractName, Interface> = Object.fromEntries(
  (Object.keys(ABIS) as ContractName[]).map((k) => [k, new Interface(ABIS[k] as ethers.InterfaceAbi)]),
) as Record<ContractName, Interface>;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class TeraPContracts {
  readonly provider: JsonRpcProvider;
  private readonly signer: Signer | null;

  constructor(signer: Signer | null = null, provider?: JsonRpcProvider) {
    this.provider = provider ?? new JsonRpcProvider(CHAIN.rpcUrl, CHAIN.id, { staticNetwork: true });
    this.signer = signer;
  }

  /** New instance bound to a wallet signer (or read-only when null). */
  withSigner(signer: Signer | null): TeraPContracts {
    return new TeraPContracts(signer, this.provider);
  }

  get isConfigured(): boolean {
    return CONTRACTS_CONFIGURED;
  }

  get hasSigner(): boolean {
    return this.signer !== null;
  }

  get isSubscriptionConfigured(): boolean {
    return Boolean(ADDRESSES.TeraPSubscription);
  }

  get isGovernanceConfigured(): boolean {
    return Boolean(ADDRESSES.TeraPGovernance);
  }

  // ------------------------------------------------------------------ internals

  private read(name: ContractName): Contract {
    const address = ADDRESSES[name];
    if (!address) throw new ContractsNotConfiguredError();
    return new Contract(address, ABIS[name] as ethers.InterfaceAbi, this.provider);
  }

  private write(name: ContractName): Contract {
    const address = ADDRESSES[name];
    if (!address) throw new ContractsNotConfiguredError();
    if (!this.signer) throw new SignerRequiredError();
    return new Contract(address, ABIS[name] as ethers.InterfaceAbi, this.signer);
  }

  private async send(promise: Promise<ethers.ContractTransactionResponse>): Promise<TxResult> {
    try {
      const tx = await promise;
      const receipt = await tx.wait();
      return { hash: tx.hash, blockNumber: receipt?.blockNumber ?? 0 };
    } catch (e) {
      throw new Error(TeraPContracts.parseError(e));
    }
  }

  private async signerAddress(): Promise<string> {
    if (!this.signer) throw new SignerRequiredError();
    return this.signer.getAddress();
  }

  /** Approve `spender` for `amount` TERAP if the current allowance is lower. */
  async ensureAllowance(spender: string, amount: bigint): Promise<TxResult | null> {
    const token = this.write('TeraPToken');
    const owner = await this.signerAddress();
    const allowance: bigint = await token.allowance(owner, spender);
    if (allowance >= amount) return null;
    return this.send(token.approve(spender, amount));
  }

  // ------------------------------------------------------------------ token

  async getTokenBalance(address: string): Promise<bigint> {
    return this.read('TeraPToken').balanceOf(address);
  }

  async getVotingPower(address: string): Promise<bigint> {
    return this.read('TeraPToken').getVotingPower(address);
  }

  async getStakedBalance(address: string): Promise<bigint> {
    return this.read('TeraPToken').stakedBalances(address);
  }

  async getStakes(address: string): Promise<StakeInfo[]> {
    const token = this.read('TeraPToken');
    const [raw, minPeriod]: [Array<{ amount: bigint; timestamp: bigint }>, bigint] = await Promise.all([
      token.getStakes(address),
      token.MIN_STAKE_PERIOD(),
    ]);
    return Promise.all(
      raw.map(async (s, index) => ({
        index,
        amount: s.amount,
        timestamp: Number(s.timestamp),
        unlockTime: Number(s.timestamp + minPeriod),
        reward: (await token.calculateStakingReward(address, index)) as bigint,
      })),
    );
  }

  async stake(amount: bigint): Promise<TxResult> {
    return this.send(this.write('TeraPToken').stake(amount));
  }

  async unstake(stakeIndex: number): Promise<TxResult> {
    return this.send(this.write('TeraPToken').unstake(stakeIndex));
  }

  async transfer(to: string, amount: bigint): Promise<TxResult> {
    return this.send(this.write('TeraPToken').transfer(to, amount));
  }

  // ------------------------------------------------------------------ therapists

  async getTherapistCount(): Promise<number> {
    return Number(await this.read('TeraPCore').getTherapistCount());
  }

  async getTherapistProfile(address: string): Promise<TherapistProfile | null> {
    const p = await this.read('TeraPCore').getTherapistProfile(address);
    if (!p || p.therapist === ethers.ZeroAddress) return null;
    return TeraPContracts.toProfile(p);
  }

  async getTherapists(offset = 0, limit = 50): Promise<TherapistProfile[]> {
    const core = this.read('TeraPCore');
    const addresses: string[] = await core.getTherapists(offset, limit);
    const profiles = await Promise.all(addresses.map((a) => core.getTherapistProfile(a)));
    return profiles.map(TeraPContracts.toProfile);
  }

  async getAllTherapists(): Promise<TherapistProfile[]> {
    const total = await this.getTherapistCount();
    const out: TherapistProfile[] = [];
    for (let offset = 0; offset < total; offset += 50) {
      out.push(...(await this.getTherapists(offset, 50)));
    }
    return out;
  }

  async getVerifiedTherapists(): Promise<TherapistProfile[]> {
    return (await this.getAllTherapists()).filter((t) => t.isVerified && t.isActive);
  }

  async registerTherapist(params: {
    anonymousId: string;
    specializations: string[];
    encryptedCredentials: string;
    hourlyRate: bigint;
    credentialHash: string; // bytes32
    encryptionPublicKey: string; // bytes32
  }): Promise<TxResult> {
    return this.send(
      this.write('TeraPCore').registerTherapist(
        params.anonymousId,
        params.specializations,
        params.encryptedCredentials,
        params.hourlyRate,
        params.credentialHash,
        params.encryptionPublicKey,
      ),
    );
  }

  async updateTherapistProfile(params: {
    specializations: string[];
    encryptedCredentials: string;
    hourlyRate: bigint;
    credentialHash: string;
    encryptionPublicKey: string;
    isActive: boolean;
  }): Promise<TxResult> {
    return this.send(
      this.write('TeraPCore').updateTherapistProfile(
        params.specializations,
        params.encryptedCredentials,
        params.hourlyRate,
        params.credentialHash,
        params.encryptionPublicKey,
        params.isActive,
      ),
    );
  }

  // ------------------------------------------------------------------ sessions

  async calculateSessionCost(therapist: string, durationMinutes: number): Promise<bigint> {
    return this.read('TeraPCore').calculateSessionCost(therapist, durationMinutes);
  }

  /**
   * Book a session. Handles the TERAP approval when paying directly.
   * @param scheduledAt unix seconds (0 = now)
   */
  async bookSession(params: {
    therapist: string;
    durationMinutes: number;
    scheduledAt: number;
    encryptedNotes: string;
    useSubscription?: boolean;
  }): Promise<TxResult & { sessionId: number | null }> {
    const core = this.write('TeraPCore');
    const useSub = params.useSubscription ?? false;
    if (!useSub) {
      const cost = await this.calculateSessionCost(params.therapist, params.durationMinutes);
      await this.ensureAllowance(ADDRESSES.TeraPCore, cost);
    }
    let tx: ethers.ContractTransactionResponse;
    try {
      tx = await core.bookSession(
        params.therapist,
        params.durationMinutes,
        params.scheduledAt,
        params.encryptedNotes,
        useSub,
      );
    } catch (e) {
      throw new Error(TeraPContracts.parseError(e));
    }
    const receipt = await tx.wait();
    const sessionId = TeraPContracts.findEventArg(receipt, 'TeraPCore', 'SessionBooked', 'sessionId');
    return { hash: tx.hash, blockNumber: receipt?.blockNumber ?? 0, sessionId: sessionId === null ? null : Number(sessionId) };
  }

  async completeSession(sessionId: number, rating: number): Promise<TxResult> {
    return this.send(this.write('TeraPCore').completeSession(sessionId, rating));
  }

  async cancelSession(sessionId: number): Promise<TxResult> {
    return this.send(this.write('TeraPCore').cancelSession(sessionId));
  }

  async claimSessionPayment(sessionId: number): Promise<TxResult> {
    return this.send(this.write('TeraPCore').claimSessionPayment(sessionId));
  }

  async getSession(sessionId: number): Promise<TherapySession | null> {
    const s = await this.read('TeraPCore').getSession(sessionId);
    if (!s || Number(s.sessionId) === 0) return null;
    return TeraPContracts.toSession(s);
  }

  async getSessions(ids: number[]): Promise<TherapySession[]> {
    const core = this.read('TeraPCore');
    const raw = await Promise.all(ids.map((id) => core.getSession(id)));
    return raw.map(TeraPContracts.toSession);
  }

  async getClientSessions(client: string): Promise<TherapySession[]> {
    const ids: bigint[] = await this.read('TeraPCore').getClientSessions(client);
    return this.getSessions(ids.map(Number));
  }

  async getTherapistSessions(therapist: string): Promise<TherapySession[]> {
    const ids: bigint[] = await this.read('TeraPCore').getTherapistSessions(therapist);
    return this.getSessions(ids.map(Number));
  }

  // ------------------------------------------------------------------ circles

  async getCircleCount(): Promise<number> {
    return Number(await this.read('TeraPCore').getCircleCount());
  }

  async getCircle(circleId: number): Promise<WellnessCircle | null> {
    const c = await this.read('TeraPCore').getCircle(circleId);
    if (!c || Number(c.circleId) === 0) return null;
    return TeraPContracts.toCircle(c);
  }

  async getAllCircles(): Promise<WellnessCircle[]> {
    const count = await this.getCircleCount();
    const core = this.read('TeraPCore');
    const raw = await Promise.all(Array.from({ length: count }, (_, i) => core.getCircle(i + 1)));
    return raw.map(TeraPContracts.toCircle);
  }

  async isCircleMember(circleId: number, user: string): Promise<boolean> {
    return this.read('TeraPCore').isCircleMember(circleId, user);
  }

  async getCircleReputation(circleId: number, user: string): Promise<number> {
    return Number(await this.read('TeraPCore').getCircleReputation(circleId, user));
  }

  async getMemberCircles(user: string): Promise<WellnessCircle[]> {
    const circles = await this.getAllCircles();
    const flags = await Promise.all(circles.map((c) => this.isCircleMember(c.circleId, user)));
    return circles.filter((_, i) => flags[i]);
  }

  async createWellnessCircle(name: string, description: string, entryStake: bigint): Promise<TxResult & { circleId: number | null }> {
    if (entryStake > 0n) await this.ensureAllowance(ADDRESSES.TeraPCore, entryStake);
    let tx: ethers.ContractTransactionResponse;
    try {
      tx = await this.write('TeraPCore').createWellnessCircle(name, description, entryStake);
    } catch (e) {
      throw new Error(TeraPContracts.parseError(e));
    }
    const receipt = await tx.wait();
    const circleId = TeraPContracts.findEventArg(receipt, 'TeraPCore', 'WellnessCircleCreated', 'circleId');
    return { hash: tx.hash, blockNumber: receipt?.blockNumber ?? 0, circleId: circleId === null ? null : Number(circleId) };
  }

  async joinWellnessCircle(circleId: number): Promise<TxResult> {
    const circle = await this.getCircle(circleId);
    if (!circle) throw new Error('Circle not found');
    if (circle.entryStake > 0n) await this.ensureAllowance(ADDRESSES.TeraPCore, circle.entryStake);
    return this.send(this.write('TeraPCore').joinWellnessCircle(circleId));
  }

  async leaveWellnessCircle(circleId: number): Promise<TxResult> {
    return this.send(this.write('TeraPCore').leaveWellnessCircle(circleId));
  }

  async setCircleActive(circleId: number, isActive: boolean): Promise<TxResult> {
    return this.send(this.write('TeraPCore').setCircleActive(circleId, isActive));
  }

  // ------------------------------------------------------------------ platform

  /** Governable session rules (seconds / basis points) so the UI tracks parameter changes. */
  async getSessionParams(): Promise<{ platformFeeBps: number; sessionClaimDelay: number; lateCancelFeeBps: number; lateCancelWindow: number }> {
    const core = this.read('TeraPCore');
    const [platformFeeBps, sessionClaimDelay, lateCancelFeeBps, lateCancelWindow] = await Promise.all([
      core.platformFeeBps(),
      core.sessionClaimDelay(),
      core.lateCancelFeeBps(),
      core.LATE_CANCEL_WINDOW(),
    ]);
    return {
      platformFeeBps: Number(platformFeeBps),
      sessionClaimDelay: Number(sessionClaimDelay),
      lateCancelFeeBps: Number(lateCancelFeeBps),
      lateCancelWindow: Number(lateCancelWindow),
    };
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const core = this.read('TeraPCore');
    const token = this.read('TeraPToken');
    const [therapists, nextSessionId, circles, treasury, feeBps, totalStaked, totalSupply] = await Promise.all([
      this.getAllTherapists(),
      core.nextSessionId(),
      core.getCircleCount(),
      core.daoTreasury(),
      core.platformFeeBps(),
      token.totalStaked(),
      token.totalSupply(),
    ]);
    let proposals = 0;
    if (ADDRESSES.TeraPGovernance) {
      proposals = Number(await this.read('TeraPGovernance').getProposalCount());
    }
    return {
      therapists: therapists.length,
      verifiedTherapists: therapists.filter((t) => t.isVerified).length,
      sessions: Number(nextSessionId) - 1,
      circles: Number(circles),
      proposals,
      treasury,
      platformFeeBps: Number(feeBps),
      totalStaked,
      totalSupply,
    };
  }

  // ------------------------------------------------------------------ subscription

  async getTiers(): Promise<SubscriptionTierOnChain[]> {
    const raw = await this.read('TeraPSubscription').getTiers();
    return raw.map((t: { name: string; pricePerPeriod: bigint; minutesPerPeriod: bigint; active: boolean }, i: number) => ({
      tierId: i + 1,
      name: t.name,
      pricePerPeriod: t.pricePerPeriod,
      minutesPerPeriod: Number(t.minutesPerPeriod),
      active: t.active,
    }));
  }

  async getSubscription(user: string): Promise<SubscriptionOnChain> {
    const s = await this.read('TeraPSubscription').getSubscription(user);
    const endTime = Number(s.endTime);
    return {
      tierId: Number(s.tierId),
      startTime: Number(s.startTime),
      endTime,
      minutesRemaining: Number(s.minutesRemaining),
      totalPaid: s.totalPaid,
      isActive: endTime > Math.floor(Date.now() / 1000),
    };
  }

  async subscribe(tierId: number, periods: number): Promise<TxResult> {
    const tiers = await this.getTiers();
    const tier = tiers.find((t) => t.tierId === tierId);
    if (!tier) throw new Error('Unknown tier');
    await this.ensureAllowance(ADDRESSES.TeraPSubscription, tier.pricePerPeriod * BigInt(periods));
    return this.send(this.write('TeraPSubscription').subscribe(tierId, periods));
  }

  // ------------------------------------------------------------------ governance

  async getGovernanceParams(): Promise<{ proposalThreshold: bigint; votingPeriod: number; quorumBps: number; quorum: bigint }> {
    const gov = this.read('TeraPGovernance');
    const [proposalThreshold, votingPeriod, quorumBps, quorum] = await Promise.all([
      gov.proposalThreshold(),
      gov.votingPeriod(),
      gov.quorumBps(),
      gov.quorum(),
    ]);
    return { proposalThreshold, votingPeriod: Number(votingPeriod), quorumBps: Number(quorumBps), quorum };
  }

  async getProposalCount(): Promise<number> {
    return Number(await this.read('TeraPGovernance').getProposalCount());
  }

  async getProposal(proposalId: number): Promise<Proposal | null> {
    const gov = this.read('TeraPGovernance');
    const [p, state] = await Promise.all([gov.getProposal(proposalId), gov.proposalState(proposalId)]);
    if (!p || p.proposer === ethers.ZeroAddress) return null;
    return TeraPContracts.toProposal(p, Number(state));
  }

  async getAllProposals(): Promise<Proposal[]> {
    const count = await this.getProposalCount();
    const list = await Promise.all(Array.from({ length: count }, (_, i) => this.getProposal(i + 1)));
    return list.filter((p): p is Proposal => p !== null).reverse();
  }

  async hasVoted(proposalId: number, voter: string): Promise<boolean> {
    return this.read('TeraPGovernance').hasVoted(proposalId, voter);
  }

  async createProposal(title: string, description: string, type: ProposalType, data: string): Promise<TxResult & { proposalId: number | null }> {
    let tx: ethers.ContractTransactionResponse;
    try {
      tx = await this.write('TeraPGovernance').createProposal(title, description, type, data);
    } catch (e) {
      throw new Error(TeraPContracts.parseError(e));
    }
    const receipt = await tx.wait();
    const id = TeraPContracts.findEventArg(receipt, 'TeraPGovernance', 'ProposalCreated', 'proposalId');
    return { hash: tx.hash, blockNumber: receipt?.blockNumber ?? 0, proposalId: id === null ? null : Number(id) };
  }

  async vote(proposalId: number, support: boolean): Promise<TxResult> {
    return this.send(this.write('TeraPGovernance').vote(proposalId, support));
  }

  async executeProposal(proposalId: number): Promise<TxResult> {
    return this.send(this.write('TeraPGovernance').executeProposal(proposalId));
  }

  async cancelProposal(proposalId: number): Promise<TxResult> {
    return this.send(this.write('TeraPGovernance').cancelProposal(proposalId));
  }

  /** Proposal payload encoders matching TeraPGovernance's expected layouts. */
  static encodeTherapistVerification(therapist: string): string {
    return abiCoder.encode(['address'], [therapist]);
  }

  static encodeFundingAllocation(token: string, to: string, amount: bigint): string {
    return abiCoder.encode(['address', 'address', 'uint256'], [token, to, amount]);
  }

  /** `param` is a GOV_PARAMS id, or CORE_PARAMS id + GOV_CORE_PARAM_OFFSET. */
  static encodeParameterChange(param: number, value: bigint): string {
    return abiCoder.encode(['uint8', 'uint256'], [param, value]);
  }

  static encodeEmergency(action: number, target: string = ethers.ZeroAddress): string {
    return abiCoder.encode(['uint8', 'address'], [action, target]);
  }

  static decodeProposalData(type: ProposalType, data: string): Record<string, string> {
    try {
      switch (type) {
        case ProposalType.TherapistVerification: {
          const [therapist] = abiCoder.decode(['address'], data);
          return { therapist };
        }
        case ProposalType.FundingAllocation: {
          const [token, to, amount] = abiCoder.decode(['address', 'address', 'uint256'], data);
          return { token, to, amount: ethers.formatEther(amount) };
        }
        case ProposalType.ParameterChange: {
          const [param, value] = abiCoder.decode(['uint8', 'uint256'], data);
          return { param: String(param), value: String(value) };
        }
        case ProposalType.Emergency: {
          const [action, target] = abiCoder.decode(['uint8', 'address'], data);
          return { action: String(action), target };
        }
      }
    } catch {
      return {};
    }
    return {};
  }

  // ------------------------------------------------------------------ gamification

  async getUserStats(user: string): Promise<{ points: number; lifetime: number; achievements: number; challenges: number }> {
    const r = await this.read('WellnessGameification').getUserStats(user);
    return { points: Number(r[0]), lifetime: Number(r[1]), achievements: Number(r[2]), challenges: Number(r[3]) };
  }

  async getChallenges(user?: string): Promise<Challenge[]> {
    const game = this.read('WellnessGameification');
    const next = Number(await game.nextChallengeId());
    const list = await Promise.all(
      Array.from({ length: next - 1 }, async (_, i) => {
        const id = i + 1;
        const c = await game.challenges(id);
        const completed = user ? await game.completedChallenges(user, id) : undefined;
        return { challengeId: id, name: c.name, rewardPoints: Number(c.rewardPoints), deadline: Number(c.deadline), active: c.active, completed };
      }),
    );
    return list;
  }

  async getAchievements(user?: string): Promise<Achievement[]> {
    const game = this.read('WellnessGameification');
    const next = Number(await game.nextAchievementId());
    return Promise.all(
      Array.from({ length: next - 1 }, async (_, i) => {
        const id = i + 1;
        const a = await game.achievements(id);
        const unlocked = user ? await game.userAchievements(user, id) : undefined;
        const minted = user ? await game.achievementMinted(user, id) : undefined;
        return { achievementId: id, name: a.name, pointsRequired: Number(a.pointsRequired), unlocked, minted };
      }),
    );
  }

  async unlockAchievement(achievementId: number): Promise<TxResult> {
    return this.send(this.write('WellnessGameification').unlockAchievement(achievementId));
  }

  async mintAchievementNFT(achievementId: number): Promise<TxResult> {
    return this.send(this.write('WellnessGameification').mintAchievementNFT(achievementId));
  }

  async redeemPoints(points: number): Promise<TxResult> {
    return this.send(this.write('WellnessGameification').redeemPoints(points));
  }

  // ------------------------------------------------------------------ credentials

  async submitCredentialCommitment(commitment: string): Promise<TxResult> {
    return this.send(this.write('ZKCredentialVerifier').submitCredentialCommitment(commitment));
  }

  async isUserCredentialVerified(user: string): Promise<boolean> {
    if (!ADDRESSES.ZKCredentialVerifier) return false;
    return this.read('ZKCredentialVerifier').isUserVerified(user);
  }

  // ------------------------------------------------------------------ helpers

  static formatTerap(wei: bigint, digits = 2): string {
    const n = Number(ethers.formatEther(wei));
    return n.toLocaleString(undefined, { maximumFractionDigits: digits });
  }

  static parseTerap(value: string | number): bigint {
    return ethers.parseEther(String(value));
  }

  /** Turn an ethers/RPC error into a readable message, decoding custom errors from our ABIs. */
  static parseError(e: unknown): string {
    const err = e as { code?: string; reason?: string; shortMessage?: string; message?: string; data?: string; info?: { error?: { data?: string; message?: string } }; error?: { data?: string; message?: string } };
    if (err?.code === 'ACTION_REJECTED') return 'Transaction rejected in wallet.';
    const data = err?.data ?? err?.info?.error?.data ?? err?.error?.data;
    if (typeof data === 'string' && data.startsWith('0x') && data.length >= 10) {
      for (const iface of Object.values(interfaces)) {
        try {
          const parsed = iface.parseError(data);
          if (parsed) {
            const args = parsed.args.length ? ` (${parsed.args.map(String).join(', ')})` : '';
            return `${humanizeError(parsed.name)}${args}`;
          }
        } catch {
          /* try next interface */
        }
      }
    }
    if (err?.reason) return err.reason;
    if (err?.shortMessage) return err.shortMessage;
    if (err?.message) return err.message.split('\n')[0].slice(0, 200);
    return 'Transaction failed';
  }

  private static findEventArg(receipt: ethers.ContractTransactionReceipt | null, contract: ContractName, event: string, arg: string): bigint | null {
    if (!receipt) return null;
    const iface = interfaces[contract];
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
        if (parsed?.name === event) return parsed.args[arg] as bigint;
      } catch {
        /* not ours */
      }
    }
    return null;
  }

  private static toProfile(p: any): TherapistProfile {
    return {
      therapist: p.therapist,
      anonymousId: p.anonymousId,
      specializations: Array.from(p.specializations ?? []),
      credentials: p.credentials,
      hourlyRate: BigInt(p.hourlyRate),
      isVerified: Boolean(p.isVerified),
      isActive: Boolean(p.isActive),
      totalSessions: Number(p.totalSessions),
      rating: Number(p.rating),
      ratingCount: Number(p.ratingCount),
      verificationTimestamp: Number(p.verificationTimestamp),
      credentialHash: p.credentialHash,
      encryptionPublicKey: p.encryptionPublicKey,
    };
  }

  private static toSession(s: any): TherapySession {
    return {
      sessionId: Number(s.sessionId),
      therapist: s.therapist,
      client: s.client,
      duration: Number(s.duration),
      cost: BigInt(s.cost),
      paymentToken: s.paymentToken,
      scheduledAt: Number(s.scheduledAt),
      createdAt: Number(s.createdAt),
      status: Number(s.status) as SessionStatus,
      paidBySubscription: Boolean(s.paidBySubscription),
      clientRating: Number(s.clientRating),
      encryptedNotes: s.encryptedNotes,
      sourceChainId: Number(s.sourceChainId),
    };
  }

  private static toCircle(c: any): WellnessCircle {
    return {
      circleId: Number(c.circleId),
      name: c.name,
      description: c.description,
      facilitator: c.facilitator,
      memberCount: Number(c.memberCount),
      entryStake: BigInt(c.entryStake),
      isActive: Boolean(c.isActive),
      createdAt: Number(c.createdAt),
    };
  }

  private static toProposal(p: any, state: number): Proposal {
    return {
      proposalId: Number(p.proposalId),
      title: p.title,
      description: p.description,
      proposer: p.proposer,
      votesFor: BigInt(p.votesFor),
      votesAgainst: BigInt(p.votesAgainst),
      snapshotBlock: Number(p.snapshotBlock),
      startTime: Number(p.startTime),
      endTime: Number(p.endTime),
      executed: Boolean(p.executed),
      cancelled: Boolean(p.cancelled),
      proposalType: Number(p.proposalType) as ProposalType,
      proposalData: p.proposalData,
      state: state as ProposalState,
    };
  }
}

function humanizeError(name: string): string {
  const map: Record<string, string> = {
    NotVerified: 'Therapist is not verified or not active',
    NotRegistered: 'Therapist is not registered',
    AlreadyRegistered: 'This wallet is already registered as a therapist',
    AlreadyVerified: 'Therapist is already verified',
    InvalidInput: 'Invalid input',
    NotClient: 'Only the session client can do this',
    NotTherapist: 'Only the session therapist can do this',
    NotParticipant: 'You are not part of this session',
    InvalidSessionState: 'Session is not in the right state for this action',
    SessionNotStarted: 'The session has not started yet',
    ClaimTooEarly: 'Payment cannot be claimed yet',
    InvalidRating: 'Rating must be between 1 and 5',
    CircleInactive: 'This circle is not active',
    AlreadyMember: 'You are already a member of this circle',
    NotMember: 'You are not a member of this circle',
    NotFacilitator: 'Only the facilitator can do this',
    InsufficientVotingPower: 'Insufficient voting power',
    VotingClosed: 'Voting is closed for this proposal',
    AlreadyVoted: 'You already voted on this proposal',
    ProposalNotSucceeded: 'Proposal has not passed',
    ProposalNotActive: 'Proposal is not active',
    NotProposer: 'Only the proposer or owner can cancel',
    UnsupportedPaymentToken: 'Payment token is not supported',
    InsufficientPayment: 'Insufficient payment',
    InsufficientTreasury: 'Treasury balance is too low',
    NotGovernor: 'Only the DAO or owner can do this',
    NotGateway: 'Only the ZetaChain gateway can call this',
    Soulbound: 'This NFT cannot be transferred',
    NotMinter: 'Not authorized to mint',
    MaxSupplyExceeded: 'Max token supply exceeded',
    ZeroAmount: 'Amount must be greater than zero',
    InvalidStakeIndex: 'Invalid stake',
    StakeLocked: 'Stake is still locked',
    NoActiveSubscription: 'No active subscription',
    InsufficientMinutes: 'Not enough subscription minutes',
    InsufficientPool: 'Subscription pool cannot cover this',
    TierInactive: 'This plan is not available',
    InvalidTier: 'Unknown plan',
    NotCore: 'Only TeraPCore can call this',
    NotOperator: 'Not authorized',
    ChallengeNotActive: 'Challenge is not active',
    ChallengeExpired: 'Challenge has expired',
    AlreadyCompleted: 'Already completed',
    AchievementNotFound: 'Achievement not found',
    AlreadyUnlocked: 'Already unlocked',
    InsufficientPoints: 'Not enough points',
    AchievementNotUnlocked: 'Achievement not unlocked yet',
    AlreadyMinted: 'Already minted',
    ERC20InsufficientBalance: 'Insufficient TERAP balance',
    ERC20InsufficientAllowance: 'Token allowance too low',
    EnforcedPause: 'The platform is paused',
    OwnableUnauthorizedAccount: 'Not the contract owner',
  };
  return map[name] ?? name;
}

/** Read-only singleton for server components, API routes and pre-wallet screens. */
export const terapContracts = new TeraPContracts();
