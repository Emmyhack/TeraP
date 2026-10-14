'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Users, AlertTriangle, TrendingUp, Calendar, Award, DollarSign, Star } from 'lucide-react';
import Navigation from '../../components/navigation/Navigation';
import Footer from '../../components/ui/Footer';
import TherapistDashboard from '../../components/dashboard/TherapistDashboard';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useContractQuery, useTeraP } from '@/hooks/useTeraP';
import { SessionStatus, TeraPContracts, type TherapistProfile, type TherapySession } from '@/services/TeraPContracts';

interface TherapistSummary {
  profile: TherapistProfile | null;
  sessions: TherapySession[];
  platformFeeBps: number;
}

export default function TherapistPage() {
  const router = useRouter();
  const { connectWallet, isConnecting } = useWeb3Wallet();
  const { contracts, address, isConnected, isConfigured, wrongNetwork, ensureNetwork, chain } = useTeraP();

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'wellness-circles') router.push('/wellness');
    else if (page === 'book-session') router.push('/client/book-session');
    else if (page === 'dao-governance') router.push('/dao');
    else if (page === 'therapist-dashboard') router.push('/therapist');
  };

  const summary = useContractQuery<TherapistSummary | null>(
    async () => {
      if (!address) return null;
      const profile = await contracts.getTherapistProfile(address);
      if (!profile) return { profile: null, sessions: [], platformFeeBps: 0 };
      const [sessions, stats] = await Promise.all([contracts.getTherapistSessions(address), contracts.getPlatformStats()]);
      return { profile, sessions, platformFeeBps: stats.platformFeeBps };
    },
    [contracts, address],
    { enabled: isConfigured && isConnected && Boolean(address) && !wrongNetwork },
  );

  const hero = (title: string, subtitle: string, body: string, cta: React.ReactNode, icon: React.ReactNode, accent = 'from-primary-500 to-purple-600') => (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-accent-50">
      <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="mb-12">
            <div className={`w-20 h-20 bg-gradient-to-br ${accent} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>{icon}</div>
            <h1 className="text-5xl font-display font-bold text-neutral-800 mb-6">
              {title}
              <span className={`block text-3xl bg-gradient-to-r ${accent} bg-clip-text text-transparent mt-2`}>{subtitle}</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">{body}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-800 mb-2">DAO Verification</h3>
              <p className="text-sm text-neutral-600">Community-verified credentials and licensing</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <Users className="w-8 h-8 text-primary-500 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-800 mb-2">Global Reach</h3>
              <p className="text-sm text-neutral-600">Clients can book from any connected chain</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <TrendingUp className="w-8 h-8 text-accent-500 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-800 mb-2">Earn TERAP</h3>
              <p className="text-sm text-neutral-600">Escrowed payments released on completion</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-500 via-purple-600 to-accent-500 rounded-3xl p-8 lg:p-12 text-white shadow-2xl max-w-2xl mx-auto">{cta}</div>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (!isConfigured) {
    return hero(
      'Contracts',
      'Not Configured',
      'The TeraP contract addresses are missing from the environment.',
      <p className="text-lg opacity-95">Set the NEXT_PUBLIC_TERAP_* variables in .env.local (see README) and reload.</p>,
      <AlertTriangle className="w-10 h-10 text-white" />,
      'from-amber-500 to-orange-500',
    );
  }

  if (!isConnected) {
    return hero(
      'Professional Practice',
      'Management',
      'Join our network of licensed therapists and manage your practice with on-chain escrow and DAO verification',
      <>
        <h2 className="text-3xl font-display font-bold mb-4">Ready to Start?</h2>
        <p className="text-lg mb-8 opacity-95">Connect your wallet on {chain.name} to access the professional therapist dashboard</p>
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto disabled:opacity-50"
        >
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          <Heart className="w-5 h-5" />
        </button>
      </>,
      <Heart className="w-10 h-10 text-white" />,
    );
  }

  if (wrongNetwork) {
    return hero(
      'Wrong',
      'Network',
      `Your wallet is connected to a different chain. Switch to ${chain.name} to continue.`,
      <button
        onClick={() => ensureNetwork().catch(() => undefined)}
        className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg mx-auto"
      >
        Switch to {chain.name}
      </button>,
      <AlertTriangle className="w-10 h-10 text-white" />,
      'from-amber-500 to-orange-500',
    );
  }

  if (summary.loading && !summary.data) {
    return hero(
      'Loading',
      'Your Practice',
      `Reading your therapist profile from ${chain.name}...`,
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto" />,
      <Heart className="w-10 h-10 text-white" />,
    );
  }

  if (summary.error && !summary.data) {
    return hero(
      'Could not load',
      'Your Profile',
      summary.error,
      <button onClick={summary.refresh} className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 shadow-lg mx-auto">
        Retry
      </button>,
      <AlertTriangle className="w-10 h-10 text-white" />,
      'from-amber-500 to-orange-500',
    );
  }

  const profile = summary.data?.profile ?? null;

  if (!profile) {
    return hero(
      'Professional Registration',
      'Required',
      'Register your anonymous professional profile on-chain to access the therapist dashboard and start practicing on TeraP',
      <>
        <h2 className="text-3xl font-display font-bold mb-4">Join Our Network</h2>
        <p className="text-lg mb-8 opacity-95">Register as a licensed therapist and help transform mental healthcare</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/therapist/register')}
            className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <span>Register as Therapist</span>
            <Award className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/')}
            className="border-2 border-white/70 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:border-white"
          >
            Back to Home
          </button>
        </div>
      </>,
      <AlertTriangle className="w-10 h-10 text-white" />,
      'from-amber-500 to-orange-500',
    );
  }

  const sessions = summary.data?.sessions ?? [];
  const feeBps = BigInt(summary.data?.platformFeeBps ?? 0);
  const completed = sessions.filter((s) => s.status === SessionStatus.Completed);
  const earnings = completed.reduce((sum, s) => sum + (s.cost - (s.cost * feeBps) / 10_000n), 0n);
  const activeClients = new Set(sessions.filter((s) => s.status === SessionStatus.Booked).map((s) => s.client)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-purple-50/30">
      <Navigation currentPage="therapist-dashboard" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Professional Header */}
          <div className="mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-neutral-800">Professional Dashboard</h1>
                <p className="text-lg text-neutral-600 mt-1">
                  {profile.anonymousId} • {profile.isVerified ? 'DAO verified' : 'Pending DAO verification'}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-primary-500/10 to-purple-600/10 rounded-2xl p-4 border border-primary-200/50">
              <p className="text-neutral-700">Monitor your sessions, track earnings, and maintain professional excellence on the TeraP platform.</p>
            </div>
          </div>

          {/* Quick Stats (live from TeraPCore) */}
          <div className="grid lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Sessions</h3>
                  <div className="text-2xl font-bold text-primary-600">{profile.totalSessions}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">Completed on-chain</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Active Clients</h3>
                  <div className="text-2xl font-bold text-emerald-600">{activeClients}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">With booked sessions</p>
            </div>

            <div className="bg-gradient-to-br from-accent-50 to-orange-50 rounded-2xl p-6 border border-accent-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Earnings</h3>
                  <div className="text-2xl font-bold text-accent-600">{TeraPContracts.formatTerap(earnings)}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">TERAP, net of platform fee</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Rating</h3>
                  <div className="text-2xl font-bold text-purple-600">{profile.ratingCount > 0 ? (profile.rating / 20).toFixed(1) : '—'}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-600">{profile.ratingCount} client ratings</p>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
            <TherapistDashboard />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
