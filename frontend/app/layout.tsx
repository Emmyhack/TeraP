'use client';

import React from 'react';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { AppProvider } from '@/stores/AppProvider';
import '@/styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>TeraP - Healing, Together</title>
        <meta name="description" content="TeraP is a decentralized wellness DAO bridging mental health care with Web3 incentives" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased">
        <AppProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </AppProvider>
      </body>
    </html>
  );
}