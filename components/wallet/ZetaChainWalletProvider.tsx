/**
 * ZetaChain Multi-Chain Wallet Provider Component
 * Implements wallet connection patterns from ZetaChain documentation
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

// Types based on ZetaChain documentation
interface WalletInfo {
  uuid: string;
  name: string;
  icon: string;
  provider: any;
}

interface ConnectedWallet {
  address: string;
  chainId: number;
  provider: any;
  signer?: ethers.AbstractSigner;
  balance?: string;
}

interface WalletContextType {
  wallets: WalletInfo[];
  connectedWallet: ConnectedWallet | null;
  isConnecting: boolean;
  connectWallet: (wallet: WalletInfo) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

// Supported Networks Configuration (based on ZetaChain docs)
export const SUPPORTED_NETWORKS = {
  // ZetaChain Testnet
  7001: {
    name: 'ZetaChain Athens Testnet',
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    explorerUrl: 'https://zetachain-testnet.blockscout.com',
    nativeCurrency: { name: 'ZETA', symbol: 'ZETA', decimals: 18 },
    gateway: '0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7'
  },
  // ZetaChain Mainnet
  7000: {
    name: 'ZetaChain Mainnet',
    rpcUrl: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    explorerUrl: 'https://zetascan.com',
    nativeCurrency: { name: 'ZETA', symbol: 'ZETA', decimals: 18 },
    gateway: '0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7'
  },
  // Ethereum Sepolia Testnet
  11155111: {
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    gateway: '0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7'
  },
  // Arbitrum Sepolia (commonly used in ZetaChain tutorials)
  421614: {
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    gateway: '0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7'
  },
  // Base Sepolia (from ZetaChain docs)
  84532: {
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    gateway: '0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7'
  }
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function ZetaChainWalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // EIP-6963 Wallet Discovery (from ZetaChain frontend tutorial)
  useEffect(() => {
    const discoverWallets = () => {
      const walletInfos: WalletInfo[] = [];

      // Listen for EIP-6963 announcements
      const handleAnnouncement = (event: any) => {
        const { info, provider } = event.detail;
        walletInfos.push({
          uuid: info.uuid,
          name: info.name,
          icon: info.icon,
          provider
        });
        setWallets([...walletInfos]);
      };

      window.addEventListener('eip6963:announceProvider', handleAnnouncement);

      // Request wallets to announce themselves
      window.dispatchEvent(new Event('eip6963:requestProvider'));

      // Fallback for MetaMask if no EIP-6963 support
      if (typeof window !== 'undefined' && window.ethereum && !walletInfos.length) {
        walletInfos.push({
          uuid: 'metamask-fallback',
          name: 'MetaMask',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAzMCAzMCI+PC9zdmc+',
          provider: window.ethereum
        });
        setWallets([...walletInfos]);
      }

      return () => {
        window.removeEventListener('eip6963:announceProvider', handleAnnouncement);
      };
    };

    if (typeof window !== 'undefined') {
      discoverWallets();
    }
  }, []);

  // Connect wallet function (based on ZetaChain tutorial patterns)
  const connectWallet = async (wallet: WalletInfo) => {
    if (!wallet.provider) {
      throw new Error('Wallet provider not found');
    }

    setIsConnecting(true);
    
    try {
      // Create ethers provider from wallet
      const ethersProvider = new ethers.BrowserProvider(wallet.provider);
      
      // Request account access
      await ethersProvider.send('eth_requestAccounts', []);
      
      // Get signer (as shown in ZetaChain docs)
      const signer = await ethersProvider.getSigner() as ethers.AbstractSigner;
      const address = await signer.getAddress();
      
      // Get network info
      const network = await ethersProvider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Get balance
      const balance = await ethersProvider.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);

      // Set connected wallet state
      setConnectedWallet({
        address,
        chainId,
        provider: wallet.provider,
        signer,
        balance: formattedBalance
      });

      // Listen for account changes
      wallet.provider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          // Refresh connection with new account
          connectWallet(wallet);
        }
      });

      // Listen for chain changes
      wallet.provider.on('chainChanged', (chainId: string) => {
        // Refresh connection with new chain
        connectWallet(wallet);
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setConnectedWallet(null);
    
    // Remove listeners
    if (connectedWallet?.provider) {
      connectedWallet.provider.removeAllListeners?.();
    }
  };

  // Switch network function
  const switchNetwork = async (chainId: number) => {
    if (!connectedWallet?.provider) {
      throw new Error('No wallet connected');
    }

    const network = SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS];
    if (!network) {
      throw new Error('Unsupported network');
    }

    try {
      // Try to switch to the network
      await connectedWallet.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        await connectedWallet.provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: network.name,
            rpcUrls: [network.rpcUrl],
            nativeCurrency: network.nativeCurrency,
            blockExplorerUrls: [network.explorerUrl],
          }],
        });
      } else {
        throw switchError;
      }
    }
  };

  // Refresh balance
  const refreshBalance = async () => {
    if (!connectedWallet?.signer) return;

    try {
      const provider = connectedWallet.signer.provider;
      if (!provider) return;

      const balance = await provider.getBalance(connectedWallet.address);
      const formattedBalance = ethers.formatEther(balance);

      setConnectedWallet({
        ...connectedWallet,
        balance: formattedBalance
      });
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  const value: WalletContextType = {
    wallets,
    connectedWallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use wallet context
export function useZetaChainWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useZetaChainWallet must be used within a ZetaChainWalletProvider');
  }
  return context;
}

// Helper function to check if network is supported
export function isSupportedNetwork(chainId: number): boolean {
  return chainId in SUPPORTED_NETWORKS;
}

// Helper function to get network info
export function getNetworkInfo(chainId: number) {
  return SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS];
}