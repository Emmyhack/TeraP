'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';

/**
 * Wallet connect button. TeraP talks to one EVM wallet (any injected EIP-1193 provider) on the
 * configured ZetaChain network. Payments from Bitcoin, Solana and other chains arrive through the
 * ZetaChain gateway and do not need a wallet connection in this UI.
 */
export function MultiWalletConnection() {
  const { connectWallet, isConnecting, error } = useWeb3Wallet();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void connectWallet()}
        disabled={isConnecting}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-60"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect EVM wallet'}
      </button>
      {error && <span className="text-xs text-red-600 max-w-[16rem] text-right">{error}</span>}
      <span className="text-[11px] text-gray-500 max-w-[16rem] text-right">
        Pay from Bitcoin, Solana or other chains via the ZetaChain gateway, see Cross-chain payments.
      </span>
    </div>
  );
}

export default MultiWalletConnection;
