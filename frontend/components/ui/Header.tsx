'use client';

import React from 'react';
import { useWallet } from '@/components/wallet/WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { Heart, Brain, Users, Vote, Wallet } from 'lucide-react';

export default function Header() {
  const { state: walletState, actions: walletActions } = useWallet();
  const { state: appState, toggleModal } = useApp();

  const handleWalletConnect = () => {
    if (!walletState.activeWallet) {
      toggleModal('connectWallet', true);
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Heart className="w-8 h-8 text-primary-500" />
              <Brain className="w-4 h-4 text-accent-500 absolute -top-1 -right-1" />
            </div>
            <div className="text-2xl font-display font-bold text-neutral-800">
              TeraP
            </div>
            <div className="hidden sm:block text-sm text-neutral-600 font-medium">
              Healing, Together
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#therapy" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
              Therapy
            </a>
            <a href="#wellness" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Wellness Circles</span>
            </a>
            <a href="#dao" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors flex items-center space-x-1">
              <Vote className="w-4 h-4" />
              <span>DAO</span>
            </a>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {walletState.activeWallet ? (
              <div className="flex items-center space-x-3">
                {/* Balance Display */}
                <div className="hidden sm:flex items-center space-x-2 bg-primary-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <span className="text-sm font-medium text-primary-700">
                    {appState.user.terapBalance} TERAP
                  </span>
                </div>

                {/* Chain Indicator */}
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-neutral-600 capitalize">
                    {walletState.activeWallet}
                  </span>
                </div>

                {/* Address */}
                <div className="bg-neutral-100 px-3 py-2 rounded-lg">
                  <span className="text-sm font-mono text-neutral-700">
                    {walletState.activeWallet === 'evm' && walletState.evmWallet.address && 
                      `${walletState.evmWallet.address.slice(0, 6)}...${walletState.evmWallet.address.slice(-4)}`}
                    {walletState.activeWallet === 'solana' && walletState.solanaWallet.address && 
                      `${walletState.solanaWallet.address.slice(0, 6)}...${walletState.solanaWallet.address.slice(-4)}`}
                    {walletState.activeWallet === 'sui' && walletState.suiWallet.address && 
                      `${walletState.suiWallet.address.slice(0, 6)}...${walletState.suiWallet.address.slice(-4)}`}
                    {walletState.activeWallet === 'ton' && walletState.tonWallet.address && 
                      `${walletState.tonWallet.address.slice(0, 6)}...${walletState.tonWallet.address.slice(-4)}`}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleWalletConnect}
                className="flex items-center space-x-2 btn-primary"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      {appState.ui.modals.connectWallet && (
        <WalletModal />
      )}
    </header>
  );
}

function WalletModal() {
  const { actions: walletActions } = useWallet();
  const { toggleModal } = useApp();

  const closeModal = () => toggleModal('connectWallet', false);

  const walletOptions = [
    {
      name: 'MetaMask / EVM',
      description: 'Connect with Ethereum, ZetaChain, Base, and other EVM chains',
      icon: '🦊',
      action: () => {
        walletActions.connectEVM();
        closeModal();
      }
    },
    {
      name: 'Phantom / Solana',
      description: 'Connect with Solana blockchain',
      icon: '👻',
      action: () => {
        walletActions.connectSolana();
        closeModal();
      }
    },
    {
      name: 'Sui Wallet',
      description: 'Connect with Sui blockchain',
      icon: '🌊',
      action: () => {
        walletActions.connectSui();
        closeModal();
      }
    },
    {
      name: 'TON Wallet',
      description: 'Connect with TON blockchain',
      icon: '💎',
      action: () => {
        walletActions.connectTon();
        closeModal();
      }
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-neutral-800">Connect Your Wallet</h3>
            <button
              onClick={closeModal}
              className="text-neutral-400 hover:text-neutral-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.name}
                onClick={wallet.action}
                className="w-full text-left p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{wallet.icon}</div>
                  <div>
                    <div className="font-medium text-neutral-800">{wallet.name}</div>
                    <div className="text-sm text-neutral-600 mt-1">{wallet.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 text-sm text-neutral-600 text-center">
            TeraP supports multiple blockchains for maximum accessibility and choice.
          </div>
        </div>
      </div>
    </div>
  );
}