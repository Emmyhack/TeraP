// Client Dashboard Component — the connected wallet's sessions, balance and circles from TeraPCore.
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  Users,
  User,
  Star,
  AlertTriangle,
  Wallet,
  RefreshCw,
  Video,
  XCircle,
  CheckCircle,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import {
  SessionStatus,
  TeraPContracts,
  type TherapySession,
  type TherapistProfile,
  type WellnessCircle,
} from '@/services/TeraPContracts';
import { explorerTx } from '@/config/contracts';

const LATE_CANCEL_WINDOW_SECONDS = 24 * 60 * 60;

interface ClientSessionRow {
  session: TherapySession;
  therapistName: string;
}

interface DashboardData {
  sessions: ClientSessionRow[];
  balance: bigint;
  circles: WellnessCircle[];
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function liveSessionHref(s: TherapySession): string {
  return `/session/live?sessionId=${s.sessionId}&therapistId=${s.therapist}&clientId=${s.client}&duration=${s.duration}`;
}

function formatWhen(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex space-x-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className={`text-2xl leading-none ${star <= value ? 'text-yellow-400' : 'text-neutral-300'} hover:text-yellow-400 transition-colors`}
        aria-label={`${star} star${star > 1 ? 's' : ''}`}
      >
        ★
      </button>
    ))}
  </div>
);

