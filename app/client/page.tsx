'use client';

import AppShell from '@/components/layout/AppShell';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Calendar, Users, Brain, TrendingUp, Award, AlertTriangle, Coins } from 'lucide-react';
import ClientDashboard from '../../components/dashboard/ClientDashboard';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { SessionStatus, TeraPContracts, type TherapySession } from '@/services/TeraPContracts';

interface ClientSummary {
  sessions: TherapySession[];
  balance: bigint;
  circles: number;
}

export default function ClientPage() {
  const router = useRouter();
  const { connectWallet, isConnecting } = useWeb3Wallet();
  const { contracts, address, isConnected, isConfigured, wrongNetwork, ensureNetwork, chain } = useTeraP();


  const summary = useContractQuery<ClientSummary | null>(
    async () => {
      if (!address) return null;
      const [sessions, balance, circles] = await Promise.all([
        contracts.getClientSessions(address),
        contracts.getTokenBalance(address),
        contracts.getMemberCircles(address),
      ]);
      return { sessions, balance, circles: circles.length };
    },
    [contracts, address],
    { enabled: isConfigured && isConnected && Boolean(address) && !wrongNetwork },
  );

  const hero = (cta: React.ReactNode) => (
    <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-display font-bold text-neutral-800 mb-6">
              Your Wellness Journey
              <span className="block text-3xl bg-gradient-to-r from-primary-500 to-accent-600 bg-clip-text text-transparent mt-2">Starts Here</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Access your personalized mental health dashboard with complete privacy and professional support
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-800 mb-2">Private & Secure</h3>
              <p className="text-sm text-neutral-600">Anonymous identity with end-to-end encryption</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <Brain className="w-8 h-8 text-primary-500 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-800 mb-2">Professional Care</h3>
              <p className="text-sm text-neutral-600">DAO-verified therapists and escrowed payments</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <Users className="w-8 h-8 text-accent-500 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-800 mb-2">Community Support</h3>
              <p className="text-sm text-neutral-600">Connect with others on similar wellness journeys</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-500 via-accent-600 to-accent-500 rounded-3xl p-8 lg:p-12 text-white shadow-2xl max-w-2xl mx-auto">{cta}</div>
        </div>
      </AppShell>
  );

  if (!isConfigured) {
    return hero(
      <>
        <AlertTriangle className="w-10 h-10 mx-auto mb-4" />
        <h2 className="text-3xl font-display font-bold mb-4">Contracts not configured</h2>
        <p className="text-lg opacity-95">Set the NEXT_PUBLIC_TERAP_* variables in .env.local (see README) and reload.</p>
      </>,
    );
  }

  if (!isConnected) {
    return hero(
      <>
        <h2 className="text-3xl font-display font-bold mb-4">Ready to Begin?</h2>
        <p className="text-lg mb-8 opacity-95">Connect your wallet on {chain.name} to see your sessions and book a therapist</p>
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto disabled:opacity-50"
        >
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          <Heart className="w-5 h-5" />
        </button>
      </>,
    );
  }

  if (wrongNetwork) {
    return hero(
      <>
        <AlertTriangle className="w-10 h-10 mx-auto mb-4" />
        <h2 className="text-3xl font-display font-bold mb-4">Wrong network</h2>
        <p className="text-lg mb-8 opacity-95">Switch your wallet to {chain.name} to continue.</p>
        <button
          onClick={() => ensureNetwork().catch(() => undefined)}
          className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg mx-auto"
        >
          Switch to {chain.name}
        </button>
      </>,
    );
  }

  const sessions = summary.data?.sessions ?? [];
  const booked = sessions.filter((s) => s.status === SessionStatus.Booked).length;
  const completed = sessions.filter((s) => s.status === SessionStatus.Completed).length;

  return (
    <AppShell>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-neutral-800">My Wellness Journey</h1>
                <p className="text-lg text-neutral-600 mt-1">Your personalized mental health dashboard</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-primary-500/10 to-accent-600/10 rounded-2xl p-4 border border-primary-200/50">
              <p className="text-neutral-700">
                Track your progress, manage sessions, and connect with your wellness community with complete privacy and professional support.
              </p>
            </div>
          </div>

          {/* Status Cards (live from TeraPCore) */}
          <div className="grid lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Wallet</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-emerald-700">{chain.name}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-neutral-600 bg-white/60 rounded-lg p-2 font-mono">
                {address?.slice(0, 10)}...{address?.slice(-6)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 border border-primary-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Sessions</h3>
                  <div className="text-2xl font-bold text-primary-600">{summary.loading && !summary.data ? '…' : booked}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">Booked • {completed} completed</p>
            </div>

            <div className="bg-gradient-to-br from-accent-50 to-orange-50 rounded-2xl p-6 border border-accent-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">TERAP</h3>
                  <div className="text-2xl font-bold text-accent-600">{summary.data ? TeraPContracts.formatTerap(summary.data.balance) : '…'}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">Token balance</p>
            </div>

            <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-6 border border-accent-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Circles</h3>
                  <div className="text-2xl font-bold text-accent-600">{summary.data ? summary.data.circles : '…'}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">Wellness circles joined</p>
            </div>
          </div>
          {summary.error && <p className="text-sm text-red-600 mb-6">{summary.error}</p>}

          {/* Action Cards */}
          <div className="mb-10">
            <h2 className="text-2xl font-display font-bold text-neutral-800 mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/client/book-session')}
                className="group bg-gradient-to-br from-primary-50 to-accent-50 hover:from-primary-100 hover:to-accent-100 rounded-2xl p-6 border border-primary-200/50 hover:border-primary-300/50 transition-all duration-300 shadow-lg hover:shadow-xl text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-800">Book Therapy Session</div>
                    <div className="text-sm text-neutral-600">Schedule with verified therapists</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/wellness')}
                className="group bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-2xl p-6 border border-emerald-200/50 hover:border-emerald-300/50 transition-all duration-300 shadow-lg hover:shadow-xl text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-800">Join Wellness Circles</div>
                    <div className="text-sm text-neutral-600">Connect with support communities</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/dao')}
                className="group bg-gradient-to-br from-accent-50 to-primary-50 hover:from-accent-100 hover:to-primary-100 rounded-2xl p-6 border border-accent-200/50 hover:border-accent-300/50 transition-all duration-300 shadow-lg hover:shadow-xl text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-800">DAO Governance</div>
                    <div className="text-sm text-neutral-600">Vote on platform decisions</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
            <ClientDashboard />
          </div>

          <p className="text-xs text-neutral-500 mt-6 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>All figures are read live from TeraPCore on {chain.name}.</span>
          </p>
        </div>
      </AppShell>
  );
}
