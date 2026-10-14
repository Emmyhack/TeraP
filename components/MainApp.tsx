'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import Navigation from '@/components/navigation/Navigation';
import Hero from '@/components/ui/Hero';
import Features from '@/components/ui/Features';
import Stats from '@/components/ui/Stats';
import Footer from '@/components/ui/Footer';
import SessionBooking from '@/components/booking/SessionBooking';
import WellnessCircles from '@/components/wellness/WellnessCircles';
import TherapistDashboard from '@/components/dashboard/TherapistDashboard';
import ClientDashboard from '@/components/dashboard/ClientDashboard';
import SubscriptionManagement from '@/components/subscription/SubscriptionManagement';
import DAOGovernance from '@/components/dao/DAOGovernance';
import NotificationContainer from '@/components/ui/NotificationContainer';
import ZKIdentityManagement from '@/components/identity/ZKIdentityManagement';
import ZKTherapistProfile from '@/components/profile/ZKTherapistProfile';
import ZKClientProfile from '@/components/profile/ZKClientProfile';
import CrossChainTransaction from '@/components/wallet/CrossChainTransaction';
import { useZKIdentity } from '@/components/identity/ZKIdentityProvider';
import MentalHealthResources from '@/components/resources/MentalHealthResources';
import { useTeraP } from '@/hooks/useTeraP';
import { CHAIN, CONTRACTS_CONFIGURED } from '@/config/contracts';

/** Global status banner: contracts missing from .env.local, or wallet on the wrong chain. */
function ContractStatusBanner() {
  const { wrongNetwork, ensureNetwork } = useTeraP();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  if (!CONTRACTS_CONFIGURED) {
    return (
      <div className="mx-4 md:mx-6 mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          Contracts not configured, copy addresses from <code>deployments/{CHAIN.id}.json</code> into{' '}
          <code>.env.local</code> (see <code>.env.example</code>) and restart the dev server.
        </span>
      </div>
    );
  }

  if (wrongNetwork) {
    const handleSwitch = async () => {
      setSwitching(true);
      setSwitchError(null);
      try {
        await ensureNetwork();
      } catch (e) {
        setSwitchError(e instanceof Error ? e.message : 'Failed to switch network');
      } finally {
        setSwitching(false);
      }
    };
    return (
      <div className="mx-4 md:mx-6 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">Your wallet is on another network. Switch to {CHAIN.name} to use TeraP.</span>
        <button
          type="button"
          onClick={handleSwitch}
          disabled={switching}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60"
        >
          {switching ? 'Switching...' : `Switch to ${CHAIN.name}`}
        </button>
        {switchError && <span className="w-full text-xs">{switchError}</span>}
      </div>
    );
  }

  return null;
}

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, currentSession } = useZKIdentity();

  // Hero.tsx dispatches a `navigate` CustomEvent to switch pages from outside the nav.
  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === 'string') setCurrentPage(detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const renderContent = () => {
    // Anonymous ZK identity is required before any in-app screen.
    if (!isAuthenticated) {
      return <ZKIdentityManagement />;
    }

    switch (currentPage) {
      case 'book-session':
        return <SessionBooking onNavigateToSubscription={() => setCurrentPage('subscription')} />;
      case 'wellness-circles':
        return <WellnessCircles />;
      case 'therapist-dashboard':
        return <TherapistDashboard />;
      case 'client-dashboard':
        return <ClientDashboard />;
      case 'subscription':
        return <SubscriptionManagement />;
      case 'dao-governance':
        return <DAOGovernance />;
      case 'identity':
        return <ZKIdentityManagement />;
      case 'profile':
        return currentSession?.profile.role === 'therapist' ? <ZKTherapistProfile /> : <ZKClientProfile />;
      case 'cross-chain':
        return <CrossChainTransaction />;
      case 'resources':
        return <MentalHealthResources />;
      case 'home':
      default:
        return (
          <div>
            <Hero />
            <Stats />
            <Features />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <ContractStatusBanner />

      <div className={currentPage === 'home' ? '' : 'pt-6'}>{renderContent()}</div>

      {currentPage === 'home' && <Footer />}
      <NotificationContainer />
    </div>
  );
};

export default MainApp;