const ClientDashboard: React.FC = () => {
  const { connectWallet, isConnecting } = useWeb3Wallet();
  const { contracts, address, isConnected, isConfigured, wrongNetwork, canWrite, ensureNetwork, chain } = useTeraP();
  const { addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<'sessions' | 'circles'>('sessions');
  const [ratingFor, setRatingFor] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [busyId, setBusyId] = useState<number | null>(null);

  const query = useContractQuery<DashboardData | null>(
    async () => {
      if (!address) return null;
      const [rawSessions, balance, circles] = await Promise.all([
        contracts.getClientSessions(address),
        contracts.getTokenBalance(address),
        contracts.getMemberCircles(address),
      ]);
      const therapistAddrs = Array.from(new Set(rawSessions.map((s) => s.therapist)));
      const profiles = await Promise.all(therapistAddrs.map((a) => contracts.getTherapistProfile(a)));
      const names = new Map<string, string>();
      therapistAddrs.forEach((a, i) => {
        const p: TherapistProfile | null = profiles[i];
        names.set(a, p ? p.anonymousId : `${a.slice(0, 6)}...${a.slice(-4)}`);
      });
      const sessions = rawSessions
        .map((session) => ({ session, therapistName: names.get(session.therapist) ?? session.therapist }))
        .sort((a, b) => b.session.scheduledAt - a.session.scheduledAt);
      return { sessions, balance, circles };
    },
    [contracts, address],
    { enabled: isConfigured && isConnected && Boolean(address) },
  );

  const buckets = useMemo(() => {
    const rows = query.data?.sessions ?? [];
    const now = nowSeconds();
    return {
      upcoming: rows.filter((r) => r.session.status === SessionStatus.Booked && r.session.scheduledAt > now),
      ready: rows.filter((r) => r.session.status === SessionStatus.Booked && r.session.scheduledAt <= now),
      completed: rows.filter((r) => r.session.status === SessionStatus.Completed),
      cancelled: rows.filter((r) => r.session.status === SessionStatus.Cancelled),
    };
  }, [query.data]);

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
      setRatingFor(null);
      query.refresh();
    } catch (e) {
      addNotification({ type: 'error', title: `${label} failed`, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusyId(null);
    }
  };

  const completeSession = (sessionId: number) => runTx(sessionId, 'Session completed', () => contracts.completeSession(sessionId, rating));

  const cancelSession = (s: TherapySession) => {
    const late = s.scheduledAt < nowSeconds() + LATE_CANCEL_WINDOW_SECONDS;
    const message = late
      ? `This session starts within 24 hours. Cancelling now forfeits 50% of the escrowed cost (${TeraPContracts.formatTerap(s.cost / 2n)} TERAP) to the therapist. Continue?`
      : 'Cancel this session? The escrowed TERAP (or subscription minutes) will be refunded in full.';
    if (!window.confirm(message)) return;
    void runTx(s.sessionId, 'Session cancelled', () => contracts.cancelSession(s.sessionId));
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
        <p className="text-neutral-600 mb-6">Connect a wallet on {chain.name} to see your sessions.</p>
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
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Loading your dashboard</h2>
        <p className="text-neutral-600">Fetching your sessions from {chain.name}...</p>
      </div>
    );
  }

  const data = query.data;

  const renderSession = (row: ClientSessionRow, kind: 'upcoming' | 'ready' | 'completed' | 'cancelled') => {
    const s = row.session;
    const busy = busyId === s.sessionId;
    const late = s.scheduledAt < nowSeconds() + LATE_CANCEL_WINDOW_SECONDS;
    return (
      <div key={s.sessionId} className="p-4 bg-neutral-50 rounded-lg border-l-4 border-primary-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <User className="h-8 w-8 text-primary-600" />
            <div>
              <div className="font-medium text-neutral-800">
                {row.therapistName} <span className="text-xs text-neutral-400 font-mono">#{s.sessionId}</span>
              </div>
              <div className="text-sm text-neutral-600">
                {formatWhen(s.scheduledAt)} • {s.duration} min •{' '}
                {s.paidBySubscription ? 'Subscription' : `${TeraPContracts.formatTerap(s.cost)} TERAP`}
              </div>
              {kind === 'completed' && s.clientRating > 0 && (
                <div className="text-sm text-yellow-500 flex items-center space-x-1 mt-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span>You rated {s.clientRating}/5</span>
                </div>
              )}
            </div>
          </div>

          {(kind === 'upcoming' || kind === 'ready') && (
            <div className="flex flex-wrap gap-2">
              <Link href={liveSessionHref(s)} className="btn-primary py-2 px-4 text-sm flex items-center space-x-1">
                <Video className="h-4 w-4" />
                <span>Join live session</span>
              </Link>
              {kind === 'ready' && (
                <button
                  onClick={() => {
                    setRatingFor(ratingFor === s.sessionId ? null : s.sessionId);
                    setRating(5);
                  }}
                  disabled={busy || !canWrite}
                  className="btn-outline py-2 px-4 text-sm flex items-center space-x-1 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete</span>
                </button>
              )}
              <button
                onClick={() => cancelSession(s)}
                disabled={busy || !canWrite}
                className="py-2 px-4 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center space-x-1 disabled:opacity-50"
                title={late ? 'Cancelling within 24h of the start forfeits 50% of the cost' : 'Cancel with a full refund'}
              >
                <XCircle className="h-4 w-4" />
                <span>{busy ? 'Sending...' : late ? 'Cancel (50% fee)' : 'Cancel'}</span>
              </button>
            </div>
          )}
          {kind === 'completed' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
          {kind === 'cancelled' && <span className="text-sm text-red-600">Cancelled</span>}
        </div>

        {ratingFor === s.sessionId && kind === 'ready' && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-neutral-200">
            <div className="text-sm font-medium text-neutral-700 mb-2">Rate your session</div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <StarPicker value={rating} onChange={setRating} />
              <button onClick={() => completeSession(s.sessionId)} disabled={busy || !canWrite} className="btn-primary py-2 px-4 text-sm disabled:opacity-50">
                {busy ? 'Confirm in wallet...' : 'Submit & release payment'}
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Completing releases the escrowed TERAP to the therapist and records your rating on-chain.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">Your Wellness Journey</h1>
            <p className="text-neutral-600 mt-2 font-mono text-sm">{address}</p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{buckets.upcoming.length + buckets.ready.length}</div>
              <div className="text-sm text-neutral-600">Booked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-600">{buckets.completed.length}</div>
              <div className="text-sm text-neutral-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">{data?.circles.length ?? 0}</div>
              <div className="text-sm text-neutral-600">Circles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 flex items-center justify-center space-x-1">
                <Coins className="h-5 w-5" />
                <span>{data ? TeraPContracts.formatTerap(data.balance) : '0'}</span>
              </div>
              <div className="text-sm text-neutral-600">TERAP balance</div>
            </div>
            <button onClick={query.refresh} className="btn-outline py-2 px-3 text-sm flex items-center space-x-1" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${query.loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        {query.error && <p className="mt-4 text-sm text-red-600">{query.error}</p>}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/client/book-session" className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow block">
          <Calendar className="h-8 w-8 text-primary-600 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">Book Session</h3>
          <p className="text-neutral-600">Schedule a session with a DAO-verified therapist</p>
        </Link>
        <Link href="/wellness" className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow block">
          <Users className="h-8 w-8 text-accent-600 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">Wellness Circles</h3>
          <p className="text-neutral-600">Join peer support groups</p>
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
          {(['sessions', 'circles'] as const).map((tab) => (
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
          {buckets.ready.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-2">Ready to complete</h2>
              <p className="text-sm text-neutral-600 mb-6">These sessions have started. Complete them to rate your therapist and release payment.</p>
              <div className="space-y-4">{buckets.ready.map((r) => renderSession(r, 'ready'))}</div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Upcoming Sessions</h2>
            {buckets.upcoming.length > 0 ? (
              <div className="space-y-4">{buckets.upcoming.map((r) => renderSession(r, 'upcoming'))}</div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No upcoming sessions. Book your next therapy session.</p>
                <Link href="/client/book-session" className="btn-primary mt-4 inline-block">
                  Book Session
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Session History</h2>
            {buckets.completed.length === 0 && buckets.cancelled.length === 0 ? (
              <p className="text-neutral-600 text-center py-4">No completed or cancelled sessions yet.</p>
            ) : (
              <div className="space-y-4">
                {buckets.completed.map((r) => renderSession(r, 'completed'))}
                {buckets.cancelled.map((r) => renderSession(r, 'cancelled'))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'circles' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-neutral-800 mb-6">My Wellness Circles</h2>
          {data && data.circles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.circles.map((circle) => (
                <div key={circle.circleId} className="border border-neutral-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-800">{circle.name}</h3>
                      <p className="text-neutral-600 text-sm mt-1">{circle.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${circle.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                      {circle.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-neutral-600">
                    <span className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{circle.memberCount} members</span>
                    </span>
                    <span>
                      Stake: {TeraPContracts.formatTerap(circle.entryStake)} TERAP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600">You have not joined any wellness circles yet.</p>
            </div>
          )}
          <Link href="/wellness" className="btn-outline w-full mt-6 inline-flex items-center justify-center space-x-2">
            <span>Browse Wellness Circles</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      )}

      <p className="text-xs text-neutral-500 flex items-center space-x-1">
        <Clock className="h-3 w-3" />
        <span>Times are shown in your local timezone. Session state is read directly from TeraPCore on {chain.name}.</span>
      </p>
    </div>
  );
};

export default ClientDashboard;
