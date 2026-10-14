'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Clock, Coins, Loader2, Lock, Plus, RefreshCw, Unlock, Vote, Wallet, X } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import {
  CORE_PARAMS,
  EMERGENCY_ACTIONS,
  GOV_CORE_PARAM_OFFSET,
  GOV_PARAMS,
  Proposal,
  ProposalState,
  ProposalType,
  StakeInfo,
  TeraPContracts,
} from '@/services/TeraPContracts';
import { ADDRESSES, explorerTx } from '@/config/contracts';

type Tab = 'proposals' | 'staking' | 'treasury';

const TYPE_LABEL: Record<ProposalType, string> = {
  [ProposalType.TherapistVerification]: 'Therapist verification',
  [ProposalType.FundingAllocation]: 'Funding allocation',
  [ProposalType.ParameterChange]: 'Parameter change',
  [ProposalType.Emergency]: 'Emergency',
};

const STATE_STYLE: Record<ProposalState, { label: string; cls: string }> = {
  [ProposalState.Active]: { label: 'Active', cls: 'bg-primary-100 text-primary-700' },
  [ProposalState.Defeated]: { label: 'Defeated', cls: 'bg-red-100 text-red-700' },
  [ProposalState.Succeeded]: { label: 'Succeeded', cls: 'bg-accent-100 text-accent-700' },
  [ProposalState.Executed]: { label: 'Executed', cls: 'bg-emerald-100 text-emerald-700' },
  [ProposalState.Cancelled]: { label: 'Cancelled', cls: 'bg-neutral-100 text-neutral-600' },
};

const inputCls = 'w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500';
const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;
const STAKE_LOCK_DAYS = 30;

function paramName(id: number): string {
  const gov = (Object.entries(GOV_PARAMS) as [string, number][]).find(([, v]) => v === id);
  if (gov) return `Governance: ${gov[0]}`;
  const core = (Object.entries(CORE_PARAMS) as [string, number][]).find(([, v]) => v === id - GOV_CORE_PARAM_OFFSET);
  if (core) return `Core: ${core[0]}`;
  return `Param #${id}`;
}

