'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import CrossChainTransaction from '@/components/wallet/CrossChainTransaction';

export default function CrossChainPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">Pay from another chain</h1>
        <p className="mt-2 text-neutral-600">
          Book a session with assets on Ethereum, BSC, Polygon, Bitcoin or Solana. Deposits reach TeraP through the
          ZetaChain gateway; no ZETA or TERAP needed on the source chain.
        </p>
      </div>
      <CrossChainTransaction />
    </AppShell>
  );
}
