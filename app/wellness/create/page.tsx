'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import Navigation from '../../../components/navigation/Navigation';
import Footer from '../../../components/ui/Footer';
import { useApp } from '../../../stores/AppProvider';
import { useTeraP } from '@/hooks/useTeraP';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { TeraPContracts } from '@/services/TeraPContracts';
import { explorerTx } from '@/config/contracts';

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500';

export default function CreateWellnessCirclePage() {
  const { addNotification } = useApp();
  const router = useRouter();
  const { contracts, isConnected, wrongNetwork, canWrite, isConfigured, ensureNetwork, chain } = useTeraP();
  const { connectWallet } = useWeb3Wallet();
  const [formData, setFormData] = useState({ name: '', description: '', entryStake: '0' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePageChange = (page: string) => {
    if (page === 'home') router.push('/');
    else if (page === 'client-dashboard') router.push('/client');
    else if (page === 'wellness-circles') router.push('/wellness');
    else if (page === 'dao-governance') router.push('/dao');
    else if (page === 'therapist-dashboard') router.push('/therapist');
    else if (page === 'book-session') router.push('/client/book-session');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wrongNetwork) {
      await ensureNetwork();
      return;
    }
    let stake: bigint;
    try {
      stake = TeraPContracts.parseTerap(formData.entryStake || '0');
    } catch {
      addNotification({ type: 'error', title: 'Invalid stake', message: 'Entry stake must be a TERAP amount.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await contracts.createWellnessCircle(formData.name.trim(), formData.description.trim(), stake);
      addNotification({
        type: 'success',
        title: 'Circle Created',
        message: `${formData.name} is live${res.circleId ? ` as circle #${res.circleId}` : ''}.${explorerTx(res.hash) ? ` ${explorerTx(res.hash)}` : ''}`,
      });
      router.push('/wellness');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Create Circle',
        message: error instanceof Error ? error.message : 'Transaction failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const gate = !isConfigured ? (
    <Gate title="Contracts not configured" body="Set NEXT_PUBLIC_TERAP_TOKEN_ADDRESS and NEXT_PUBLIC_TERAP_CORE_ADDRESS in .env.local." />
  ) : !isConnected ? (
    <Gate title="Connect Wallet Required" body="Please connect your wallet to create a wellness circle.">
      <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>
    </Gate>
  ) : null;

  if (gate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navigation currentPage="wellness-circles" onPageChange={handlePageChange} />
        <main className="pt-20">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">{gate}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navigation currentPage="wellness-circles" onPageChange={handlePageChange} />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card overflow-hidden p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Create Wellness Circle</h1>
                  <p className="mt-2 text-primary-100">Start a supportive community focused on wellness and growth</p>
                </div>
                <button onClick={() => router.back()} className="text-primary-200 hover:text-white transition-colors" aria-label="Close">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {wrongNetwork && (
              <div className="bg-amber-50 border-b border-amber-200 px-8 py-4 flex items-center justify-between">
                <span className="text-sm text-amber-800 flex items-center"><AlertCircle className="h-4 w-4 mr-2" />Your wallet is on another network. Switch to {chain.name}.</span>
                <button onClick={ensureNetwork} className="btn-primary btn-sm">Switch network</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Circle Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Circle Name *</label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className={inputCls}
                      placeholder="e.g., Anxiety Support Circle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className={inputCls}
                      placeholder="Describe the purpose, goals, and what members can expect from this circle..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Entry Stake</h2>
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Stake (TERAP)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.entryStake}
                    onChange={(e) => setFormData((prev) => ({ ...prev, entryStake: e.target.value }))}
                    className={inputCls}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Locked by every member (including you) while in the circle and returned on leaving. Use 0 for an open circle.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 text-sm text-blue-800 space-y-1">
                <p>The name, description, facilitator address and stake are written to the TeraPCore contract and are public.</p>
                <p>As facilitator you can deactivate or reactivate the circle, but you cannot leave it.</p>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-start mb-4">
                  <input type="checkbox" required className="mt-1 mr-3" />
                  <p className="text-sm text-gray-600">
                    I agree to facilitate this circle responsibly and create a safe, supportive environment for all members.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button type="submit" disabled={isSubmitting || (!canWrite && !wrongNetwork)} className="btn-primary flex items-center disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> : null}
                    {wrongNetwork ? `Switch to ${chain.name}` : isSubmitting ? 'Confirm in wallet...' : 'Create Wellness Circle'}
                  </button>
                  <button type="button" onClick={() => router.push('/wellness')} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Gate({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="card text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 mb-6">{body}</p>
      {children}
    </div>
  );
}
