/**
 * ZetaChain Cross-Chain Integration Utilities
 * Provides seamless integration with ZetaChain's omnichain infrastructure
 */

import { ethers } from 'ethers';

// ZetaChain Network Configuration
export const ZETACHAIN_NETWORKS = {
  testnet: {
    chainId: 7001,
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    gateway: '0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7',
    name: 'ZetaChain Athens Testnet'
  },
  mainnet: {
    chainId: 7000,
    rpcUrl: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    gateway: '0x3c85E0cA1001f085aC2c95C50DD0a2e5A0C0e5b7',
    name: 'ZetaChain Mainnet'
  }
};

// Connected Chain Configuration
export const CONNECTED_CHAINS = {
  ethereum: {
    testnet: { chainId: 11155111, name: 'Sepolia' },
    mainnet: { chainId: 1, name: 'Ethereum Mainnet' }
  },
  bitcoin: {
    testnet: { chainId: 18332, name: 'Bitcoin Testnet' },
    mainnet: { chainId: 18333, name: 'Bitcoin Mainnet' }
  },
  solana: {
    devnet: { chainId: 90001, name: 'Solana Devnet' },
    mainnet: { chainId: 90002, name: 'Solana Mainnet' }
  },
  sui: {
    testnet: { chainId: 'sui:testnet', name: 'Sui Testnet' },
    mainnet: { chainId: 'sui:mainnet', name: 'Sui Mainnet' }
  },
  ton: {
    testnet: { chainId: 'ton:testnet', name: 'TON Testnet' },
    mainnet: { chainId: 'ton:mainnet', name: 'TON Mainnet' }
  }
};

/**
 * ZetaChain Cross-Chain Service
 */
export class ZetaChainService {
  private provider: ethers.Provider;
  private network: 'testnet' | 'mainnet';
  
  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.network = network;
    this.provider = new ethers.JsonRpcProvider(ZETACHAIN_NETWORKS[network].rpcUrl);
  }

  /**
   * Get ZetaChain network configuration
   */
  getNetworkConfig() {
    return ZETACHAIN_NETWORKS[this.network];
  }

  /**
   * Create cross-chain message for therapy session booking
   */
  async createBookingMessage(
    therapistAddress: string,
    sessionType: string,
    amount: string,
    sourceChain: string
  ) {
    const messageData = {
      functionName: 'bookSession',
      params: {
        therapistAddress,
        sessionType,
        amount,
        sourceChain,
        timestamp: Date.now()
      }
    };

    return this.encodeMessage(messageData);
  }

  /**
   * Create cross-chain message for therapist registration
   */
  async createTherapistRegistrationMessage(
    name: string,
    credentials: string,
    hourlyRate: string,
    sourceChain: string
  ) {
    const messageData = {
      functionName: 'registerTherapist',
      params: {
        name,
        credentials,
        hourlyRate,
        sourceChain,
        timestamp: Date.now()
      }
    };

    return this.encodeMessage(messageData);
  }

  /**
   * Create cross-chain message for DAO proposal
   */
  async createDAOProposalMessage(
    title: string,
    description: string,
    votingPeriod: number,
    sourceChain: string
  ) {
    const messageData = {
      functionName: 'createProposal',
      params: {
        title,
        description,
        votingPeriod,
        sourceChain,
        timestamp: Date.now()
      }
    };

    return this.encodeMessage(messageData);
  }

  /**
   * Encode message for cross-chain transmission
   */
  private encodeMessage(messageData: any): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(messageData));
    return ethers.hexlify(data);
  }

  /**
   * Decode cross-chain message
   */
  decodeMessage(encodedData: string): any {
    const data = ethers.getBytes(encodedData);
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(data));
  }

  /**
   * Query cross-chain transaction status
   */
  async queryCCTX(txHash: string) {
    try {
      const response = await fetch(
        `https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/cctx/${txHash}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error querying CCTX:', error);
      throw error;
    }
  }

  /**
   * Get supported chains for cross-chain operations
   */
  getSupportedChains() {
    return Object.keys(CONNECTED_CHAINS);
  }

  /**
   * Get chain-specific configuration
   */
  getChainConfig(chain: string, network: 'testnet' | 'mainnet' | 'devnet' = 'testnet') {
    const chainConfig = CONNECTED_CHAINS[chain as keyof typeof CONNECTED_CHAINS];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    // Handle Solana's devnet vs testnet naming
    const networkKey = chain === 'solana' && network === 'testnet' ? 'devnet' : network;
    const config = chainConfig[networkKey as keyof typeof chainConfig];
    
    // Fallback to testnet if network not found, or devnet for Solana
    if (!config) {
      const fallbackKey = chain === 'solana' ? 'devnet' : 'testnet';
      return chainConfig[fallbackKey as keyof typeof chainConfig];
    }
    
    return config;
  }
}

/**
 * Cross-Chain Event Emitter for real-time updates
 */
export class CrossChainEventEmitter {
  private eventSource: EventSource | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  /**
   * Subscribe to cross-chain events
   */
  subscribe(eventType: string, callback: Function) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType)!.push(callback);
  }

  /**
   * Start listening for cross-chain events
   */
  startListening(cctxHash?: string) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = cctxHash 
      ? `https://api.zetachain.com/events?cctx=${cctxHash}`
      : 'https://api.zetachain.com/events';

    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.payload);
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
    };
  }

  /**
   * Emit event to subscribers
   */
  private emit(eventType: string, payload: any) {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(payload));
    }
  }

  /**
   * Stop listening for events
   */
  stopListening() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

