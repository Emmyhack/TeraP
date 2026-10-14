'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTeraP } from '@/hooks/useTeraP';
import { CHAIN, CONTRACTS_CONFIGURED } from '@/config/contracts';

/** Global status banner: contracts missing from .env.local, or wallet on the wrong chain. */
export default function ContractStatusBanner() {
  const { wrongNetwork, ensureNetwork } = useTeraP();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  if (!CONTRACTS_CONFIGURED) {
    return (
      <div className="mx-auto mt-4 flex max-w-7xl items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          Contracts not configured. Copy the addresses from <code>deployments/{CHAIN.id}.json</code> into{' '}
          <code>.env.local</code> (see <code>.env.example</code>) and restart the dev server.
        </span>
      </div>
    );
  }

  if (!wrongNetwork) return null;

  const handleSwitch = async () => {
    setSwitching(true);
    setSwitchError(null);
    try {
      await ensureNetwork();
    } catch (e) {
      setSwitchError(e instanceof Error ? e.message : 'Failed to switch network');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="mx-auto mt-4 flex max-w-7xl flex-wrap items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">Your wallet is on another network. Switch to {CHAIN.name} to use TeraP.</span>
      <button
        type="button"
        onClick={handleSwitch}
        disabled={switching}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60"
      >
        {switching ? 'Switching...' : `Switch to ${CHAIN.name}`}
      </button>
      {switchError && <span className="w-full text-xs">{switchError}</span>}
    </div>
  );
}
