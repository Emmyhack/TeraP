'use client';

import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import type { BrowserProvider, Eip1193Provider, JsonRpcSigner } from 'ethers';
import { SUPPORTED_CHAINS } from '@/config/contracts';
import { useApp } from '@/stores/AppProvider';

// Types for Web3 wallet functionality
interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
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
  provider: InjectedProvider;
}

interface InjectedProvider extends Eip1193Provider {
  isMetaMask?: boolean;
  providers?: InjectedProvider[];
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

interface WalletError {
  code?: number | string;
  message?: string;
  shortMessage?: string;
  data?: { originalError?: { code?: number | string } };
  info?: { error?: { code?: number | string } };
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
function getInjectedProvider(): InjectedProvider | null {
  if (typeof window === 'undefined') return null;
  if (discovered.size > 0) {
    const mm = discovered.get('io.metamask') ?? discovered.get('io.metamask.flask');
    const first = mm ?? Array.from(discovered.values())[0];
    if (first) return first.provider;
  }
  const eth = window.ethereum;
  if (!eth) return null;
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    return eth.providers.find(provider => provider.isMetaMask) ?? eth.providers[0];
  }
  return eth;
}

function asWalletError(error: unknown): WalletError {
  return typeof error === 'object' && error !== null ? error as WalletError : {};
}

function describeWalletError(error: unknown): string {
  const walletError = asWalletError(error);
  const code = walletError.code ?? walletError.info?.error?.code;
  if (code === 4001 || walletError.code === 'ACTION_REJECTED') return 'Connection request was rejected in the wallet.';
  if (code === -32002) return 'A connection request is already open. Click the wallet extension icon in your browser toolbar to approve it.';
  if (code === 4100) return 'The wallet is locked. Unlock it and try again.';
  return walletError.shortMessage || walletError.message || 'Failed to connect wallet';
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

  const syncWallet = useCallback(async (ethereum: InjectedProvider): Promise<void> => {
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
  }, []);

  const connectWallet = useCallback(async (): Promise<void> => {
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

      await syncWallet(ethereum);

    } catch (error: unknown) {
      const errorMessage = describeWalletError(error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage
      }));
      addNotification({ type: 'error', title: 'Wallet connection failed', message: errorMessage });
      console.error('Wallet connection error:', error);
    }
  }, [addNotification, syncWallet]);

  const disconnectWallet = useCallback((): void => {
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
  }, []);

  const signMessage = async (message: string): Promise<string> => {
    if (!walletState.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await walletState.signer.signMessage(message);
      console.log('Message signed:', { message, signature });
      return signature;
    } catch (error: unknown) {
      const walletError = asWalletError(error);
      console.error('Message signing error:', error);
      throw new Error(walletError.message || 'Failed to sign message');
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
    } catch (error: unknown) {
      const walletError = asWalletError(error);
      // 4902: chain not added to the wallet yet
      const code = walletError.code ?? walletError.data?.originalError?.code;
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
      throw new Error(walletError.message || 'Failed to switch chain');
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
        const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
        
        if (accounts && accounts.length > 0) {
          // Auto-connect if previously connected
          await syncWallet(ethereum);
        }
      } catch (error) {
        console.warn('Auto-connect failed:', error);
      }
    };

    checkConnection();
  }, [syncWallet]);

  // Listen for account and chain changes
  useEffect(() => {
    const ethereum = getInjectedProvider();
    if (!ethereum || typeof ethereum.on !== 'function' || typeof ethereum.removeListener !== 'function') {
      return;
    }
    const addListener = ethereum.on;
    const removeListener = ethereum.removeListener;

    const handleAccountsChanged = async (value: unknown) => {
      const accounts = Array.isArray(value) ? value.filter((account): account is string => typeof account === 'string') : [];
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== walletState.address) {
        // Refresh ethers state without opening another account-access prompt.
        await syncWallet(ethereum);
      }
    };

    const handleChainChanged = (value: unknown) => {
      if (typeof value !== 'string') return;
      setWalletState(prev => ({
        ...prev,
        chainId: parseInt(value, 16)
      }));
    };

    addListener('accountsChanged', handleAccountsChanged);
    addListener('chainChanged', handleChainChanged);

    return () => {
      removeListener('accountsChanged', handleAccountsChanged);
      removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnectWallet, syncWallet, walletState.address]);

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
