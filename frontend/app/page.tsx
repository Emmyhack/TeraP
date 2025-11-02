'use client';

import React from 'react';
import { useApp } from '@/stores/AppProvider';
import { useWallet } from '@/components/wallet/WalletProvider';
import Header from '@/components/ui/Header';
import Hero from '@/components/ui/Hero';
import Features from '@/components/ui/Features';
import Stats from '@/components/ui/Stats';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NotificationContainer from '@/components/ui/NotificationContainer';

export default function HomePage() {
  const { state } = useApp();
  const { state: walletState } = useWallet();

  if (state.ui.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-wellness-calm to-white">
      <Header />
      <Hero />
      <Stats />
      <Features />
      <Footer />
      <NotificationContainer />
    </main>
  );
}