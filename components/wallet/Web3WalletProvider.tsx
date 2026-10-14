'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SUPPORTED_CHAINS } from '@/config/contracts';
import { useApp } from '@/stores/AppProvider';

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

interface Eip6963Detail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: any;
}
const discovered = new Map<string, Eip6963Detail>();
if (typeof window !== 'undefined') {
  window.addEventListener('eip6963:announceProvider', (event: Event) => {
    const detail = (event as CustomEvent<Eip6963Detail>).detail;
    if (detail?.info?.rdns) discovered.set(detail.info.rdns, detail);
  });
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

/**
 * Pick an injected EIP-1193 provider. Prefers wallets announced via EIP-6963 (MetaMask first),
 * then falls back to window.ethereum (unwrapping multi-wallet shims).
 */
function getInjectedProvider(): any | null {
  if (typeof window === 'undefined') return null;
  if (discovered.size > 0) {
    const mm = discovered.get('io.metamask') ?? discovered.get('io.metamask.flask');
    const first = mm ?? Array.from(discovered.values())[0];
    if (first) return first.provider;
  }
  const eth = (window as any).ethereum;
  if (!eth) return null;
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    return eth.providers.find((p: any) => p.isMetaMask) ?? eth.providers[0];
  }
  return eth;
}

function describeWalletError(error: any): string {
  const code = error?.code ?? error?.info?.error?.code;
  if (code === 4001 || error?.code === 'ACTION_REJECTED') return 'Connection request was rejected in the wallet.';
  if (code === -32002) return 'A connection request is already open. Click the wallet extension icon in your browser toolbar to approve it.';
  if (code === 4100) return 'The wallet is locked. Unlock it and try again.';
  return error?.shortMessage || error?.message || 'Failed to connect wallet';
}

interface Web3WalletProviderProps {
  children: ReactNode;
}

export const Web3WalletProvider: React.FC<Web3WalletProviderProps> = ({ children }) => {
  const { addNotification } = useApp();
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
      const ethereum = getInjectedProvider();
      if (!ethereum) {
        throw new Error('No browser wallet detected. Install MetaMask (metamask.io), then reload this page.');
      }

      // Request account access (opens the wallet popup)
      const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('The wallet returned no accounts. Unlock it and select an account.');
      }

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
      const errorMessage = describeWalletError(error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage
      }));
      addNotification({ type: 'error', title: 'Wallet connection failed', message: errorMessage });
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
    const ethereum = getInjectedProvider();
    if (!ethereum) {
      throw new Error('No browser wallet available');
    }
    const hexId = `0x${targetChainId.toString(16)}`;

    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
    } catch (error: any) {
      // 4902: chain not added to the wallet yet
      const code = error?.code ?? error?.data?.originalError?.code;
      const chain = SUPPORTED_CHAINS[targetChainId];
      if (code === 4902 && chain) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexId,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: [chain.rpcUrl],
              blockExplorerUrls: chain.explorerUrl ? [chain.explorerUrl] : [],
            },
          ],
        });
        return;
      }
      console.error('Chain switch error:', error);
      throw new Error(error?.message || 'Failed to switch chain');
    }
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const ethereum = getInjectedProvider();
      if (!ethereum) {
        return;
      }

      try {
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
    const ethereum = getInjectedProvider();
    if (!ethereum || typeof ethereum.on !== 'function') {
      return;
    }

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