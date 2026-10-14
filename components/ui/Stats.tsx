'use client';

import React, { useEffect } from 'react';
import { UserCheck, Users, Vote, TrendingUp } from 'lucide-react';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { TeraPContracts } from '@/services/TeraPContracts';
import { useApp } from '@/stores/AppProvider';

export default function Stats() {
  const { contracts, isConfigured, chain } = useTeraP();
  const { dispatch } = useApp();
  const { data, loading, error } = useContractQuery(() => contracts.getPlatformStats(), [contracts], { enabled: isConfigured });

  // Keep the shared store in sync for screens that read platform totals from it.
  useEffect(() => {
    if (!data) return;
    dispatch({
      type: 'UPDATE_PLATFORM_STATS',
      payload: {
        totalTherapists: data.therapists,
        totalSessions: data.sessions,
        totalCircles: data.circles,
        daoTreasury: TeraPContracts.formatTerap(data.treasury),
      },
    });
  }, [data, dispatch]);

  const ready = Boolean(data) && !loading;
  const stats = [
    {
      label: 'Verified Therapists',
      value: ready && data ? data.verifiedTherapists.toLocaleString() : '—',
      sub: ready && data ? `${data.therapists.toLocaleString()} registered` : null,
      icon: UserCheck,
      color: 'text-primary-600',
    },
    {
      label: 'Sessions Booked',
      value: ready && data ? data.sessions.toLocaleString() : '—',
      sub: 'on-chain bookings',
      icon: TrendingUp,
      color: 'text-accent-600',
    },
    {
      label: 'Wellness Circles',
      value: ready && data ? data.circles.toLocaleString() : '—',
      sub: 'community groups',
      icon: Users,
      color: 'text-wellness-peace',
    },
    {
      label: 'DAO Treasury',
      value: ready && data ? `${TeraPContracts.formatTerap(data.treasury, 0)} TERAP` : '—',
      sub: ready && data ? `${data.proposals.toLocaleString()} proposals` : null,
      icon: Vote,
      color: 'text-neutral-700',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-neutral-800 mb-4">Platform Impact</h2>
          <p className="text-lg text-neutral-600">
            {!isConfigured
              ? 'Live numbers appear once the contract addresses are configured.'
              : error
                ? `Could not reach ${chain.name}: ${error}`
                : `Live from the TeraP contracts on ${chain.name}`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="card card-hover text-center">
              <div className="flex justify-center mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-neutral-800 mb-2">{stat.value}</div>
              <div className="text-neutral-600 mb-2">{stat.label}</div>
              {stat.sub && <div className="text-sm text-neutral-500 font-medium">{stat.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
