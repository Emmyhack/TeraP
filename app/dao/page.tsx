'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Vote, Shield, Users, Coins, TrendingUp, Plus, Award, Heart } from 'lucide-react';
import Navigation from '../../components/navigation/Navigation';
import Footer from '../../components/ui/Footer';
import DAOGovernance from '../../components/dao/DAOGovernance';
import { useApp } from '../../stores/AppProvider';

export default function DAOPage() {
  const { state } = useApp();
  const router = useRouter();

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'wellness-circles') router.push('/wellness');
    else if (page === 'book-session') router.push('/client/book-session');
    else if (page === 'therapist-dashboard') router.push('/therapist');
    else if (page === 'dao-governance') router.push('/dao');
  };

  if (!state.user.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-accent-50">
        <Navigation currentPage="dao-governance" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Vote className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-display font-bold text-neutral-800 mb-6">
                Community Governance
                <span className="block text-3xl bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent mt-2">
                  Shape the Future
                </span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join the TeraP DAO and help govern the future of decentralized mental healthcare
              </p>
            </div>

            {/* Governance Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Vote className="w-8 h-8 text-purple-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Democratic Voting</h3>
                <p className="text-sm text-neutral-600">Vote on proposals with TERAP tokens</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Coins className="w-8 h-8 text-primary-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Treasury Control</h3>
                <p className="text-sm text-neutral-600">Direct community fund allocation</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 mb-2">Platform Evolution</h3>
                <p className="text-sm text-neutral-600">Guide feature development and policies</p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-500 rounded-3xl p-8 lg:p-12 text-white shadow-2xl max-w-2xl mx-auto">
              <h2 className="text-3xl font-display font-bold mb-4">Ready to Participate?</h2>
              <p className="text-lg mb-8 opacity-95">
                Connect your wallet to join the governance community and start voting
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-white text-purple-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto"
              >
                <span>Connect Wallet</span>
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/30 to-indigo-50/30">
      <Navigation currentPage="dao-governance" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Professional Header */}
          <div className="mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-neutral-800">
                  DAO Governance
                </h1>
                <p className="text-lg text-neutral-600 mt-1">
                  Democratically govern the future of mental healthcare
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-600/10 rounded-2xl p-4 border border-purple-200/50">
              <p className="text-neutral-700">
                Participate in platform governance through proposals, voting, and community decision-making with your TERAP tokens.
              </p>
            </div>
          </div>
          
          {/* Governance Stats */}
          <div className="grid lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Vote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Active Proposals</h3>
                  <div className="text-2xl font-bold text-purple-600">3</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">Available to vote</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Voting Power</h3>
                  <div className="text-2xl font-bold text-emerald-600">{state.user.terapBalance || 1250}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">TERAP tokens</p>
            </div>

            <div className="bg-gradient-to-br from-accent-50 to-orange-50 rounded-2xl p-6 border border-accent-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Treasury</h3>
                  <div className="text-2xl font-bold text-accent-600">{state.platform?.daoTreasury || '2.5M'}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">TERAP tokens</p>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Total Voters</h3>
                  <div className="text-2xl font-bold text-primary-600">1,234</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">Community members</p>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
            <div>
              <h2 className="text-2xl font-display font-bold text-neutral-800">Active Proposals</h2>
              <p className="mt-1 text-neutral-600">
                Vote on proposals and help shape the future of TeraP platform
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => router.push('/dao/create-proposal')}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Proposal</span>
              </button>
            </div>
          </div>

          {/* DAO Governance Component */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
            <DAOGovernance />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}