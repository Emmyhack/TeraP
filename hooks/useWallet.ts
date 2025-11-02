'use client';

import { useState, useEffect } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isConnecting: false,
    error: null
  });

  const connectWallet = async (): Promise<void> => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Check if wallet is available
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts && accounts.length > 0) {
          setWalletState({
            isConnected: true,
            address: accounts[0],
            isConnecting: false,
            error: null
          });
        }
      } else {
        throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage
      }));
    }
  };

  const disconnectWallet = (): void => {
    setWalletState({
      isConnected: false,
      address: null,
      isConnecting: false,
      error: null
    });
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!walletState.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [message, walletState.address]
      });
      
      return signature;
    } catch (error) {
      throw new Error('Failed to sign message');
    }
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts && accounts.length > 0) {
            setWalletState(prev => ({
              ...prev,
              isConnected: true,
              address: accounts[0]
            }));
          }
        } catch (error) {
          console.warn('Failed to check wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: accounts[0],
            error: null
          }));
        } else {
          disconnectWallet();
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        (window as any).ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    signMessage
  };
};