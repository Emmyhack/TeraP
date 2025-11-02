'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Multi-chain wallet interface
export interface WalletState {
  // EVM wallets (ZetaChain, Ethereum, etc.)
  evmWallet: {
    address: string | null;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    chainId: number | null;
    isConnected: boolean;
  };
  
  // Solana wallet
  solanaWallet: {
    address: string | null;
    publicKey: any | null;
    wallet: any | null;
    isConnected: boolean;
  };
  
  // Sui wallet
  suiWallet: {
    address: string | null;
    wallet: any | null;
    isConnected: boolean;
  };
  
  // TON wallet
  tonWallet: {
    address: string | null;
    wallet: any | null;
    isConnected: boolean;
  };
  
  // Currently active wallet type
  activeWallet: 'evm' | 'solana' | 'sui' | 'ton' | null;
}

export interface WalletActions {
  connectEVM: () => Promise<void>;
  connectSolana: () => Promise<void>;
  connectSui: () => Promise<void>;
  connectTon: () => Promise<void>;
  disconnectAll: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

interface WalletContextType {
  state: WalletState;
  actions: WalletActions;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

const initialState: WalletState = {
  evmWallet: {
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    isConnected: false,
  },
  solanaWallet: {
    address: null,
    publicKey: null,
    wallet: null,
    isConnected: false,
  },
  suiWallet: {
    address: null,
    wallet: null,
    isConnected: false,
  },
  tonWallet: {
    address: null,
    wallet: null,
    isConnected: false,
  },
  activeWallet: null,
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);

  // ZetaChain and other EVM chains
  const connectEVM = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        
        setState(prev => ({
          ...prev,
          evmWallet: {
            address: accounts[0],
            provider,
            signer,
            chainId: Number(network.chainId),
            isConnected: true,
          },
          activeWallet: 'evm',
        }));
      } else {
        alert('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      console.error('Failed to connect EVM wallet:', error);
    }
  };

  // Solana connection - requires @solana/wallet-adapter integration
  const connectSolana = async () => {
    try {
      // Real Solana wallet integration would use @solana/wallet-adapter-react
      // and connect to Phantom, Solflare, or other Solana wallets
      throw new Error('Solana wallet integration not yet implemented. Please install and connect a Solana wallet adapter.');
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error);
      throw error;
    }
  };

  // Sui connection - requires @mysten/sui.js integration
  const connectSui = async () => {
    try {
      // Real Sui wallet integration would use @mysten/sui.js
      // and connect to Sui Wallet, Suiet, or other Sui wallets
      throw new Error('Sui wallet integration not yet implemented. Please install and connect a Sui wallet.');
    } catch (error) {
      console.error('Failed to connect Sui wallet:', error);
      throw error;
    }
  };

  // TON connection - requires @ton/ton SDK integration
  const connectTon = async () => {
    try {
      // Real TON wallet integration would use @ton/ton SDK
      // and connect to Tonkeeper, TON Wallet, or other TON wallets
      throw new Error('TON wallet integration not yet implemented. Please install and connect a TON wallet.');
    } catch (error) {
      console.error('Failed to connect TON wallet:', error);
      throw error;
    }
  };

  const disconnectAll = () => {
    setState(initialState);
  };

  const switchChain = async (chainId: number) => {
    try {
      if (state.evmWallet.provider) {
        await state.evmWallet.provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${chainId.toString(16)}` }
        ]);
      }
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  // Auto-connect on page load if previously connected
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connectEVM();
          }
        });
    }
  }, []);

  const actions: WalletActions = {
    connectEVM,
    connectSolana,
    connectSui,
    connectTon,
    disconnectAll,
    switchChain,
  };

  return (
    <WalletContext.Provider value={{ state, actions }}>
      {children}
    </WalletContext.Provider>
  );
}