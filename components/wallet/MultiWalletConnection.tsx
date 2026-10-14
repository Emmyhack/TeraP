'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';

/**
 * Wallet connect button. TeraP talks to one EVM wallet (any injected EIP-1193 provider) on the
 * configured ZetaChain network. Payments from other chains arrive through the ZetaChain gateway
 * and do not need a wallet connection in this UI (see /cross-chain).
 */
export function MultiWalletConnection() {
  const { connectWallet, isConnecting, error } = useWeb3Wallet();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void connectWallet()}
        disabled={isConnecting}
        className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-primary-600 disabled:opacity-60"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && <span className="max-w-[16rem] text-right text-xs text-red-600">{error}</span>}
    </div>
  );
}

export default MultiWalletConnection;
