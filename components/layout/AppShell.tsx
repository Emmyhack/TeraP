'use client';

import React from 'react';
import Navigation from '@/components/navigation/Navigation';
import Footer from '@/components/ui/Footer';
import NotificationContainer from '@/components/ui/NotificationContainer';
import ContractStatusBanner from '@/components/layout/ContractStatusBanner';

interface AppShellProps {
  children: React.ReactNode;
  /** Render children edge-to-edge (landing page) instead of inside the centered content column. */
  fullBleed?: boolean;
}

/** Shared page frame: navigation, status banner, centered content column, footer, toasts. */
export default function AppShell({ children, fullBleed = false }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary-50 via-white to-accent-50 text-neutral-800 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950 dark:text-gray-100">
      <Navigation />
      <div className="px-4 sm:px-6">
        <ContractStatusBanner />
      </div>
      {fullBleed ? (
        <main className="flex-1">{children}</main>
      ) : (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">{children}</main>
      )}
      <Footer />
      <NotificationContainer />
    </div>
  );
}
