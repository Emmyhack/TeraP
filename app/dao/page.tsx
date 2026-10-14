'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Vote } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import DAOGovernance from '@/components/dao/DAOGovernance';
import { useTeraP } from '@/hooks/useTeraP';

export default function DAOPage() {
  const { chain } = useTeraP();
  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500 shadow-lg">
            <Vote className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">DAO Governance</h1>
            <p className="mt-1 text-neutral-600">Proposals, votes and staking on {chain.name}, enforced by the TeraPGovernance contract.</p>
          </div>
        </div>
        <Link
          href="/dao/create-proposal"
          className="inline-flex items-center space-x-2 rounded-xl bg-accent-500 px-5 py-3 font-semibold text-white shadow-lg transition-all hover:bg-accent-600"
        >
          <Plus className="h-4 w-4" />
          <span>Create Proposal</span>
        </Link>
      </div>
      <DAOGovernance />
    </AppShell>
  );
}
