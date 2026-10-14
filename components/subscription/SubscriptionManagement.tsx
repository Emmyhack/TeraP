'use client';

import React, { useState } from 'react';
import { AlertCircle, CalendarClock, Clock, Coins, RefreshCw, Wallet } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SubscriptionPlanSelector from '@/components/subscription/SubscriptionPlans';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useTeraP } from '@/hooks/useTeraP';
import { useSubscription } from '@/hooks/useSubscription';
import { TeraPContracts } from '@/services/TeraPContracts';
import { getTierPresentation } from '@/config/subscriptionConfig';

export const SubscriptionManagement: React.FC = () => {
  const [view, setView] = useState<'current' | 'plans'>('current');
  const { isConnected, wrongNetwork, ensureNetwork, chain, isConfigured } = useTeraP();
  const { connectWallet } = useWeb3Wallet();
  const { tiers, subscription, loading, error, refresh, isConfigured: subConfigured } = useSubscription();

  if (!isConfigured || !subConfigured) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Subscriptions not configured</h3>
            <p className="text-sm text-amber-700 mt-1">Set the NEXT_PUBLIC_TERAP_* contract addresses in .env.local.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center bg-white border border-neutral-200 rounded-xl p-8">
          <Wallet className="h-10 w-10 text-primary-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">Connect your wallet</h3>
          <p className="text-neutral-600 mb-4">Your subscription is stored on-chain and tied to your wallet address.</p>
          <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>
        </div>
      </div>
    );
  }

  const tier = subscription ? tiers.find((t) => t.tierId === subscription.tierId) : undefined;
  const presentation = tier ? getTierPresentation(tier.name) : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {wrongNetwork && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-amber-800">Your wallet is on another network. Switch to {chain.name} to manage your plan.</span>
          <button onClick={ensureNetwork} className="btn-primary btn-sm">Switch network</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Subscription</h2>
          <p className="text-neutral-600">Prepaid therapy minutes, paid in TERAP on {chain.name}.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={refresh} className="btn-ghost flex items-center space-x-1" title="Refresh from chain">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          <div className="flex bg-neutral-100 rounded-lg p-1">
            {(['current', 'plans'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium ${view === v ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-600'}`}
              >
                {v === 'current' ? 'My plan' : 'Plans'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {view === 'current' && (
        loading && !subscription ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" inline />
            <span className="ml-3 text-neutral-600">Loading your subscription...</span>
          </div>
        ) : !subscription ? (
          <div className="text-center bg-white border border-neutral-200 rounded-xl p-8">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No subscription yet</h3>
            <p className="text-neutral-600 mb-4">Pick a plan to prepay session minutes at a discount to pay-per-session rates.</p>
            <button onClick={() => setView('plans')} className="btn-primary">View plans</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: presentation?.color ?? '#6366F1' }} />
                  <div>
                    <h3 className="text-xl font-bold text-neutral-800">{tier?.name ?? `Tier #${subscription.tierId}`}</h3>
                    <p className="text-sm text-neutral-600">{presentation?.description}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    subscription.isActive ? 'bg-accent-100 text-accent-700' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {subscription.isActive ? 'Active' : 'Expired'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Stat icon={<Clock className="h-5 w-5 text-primary-600" />} label="Minutes remaining" value={subscription.isActive ? `${subscription.minutesRemaining}` : '0'} />
                <Stat icon={<CalendarClock className="h-5 w-5 text-primary-600" />} label={subscription.isActive ? 'Ends' : 'Ended'} value={formatDate(subscription.endTime)} />
                <Stat icon={<Coins className="h-5 w-5 text-primary-600" />} label="Total paid" value={`${TeraPContracts.formatTerap(subscription.totalPaid)} TERAP`} />
              </div>

              {tier && subscription.isActive && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Minutes used this period</span>
                    <span>
                      {Math.max(tier.minutesPerPeriod - subscription.minutesRemaining, 0)} / {tier.minutesPerPeriod}
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500"
                      style={{ width: `${Math.min(100, Math.round((subscription.minutesRemaining / Math.max(tier.minutesPerPeriod, 1)) * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Unused minutes expire when the plan ends. Extending resets your balance to the tier allowance.</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setView('plans')} className="btn-primary py-2">
                  {subscription.isActive ? 'Extend or change plan' : 'Renew'}
                </button>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-sm text-neutral-600 space-y-3">
              <h4 className="font-semibold text-neutral-800">How it works</h4>
              <p>When you book a session with your plan, the minutes are reserved on-chain and the therapist is paid from the subscription pool.</p>
              <p>Cancelling a booked session refunds the minutes to your plan.</p>
              <p>Started {formatDate(subscription.startTime)}.</p>
            </div>
          </div>
        )
      )}

      {view === 'plans' && (
        <SubscriptionPlanSelector currentTierId={subscription?.tierId} onSubscribed={() => setView('current')} />
      )}
    </div>
  );
};

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-neutral-50 rounded-xl p-4">
      <div className="flex items-center space-x-2 text-neutral-500 text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-semibold text-neutral-800">{value}</div>
    </div>
  );
}

function formatDate(unixSeconds: number): string {
  if (!unixSeconds) return '—';
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default SubscriptionManagement;
