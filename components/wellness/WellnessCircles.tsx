'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircle, Award, Loader2, MessageCircle, Plus, RefreshCw, Shield, Users, Wallet } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { TeraPContracts, WellnessCircle } from '@/services/TeraPContracts';
import { explorerTx } from '@/config/contracts';
import CircleChat from './CircleChat';

interface CirclesData {
  circles: WellnessCircle[];
  /** circleId -> membership flag for the connected wallet */
  membership: Record<number, boolean>;
  /** circleId -> reputation for circles the wallet belongs to */
  reputation: Record<number, number>;
}

type Tab = 'browse' | 'my-circles' | 'create';

const inputCls = 'w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500';

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

const WellnessCircles: React.FC = () => {
  const { contracts, address, isConnected, wrongNetwork, canWrite, isConfigured, ensureNetwork, chain } = useTeraP();
  const { connectWallet } = useWeb3Wallet();
  const { addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [activeChatCircle, setActiveChatCircle] = useState<WellnessCircle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', entryStake: '0' });
  const [creating, setCreating] = useState(false);

  const { data, loading, error, refresh } = useContractQuery<CirclesData>(
    async () => {
      const circles = await contracts.getAllCircles();
      const membership: Record<number, boolean> = {};
      const reputation: Record<number, number> = {};
      if (address) {
        const flags = await Promise.all(circles.map((c) => contracts.isCircleMember(c.circleId, address)));
        const mine = circles.filter((_, i) => flags[i]);
        const reps = await Promise.all(mine.map((c) => contracts.getCircleReputation(c.circleId, address)));
        circles.forEach((c, i) => {
          membership[c.circleId] = flags[i];
        });
        mine.forEach((c, i) => {
          reputation[c.circleId] = reps[i];
        });
      }
      return { circles, membership, reputation };
    },
    [contracts, address],
    { enabled: isConfigured },
  );

  const circles = useMemo(() => data?.circles ?? [], [data]);
  const myCircles = useMemo(() => circles.filter((c) => data?.membership[c.circleId]), [circles, data]);
  const filteredCircles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return circles.filter((c) => (showInactive || c.isActive) && (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)));
  }, [circles, searchTerm, showInactive]);

  const isFacilitator = (c: WellnessCircle) => Boolean(address) && c.facilitator.toLowerCase() === address!.toLowerCase();

  const run = async (circle: WellnessCircle, label: string, action: () => Promise<{ hash: string }>) => {
    if (wrongNetwork) {
      await ensureNetwork();
      return;
    }
    setBusyId(circle.circleId);
    try {
      const tx = await action();
      addNotification({
        type: 'success',
        title: label,
        message: `${circle.name}${explorerTx(tx.hash) ? ` — ${explorerTx(tx.hash)}` : ''}`,
      });
      refresh();
    } catch (e) {
      addNotification({ type: 'error', title: `${label} failed`, message: e instanceof Error ? e.message : 'Transaction failed' });
    } finally {
      setBusyId(null);
    }
  };

  const handleJoin = (c: WellnessCircle) => run(c, 'Joined circle', () => contracts.joinWellnessCircle(c.circleId));
  const handleLeave = (c: WellnessCircle) => run(c, 'Left circle', () => contracts.leaveWellnessCircle(c.circleId));
  const handleToggleActive = (c: WellnessCircle) =>
    run(c, c.isActive ? 'Circle deactivated' : 'Circle activated', () => contracts.setCircleActive(c.circleId, !c.isActive));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wrongNetwork) {
      await ensureNetwork();
      return;
    }
    let stake: bigint;
    try {
      stake = TeraPContracts.parseTerap(form.entryStake || '0');
    } catch {
      addNotification({ type: 'error', title: 'Invalid stake', message: 'Entry stake must be a TERAP amount.' });
      return;
    }
    setCreating(true);
    try {
      const res = await contracts.createWellnessCircle(form.name.trim(), form.description.trim(), stake);
      addNotification({
        type: 'success',
        title: 'Circle created',
        message: res.circleId ? `${form.name} is live as circle #${res.circleId}.` : `${form.name} created.`,
      });
      setForm({ name: '', description: '', entryStake: '0' });
      refresh();
      setActiveTab('my-circles');
    } catch (err) {
      addNotification({ type: 'error', title: 'Create failed', message: err instanceof Error ? err.message : 'Transaction failed' });
    } finally {
      setCreating(false);
    }
  };

  if (!isConfigured) {
    return (
      <Notice icon={<AlertCircle className="h-6 w-6 text-amber-600" />} title="Contracts not configured">
        Set NEXT_PUBLIC_TERAP_TOKEN_ADDRESS and NEXT_PUBLIC_TERAP_CORE_ADDRESS in .env.local to load wellness circles.
      </Notice>
    );
  }

  const writeBlocked = !canWrite && !wrongNetwork;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">Wellness Circles</h1>
              <p className="text-neutral-600 mt-2">Token-gated peer support groups, run by the community on {chain.name}</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{isConnected ? myCircles.length : '—'}</div>
                <div className="text-sm text-neutral-600">Your Circles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-600">{data ? circles.filter((c) => c.isActive).length : '—'}</div>
                <div className="text-sm text-neutral-600">Active Circles</div>
              </div>
              <button onClick={refresh} className="btn-ghost" title="Refresh from chain">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setActiveTab('create')} className="btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Circle</span>
              </button>
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm text-neutral-700">
              <Wallet className="h-5 w-5 text-primary-600" />
              <span>Connect a wallet to join circles, see your memberships and reputation.</span>
            </div>
            <button onClick={connectWallet} className="btn-primary btn-sm">Connect Wallet</button>
          </div>
        )}
        {isConnected && wrongNetwork && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-sm text-amber-800">Your wallet is on another network. Switch to {chain.name} to interact with circles.</span>
            <button onClick={ensureNetwork} className="btn-primary btn-sm">Switch network</button>
          </div>
        )}
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">{error}</div>}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
            {(['browse', 'my-circles', 'create'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md font-medium capitalize transition-colors ${
                  activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'browse' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Search Circles</label>
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    className={inputCls}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <label className="flex items-center space-x-2 text-sm text-neutral-700 pb-2">
                  <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded border-neutral-300" />
                  <span>Show inactive circles</span>
                </label>
              </div>
            </div>

            {loading && !data ? (
              <Loading text="Loading circles from chain..." />
            ) : filteredCircles.length === 0 ? (
              <Empty title={circles.length === 0 ? 'No circles yet' : 'No matches'} body={circles.length === 0 ? 'Be the first to create a wellness circle.' : 'Try a different search.'} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCircles.map((circle) => {
                  const member = Boolean(data?.membership[circle.circleId]);
                  const facilitator = isFacilitator(circle);
                  const busy = busyId === circle.circleId;
                  return (
                    <div key={circle.circleId} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-800">{circle.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${circle.isActive ? 'bg-accent-100 text-accent-700' : 'bg-neutral-100 text-neutral-600'}`}>
                              {circle.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {member && <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">Member</span>}
                            {facilitator && <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Facilitator</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-neutral-800">{circle.memberCount}</div>
                          <div className="text-xs text-neutral-500">members</div>
                        </div>
                      </div>

                      <p className="text-neutral-600 text-sm mb-4 line-clamp-3 flex-1">{circle.description || 'No description provided.'}</p>

                      <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                        <span>Entry stake: <span className="font-medium text-neutral-800">{TeraPContracts.formatTerap(circle.entryStake)} TERAP</span></span>
                        <span title={circle.facilitator}>by {short(circle.facilitator)}</span>
                      </div>

                      <div className="flex space-x-3">
                        {member ? (
                          <>
                            <button onClick={() => setActiveChatCircle(circle)} className="btn-primary flex-1 text-sm py-2">
                              Enter Circle
                            </button>
                            <button
                              onClick={() => handleLeave(circle)}
                              disabled={busy || facilitator || writeBlocked}
                              title={facilitator ? 'Facilitators cannot leave their circle' : 'Leave and get your stake back'}
                              className="btn-outline flex-1 text-sm py-2 disabled:opacity-50"
                            >
                              {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Leave'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleJoin(circle)}
                            disabled={busy || !circle.isActive || writeBlocked}
                            className="btn-primary flex-1 text-sm py-2 disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : !isConnected ? 'Connect to join' : wrongNetwork ? 'Switch network' : circle.entryStake > 0n ? `Join (${TeraPContracts.formatTerap(circle.entryStake)} TERAP)` : 'Join Circle'}
                          </button>
                        )}
                      </div>
                      {facilitator && (
                        <button
                          onClick={() => handleToggleActive(circle)}
                          disabled={busy || writeBlocked}
                          className="mt-3 text-xs text-neutral-600 hover:text-primary-600 underline disabled:opacity-50"
                        >
                          {circle.isActive ? 'Deactivate circle' : 'Activate circle'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-circles' && (
          <div className="space-y-6">
            {!isConnected ? (
              <Empty title="Connect your wallet" body="Memberships are read from the TeraPCore contract for your address." />
            ) : loading && !data ? (
              <Loading text="Checking your memberships..." />
            ) : myCircles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myCircles.map((circle) => (
                  <div key={circle.circleId} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-neutral-800">{circle.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-neutral-600">
                        <Award className="h-4 w-4 text-accent-600" />
                        <span>Reputation {data?.reputation[circle.circleId] ?? 0}</span>
                      </div>
                    </div>
                    <p className="text-neutral-600 text-sm mb-4">{circle.description || 'No description provided.'}</p>
                    <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                      <span className="flex items-center space-x-1"><Users className="h-4 w-4" /><span>{circle.memberCount} members</span></span>
                      <span>{TeraPContracts.formatTerap(circle.entryStake)} TERAP staked</span>
                      <span className={circle.isActive ? 'text-accent-600' : 'text-neutral-500'}>{circle.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={() => setActiveChatCircle(circle)} className="btn-primary flex-1 flex items-center justify-center space-x-2 py-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>Enter Circle</span>
                      </button>
                      {isFacilitator(circle) ? (
                        <button
                          onClick={() => handleToggleActive(circle)}
                          disabled={busyId === circle.circleId || writeBlocked}
                          className="btn-outline flex-1 py-2 disabled:opacity-50"
                        >
                          {busyId === circle.circleId ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : circle.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLeave(circle)}
                          disabled={busyId === circle.circleId || writeBlocked}
                          className="btn-outline flex-1 py-2 disabled:opacity-50"
                        >
                          {busyId === circle.circleId ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Leave'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">No Circles Yet</h3>
                <p className="text-neutral-600 mb-6">Join wellness circles to connect with supportive communities</p>
                <button onClick={() => setActiveTab('browse')} className="btn-primary">Browse Circles</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Create Wellness Circle</h2>
            <form className="space-y-6" onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Circle Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    className={inputCls}
                    placeholder="Enter circle name..."
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Entry Stake (TERAP)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={inputCls}
                    value={form.entryStake}
                    onChange={(e) => setForm((f) => ({ ...f, entryStake: e.target.value }))}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Members lock this amount while they are in the circle and get it back when they leave. You stake it too as facilitator.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description *</label>
                <textarea
                  required
                  className={`${inputCls} h-32`}
                  placeholder="Describe the purpose and guidelines of your circle..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-accent-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-neutral-800 mb-2">Circle Guidelines</h4>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• Maintain confidentiality and respect privacy</li>
                      <li>• Use supportive and non-judgmental language</li>
                      <li>• No medical advice - encourage professional help</li>
                      <li>• The name, description and stake are stored on-chain and public</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button type="button" onClick={() => setActiveTab('browse')} className="btn-outline flex-1" disabled={creating}>
                  Cancel
                </button>
                <button type="submit" disabled={creating || writeBlocked} className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {!isConnected ? 'Connect wallet to create' : wrongNetwork ? `Switch to ${chain.name}` : creating ? 'Confirm in wallet...' : 'Create Circle'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {activeChatCircle && (
        <div className="fixed inset-0 z-50">
          <CircleChat circle={activeChatCircle} onBack={() => setActiveChatCircle(null)} />
        </div>
      )}
    </div>
  );
};

function Loading({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center text-neutral-600">
      <Loader2 className="h-5 w-5 animate-spin mr-3 text-primary-600" />
      {text}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <Users className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-neutral-800 mb-1">{title}</h3>
      <p className="text-neutral-600">{body}</p>
    </div>
  );
}

function Notice({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[40vh] bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg text-center">
        <div className="flex justify-center mb-3">{icon}</div>
        <h2 className="text-xl font-bold text-neutral-800 mb-2">{title}</h2>
        <p className="text-neutral-600 text-sm">{children}</p>
      </div>
    </div>
  );
}

export default WellnessCircles;
