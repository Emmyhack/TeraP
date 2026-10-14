// Session Booking Component — books therapy sessions directly on TeraPCore.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Star,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  AlertTriangle,
  CreditCard,
  Zap,
  Search,
  ExternalLink,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '@/stores/AppProvider';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { TeraPContracts, type TherapistProfile, type SubscriptionOnChain } from '@/services/TeraPContracts';
import { explorerTx } from '@/config/contracts';

interface SessionBookingProps {
  onNavigateToSubscription?: () => void;
}

type Step = 'therapists' | 'schedule' | 'payment' | 'confirmation';
type PaymentMethod = 'terap' | 'subscription';

const DURATIONS = [30, 45, 60, 90] as const;

interface BookingReceipt {
  sessionId: number | null;
  txHash: string;
  therapist: TherapistProfile;
  duration: number;
  scheduledAt: number;
  paymentMethod: PaymentMethod;
  cost: bigint;
}

/** Render a 0-100 on-chain rating as stars (rating / 20). */
function ratingStars(rating: number): string {
  return (rating / 20).toFixed(1);
}

function toUnixSeconds(date: string, time: string): number | null {
  if (!date || !time) return null;
  const ms = new Date(`${date}T${time}`).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

const SessionBooking: React.FC<SessionBookingProps> = ({ onNavigateToSubscription }) => {
  const { connectWallet, isConnecting } = useWeb3Wallet();
  const { contracts, address, isConnected, isConfigured, wrongNetwork, canWrite, ensureNetwork, chain } = useTeraP();
  const { addNotification } = useApp();

  const [step, setStep] = useState<Step>('therapists');
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistProfile | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('terap');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);

  // Verified therapists from TeraPCore
  const therapistsQuery = useContractQuery<TherapistProfile[]>(() => contracts.getVerifiedTherapists(), [contracts], {
    enabled: isConfigured,
  });
  const therapists = useMemo(() => therapistsQuery.data ?? [], [therapistsQuery.data]);

  // On-chain subscription (source of truth for the "use subscription" option)
  const subscriptionQuery = useContractQuery<SubscriptionOnChain | null>(
    async () => (address ? contracts.getSubscription(address) : null),
    [contracts, address],
    { enabled: isConfigured && Boolean(address) },
  );
  const subscription = subscriptionQuery.data;

  // TERAP balance for the pay-with-TERAP option
  const balanceQuery = useContractQuery<bigint | null>(
    async () => (address ? contracts.getTokenBalance(address) : null),
    [contracts, address],
    { enabled: isConfigured && Boolean(address) },
  );

  // Quoted cost from the contract
  const costQuery = useContractQuery<bigint | null>(
    async () => (selectedTherapist ? contracts.calculateSessionCost(selectedTherapist.therapist, duration) : null),
    [contracts, selectedTherapist?.therapist, duration],
    { enabled: isConfigured && Boolean(selectedTherapist) },
  );
  const quotedCost = costQuery.data;

  const specializations = useMemo(() => {
    const set = new Set<string>();
    therapists.forEach((t) => t.specializations.forEach((s) => set.add(s)));
    return ['all', ...Array.from(set).sort()];
  }, [therapists]);

  const filteredTherapists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return therapists.filter((t) => {
      const matchesTerm =
        !term ||
        t.anonymousId.toLowerCase().includes(term) ||
        t.specializations.some((s) => s.toLowerCase().includes(term));
      const matchesSpec = filterSpecialization === 'all' || t.specializations.includes(filterSpecialization);
      return matchesTerm && matchesSpec;
    });
  }, [therapists, searchTerm, filterSpecialization]);

  const scheduledAt = toUnixSeconds(selectedDate, selectedTime);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const scheduleInFuture = scheduledAt !== null && scheduledAt > nowSeconds;

  const subscriptionUsable = Boolean(subscription && subscription.isActive && subscription.minutesRemaining >= duration);
  const balance = balanceQuery.data;
  const hasEnoughTerap = balance !== null && balance !== undefined && quotedCost !== null && quotedCost !== undefined && balance >= quotedCost;

  // Fall back to TERAP when the subscription can no longer cover the selected duration
  useEffect(() => {
    if (paymentMethod === 'subscription' && !subscriptionUsable) setPaymentMethod('terap');
  }, [paymentMethod, subscriptionUsable]);

  const resetFlow = () => {
    setStep('therapists');
    setSelectedTherapist(null);
    setSelectedDate('');
    setSelectedTime('');
    setNotes('');
    setPaymentMethod('terap');
    setReceipt(null);
  };

  const confirmBooking = async () => {
    if (!selectedTherapist || scheduledAt === null || !canWrite) return;
    if (scheduledAt <= Math.floor(Date.now() / 1000)) {
      addNotification({ type: 'error', title: 'Invalid time', message: 'Please pick a date and time in the future.' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await contracts.bookSession({
        therapist: selectedTherapist.therapist,
        durationMinutes: duration,
        scheduledAt,
        encryptedNotes: notes.trim(),
        useSubscription: paymentMethod === 'subscription',
      });
      setReceipt({
        sessionId: result.sessionId,
        txHash: result.hash,
        therapist: selectedTherapist,
        duration,
        scheduledAt,
        paymentMethod,
        cost: quotedCost ?? 0n,
      });
      setStep('confirmation');
      addNotification({
        type: 'success',
        title: 'Session booked',
        message: result.sessionId !== null ? `Session #${result.sessionId} is confirmed on-chain.` : 'Your session is confirmed on-chain.',
      });
      subscriptionQuery.refresh();
      balanceQuery.refresh();
    } catch (e) {
      addNotification({ type: 'error', title: 'Booking failed', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setSubmitting(false);
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
        <p className="text-neutral-600 mb-6">Connect a wallet on {chain.name} to browse therapists and book a session.</p>
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
        <p className="text-neutral-600 mb-6">Please switch your wallet to {chain.name} to continue.</p>
        <button onClick={() => ensureNetwork().catch(() => undefined)} className="btn-primary">
          Switch to {chain.name}
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------ steps

  const stepIndex: Record<Step, number> = { therapists: 0, schedule: 1, payment: 2, confirmation: 3 };

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="flex items-center justify-center space-x-4">
        {(['Therapist', 'Schedule', 'Payment', 'Confirm'] as const).map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                stepIndex[step] >= i ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {stepIndex[step] > i ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`ml-2 text-sm ${stepIndex[step] >= i ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}>{label}</span>
            {i < 3 && <ArrowRight className="h-4 w-4 text-neutral-300 ml-4" />}
          </div>
        ))}
      </div>

      {step === 'therapists' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by anonymous ID or specialization"
                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {specializations.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All specializations' : s}
                </option>
              ))}
            </select>
            <button onClick={therapistsQuery.refresh} className="btn-outline flex items-center space-x-2" type="button">
              <RefreshCw className={`h-4 w-4 ${therapistsQuery.loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {therapistsQuery.loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading verified therapists from {chain.name}...</p>
            </div>
          )}

          {therapistsQuery.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{therapistsQuery.error}</div>
          )}

          {!therapistsQuery.loading && !therapistsQuery.error && filteredTherapists.length === 0 && (
            <div className="text-center py-12">
              <User className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">
                {therapists.length === 0
                  ? 'No verified therapists are available yet. Therapists appear here once the DAO verifies them.'
                  : 'No therapists match your search.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTherapists.map((t) => (
              <div
                key={t.therapist}
                className={`bg-white rounded-xl border-2 p-6 transition-all cursor-pointer hover:shadow-lg ${
                  selectedTherapist?.therapist === t.therapist ? 'border-primary-500 shadow-lg' : 'border-neutral-200'
                }`}
                onClick={() => setSelectedTherapist(t)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full flex items-center justify-center text-white font-bold">
                      {t.anonymousId.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-neutral-800">{t.anonymousId}</h3>
                        <Shield className="h-4 w-4 text-emerald-500" aria-label="DAO verified" />
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-neutral-600">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{ratingStars(t.rating)}</span>
                        <span className="text-neutral-400">({t.ratingCount} ratings)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">{TeraPContracts.formatTerap(t.hourlyRate)} TERAP</div>
                    <div className="text-xs text-neutral-500">per hour</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {t.specializations.map((s) => (
                    <span key={s} className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-600">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{t.totalSessions} sessions completed</span>
                  </span>
                  <span className="font-mono text-xs text-neutral-400">
                    {t.therapist.slice(0, 6)}...{t.therapist.slice(-4)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep('schedule')} disabled={!selectedTherapist} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'schedule' && selectedTherapist && (
        <div className="space-y-6">
          <div className="bg-primary-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-neutral-800">{selectedTherapist.anonymousId}</div>
              <div className="text-sm text-neutral-600">{TeraPContracts.formatTerap(selectedTherapist.hourlyRate)} TERAP / hour</div>
            </div>
            <button onClick={() => setStep('therapists')} className="text-sm text-primary-600 hover:underline">
              Change therapist
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">Session duration</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    duration === d ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-lg font-bold text-neutral-800">{d} min</div>
                  <div className="text-xs text-neutral-500">
                    {TeraPContracts.formatTerap((selectedTherapist.hourlyRate * BigInt(d)) / 60n)} TERAP
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Time (your local time)
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          {scheduledAt !== null && !scheduleInFuture && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4" />
              <span>The session must be scheduled in the future.</span>
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Notes for your therapist (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What would you like to focus on?"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-500 mt-1">Notes are stored on-chain with the session; avoid sharing identifying details.</p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('therapists')} className="btn-outline flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button onClick={() => setStep('payment')} disabled={!scheduleInFuture} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
              <span>Continue to payment</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && selectedTherapist && scheduledAt !== null && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Session summary</h3>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-neutral-600">Therapist</dt>
              <dd className="text-neutral-800 font-medium text-right">{selectedTherapist.anonymousId}</dd>
              <dt className="text-neutral-600">When</dt>
              <dd className="text-neutral-800 font-medium text-right">{new Date(scheduledAt * 1000).toLocaleString()}</dd>
              <dt className="text-neutral-600">Duration</dt>
              <dd className="text-neutral-800 font-medium text-right">{duration} minutes</dd>
              <dt className="text-neutral-600">Quoted cost</dt>
              <dd className="text-primary-600 font-bold text-right">
                {costQuery.loading ? 'Calculating...' : quotedCost !== null && quotedCost !== undefined ? `${TeraPContracts.formatTerap(quotedCost)} TERAP` : '—'}
              </dd>
            </dl>
            {costQuery.error && <p className="text-sm text-red-600 mt-2">{costQuery.error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">Payment method</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('terap')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  paymentMethod === 'terap' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold text-neutral-800">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                  <span>Pay with TERAP</span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">
                  Tokens are escrowed by the contract and released to the therapist after the session.
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  Balance: {balance !== null && balance !== undefined ? `${TeraPContracts.formatTerap(balance)} TERAP` : '...'}
                  {balance !== null && balance !== undefined && quotedCost !== null && quotedCost !== undefined && !hasEnoughTerap && (
                    <span className="text-red-600 ml-2">Insufficient balance</span>
                  )}
                </p>
              </button>

              <button
                type="button"
                onClick={() => subscriptionUsable && setPaymentMethod('subscription')}
                disabled={!subscriptionUsable}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  paymentMethod === 'subscription'
                    ? 'border-primary-500 bg-primary-50'
                    : subscriptionUsable
                    ? 'border-neutral-200 hover:border-neutral-300'
                    : 'border-neutral-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold text-neutral-800">
                  <Zap className="h-5 w-5 text-accent-600" />
                  <span>Use subscription</span>
                </div>
                {subscriptionQuery.loading ? (
                  <p className="text-sm text-neutral-600 mt-1">Checking your subscription...</p>
                ) : subscription && subscription.isActive ? (
                  <p className="text-sm text-neutral-600 mt-1">
                    {subscription.minutesRemaining} minutes remaining
                    {!subscriptionUsable && <span className="text-red-600 ml-1">(not enough for {duration} min)</span>}
                  </p>
                ) : (
                  <p className="text-sm text-neutral-600 mt-1">No active subscription.</p>
                )}
                {subscription && subscription.isActive && (
                  <p className="text-xs text-neutral-500 mt-2">Plan ends {new Date(subscription.endTime * 1000).toLocaleDateString()}</p>
                )}
              </button>
            </div>
            {!subscriptionUsable && onNavigateToSubscription && (
              <button type="button" onClick={onNavigateToSubscription} className="text-sm text-primary-600 hover:underline mt-3">
                View subscription plans
              </button>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('schedule')} className="btn-outline flex items-center space-x-2" disabled={submitting}>
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={confirmBooking}
              disabled={submitting || !canWrite || costQuery.loading || (paymentMethod === 'terap' && balance !== null && balance !== undefined && !hasEnoughTerap)}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Confirm in wallet...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirm booking</span>
                </>
              )}
            </button>
          </div>
          {paymentMethod === 'terap' && (
            <p className="text-xs text-neutral-500">You may be asked to approve TERAP spending before the booking transaction.</p>
          )}
        </div>
      )}

      {step === 'confirmation' && receipt && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">Session booked</h2>
          <p className="text-neutral-600 mb-6">
            {receipt.sessionId !== null ? `Session #${receipt.sessionId}` : 'Your session'} with {receipt.therapist.anonymousId} is confirmed for{' '}
            {new Date(receipt.scheduledAt * 1000).toLocaleString()} ({receipt.duration} min).
          </p>
          <div className="bg-neutral-50 rounded-lg p-4 text-sm text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Paid with</span>
              <span className="font-medium">{receipt.paymentMethod === 'subscription' ? 'Subscription minutes' : `${TeraPContracts.formatTerap(receipt.cost)} TERAP (escrowed)`}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Transaction</span>
              {explorerTx(receipt.txHash) ? (
                <a href={explorerTx(receipt.txHash)} target="_blank" rel="noreferrer" className="font-mono text-primary-600 hover:underline flex items-center space-x-1">
                  <span>
                    {receipt.txHash.slice(0, 10)}...{receipt.txHash.slice(-6)}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="font-mono">{receipt.txHash.slice(0, 10)}...{receipt.txHash.slice(-6)}</span>
              )}
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <a href="/client" className="btn-primary">
              Go to my sessions
            </a>
            <button onClick={resetFlow} className="btn-outline">
              Book another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionBooking;
