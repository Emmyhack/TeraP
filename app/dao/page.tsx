'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Vote, Plus } from 'lucide-react';
import Navigation from '../../components/navigation/Navigation';
import Footer from '../../components/ui/Footer';
import DAOGovernance from '../../components/dao/DAOGovernance';
import { useTeraP } from '@/hooks/useTeraP';

export default function DAOPage() {
  const router = useRouter();
  const { chain } = useTeraP();

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'wellness-circles') router.push('/wellness');
    else if (page === 'book-session') router.push('/client/book-session');
    else if (page === 'therapist-dashboard') router.push('/therapist');
    else if (page === 'dao-governance') router.push('/dao');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/30 to-indigo-50/30">
      <Navigation currentPage="dao-governance" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-neutral-800">DAO Governance</h1>
                <p className="text-lg text-neutral-600 mt-1">
                  Proposals, votes and staking on {chain.name}, enforced by the TeraPGovernance contract.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dao/create-proposal')}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Proposal</span>
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
            <DAOGovernance />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
