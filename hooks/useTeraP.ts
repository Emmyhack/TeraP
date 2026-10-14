'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { CHAIN, CONTRACTS_CONFIGURED } from '@/config/contracts';
import { TeraPContracts, terapContracts } from '@/services/TeraPContracts';

/**
 * Access the TeraP contracts bound to the connected wallet.
 *
 * - `contracts` is read-only until a wallet is connected.
 * - `wrongNetwork` is true when the wallet is on a different chain than the configured one.
 * - `isConfigured` is false when NEXT_PUBLIC_TERAP_* addresses are missing; screens should show a
 *   setup notice instead of attempting calls.
 */
export function useTeraP() {
  const { signer, address, chainId, isConnected, switchChain } = useWeb3Wallet();

  const contracts = useMemo<TeraPContracts>(() => terapContracts.withSigner(signer ?? null), [signer]);
  const wrongNetwork = isConnected && chainId !== null && chainId !== CHAIN.id;
  const canWrite = isConnected && !wrongNetwork && CONTRACTS_CONFIGURED;

  const ensureNetwork = useCallback(async () => {
    if (chainId !== CHAIN.id) await switchChain(CHAIN.id);
  }, [chainId, switchChain]);

  return { contracts, address, isConnected, chain: CHAIN, wrongNetwork, canWrite, isConfigured: CONTRACTS_CONFIGURED, ensureNetwork };
}

/**
 * Small async-data helper: runs `loader` whenever `deps` change and exposes loading/error/refresh.
 * Returns `null` data when contracts are not configured instead of throwing.
 */
export function useContractQuery<T>(loader: () => Promise<T>, deps: unknown[], options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled || !CONTRACTS_CONFIGURED) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    loader()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(TeraPContracts.parseError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, refresh };
}
