'use client';

import React, { useState } from 'react';

// Import all components
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
import NotificationContainer from '@/components/ui/NotificationContainer';
import ZKIdentityManagement from '@/components/identity/ZKIdentityManagement';
import { useZKIdentity } from '@/components/identity/ZKIdentityProvider';

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated } = useZKIdentity();

  const renderContent = () => {
    // If not authenticated, show identity management
    if (!isAuthenticated) {
      return <ZKIdentityManagement />;
    }

    switch (currentPage) {
      case 'home':
        return (
          <div>
            <Hero />
            <Stats />
            <Features />
          </div>
        );
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
      case 'identity':
        return <ZKIdentityManagement />;
      case 'profile':
        return <ZKIdentityManagement />;
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
      
      <div className={currentPage === 'home' ? '' : 'pt-6'}>
        {renderContent()}
      </div>

      {currentPage === 'home' && <Footer />}
      <NotificationContainer />
    </div>
  );
};

export default MainApp;