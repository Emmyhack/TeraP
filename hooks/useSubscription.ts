'use client';

import { useCallback, useState } from 'react';
import { ADDRESSES } from '@/config/contracts';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import type { SubscriptionOnChain, SubscriptionTierOnChain } from '@/types/subscription';
import type { TxResult } from '@/services/TeraPContracts';

export interface UseSubscriptionReturn {
  tiers: SubscriptionTierOnChain[];
  subscription: SubscriptionOnChain | null;
  loading: boolean;
  error: string | null;
  /** Buys `periods` x 30 days of `tierId`. The contracts layer handles the TERAP approval. */
  subscribe: (tierId: number, periods: number) => Promise<TxResult>;
  refresh: () => void;
  /** True when the subscription contract address is configured. */
  isConfigured: boolean;
}

/** Thin hook over the on-chain subscription (TeraPSubscription). */
export function useSubscription(): UseSubscriptionReturn {
  const { contracts, address, isConfigured } = useTeraP();
  const subscriptionConfigured = isConfigured && Boolean(ADDRESSES.TeraPSubscription);
  const [actionError, setActionError] = useState<string | null>(null);

  const tiersQuery = useContractQuery(() => contracts.getTiers(), [contracts], { enabled: subscriptionConfigured });
  const subQuery = useContractQuery(
    () => (address ? contracts.getSubscription(address) : Promise.resolve(null)),
    [contracts, address],
    { enabled: subscriptionConfigured && Boolean(address) },
  );

  const refreshTiers = tiersQuery.refresh;
  const refreshSub = subQuery.refresh;
  const refresh = useCallback(() => {
    refreshTiers();
    refreshSub();
  }, [refreshTiers, refreshSub]);

  const subscribe = useCallback(
    async (tierId: number, periods: number) => {
      setActionError(null);
      try {
        const result = await contracts.subscribe(tierId, periods);
        refreshSub();
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Subscription failed';
        setActionError(message);
        throw e;
      }
    },
    [contracts, refreshSub],
  );

  // A subscription with tierId 0 means the user never subscribed.
  const subscription = subQuery.data && subQuery.data.tierId > 0 ? subQuery.data : null;

  return {
    tiers: tiersQuery.data ?? [],
    subscription,
    loading: tiersQuery.loading || subQuery.loading,
    error: actionError ?? tiersQuery.error ?? subQuery.error,
    subscribe,
    refresh,
    isConfigured: subscriptionConfigured,
  };
}

export default useSubscription;
