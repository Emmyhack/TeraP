import React from 'react';
import { Metadata } from 'next';
import { AppProvider } from '@/stores/AppProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'TeraP Universal - Wellness DAO Platform',
  description: 'A decentralized wellness platform connecting therapists and clients across all chains via ZetaChain',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#6366f1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-primary-50 font-sans text-neutral-800 antialiased">
        <AppProvider>
          <div id="root" className="relative">
            {children}
          </div>
        </AppProvider>
        
        {/* Portal for modals and overlays */}
        <div id="modal-portal" />
        <div id="toast-portal" />
      </body>
    </html>
  );
}