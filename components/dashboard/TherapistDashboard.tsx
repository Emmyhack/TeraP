// Therapist Dashboard Component — profile, sessions, earnings and claims from TeraPCore.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  Star,
  CheckCircle,
  AlertTriangle,
  Wallet,
  RefreshCw,
  Video,
  XCircle,
  Award,
  Settings,
  ShieldCheck,
  Hourglass,
} from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { SessionStatus, TeraPContracts, type TherapySession, type TherapistProfile } from '@/services/TeraPContracts';
import { explorerTx } from '@/config/contracts';
import { ethers } from 'ethers';

/** Mirrors TeraPCore.sessionClaimDelay default (7 days). */
const CLAIM_DELAY_SECONDS = 7 * 24 * 60 * 60;
const BPS = 10_000n;

interface TherapistData {
  profile: TherapistProfile | null;
  sessions: TherapySession[];
  platformFeeBps: number;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function claimableAt(s: TherapySession): number {
  return s.scheduledAt + s.duration * 60 + CLAIM_DELAY_SECONDS;
}

function liveSessionHref(s: TherapySession): string {
  return `/session/live?sessionId=${s.sessionId}&therapistId=${s.therapist}&clientId=${s.client}&duration=${s.duration}`;
}

function formatWhen(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

const TherapistDashboard: React.FC = () => {
  const { connectWallet, isConnecting } = useWeb3Wallet();
  const { contracts, address, isConnected, isConfigured, wrongNetwork, canWrite, ensureNetwork, chain } = useTeraP();
  const { addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<'sessions' | 'earnings' | 'profile'>('sessions');
  const [busyId, setBusyId] = useState<number | null>(null);

  // Edit profile form
  const [editRate, setEditRate] = useState('');
  const [editSpecs, setEditSpecs] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const query = useContractQuery<TherapistData | null>(
    async () => {
      if (!address) return null;
      const profile = await contracts.getTherapistProfile(address);
      if (!profile) return { profile: null, sessions: [], platformFeeBps: 0 };
      const [sessions, stats] = await Promise.all([contracts.getTherapistSessions(address), contracts.getPlatformStats()]);
      return {
        profile,
        sessions: [...sessions].sort((a, b) => b.scheduledAt - a.scheduledAt),
        platformFeeBps: stats.platformFeeBps,
      };
    },
    [contracts, address],
    { enabled: isConfigured && isConnected && Boolean(address) },
  );

  const profile = query.data?.profile ?? null;

  // Seed the edit form from the loaded profile
  useEffect(() => {
    if (!profile) return;
    setEditRate(ethers.formatEther(profile.hourlyRate));
    setEditSpecs(profile.specializations.join(', '));
    setEditActive(profile.isActive);
  }, [profile]);

  const buckets = useMemo(() => {
    const rows = query.data?.sessions ?? [];
    const now = nowSeconds();
    return {
      upcoming: rows.filter((s) => s.status === SessionStatus.Booked && s.scheduledAt > now),
      inProgress: rows.filter((s) => s.status === SessionStatus.Booked && s.scheduledAt <= now),
      completed: rows.filter((s) => s.status === SessionStatus.Completed),
      cancelled: rows.filter((s) => s.status === SessionStatus.Cancelled),
    };
  }, [query.data]);

  const feeBps = BigInt(query.data?.platformFeeBps ?? 0);
  const earnings = useMemo(
    () => buckets.completed.reduce((sum, s) => sum + (s.cost - (s.cost * feeBps) / BPS), 0n),
    [buckets.completed, feeBps],
  );
  const uniqueClients = useMemo(() => new Set((query.data?.sessions ?? []).map((s) => s.client)).size, [query.data]);

  const runTx = async (sessionId: number, label: string, fn: () => Promise<{ hash: string }>) => {
    if (!canWrite) return;
    setBusyId(sessionId);
    try {
      const res = await fn();
      const link = explorerTx(res.hash);
      addNotification({
        type: 'success',
        title: `${label} confirmed`,
        message: link ? `Transaction ${res.hash.slice(0, 10)}... (${link})` : `Transaction ${res.hash.slice(0, 10)}...`,
      });
      query.refresh();
    } catch (e) {
      addNotification({ type: 'error', title: `${label} failed`, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusyId(null);
    }
  };

  const cancelSession = (s: TherapySession) => {
    if (!window.confirm('Cancel this session? The client will be refunded in full.')) return;
    void runTx(s.sessionId, 'Session cancelled', () => contracts.cancelSession(s.sessionId));
  };

  const claimPayment = (s: TherapySession) => runTx(s.sessionId, 'Payment claimed', () => contracts.claimSessionPayment(s.sessionId));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !canWrite) return;
    const specializations = editSpecs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    let hourlyRate: bigint;
    try {
      hourlyRate = TeraPContracts.parseTerap(editRate.trim());
    } catch {
      addNotification({ type: 'error', title: 'Invalid rate', message: 'Enter the hourly rate as a TERAP amount, e.g. 120.' });
      return;
    }
    if (hourlyRate <= 0n) {
      addNotification({ type: 'error', title: 'Invalid rate', message: 'Hourly rate must be greater than zero.' });
      return;
    }
    setSavingProfile(true);
    try {
      const res = await contracts.updateTherapistProfile({
        specializations,
        encryptedCredentials: profile.credentials,
        hourlyRate,
        credentialHash: profile.credentialHash,
        encryptionPublicKey: profile.encryptionPublicKey,
        isActive: editActive,
      });
      addNotification({ type: 'success', title: 'Profile updated', message: `Transaction ${res.hash.slice(0, 10)}... confirmed.` });
      query.refresh();
    } catch (err) {
      addNotification({ type: 'error', title: 'Update failed', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setSavingProfile(false);
    }
  };

  // ------------------------------------------------------------------ gating states

  if (!isConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <div className="flex items-center space-x-2 font-semibold">
          <AlertTriangle className="h-5 w-5" />
          <span>Contracts not configured</span>
        </div>
        <p className="mt-2 text-sm">Set the NEXT_PUBLIC_TERAP_* contract addresses in .env.local. See the README for details.</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Wallet className="h-16 w-16 text-primary-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Connect your wallet</h2>
        <p className="text-neutral-600 mb-6">Connect a wallet on {chain.name} to access the therapist dashboard.</p>
        <button onClick={connectWallet} disabled={isConnecting} className="btn-primary">
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Wrong network</h2>
        <p className="text-neutral-600 mb-6">Please switch your wallet to {chain.name}.</p>
        <button onClick={() => ensureNetwork().catch(() => undefined)} className="btn-primary">
          Switch to {chain.name}
        </button>
      </div>
    );
  }

  if (query.loading && !query.data) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Loading Therapist Dashboard</h2>
        <p className="text-neutral-600">Fetching your profile and sessions from {chain.name}...</p>
      </div>
    );
  }

  if (query.error && !query.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Could not load your therapist data</p>
        <p className="text-sm mt-1">{query.error}</p>
        <button onClick={query.refresh} className="btn-outline mt-4">
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Award className="h-16 w-16 text-primary-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">You are not registered as a therapist</h2>
        <p className="text-neutral-600 mb-6">Register your anonymous professional profile on-chain to start accepting sessions.</p>
        <Link href="/therapist/register" className="btn-primary inline-block">
          Register as therapist
        </Link>
      </div>
    );
  }

  const renderSession = (s: TherapySession, kind: 'upcoming' | 'inProgress' | 'completed' | 'cancelled') => {
    const busy = busyId === s.sessionId;
    const claimTime = claimableAt(s);
    const canClaim = nowSeconds() >= claimTime;
    return (
      <div key={s.sessionId} className="p-4 bg-neutral-50 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div
              className={`w-3 h-3 rounded-full ${
                kind === 'completed' ? 'bg-emerald-500' : kind === 'cancelled' ? 'bg-red-500' : kind === 'inProgress' ? 'bg-amber-500' : 'bg-primary-500'
              }`}
            />
            <div>
              <div className="font-medium text-neutral-800">
                Client {shortAddr(s.client)} <span className="text-xs text-neutral-400 font-mono">#{s.sessionId}</span>
              </div>
              <div className="text-sm text-neutral-600">
                {formatWhen(s.scheduledAt)} • {s.duration} min
              </div>
              {s.encryptedNotes && <div className="text-xs text-neutral-500 mt-1 truncate max-w-md">Notes: {s.encryptedNotes}</div>}
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-2">
            <div className="text-right">
              <div className="font-medium text-neutral-800">{TeraPContracts.formatTerap(s.cost)} TERAP</div>
              {kind === 'completed' && (
                <div className="text-xs text-emerald-600 flex items-center justify-end space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Paid{s.clientRating > 0 ? ` • rated ${s.clientRating}/5` : ''}</span>
                </div>
              )}
              {kind === 'cancelled' && <div className="text-xs text-red-600">Cancelled</div>}
            </div>

            {(kind === 'upcoming' || kind === 'inProgress') && (
              <div className="flex flex-wrap gap-2 justify-end">
                <Link href={liveSessionHref(s)} className="btn-primary py-2 px-4 text-sm flex items-center space-x-1">
                  <Video className="h-4 w-4" />
                  <span>Join live session</span>
                </Link>
                {kind === 'inProgress' && (
                  <button
                    onClick={() => claimPayment(s)}
                    disabled={busy || !canWrite || !canClaim}
                    className="btn-outline py-2 px-4 text-sm flex items-center space-x-1 disabled:opacity-50"
                    title={canClaim ? 'Claim the escrowed payment' : `Claimable from ${formatWhen(claimTime)}`}
                  >
                    {canClaim ? <DollarSign className="h-4 w-4" /> : <Hourglass className="h-4 w-4" />}
                    <span>{busy ? 'Sending...' : canClaim ? 'Claim payment' : `Claimable ${formatWhen(claimTime)}`}</span>
                  </button>
                )}
                <button
                  onClick={() => cancelSession(s)}
                  disabled={busy || !canWrite}
                  className="py-2 px-4 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center space-x-1 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-neutral-800">{profile.anonymousId}</h1>
              {profile.isVerified ? (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center space-x-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>DAO verified</span>
                </span>
              ) : (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Hourglass className="h-3 w-3" />
                  <span>Pending DAO verification</span>
                </span>
              )}
              {!profile.isActive && <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">Inactive</span>}
            </div>
            <p className="text-neutral-600 mt-2 font-mono text-sm">{address}</p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{buckets.upcoming.length}</div>
              <div className="text-sm text-neutral-600">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-600">{TeraPContracts.formatTerap(earnings)}</div>
              <div className="text-sm text-neutral-600">TERAP earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">{profile.ratingCount > 0 ? (profile.rating / 20).toFixed(1) : '—'}</div>
              <div className="text-sm text-neutral-600">Rating</div>
            </div>
            <button onClick={query.refresh} className="btn-outline py-2 px-3 text-sm flex items-center space-x-1" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${query.loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        {query.error && <p className="mt-4 text-sm text-red-600">{query.error}</p>}
      </div>

      {!profile.isVerified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <div className="flex items-center space-x-2 font-semibold">
            <Hourglass className="h-5 w-5" />
            <span>Pending DAO verification</span>
          </div>
          <p className="mt-2 text-sm">
            Your profile is registered on-chain but clients cannot book you until a therapist-verification proposal passes in the DAO. You can still
            update your profile below.
          </p>
          <Link href="/dao" className="text-sm underline mt-2 inline-block">
            Open DAO governance
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
          {(['sessions', 'earnings', 'profile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {buckets.inProgress.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-2">Started, awaiting completion</h2>
              <p className="text-sm text-neutral-600 mb-6">
                Payment is released when the client completes the session, or you can claim it yourself 7 days after the session ends.
              </p>
              <div className="space-y-4">{buckets.inProgress.map((s) => renderSession(s, 'inProgress'))}</div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Upcoming Sessions</h2>
            {buckets.upcoming.length > 0 ? (
              <div className="space-y-4">{buckets.upcoming.map((s) => renderSession(s, 'upcoming'))}</div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">
                  {profile.isVerified ? 'No upcoming sessions booked yet.' : 'Sessions will appear here once you are verified and clients book you.'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Session History</h2>
            {buckets.completed.length === 0 && buckets.cancelled.length === 0 ? (
              <p className="text-neutral-600 text-center py-4">No completed or cancelled sessions yet.</p>
            ) : (
              <div className="space-y-4">
                {buckets.completed.map((s) => renderSession(s, 'completed'))}
                {buckets.cancelled.map((s) => renderSession(s, 'cancelled'))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-neutral-800 mb-6">Earnings Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary-600">{TeraPContracts.formatTerap(earnings)}</div>
              <div className="text-sm text-neutral-600">TERAP earned (net)</div>
            </div>
            <div className="text-center p-4 bg-accent-50 rounded-lg">
              <Clock className="h-8 w-8 text-accent-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-accent-600">{profile.totalSessions}</div>
              <div className="text-sm text-neutral-600">Sessions completed</div>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <Star className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary-600">{profile.ratingCount > 0 ? (profile.rating / 20).toFixed(1) : '—'}</div>
              <div className="text-sm text-neutral-600">Average rating ({profile.ratingCount})</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <Users className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-600">{uniqueClients}</div>
              <div className="text-sm text-neutral-600">Unique clients</div>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            Net earnings are the session cost minus the platform fee of {(Number(feeBps) / 100).toFixed(2)}%. Payments are transferred to your wallet
            when a session is completed or claimed; there is nothing to withdraw separately.
          </p>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="h-5 w-5 text-neutral-600" />
            <h2 className="text-xl font-bold text-neutral-800">Edit profile</h2>
          </div>
          <form onSubmit={saveProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Anonymous ID</label>
              <input type="text" value={profile.anonymousId} disabled className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500" />
              <p className="text-xs text-neutral-500 mt-1">Cannot be changed after registration.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Hourly rate (TERAP)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Specializations (comma separated)</label>
              <textarea
                value={editSpecs}
                onChange={(e) => setEditSpecs(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Anxiety, Depression, CBT"
              />
            </div>
            <label className="flex items-center space-x-3">
              <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm text-neutral-700">Accepting new bookings (active)</span>
            </label>
            <div className="text-xs text-neutral-500 space-y-1">
              <div>
                Credential hash: <span className="font-mono">{profile.credentialHash}</span>
              </div>
              <div>
                Encryption key: <span className="font-mono">{profile.encryptionPublicKey}</span>
              </div>
              <div>These values are kept as-is when you save.</div>
            </div>
            <button type="submit" disabled={savingProfile || !canWrite} className="btn-primary disabled:opacity-50">
              {savingProfile ? 'Confirm in wallet...' : 'Update profile'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TherapistDashboard;
