'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for Web3 wallet functionality
interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  provider: any | null;
  signer: any | null;
}

interface Web3WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
  switchChain: (chainId: number) => Promise<void>;
}

const Web3WalletContext = createContext<Web3WalletContextType | undefined>(undefined);

interface Web3WalletProviderProps {
  children: ReactNode;
}

export const Web3WalletProvider: React.FC<Web3WalletProviderProps> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
    provider: null,
    signer: null
  });

  // Initialize ethers.js dynamically
  const getEthers = async () => {
    const ethers = await import('ethers');
    return ethers;
  };

  const connectWallet = async (): Promise<void> => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if MetaMask is specifically installed
      if (typeof window === 'undefined' || !(window as any).ethereum?.isMetaMask) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const ethereum = (window as any).ethereum;
      
      // Request account access
      await ethereum.request({ method: 'eth_requestAccounts' });

      // Initialize ethers provider
      const ethers = await getEthers();
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setWalletState({
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        isConnecting: false,
        error: null,
        provider,
        signer
      });

      console.log('Wallet connected:', {
        address,
        chainId: Number(network.chainId)
      });

    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to connect wallet';
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage
      }));
      console.error('Wallet connection error:', error);
    }
  };

  const disconnectWallet = (): void => {
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
      provider: null,
      signer: null
    });
    console.log('Wallet disconnected');
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!walletState.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await walletState.signer.signMessage(message);
      console.log('Message signed:', { message, signature });
      return signature;
    } catch (error: any) {
      console.error('Message signing error:', error);
      throw new Error(error?.message || 'Failed to sign message');
    }
  };

  const switchChain = async (targetChainId: number): Promise<void> => {
    if (typeof window === 'undefined' || !(window as any).ethereum?.isMetaMask) {
      throw new Error('MetaMask not available');
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      console.error('Chain switch error:', error);
      throw new Error('Failed to switch chain');
    }
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined' || !(window as any).ethereum?.isMetaMask) {
        return;
      }

      try {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          // Auto-connect if previously connected
          const ethers = await getEthers();
          const provider = new ethers.BrowserProvider(ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const network = await provider.getNetwork();

          setWalletState({
            isConnected: true,
            address,
            chainId: Number(network.chainId),
            isConnecting: false,
            error: null,
            provider,
            signer
          });

          console.log('Auto-connected wallet:', address);
        }
      } catch (error) {
        console.warn('Auto-connect failed:', error);
      }
    };

    checkConnection();
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum?.isMetaMask) {
      return;
    }

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== walletState.address) {
        // Reconnect with new account
        await connectWallet();
      }
    };

    const handleChainChanged = (chainId: string) => {
      setWalletState(prev => ({
        ...prev,
        chainId: parseInt(chainId, 16)
      }));
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [walletState.address]);

  const contextValue: Web3WalletContextType = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    signMessage,
    switchChain
  };

  return (
    <Web3WalletContext.Provider value={contextValue}>
      {children}
    </Web3WalletContext.Provider>
  );
};

export const useWeb3Wallet = (): Web3WalletContextType => {
  const context = useContext(Web3WalletContext);
  if (context === undefined) {
    throw new Error('useWeb3Wallet must be used within a Web3WalletProvider');
  }
  return context;
};