/**
 * Multi-Chain Wallet Integration
 */
export class MultiChainWallet {
  private connectedWallets: Map<string, any> = new Map();

  /**
   * Connect to a specific chain wallet
   */
  async connectWallet(chain: 'ethereum' | 'solana' | 'sui' | 'ton' | 'bitcoin') {
    try {
      switch (chain) {
        case 'ethereum':
          return await this.connectEthereum();
        case 'solana':
          return await this.connectSolana();
        case 'sui':
          return await this.connectSui();
        case 'ton':
          return await this.connectTON();
        case 'bitcoin':
          return await this.connectBitcoin();
        default:
          throw new Error(`Unsupported chain: ${chain}`);
      }
    } catch (error) {
      console.error(`Error connecting to ${chain}:`, error);
      throw error;
    }
  }

  private async connectEthereum() {
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      this.connectedWallets.set('ethereum', { provider, signer, address });
      return { address, chain: 'ethereum' };
    }
    throw new Error('Ethereum wallet not found');
  }

  private async connectSolana() {
    if (typeof window !== 'undefined' && window.solana) {
      const response = await window.solana.connect();
      this.connectedWallets.set('solana', window.solana);
      return { address: response.publicKey.toString(), chain: 'solana' };
    }
    throw new Error('Solana wallet not found');
  }

  private async connectSui() {
    // Placeholder for Sui wallet connection
    throw new Error('Sui wallet integration not implemented');
  }

  private async connectTON() {
    // Placeholder for TON wallet connection  
    throw new Error('TON wallet integration not implemented');
  }

  private async connectBitcoin() {
    // Placeholder for Bitcoin wallet connection
    throw new Error('Bitcoin wallet integration not implemented');
  }

  /**
   * Get connected wallet for a specific chain
   */
  getWallet(chain: string) {
    return this.connectedWallets.get(chain);
  }

  /**
   * Get all connected wallets
   */
  getConnectedChains() {
    return Array.from(this.connectedWallets.keys());
  }
}

/**
 * Utility Functions for ZetaChain Integration
 */
export const ZetaChainUtils = {
  /**
   * Format cross-chain transaction for display
   */
  formatCCTX(cctx: any) {
    return {
      hash: cctx.index,
      status: cctx.cctx_status?.status || 'pending',
      sourceChain: cctx.inbound_tx_params?.sender_chain_id,
      destinationChain: cctx.outbound_tx_params?.[0]?.receiver_chainId,
      amount: cctx.inbound_tx_params?.amount,
      timestamp: new Date(cctx.created_timestamp).toLocaleString()
    };
  },

  /**
   * Calculate cross-chain fees
   */
  async calculateFees(sourceChain: string, destinationChain: string, amount: string) {
    try {
      const response = await fetch(
        `https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/gasPrice/${sourceChain}`
      );
      const data = await response.json();
      return data.gasPrice;
    } catch (error) {
      console.error('Error calculating fees:', error);
      return '0';
    }
  },

  /**
   * Validate cross-chain address format
   */
  validateAddress(address: string, chain: string): boolean {
    switch (chain) {
      case 'ethereum':
        return ethers.isAddress(address);
      case 'bitcoin':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
      case 'solana':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      default:
        return true; // Basic validation for other chains
    }
  }
};

// Export default instance
export const zetaChainService = new ZetaChainService();
export const crossChainEvents = new CrossChainEventEmitter();
export const multiChainWallet = new MultiChainWallet();