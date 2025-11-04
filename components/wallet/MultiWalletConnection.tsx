'use client';

import React, { useState } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  type: 'evm' | 'solana' | 'sui' | 'ton';
  connect: () => Promise<void>;
}

export function MultiWalletConnection() {
  const [isOpen, setIsOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      type: 'evm',
      connect: async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
      }
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      type: 'solana',
      connect: async () => {
        if (typeof window !== 'undefined' && window.solana?.isPhantom) {
          await window.solana.connect();
        }
      }
    },
    {
      id: 'sui',
      name: 'Sui Wallet',
      icon: '💧',
      type: 'sui',
      connect: async () => {
        if (typeof window !== 'undefined' && window.suiWallet) {
          await window.suiWallet.connect();
        }
      }
    },
    {
      id: 'tonkeeper',
      name: 'TON Wallet',
      icon: '💎',
      type: 'ton',
      connect: async () => {
        if (typeof window !== 'undefined' && window.tonConnectUI) {
          await window.tonConnectUI.connectWallet();
        }
      }
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      type: 'evm',
      connect: async () => {
        // WalletConnect implementation
        console.log('WalletConnect not implemented');
      }
    }
  ];

  const handleConnect = async (wallet: WalletOption) => {
    setConnecting(wallet.id);
    try {
      await wallet.connect();
      setIsOpen(false);
    } catch (error) {
      console.error(`Failed to connect ${wallet.name}:`, error);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[300px]">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Connect a Wallet</h3>
            <p className="text-sm text-gray-600 mt-1">
              Choose your preferred wallet for cross-chain payments
            </p>
          </div>
          <div className="p-4 space-y-2">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet)}
                disabled={connecting === wallet.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">{wallet.icon}</span>
                <div className="text-left flex-1">
                  <div className="font-medium">{wallet.name}</div>
                  <div className="text-sm text-gray-500 capitalize">
                    {wallet.type === 'evm' ? 'EVM Compatible' : wallet.type.toUpperCase()}
                  </div>
                </div>
                {connecting === wallet.id && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiWalletConnection;