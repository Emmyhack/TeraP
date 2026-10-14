'use client';

import AppShell from '@/components/layout/AppShell';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Heart, Shield, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import SessionBooking from '../../../components/booking/SessionBooking';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useTeraP } from '@/hooks/useTeraP';

export default function BookSessionPage() {
  const router = useRouter();
  const { connectWallet, isConnecting } = useWeb3Wallet();
  const { isConnected, isConfigured, wrongNetwork, ensureNetwork, chain } = useTeraP();


  const hero = (cta: React.ReactNode) => (
    <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-display font-bold text-neutral-800 mb-6">
              Professional Therapy
              <span className="block text-3xl bg-gradient-to-r from-primary-500 to-accent-600 bg-clip-text text-transparent mt-2">When You Need It</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Connect with licensed mental health professionals through our secure, private platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-800 mb-2">Verified Professionals</h3>
              <p className="text-sm text-neutral-600">All therapists are licensed and DAO-verified</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <Clock className="w-8 h-8 text-primary-500 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-800 mb-2">Flexible Scheduling</h3>
              <p className="text-sm text-neutral-600">Book sessions that fit your schedule</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <Heart className="w-8 h-8 text-accent-500 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-800 mb-2">Escrowed Payments</h3>
              <p className="text-sm text-neutral-600">TERAP is held by the contract until your session completes</p>
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
        <h2 className="text-3xl font-display font-bold mb-4">Ready to Connect?</h2>
        <p className="text-lg mb-8 opacity-95">Connect your wallet on {chain.name} to browse verified therapists</p>
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
        <p className="text-lg mb-8 opacity-95">Switch your wallet to {chain.name} to book a session.</p>
        <button
          onClick={() => ensureNetwork().catch(() => undefined)}
          className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-lg mx-auto"
        >
          Switch to {chain.name}
        </button>
      </>,
    );
  }

  return (
    <AppShell>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <button onClick={() => router.push('/client')} className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-800 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-neutral-800">Book Therapy Session</h1>
                <p className="text-lg text-neutral-600 mt-1">Connect with DAO-verified mental health professionals</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-500/10 to-accent-600/10 rounded-2xl p-4 border border-primary-200/50">
              <p className="text-neutral-700">
                Choose a verified therapist, pick a time, and pay with TERAP or your subscription. Payment is escrowed on {chain.name} until the session
                completes.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
            <SessionBooking onNavigateToSubscription={() => router.push('/client/subscription')} />
          </div>
        </div>
      </AppShell>
  );
}
