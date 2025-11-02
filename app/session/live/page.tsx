'use client';

// Live Therapy Session Page
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TherapySession } from '@/components/therapy/TherapySession';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useZKIdentity } from '@/components/identity/ZKIdentityProvider';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function LiveSessionContent() {
  const searchParams = useSearchParams();
  const { isConnected, address } = useWeb3Wallet();
  const { isAuthenticated, currentSession } = useZKIdentity();
  
  const [sessionConfig, setSessionConfig] = useState({
    sessionId: '',
    therapistId: '',
    clientId: '',
    duration: 60,
    userRole: 'client' as 'therapist' | 'client'
  });
  
  const [isValidSession, setIsValidSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract session parameters from URL
  useEffect(() => {
    if (!searchParams) {
      setError('Invalid session parameters. Please check the session link.');
      return;
    }
    
    const sessionId = searchParams.get('sessionId');
    const therapistId = searchParams.get('therapistId');
    const clientId = searchParams.get('clientId');
    const duration = searchParams.get('duration');
    const role = searchParams.get('role');

    if (!sessionId || !therapistId || !clientId) {
      setError('Invalid session parameters. Please check the session link.');
      return;
    }

    // Determine user role based on connected address
    const userRole = address === therapistId ? 'therapist' : 'client';

    setSessionConfig({
      sessionId,
      therapistId,
      clientId,
      duration: duration ? parseInt(duration) : 60,
      userRole
    });

    setIsValidSession(true);
  }, [searchParams, address]);

  // Check authentication and wallet connection
  useEffect(() => {
    if (!isConnected) {
      setError('Please connect your wallet to join the therapy session.');
      return;
    }

    if (!isAuthenticated || !currentSession) {
      setError('Please authenticate with your anonymous identity to access secure therapy sessions.');
      return;
    }

    setError(null);
  }, [isConnected, isAuthenticated, currentSession]);

  // Handle session completion
  const handleSessionComplete = (sessionData: any) => {
    console.log('Session completed:', sessionData);
    
    // Redirect to appropriate dashboard
    if (sessionConfig.userRole === 'therapist') {
      window.location.href = '/therapist';
    } else {
      window.location.href = '/client';
    }
  };

  if (!isValidSession || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">
            {error ? 'Access Denied' : 'Invalid Session'}
          </h2>
          <p className="text-neutral-600 mb-6">
            {error || 'The session link appears to be invalid or expired.'}
          </p>
          
          <div className="space-y-3">
            {!isConnected && (
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Connect Wallet
              </button>
            )}
            
            {!isAuthenticated && isConnected && (
              <Link
                href="/client"
                className="block w-full px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors font-medium text-center"
              >
                Authenticate Identity
              </Link>
            )}
            
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
  }

  return (
    <TherapySession
      sessionId={sessionConfig.sessionId}
      therapistId={sessionConfig.therapistId}
      clientId={sessionConfig.clientId}
      userRole={sessionConfig.userRole}
      duration={sessionConfig.duration}
      onSessionComplete={handleSessionComplete}
    />
  );
}

export default function LiveSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Loading Session</h2>
          <p className="text-neutral-600">Preparing your encrypted therapy session...</p>
        </div>
      </div>
    }>
      <LiveSessionContent />
    </Suspense>
  );
}