function emergencyName(id: number): string {
  const hit = (Object.entries(EMERGENCY_ACTIONS) as [string, number][]).find(([, v]) => v === id);
  return hit ? hit[0].replace('_', ' ').toLowerCase() : `action #${id}`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'ended';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function describePayload(p: Proposal): string[] {
  const d = TeraPContracts.decodeProposalData(p.proposalType, p.proposalData);
  switch (p.proposalType) {
    case ProposalType.TherapistVerification:
      return d.therapist ? [`Verify therapist ${d.therapist}`] : [];
    case ProposalType.FundingAllocation:
      return d.to ? [`Send ${d.amount} of token ${short(d.token)} to ${d.to}`] : [];
    case ProposalType.ParameterChange:
      return d.param ? [`Set ${paramName(Number(d.param))} to ${d.value}`] : [];
    case ProposalType.Emergency:
      return d.action ? [`Emergency ${emergencyName(Number(d.action))}${Number(d.action) === EMERGENCY_ACTIONS.REVOKE_THERAPIST ? ` for ${d.target}` : ''}`] : [];
  }
  return [];
}

export function DAOGovernance() {
  const router = useRouter();
  const { contracts, address, isConnected, wrongNetwork, canWrite, isConfigured, ensureNetwork, chain } = useTeraP();
  const { connectWallet } = useWeb3Wallet();
  const { addNotification } = useApp();
  const govConfigured = isConfigured && Boolean(ADDRESSES.TeraPGovernance);

  const [activeTab, setActiveTab] = useState<Tab>('proposals');
  const [busy, setBusy] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [now] = useState(() => Math.floor(Date.now() / 1000));

  const params = useContractQuery(() => contracts.getGovernanceParams(), [contracts], { enabled: govConfigured });
  const proposals = useContractQuery(
    async () => {
      const list = await contracts.getAllProposals();
      const voted: Record<number, boolean> = {};
      if (address) {
        const flags = await Promise.all(list.map((p) => contracts.hasVoted(p.proposalId, address)));
        list.forEach((p, i) => {
          voted[p.proposalId] = flags[i];
        });
      }
      return { list, voted };
    },
    [contracts, address],
    { enabled: govConfigured },
  );
  const account = useContractQuery(
    async () => {
      if (!address) return null;
      const [balance, staked, votingPower, stakes] = await Promise.all([
        contracts.getTokenBalance(address),
        contracts.getStakedBalance(address),
        contracts.getVotingPower(address),
        contracts.getStakes(address),
      ]);
      return { balance, staked, votingPower, stakes };
    },
    [contracts, address],
    { enabled: isConfigured && Boolean(address) },
  );
  const stats = useContractQuery(() => contracts.getPlatformStats(), [contracts], { enabled: isConfigured });

  const activeCount = useMemo(() => proposals.data?.list.filter((p) => p.state === ProposalState.Active).length ?? 0, [proposals.data]);

  const refreshAll = () => {
    params.refresh();
    proposals.refresh();
    account.refresh();
    stats.refresh();
  };

  const run = async (key: string, title: string, action: () => Promise<{ hash: string }>, after?: () => void) => {
    if (wrongNetwork) {
      await ensureNetwork();
      return;
    }
    setBusy(key);
    try {
      const tx = await action();
      addNotification({ type: 'success', title, message: explorerTx(tx.hash) || `Tx ${tx.hash.slice(0, 10)}...` });
      after?.();
    } catch (e) {
      addNotification({ type: 'error', title: `${title} failed`, message: e instanceof Error ? e.message : 'Transaction failed' });
    } finally {
      setBusy(null);
    }
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    let amount: bigint;
    try {
      amount = TeraPContracts.parseTerap(stakeAmount);
    } catch {
      addNotification({ type: 'error', title: 'Invalid amount', message: 'Enter a TERAP amount to stake.' });
      return;
    }
    if (amount <= 0n) return;
    await run('stake', 'Tokens staked', () => contracts.stake(amount), () => {
      setStakeAmount('');
      account.refresh();
    });
  };

  if (!isConfigured) {
    return <Gate icon={<AlertCircle className="h-8 w-8 text-amber-600" />} title="Contracts not configured" body="Set the NEXT_PUBLIC_TERAP_* addresses in .env.local to load governance data." />;
  }

  const writeBlocked = !canWrite && !wrongNetwork;

  return (
    <div className="space-y-6">
      {/* Status banners */}
      {!isConnected && (
        <Banner tone="info" icon={<Wallet className="h-5 w-5 text-primary-600" />} text="Connect a wallet to vote, stake and create proposals.">
          <button onClick={connectWallet} className="btn-primary btn-sm">Connect Wallet</button>
        </Banner>
      )}
      {isConnected && wrongNetwork && (
        <Banner tone="warn" icon={<AlertCircle className="h-5 w-5 text-amber-600" />} text={`Your wallet is on another network. Switch to ${chain.name}.`}>
          <button onClick={ensureNetwork} className="btn-primary btn-sm">Switch network</button>
        </Banner>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active proposals" value={proposals.data ? String(activeCount) : '—'} sub={govConfigured ? `${proposals.data?.list.length ?? '—'} total` : 'Governance not configured'} />
        <StatCard label="Your voting power" value={account.data ? `${TeraPContracts.formatTerap(account.data.votingPower)}` : '—'} sub="balance + 2x staked" />
        <StatCard label="Proposal threshold" value={params.data ? TeraPContracts.formatTerap(params.data.proposalThreshold) : '—'} sub="TERAP voting power" />
        <StatCard label="Quorum" value={params.data ? `${(params.data.quorumBps / 100).toFixed(1)}%` : '—'} sub={params.data ? `${TeraPContracts.formatTerap(params.data.quorum, 0)} TERAP · ${formatDuration(params.data.votingPeriod).replace(' left', '')} voting` : 'of total supply'} />
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
          {(['proposals', 'staking', 'treasury'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-5 rounded-md font-medium capitalize transition-colors ${activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-600 hover:text-neutral-800'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={refreshAll} className="btn-ghost" title="Refresh from chain">
            <RefreshCw className={`h-4 w-4 ${proposals.loading || account.loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => router.push('/dao/create-proposal')} className="btn-primary btn-sm flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>New proposal</span>
          </button>
        </div>
      </div>

      {/* Proposals */}
      {activeTab === 'proposals' && (
        !govConfigured ? (
          <Gate icon={<AlertCircle className="h-8 w-8 text-amber-600" />} title="Governance not configured" body="Set NEXT_PUBLIC_TERAP_GOVERNANCE_ADDRESS in .env.local." />
        ) : proposals.error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{proposals.error}</div>
        ) : proposals.loading && !proposals.data ? (
          <Loading text="Loading proposals from chain..." />
        ) : !proposals.data || proposals.data.list.length === 0 ? (
          <Gate icon={<Vote className="h-8 w-8 text-neutral-400" />} title="No proposals yet" body="Anyone with enough voting power can create the first proposal." />
        ) : (
          <div className="space-y-4">
            {proposals.data.list.map((p) => {
              const total = p.votesFor + p.votesAgainst;
              const forPct = total > 0n ? Number((p.votesFor * 10000n) / total) / 100 : 0;
              const quorum = params.data?.quorum ?? 0n;
              const quorumPct = quorum > 0n ? Math.min(100, Number((total * 10000n) / quorum) / 100) : 0;
              const voted = proposals.data?.voted[p.proposalId] ?? false;
              const isActive = p.state === ProposalState.Active;
              const isProposer = Boolean(address) && p.proposer.toLowerCase() === address!.toLowerCase();
              const st = STATE_STYLE[p.state];
              const key = `p${p.proposalId}`;
              return (
                <div key={p.proposalId} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="text-xs text-neutral-500">#{p.proposalId}</span>
                        <h3 className="text-lg font-semibold text-neutral-800">{p.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700">{TYPE_LABEL[p.proposalType]}</span>
                      </div>
                      <p className="text-neutral-600 text-sm whitespace-pre-line">{p.description}</p>
                      {describePayload(p).map((line) => (
                        <p key={line} className="mt-2 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-neutral-700 break-all">{line}</p>
                      ))}
                    </div>
                    <div className="text-right text-xs text-neutral-500 whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1"><Clock className="h-3 w-3" /><span>{isActive ? formatDuration(p.endTime - now) : `ended ${new Date(p.endTime * 1000).toLocaleDateString()}`}</span></div>
                      <div className="mt-1" title={p.proposer}>by {short(p.proposer)}{isProposer ? ' (you)' : ''}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-accent-700 font-medium">For: {TeraPContracts.formatTerap(p.votesFor)} TERAP</span>
                      <span className="text-red-600 font-medium">Against: {TeraPContracts.formatTerap(p.votesAgainst)} TERAP</span>
                    </div>
                    <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-500" style={{ width: `${forPct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>{forPct.toFixed(1)}% in favour</span>
                      <span>Quorum {quorumPct.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    {isActive && (
                      <>
                        <button
                          onClick={() => run(key, 'Vote cast', () => contracts.vote(p.proposalId, true), proposals.refresh)}
                          disabled={busy === key || voted || writeBlocked}
                          className="btn-primary btn-sm flex items-center space-x-1 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" /><span>{voted ? 'Voted' : 'Vote for'}</span>
                        </button>
                        <button
                          onClick={() => run(key, 'Vote cast', () => contracts.vote(p.proposalId, false), proposals.refresh)}
                          disabled={busy === key || voted || writeBlocked}
                          className="btn-outline btn-sm flex items-center space-x-1 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" /><span>Vote against</span>
                        </button>
                        {isProposer && (
                          <button
                            onClick={() => run(key, 'Proposal cancelled', () => contracts.cancelProposal(p.proposalId), proposals.refresh)}
                            disabled={busy === key || writeBlocked}
                            className="btn-ghost btn-sm text-red-600 disabled:opacity-50"
                          >
                            Cancel proposal
                          </button>
                        )}
                      </>
                    )}
                    {p.state === ProposalState.Succeeded && (
                      <button
                        onClick={() => run(key, 'Proposal executed', () => contracts.executeProposal(p.proposalId), refreshAll)}
                        disabled={busy === key || writeBlocked}
                        className="btn-success btn-sm disabled:opacity-50"
                      >
                        Execute
                      </button>
                    )}
                    {busy === key && <Loader2 className="h-5 w-5 animate-spin text-primary-600 self-center" />}
                    {isActive && voted && <span className="text-xs text-neutral-500 self-center">You already voted on this proposal.</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Staking */}
      {activeTab === 'staking' && (
        !isConnected ? (
          <Gate icon={<Wallet className="h-8 w-8 text-primary-600" />} title="Connect your wallet" body="Staking positions are read from the TERAP token contract for your address." />
        ) : account.loading && !account.data ? (
          <Loading text="Loading your TERAP balances..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
                <Row label="TERAP balance" value={account.data ? `${TeraPContracts.formatTerap(account.data.balance)} TERAP` : '—'} />
                <Row label="Staked" value={account.data ? `${TeraPContracts.formatTerap(account.data.staked)} TERAP` : '—'} />
                <Row label="Voting power" value={account.data ? `${TeraPContracts.formatTerap(account.data.votingPower)}` : '—'} />
                {account.error && <p className="text-xs text-red-600">{account.error}</p>}
              </div>
              <form onSubmit={handleStake} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-neutral-800 mb-3 flex items-center space-x-2"><Lock className="h-4 w-4 text-primary-600" /><span>Stake TERAP</span></h3>
                <input type="number" min="0" step="any" placeholder="Amount" className={inputCls} value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
                <p className="text-xs text-neutral-500 mt-2">Locked for {STAKE_LOCK_DAYS} days. Earns 5% APY and counts double towards voting power.</p>
                <button type="submit" disabled={busy === 'stake' || writeBlocked || !stakeAmount} className="btn-primary w-full mt-4 py-2 flex items-center justify-center disabled:opacity-50">
                  {busy === 'stake' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {wrongNetwork ? `Switch to ${chain.name}` : 'Stake'}
                </button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-neutral-800 mb-4">Your positions</h3>
              {!account.data || account.data.stakes.length === 0 ? (
                <p className="text-sm text-neutral-600">No active stakes.</p>
              ) : (
                <div className="space-y-3">
                  {account.data.stakes.map((s: StakeInfo) => {
                    const unlocked = s.unlockTime <= now;
                    const key = `u${s.index}`;
                    return (
                      <div key={s.index} className="border border-neutral-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="font-medium text-neutral-800">{TeraPContracts.formatTerap(s.amount)} TERAP</div>
                          <div className="text-xs text-neutral-500">
                            Staked {new Date(s.timestamp * 1000).toLocaleDateString()} · {unlocked ? 'Unlocked' : `Unlocks ${new Date(s.unlockTime * 1000).toLocaleDateString()} (${formatDuration(s.unlockTime - now)})`}
                          </div>
                          <div className="text-xs text-accent-700 mt-1">Accrued reward: {TeraPContracts.formatTerap(s.reward, 4)} TERAP</div>
                        </div>
                        <button
                          onClick={() => run(key, 'Unstaked', () => contracts.unstake(s.index), account.refresh)}
                          disabled={!unlocked || busy === key || writeBlocked}
                          className="btn-outline btn-sm flex items-center space-x-1 disabled:opacity-50"
                          title={unlocked ? 'Withdraw stake and reward' : 'Still locked'}
                        >
                          {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                          <span>Unstake</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Treasury */}
      {activeTab === 'treasury' && (
        stats.error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{stats.error}</div>
        ) : stats.loading && !stats.data ? (
          <Loading text="Loading treasury..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="DAO treasury" value={stats.data ? `${TeraPContracts.formatTerap(stats.data.treasury)} TERAP` : '—'} sub="held by TeraPCore" icon={<Coins className="h-5 w-5 text-accent-600" />} />
            <StatCard label="Platform fee" value={stats.data ? `${(stats.data.platformFeeBps / 100).toFixed(2)}%` : '—'} sub="of each session, to treasury" />
            <StatCard label="Total staked" value={stats.data ? `${TeraPContracts.formatTerap(stats.data.totalStaked, 0)} TERAP` : '—'} sub={stats.data && stats.data.totalSupply > 0n ? `${(Number((stats.data.totalStaked * 10000n) / stats.data.totalSupply) / 100).toFixed(2)}% of supply` : ''} />
            <StatCard label="TERAP supply" value={stats.data ? `${TeraPContracts.formatTerap(stats.data.totalSupply, 0)}` : '—'} sub={stats.data ? `${stats.data.sessions} sessions · ${stats.data.verifiedTherapists} verified therapists` : ''} />
            <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl shadow-lg p-6 text-sm text-neutral-600">
              Treasury funds can only leave TeraPCore through a passed <span className="font-medium text-neutral-800">Funding allocation</span> proposal. Fees are set by <span className="font-medium text-neutral-800">Parameter change</span> proposals.
            </div>
          </div>
        )
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <div className="flex items-center justify-between text-sm text-neutral-500 mb-1"><span>{label}</span>{icon}</div>
      <div className="text-2xl font-bold text-neutral-800 truncate">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-600">{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}

function Banner({ tone, icon, text, children }: { tone: 'info' | 'warn'; icon: React.ReactNode; text: string; children?: React.ReactNode }) {
  return (
    <div className={`${tone === 'warn' ? 'bg-amber-50 border-amber-200' : 'bg-white border-neutral-200'} border rounded-xl p-4 flex items-center justify-between gap-4`}>
      <div className="flex items-center space-x-3 text-sm text-neutral-700">{icon}<span>{text}</span></div>
      {children}
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center text-neutral-600">
      <Loader2 className="h-5 w-5 animate-spin mr-3 text-primary-600" />{text}
    </div>
  );
}

function Gate({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-neutral-800 mb-1">{title}</h3>
      <p className="text-sm text-neutral-600">{body}</p>
    </div>
  );
}

export default DAOGovernance;
