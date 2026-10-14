// Therapy Session Interface with Encrypted Communication, backed by the on-chain session record.
'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Shield, User, FileText, AlertCircle, CheckCircle, Calendar, Coins, ExternalLink } from 'lucide-react';
import { EncryptedChat } from './EncryptedChat';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { SessionStatus, TeraPContracts, type TherapySession as OnChainSession } from '@/services/TeraPContracts';
import { explorerAddress } from '@/config/contracts';

export type SessionRole = 'therapist' | 'client';

export interface SessionCompletionResult {
  sessionId: number;
  userRole: SessionRole;
  /** Rating submitted by the client (1-5), when the client completed the session on-chain. */
  rating?: number;
  /** Hash of the completeSession transaction, when one was sent. */
  txHash?: string;
}

interface TherapySessionProps {
  /** On-chain session id (TeraPCore.getSession). */
  sessionId: number;
  onSessionComplete: (result: SessionCompletionResult) => void;
}

type LocalStatus = 'waiting' | 'active' | 'ending' | 'finished';

const notesKey = (sessionId: number) => `terap_session_notes_${sessionId}`;

function sameAddress(a: string | null | undefined, b: string): boolean {
  return Boolean(a) && (a as string).toLowerCase() === b.toLowerCase();
}

export const TherapySession: React.FC<TherapySessionProps> = ({ sessionId, onSessionComplete }) => {
  const { address } = useWeb3Wallet();
  const { contracts, isConfigured, canWrite, chain } = useTeraP();

  const sessionQuery = useContractQuery<OnChainSession | null>(() => contracts.getSession(sessionId), [contracts, sessionId], {
    enabled: isConfigured && Number.isFinite(sessionId) && sessionId > 0,
  });
  const session = sessionQuery.data;

  const [status, setStatus] = useState<LocalStatus>('waiting');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [clientRating, setClientRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const userRole: SessionRole | null = session
    ? sameAddress(address, session.therapist)
      ? 'therapist'
      : sameAddress(address, session.client)
      ? 'client'
      : null
    : null;

  // Timer is driven by the on-chain duration
  useEffect(() => {
    if (session) setTimeRemaining(session.duration * 60);
  }, [session]);

  // Restore locally saved therapist notes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(notesKey(sessionId));
      if (saved) setSessionNotes(saved);
    } catch {
      /* storage unavailable */
    }
  }, [sessionId]);

  useEffect(() => {
    if (status !== 'active') return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStatus('ending');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const startSession = () => setStatus('active');
  const endSession = () => setStatus('ending');

  const saveNotes = (value: string) => {
    setSessionNotes(value);
    try {
      localStorage.setItem(notesKey(sessionId), value);
    } catch {
      /* storage unavailable */
    }
  };

  /** Client: complete the session on-chain with the chosen rating (releases escrow). */
  const completeOnChain = async () => {
    if (!session || userRole !== 'client' || clientRating < 1 || !canWrite) return;
    setSubmitting(true);
    setTxError(null);
    try {
      const res = await contracts.completeSession(session.sessionId, clientRating);
      setStatus('finished');
      onSessionComplete({ sessionId: session.sessionId, userRole: 'client', rating: clientRating, txHash: res.hash });
    } catch (e) {
      setTxError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  /** Therapist: finish locally; payment is claimed later from the dashboard. */
  const finishLocally = () => {
    if (!session || userRole !== 'therapist') return;
    setStatus('finished');
    onSessionComplete({ sessionId: session.sessionId, userRole: 'therapist' });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ------------------------------------------------------------------ states

  const errorScreen = (title: string, message: string) => (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-4">{title}</h2>
        <p className="text-neutral-600 mb-6">{message}</p>
        <button onClick={sessionQuery.refresh} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Retry
        </button>
      </div>
    </div>
  );

  if (!isConfigured) return errorScreen('Contracts not configured', 'Set the NEXT_PUBLIC_TERAP_* contract addresses in .env.local. See the README.');

  if (sessionQuery.loading && !session) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Loading Session</h2>
          <p className="text-neutral-600">Reading session #{sessionId} from {chain.name}...</p>
        </div>
      </div>
    );
  }

  if (sessionQuery.error) return errorScreen('Session Error', sessionQuery.error);
  if (!session) return errorScreen('Session not found', `No session #${sessionId} exists on ${chain.name}.`);
  if (!userRole) return errorScreen('Not a participant', 'The connected wallet is neither the therapist nor the client of this session.');
  if (session.status === SessionStatus.Completed) {
    return errorScreen('Session already completed', `Session #${session.sessionId} was completed${session.clientRating ? ` with a ${session.clientRating}/5 rating` : ''}.`);
  }
  if (session.status === SessionStatus.Cancelled) return errorScreen('Session cancelled', `Session #${session.sessionId} has been cancelled.`);

  const nowSeconds = Math.floor(Date.now() / 1000);
  const startsInFuture = session.scheduledAt > nowSeconds;
  const counterpart = userRole === 'therapist' ? session.client : session.therapist;

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Session Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-green-500" />
                <h1 className="text-2xl font-bold text-neutral-800">
                  {userRole === 'therapist' ? 'Therapy Session' : 'Your Session'} <span className="text-neutral-400 text-lg">#{session.sessionId}</span>
                </h1>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : status === 'ending' || status === 'finished'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {status === 'active' ? 'Active' : status === 'ending' ? 'Ending' : status === 'finished' ? 'Finished' : 'Waiting'}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {status === 'active' && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-neutral-600" />
                  <span className="text-lg font-mono font-bold text-neutral-800">{formatTime(timeRemaining)}</span>
                </div>
              )}
              {status === 'waiting' && (
                <button onClick={startSession} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Start Session
                </button>
              )}
              {status === 'active' && (
                <button onClick={endSession} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                  End Session
                </button>
              )}
            </div>
          </div>

          {/* Session Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(session.scheduledAt * 1000).toLocaleString()} • {session.duration} min
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <User className="h-4 w-4" />
              <span className="font-mono">
                {userRole === 'therapist' ? 'Client' : 'Therapist'}: {counterpart.slice(0, 6)}...{counterpart.slice(-4)}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Coins className="h-4 w-4" />
              <span>{session.paidBySubscription ? 'Paid by subscription' : `${TeraPContracts.formatTerap(session.cost)} TERAP in escrow`}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Shield className="h-4 w-4" />
              <span>End-to-End Encrypted</span>
            </div>
          </div>
          {startsInFuture && (
            <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              This session is scheduled for {new Date(session.scheduledAt * 1000).toLocaleString()}. It cannot be completed on-chain before then.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            {status === 'active' || status === 'ending' ? (
              <div className="h-[600px]">
                <EncryptedChat
                  sessionId={String(session.sessionId)}
                  therapistId={session.therapist}
                  clientId={session.client}
                  userRole={userRole}
                  onSessionEnd={endSession}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">{status === 'finished' ? 'Session finished' : 'Secure Session Ready'}</h3>
                  <p className="text-gray-500">
                    {status === 'finished' ? 'You can close this page.' : 'Click "Start Session" to begin encrypted communication'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {userRole === 'therapist' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-5 w-5 text-neutral-600" />
                  <h3 className="text-lg font-semibold text-neutral-800">Session Notes</h3>
                </div>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => saveNotes(e.target.value)}
                  placeholder="Private notes about this session..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  disabled={status === 'waiting' || status === 'finished'}
                />
                <p className="text-xs text-gray-500 mt-2">Notes stay in this browser only; they are never sent on-chain.</p>
              </div>
            )}

            {/* Wrap-up: client completes on-chain, therapist finishes locally */}
            {status === 'ending' && userRole === 'client' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-neutral-600" />
                  <h3 className="text-lg font-semibold text-neutral-800">Rate & complete</h3>
                </div>
                <div className="flex space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setClientRating(star)}
                      className={`text-2xl ${star <= clientRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <button
                  onClick={completeOnChain}
                  disabled={submitting || clientRating < 1 || !canWrite || startsInFuture}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Confirm in wallet...' : 'Complete session on-chain'}
                </button>
                {txError && <p className="text-xs text-red-600 mt-2">{txError}</p>}
                <p className="text-xs text-gray-500 mt-2">
                  Completing releases {session.paidBySubscription ? 'the subscription payment' : `${TeraPContracts.formatTerap(session.cost)} TERAP`} to your therapist and
                  records your rating.
                </p>
                <button onClick={() => setStatus('active')} className="text-xs text-primary-600 hover:underline mt-3">
                  Resume session
                </button>
              </div>
            )}

            {status === 'ending' && userRole === 'therapist' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-neutral-600" />
                  <h3 className="text-lg font-semibold text-neutral-800">Wrap up</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Payment is released when your client completes the session. If they do not, you can claim it from your dashboard 7 days after the
                  session ends.
                </p>
                <button onClick={finishLocally} className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Finish session
                </button>
                <button onClick={() => setStatus('active')} className="text-xs text-primary-600 hover:underline mt-3">
                  Resume session
                </button>
              </div>
            )}

            {/* Security Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-neutral-800">Security Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">End-to-end encryption active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Anonymous identities protected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Session verified on {chain.name}</span>
                </div>
              </div>
              {explorerAddress(session.therapist) && (
                <a
                  href={explorerAddress(session.therapist)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary-600 hover:underline mt-3 inline-flex items-center space-x-1"
                >
                  <span>View therapist on explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Emergency Protocols */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold text-neutral-800">Emergency</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">If you are experiencing a mental health emergency:</p>
              <a href="/" className="block text-center w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                Emergency Support
              </a>
              <p className="text-xs text-gray-500 mt-2">24/7 crisis support available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
