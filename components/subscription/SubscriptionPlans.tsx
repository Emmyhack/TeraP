'use client';

import React, { useState } from 'react';
import { AlertCircle, Check, Clock, Loader2, Wallet } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useTeraP } from '@/hooks/useTeraP';
import { useSubscription } from '@/hooks/useSubscription';
import { useApp } from '@/stores/AppProvider';
import { TeraPContracts } from '@/services/TeraPContracts';
import { explorerTx } from '@/config/contracts';
import { SUBSCRIPTION_PERIOD_DAYS, SUBSCRIPTION_PERIOD_OPTIONS, getTierPresentation } from '@/config/subscriptionConfig';
import type { SubscriptionPeriods, SubscriptionTierOnChain } from '@/types/subscription';

interface SubscriptionPlanSelectorProps {
  /** Tier the user currently holds, highlighted as "Current plan". */
  currentTierId?: number;
  /** Called after a successful on-chain subscribe. */
  onSubscribed?: (tier: SubscriptionTierOnChain, periods: number, txHash: string) => void;
}

export const SubscriptionPlanSelector: React.FC<SubscriptionPlanSelectorProps> = ({ currentTierId, onSubscribed }) => {
  const { isConnected, wrongNetwork, canWrite, ensureNetwork, chain } = useTeraP();
  const { connectWallet } = useWeb3Wallet();
  const { tiers, loading, error, subscribe, isConfigured } = useSubscription();
  const { addNotification } = useApp();

  const [selected, setSelected] = useState<SubscriptionTierOnChain | null>(null);
  const [periods, setPeriods] = useState<SubscriptionPeriods>(1);
  const [submitting, setSubmitting] = useState(false);

  if (!isConfigured) {
    return (
      <Notice icon={<AlertCircle className="h-5 w-5 text-amber-600" />} title="Subscriptions not configured">
        Set NEXT_PUBLIC_TERAP_SUBSCRIPTION_ADDRESS (and the token/core addresses) in .env.local to enable plans.
      </Notice>
    );
  }

  if (loading && tiers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" inline />
        <span className="ml-3 text-neutral-600">Loading plans from chain...</span>
      </div>
    );
  }

  if (error && tiers.length === 0) {
    return (
      <Notice icon={<AlertCircle className="h-5 w-5 text-red-600" />} title="Could not load plans">
        {error}
      </Notice>
    );
  }

  const activeTiers = tiers.filter((t) => t.active);

  const handleSubscribe = async () => {
    if (!selected) return;
    if (wrongNetwork) {
      await ensureNetwork();
      return;
    }
    setSubmitting(true);
    try {
      const tx = await subscribe(selected.tierId, periods);
      addNotification({
        type: 'success',
        title: 'Subscription active',
        message: `${selected.name} for ${periods * SUBSCRIPTION_PERIOD_DAYS} days. ${explorerTx(tx.hash) ? 'View on explorer: ' + explorerTx(tx.hash) : 'Tx ' + tx.hash.slice(0, 10)}`,
      });
      onSubscribed?.(selected, periods, tx.hash);
      setSelected(null);
    } catch (e) {
      addNotification({ type: 'error', title: 'Subscription failed', message: e instanceof Error ? e.message : 'Transaction failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const total = selected ? selected.pricePerPeriod * BigInt(periods) : 0n;

  return (
    <div className="space-y-8">
      {!isConnected && (
        <Notice icon={<Wallet className="h-5 w-5 text-primary-600" />} title="Connect a wallet to subscribe">
          Plans are shown from the chain; connecting lets you pay in TERAP.
          <button onClick={connectWallet} className="btn-primary btn-sm ml-4">Connect Wallet</button>
        </Notice>
      )}
      {isConnected && wrongNetwork && (
        <Notice icon={<AlertCircle className="h-5 w-5 text-amber-600" />} title={`Switch to ${chain.name}`}>
          Your wallet is on a different network.
          <button onClick={ensureNetwork} className="btn-primary btn-sm ml-4">Switch network</button>
        </Notice>
      )}

      {activeTiers.length === 0 ? (
        <div className="text-center text-neutral-600 py-12">No plans are available right now.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeTiers.map((tier) => {
            const p = getTierPresentation(tier.name);
            const isCurrent = currentTierId === tier.tierId;
            const isSelected = selected?.tierId === tier.tierId;
            return (
              <div
                key={tier.tierId}
                className={`relative rounded-2xl border-2 p-6 transition-all bg-white ${
                  isSelected ? 'border-primary-500 shadow-xl' : 'border-neutral-200 hover:shadow-lg'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-4 bg-accent-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Current plan
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl mb-4" style={{ backgroundColor: p.color }} />
                <h3 className="text-lg font-bold text-neutral-800">{tier.name}</h3>
                <p className="text-sm text-neutral-600 mt-1 min-h-[40px]">{p.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-neutral-800">{TeraPContracts.formatTerap(tier.pricePerPeriod)}</span>
                  <span className="text-sm text-neutral-500"> TERAP / {SUBSCRIPTION_PERIOD_DAYS} days</span>
                </div>
                <div className="flex items-center text-sm text-neutral-700 mt-2">
                  <Clock className="h-4 w-4 mr-2 text-primary-600" />
                  {tier.minutesPerPeriod} session minutes per period
                </div>
                <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-accent-600 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelected(tier)}
                  disabled={!isConnected}
                  className={`w-full mt-6 ${isSelected ? 'btn-primary' : 'btn-outline'} py-2 disabled:opacity-50`}
                >
                  {isCurrent ? 'Extend' : 'Choose'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
          <h4 className="font-semibold text-neutral-800 mb-4">Checkout: {selected.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {SUBSCRIPTION_PERIOD_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPeriods(n)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                      periods === n ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-300 text-neutral-700'
                    }`}
                  >
                    {n * SUBSCRIPTION_PERIOD_DAYS}d
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Each period is {SUBSCRIPTION_PERIOD_DAYS} days. Unused minutes expire when the plan ends; extending resets the minute balance to the tier allowance.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Minutes per period" value={`${selected.minutesPerPeriod}`} />
              <Row label="Price per period" value={`${TeraPContracts.formatTerap(selected.pricePerPeriod)} TERAP`} />
              <Row label="Periods" value={`${periods}`} />
              <div className="border-t pt-2 flex justify-between font-semibold text-neutral-800">
                <span>Total</span>
                <span>{TeraPContracts.formatTerap(total)} TERAP</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setSelected(null)} className="btn-outline flex-1 py-2" disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={submitting || (!canWrite && !wrongNetwork)}
              className="btn-primary flex-1 py-2 flex items-center justify-center disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {wrongNetwork ? `Switch to ${chain.name}` : submitting ? 'Confirm in wallet...' : `Pay ${TeraPContracts.formatTerap(total)} TERAP`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-600">
      <span>{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}

function Notice({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-start space-x-3">
      <div className="mt-0.5">{icon}</div>
      <div className="text-sm text-neutral-700">
        <div className="font-semibold text-neutral-800">{title}</div>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

export default SubscriptionPlanSelector;
