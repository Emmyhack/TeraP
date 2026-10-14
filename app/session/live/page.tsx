'use client';

// Live Therapy Session Page — resolves the session from TeraPCore and hands it to the in-browser session UI.
import React, { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Wallet } from 'lucide-react';
import { TherapySession, type SessionCompletionResult } from '@/components/therapy/TherapySession';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useTeraP } from '@/hooks/useTeraP';
import { useApp } from '@/stores/AppProvider';
import { explorerTx } from '@/config/contracts';

function LiveSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { connectWallet, isConnecting } = useWeb3Wallet();
  const { isConnected, isConfigured, wrongNetwork, ensureNetwork, chain } = useTeraP();
  const { addNotification } = useApp();

  // Only the session id is trusted from the URL; participants and duration come from the contract.
  const sessionId = useMemo(() => {
    const raw = searchParams?.get('sessionId');
    const id = raw ? Number(raw) : NaN;
    return Number.isInteger(id) && id > 0 ? id : null;
  }, [searchParams]);

  const handleSessionComplete = (result: SessionCompletionResult) => {
    if (result.txHash) {
      const link = explorerTx(result.txHash);
      addNotification({
        type: 'success',
        title: `Session #${result.sessionId} completed`,
        message: link ? `Rated ${result.rating}/5. Transaction: ${link}` : `Rated ${result.rating}/5. Transaction ${result.txHash.slice(0, 10)}...`,
      });
    } else {
      addNotification({
        type: 'info',
        title: `Session #${result.sessionId} finished`,
        message: 'Payment is released when the client completes the session, or claim it from your dashboard after 7 days.',
      });
    }
    router.push(result.userRole === 'therapist' ? '/therapist' : '/client');
  };

  const gate = (title: string, message: string, action?: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-4">{title}</h2>
        <p className="text-neutral-600 mb-6">{message}</p>
        <div className="space-y-3">
          {action}
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );

  if (!isConfigured) {
    return gate('Contracts not configured', 'Set the NEXT_PUBLIC_TERAP_* contract addresses in .env.local. See the README for details.');
  }

  if (sessionId === null) {
    return gate('Invalid Session', 'The session link is missing a valid sessionId. Open the session from your dashboard.');
  }

  if (!isConnected) {
    return gate(
      'Connect your wallet',
      'Connect the wallet that booked this session (or the therapist wallet) to join.',
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center space-x-2"
      >
        <Wallet className="h-4 w-4" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>,
    );
  }

  if (wrongNetwork) {
    return gate(
      'Wrong network',
      `Switch your wallet to ${chain.name} to join this session.`,
      <button
        onClick={() => ensureNetwork().catch(() => undefined)}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
      >
        Switch to {chain.name}
      </button>,
    );
  }

  return <TherapySession sessionId={sessionId} onSessionComplete={handleSessionComplete} />;
}

export default function LiveSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Loading Session</h2>
            <p className="text-neutral-600">Preparing your encrypted therapy session...</p>
          </div>
        </div>
      }
    >
      <LiveSessionContent />
    </Suspense>
  );
}
