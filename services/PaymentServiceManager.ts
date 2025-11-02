import { ethers } from 'ethers';
import { SUPPORTED_PAYMENT_CHAINS } from '@/config/subscriptionConfig';

// Real blockchain RPC configurations
const BLOCKCHAIN_CONFIGS = {
  // Ethereum Mainnet
  1: {
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    chainId: 1,
    name: 'Ethereum Mainnet',
    blockExplorer: 'https://etherscan.io',
  },
  // BNB Smart Chain
  56: {
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    chainId: 56,
    name: 'BNB Smart Chain',
    blockExplorer: 'https://bscscan.com',
  },
  // Polygon
  137: {
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    name: 'Polygon',
    blockExplorer: 'https://polygonscan.com',
  },
  // Arbitrum One
  42161: {
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    name: 'Arbitrum One',
    blockExplorer: 'https://arbiscan.io',
  },
  // Optimism
  10: {
    rpcUrl: 'https://mainnet.optimism.io',
    chainId: 10,
    name: 'Optimism',
    blockExplorer: 'https://optimistic.etherscan.io',
  },
  // Base
  8453: {
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453,
    name: 'Base',
    blockExplorer: 'https://basescan.org',
  },
  // Avalanche C-Chain
  43114: {
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
    name: 'Avalanche C-Chain',
    blockExplorer: 'https://snowtrace.io',
  },
  // ZetaChain Mainnet
  7000: {
    rpcUrl: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    chainId: 7000,
    name: 'ZetaChain Mainnet',
    blockExplorer: 'https://zetascan.com',
  },
  // ZetaChain Athens Testnet
  7001: {
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    chainId: 7001,
    name: 'ZetaChain Athens',
    blockExplorer: 'https://zetachain-testnet.blockscout.com',
  },
  // Somnia Network
  1001: {
    rpcUrl: 'https://rpc.somnia.network',
    chainId: 1001,
    name: 'Somnia Network',
    blockExplorer: 'https://explorer.somnia.network',
  },
};

// TeraPCore contract configuration
const TERAP_CORE_CONFIG = {
  // Main deployment on ZetaChain
  7000: {
    address: '0x1234567890123456789012345678901234567890', // Replace with actual address
    abi: [
      'function calculateSessionCost(address therapist, uint256 duration) view returns (uint256)',
      'function bookSession(address therapist, uint256 duration, string encryptedNotes) external',
      'function completeSession(uint256 sessionId, uint8 rating) external',
      'function subscribe(uint256 tierId, uint256 duration) external payable',
      'function getSubscriptionStatus(address user) view returns (bool active, uint256 endTime, uint256 tierId)',
      'function processPayment(address user, uint256 amount, bytes calldata data) external',
    ],
  },
  // Testnet deployment
  7001: {
    address: '0x9876543210987654321098765432109876543210', // Replace with actual testnet address
    abi: [
      'function calculateSessionCost(address therapist, uint256 duration) view returns (uint256)',
      'function bookSession(address therapist, uint256 duration, string encryptedNotes) external',
      'function completeSession(uint256 sessionId, uint8 rating) external',
      'function subscribe(uint256 tierId, uint256 duration) external payable',
      'function getSubscriptionStatus(address user) view returns (bool active, uint256 endTime, uint256 tierId)',
      'function processPayment(address user, uint256 amount, bytes calldata data) external',
    ],
  },
};

// ERC20 ABI for token operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

interface PaymentRequest {
  amount: number; // USD amount
  currency: 'USDT' | 'NATIVE';
  sourceChain: string;
  destinationAddress: string;
  metadata: {
    subscriptionTierId?: string;
    sessionId?: string;
    userId: string;
    paymentType: 'subscription' | 'emergency_session' | 'session_topup';
    billingCycle?: 'monthly' | 'yearly';
  };
}

interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  zetaChainTxHash?: string;
  error?: string;
  gasUsed?: number;
  processingFee?: number;
  confirmations?: number;
  blockNumber?: number;
}

interface ChainProvider {
  provider: ethers.Provider;
  signer?: ethers.Signer;
  chainId: number;
}

export class PaymentServiceManager {
  private chainProviders: Map<number, ChainProvider> = new Map();
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    Object.entries(BLOCKCHAIN_CONFIGS).forEach(([chainIdStr, config]) => {
      const chainId = parseInt(chainIdStr);
      try {
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.chainProviders.set(chainId, {
          provider,
          chainId,
        });
        console.log(`Initialized provider for ${config.name}`);
      } catch (error) {
        console.error(`Failed to initialize provider for chain ${chainId}:`, error);
      }
    });
  }

  async initializeWallet(chainId: number, signer: ethers.Signer) {
    const providerData = this.chainProviders.get(chainId);
    if (!providerData) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Connect signer to the provider
    const connectedSigner = signer.connect(providerData.provider);
    this.chainProviders.set(chainId, {
      ...providerData,
      signer: connectedSigner,
    });

    console.log(`Wallet initialized for chain ${chainId}`);
  }

  async getCurrentTokenPrices(): Promise<Record<string, number>> {
    try {
      // Use CoinGecko API for real token prices
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin,matic-network,arbitrum,optimism,base,avalanche-2,zetachain,solana,sui,the-open-network&vs_currencies=usd'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch token prices');
      }

      const prices = await response.json();
      
      // Map CoinGecko IDs to our token symbols
      const tokenPriceMap = {
        'ETH': prices.ethereum?.usd || 2500,
        'BNB': prices.binancecoin?.usd || 600,
        'MATIC': prices['matic-network']?.usd || 0.80,
        'ARB': prices.arbitrum?.usd || 1.20,
        'OP': prices.optimism?.usd || 2.50,
        'BASE': prices.ethereum?.usd || 2500, // Base uses ETH
        'AVAX': prices['avalanche-2']?.usd || 35,
        'ZETA': prices.zetachain?.usd || 0.65,
        'SOL': prices.solana?.usd || 180,
        'SUI': prices.sui?.usd || 3.2,
        'TON': prices['the-open-network']?.usd || 5.8,
        'SOM': 0.45, // Somnia price (mock for now)
        'USDT': 1.00,
      };

      // Cache the prices
      const timestamp = Date.now();
      Object.entries(tokenPriceMap).forEach(([symbol, price]) => {
        this.priceCache.set(symbol, { price, timestamp });
      });

      return tokenPriceMap;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      
      // Return cached prices or fallback prices
      return this.getFallbackPrices();
    }
  }

  private getFallbackPrices(): Record<string, number> {
    const fallbackPrices = {
      'ETH': 2500,
      'BNB': 600,
      'MATIC': 0.80,
      'ARB': 1.20,
      'OP': 2.50,
      'BASE': 2500,
      'AVAX': 35,
      'ZETA': 0.65,
      'SOL': 180,
      'SUI': 3.2,
      'TON': 5.8,
      'SOM': 0.45,
      'USDT': 1.00,
    };

    // Check cache first
    const cachedPrices: Record<string, number> = {};
    let foundCached = false;

    Object.keys(fallbackPrices).forEach(symbol => {
      const cached = this.priceCache.get(symbol);
      if (cached && (Date.now() - cached.timestamp) < this.PRICE_CACHE_DURATION) {
        cachedPrices[symbol] = cached.price;
        foundCached = true;
      }
    });

    return foundCached ? { ...fallbackPrices, ...cachedPrices } : fallbackPrices;
  }

  async getPaymentQuote(request: PaymentRequest): Promise<{
    nativeTokenRequired: string;
    usdtRequired: string;
    processingFee: number;
    estimatedGas: number;
    totalCostUSD: number;
    gasEstimateUSD: number;
  }> {
    const chain = SUPPORTED_PAYMENT_CHAINS.find(c => c.id === request.sourceChain);
    if (!chain) throw new Error('Unsupported chain');

    const processingFee = (request.amount * chain.processingFee) / 100;
    const totalCostUSD = request.amount + processingFee;

    // Get current token prices
    const tokenPrices = await this.getCurrentTokenPrices();
    
    const nativeTokenSymbol = chain.nativeToken;
    const nativeTokenPrice = tokenPrices[nativeTokenSymbol] || 1;
    
    const nativeTokenRequired = (totalCostUSD / nativeTokenPrice).toFixed(6);
    const usdtRequired = totalCostUSD.toFixed(2);

    // Get gas estimate in USD
    let gasEstimateUSD = 0;
    if (chain.chainId) {
      const providerData = this.chainProviders.get(chain.chainId);
      if (providerData) {
        try {
          const gasPrice = await providerData.provider.getFeeData();
          const gasCostWei = (gasPrice.gasPrice || BigInt(20000000000)) * BigInt(chain.gasEstimate);
          const gasCostEth = parseFloat(ethers.formatEther(gasCostWei));
          gasEstimateUSD = gasCostEth * nativeTokenPrice;
        } catch (error) {
          console.warn('Failed to get gas estimate:', error);
          gasEstimateUSD = 5; // Fallback gas estimate in USD
        }
      }
    }

    return {
      nativeTokenRequired,
      usdtRequired,
      processingFee,
      estimatedGas: chain.gasEstimate,
      totalCostUSD,
      gasEstimateUSD,
    };
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const chain = SUPPORTED_PAYMENT_CHAINS.find(c => c.id === request.sourceChain);
      if (!chain) throw new Error('Unsupported chain');

      const quote = await this.getPaymentQuote(request);
      
      let txResult: any;

      // Handle non-EVM chains (use external SDKs/APIs)
      if (chain.chainId === null) {
        txResult = await this.processNonEvmPayment(request, chain, quote);
      } else {
        // Handle EVM chains
        const providerData = this.chainProviders.get(chain.chainId);
        if (!providerData || !providerData.signer) {
          throw new Error('Wallet not initialized for EVM chain');
        }

        if (request.currency === 'USDT') {
          txResult = await this.processUSDTPayment(request, chain, quote, providerData);
        } else {
          txResult = await this.processNativeTokenPayment(request, chain, quote, providerData);
        }
      }

      // Verify transaction on blockchain
      const verified = await this.verifyTransaction(txResult.transactionHash, chain.chainId);
      if (!verified) {
        throw new Error('Transaction verification failed');
      }

      // Process cross-chain settlement if needed
      let zetaChainTxHash: string | undefined;
      if (chain.chainId !== 7000) { // If not already on ZetaChain
        zetaChainTxHash = await this.processCrossChainSettlement(
          txResult.transactionHash,
          chain,
          request
        );
      }

      // Update subscription/service status
      await this.updateServiceStatus(request, txResult.transactionHash);

      return {
        success: true,
        transactionHash: txResult.transactionHash,
        zetaChainTxHash,
        gasUsed: txResult.gasUsed,
        processingFee: quote.processingFee,
        confirmations: txResult.confirmations || 0,
        blockNumber: txResult.blockNumber,
      };

    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async processUSDTPayment(
    request: PaymentRequest,
    chain: any,
    quote: any,
    providerData: ChainProvider
  ): Promise<any> {
    if (!providerData.signer) throw new Error('Signer not available');

    const usdtContract = new ethers.Contract(
      chain.usdtAddress,
      ERC20_ABI,
      providerData.signer
    );

    // Check USDT balance
    const userAddress = await providerData.signer.getAddress();
    const balance = await usdtContract.balanceOf(userAddress);
    const decimals = await usdtContract.decimals();
    const requiredAmount = ethers.parseUnits(quote.usdtRequired, decimals);

    if (balance < requiredAmount) {
      throw new Error(`Insufficient USDT balance. Required: ${quote.usdtRequired} USDT`);
    }

    // Get current gas price
    const feeData = await providerData.provider.getFeeData();
    
    // Transfer USDT to TeraP platform address
    const transferTx = await usdtContract.transfer(
      request.destinationAddress,
      requiredAmount,
      {
        gasLimit: chain.gasEstimate,
        gasPrice: feeData.gasPrice,
      }
    );

    console.log(`USDT payment initiated: ${transferTx.hash}`);

    // Wait for confirmation
    const receipt = await transferTx.wait();
    
    if (!receipt) {
      throw new Error('Transaction receipt not available');
    }

    return {
      transactionHash: receipt.hash,
      gasUsed: Number(receipt.gasUsed),
      confirmations: receipt.confirmations,
      blockNumber: receipt.blockNumber,
    };
  }

  private async processNativeTokenPayment(
    request: PaymentRequest,
    chain: any,
    quote: any,
    providerData: ChainProvider
  ): Promise<any> {
    if (!providerData.signer) throw new Error('Signer not available');

    const userAddress = await providerData.signer.getAddress();
    const balance = await providerData.provider.getBalance(userAddress);
    const requiredAmount = ethers.parseEther(quote.nativeTokenRequired);

    if (balance < requiredAmount) {
      throw new Error(`Insufficient ${chain.nativeToken} balance. Required: ${quote.nativeTokenRequired} ${chain.nativeToken}`);
    }

    // Get current gas price
    const feeData = await providerData.provider.getFeeData();

    // Send native token to TeraP platform address
    const tx = await providerData.signer.sendTransaction({
      to: request.destinationAddress,
      value: requiredAmount,
      gasLimit: chain.gasEstimate,
      gasPrice: feeData.gasPrice,
    });

    console.log(`Native token payment initiated: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (!receipt) {
      throw new Error('Transaction receipt not available');
    }

    return {
      transactionHash: receipt.hash,
      gasUsed: Number(receipt.gasUsed),
      confirmations: receipt.confirmations,
      blockNumber: receipt.blockNumber,
    };
  }

  private async processNonEvmPayment(
    request: PaymentRequest,
    chain: any,
    quote: any
  ): Promise<any> {
    // For now, we'll use mock implementations for non-EVM chains
    // In production, integrate with specific chain SDKs
    
    console.log(`Processing ${chain.name} payment:`, {
      amount: quote.totalCostUSD,
      currency: request.currency,
      chain: chain.symbol
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockTxHash = `${chain.symbol.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    return {
      transactionHash: mockTxHash,
      gasUsed: chain.gasEstimate,
      confirmations: 1,
      blockNumber: Math.floor(Math.random() * 1000000),
    };
  }

  private async verifyTransaction(txHash: string, chainId: number | null): Promise<boolean> {
    if (!chainId) {
      // For non-EVM chains, implement specific verification logic
      console.log(`Verification skipped for non-EVM transaction: ${txHash}`);
      return true; // Mock verification for now
    }

    const providerData = this.chainProviders.get(chainId);
    if (!providerData) {
      console.warn(`No provider available for chain ${chainId}`);
      return false;
    }

    try {
      const receipt = await providerData.provider.getTransactionReceipt(txHash);
      return receipt !== null && receipt.status === 1;
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return false;
    }
  }

  private async processCrossChainSettlement(
    sourceTransactionHash: string,
    sourceChain: any,
    request: PaymentRequest
  ): Promise<string> {
    // This would integrate with ZetaChain's omnichain contracts
    // For now, we'll simulate the cross-chain settlement
    
    console.log('Processing cross-chain settlement:', {
      sourceChain: sourceChain.id,
      targetChain: 'zetachain-mainnet',
      amount: request.amount,
      metadata: request.metadata,
    });

    // Simulate cross-chain transaction hash
    const zetaTxHash = `zeta_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    return zetaTxHash;
  }

  private async updateServiceStatus(request: PaymentRequest, txHash: string): Promise<void> {
    // Update local storage for now (in production, this would be API calls)
    const paymentRecord = {
      id: `payment_${Date.now()}`,
      transactionHash: txHash,
      userId: request.metadata.userId,
      amount: request.amount,
      paymentType: request.metadata.paymentType,
      subscriptionTierId: request.metadata.subscriptionTierId,
      timestamp: new Date().toISOString(),
      status: 'confirmed',
    };

    // Store payment record
    const payments = JSON.parse(localStorage.getItem('terap_payments') || '[]');
    payments.push(paymentRecord);
    localStorage.setItem('terap_payments', JSON.stringify(payments));

    // Update subscription status if applicable
    if (request.metadata.paymentType === 'subscription' && request.metadata.subscriptionTierId) {
      await this.activateSubscription(request.metadata.userId, request.metadata.subscriptionTierId, txHash);
    }

    console.log('Service status updated:', paymentRecord);
  }

  private async activateSubscription(userId: string, tierId: string, txHash: string): Promise<void> {
    const subscriptions = JSON.parse(localStorage.getItem(`subscriptions_${userId}`) || '[]');
    
    // Find and activate the pending subscription
    const updatedSubscriptions = subscriptions.map((sub: any) => {
      if (sub.tierId === tierId && sub.status === 'pending') {
        return {
          ...sub,
          status: 'active',
          transactionHash: txHash,
          activatedAt: new Date().toISOString(),
        };
      }
      return sub;
    });

    localStorage.setItem(`subscriptions_${userId}`, JSON.stringify(updatedSubscriptions));
    console.log(`Subscription ${tierId} activated for user ${userId}`);
  }

  async getUserBalances(userAddress: string, chainId: number): Promise<{
    native: string;
    usdt: string;
    nativeSymbol: string;
  }> {
    const chain = SUPPORTED_PAYMENT_CHAINS.find(c => c.chainId === chainId);
    if (!chain) throw new Error('Unsupported chain');

    const providerData = this.chainProviders.get(chainId);
    if (!providerData) throw new Error('Provider not initialized');

    try {
      // Get native token balance
      const nativeBalance = await providerData.provider.getBalance(userAddress);
      const nativeFormatted = ethers.formatEther(nativeBalance);

      // Get USDT balance
      const usdtContract = new ethers.Contract(
        chain.usdtAddress,
        ERC20_ABI,
        providerData.provider
      );
      
      const usdtBalance = await usdtContract.balanceOf(userAddress);
      const decimals = await usdtContract.decimals();
      const usdtFormatted = ethers.formatUnits(usdtBalance, decimals);

      return {
        native: nativeFormatted,
        usdt: usdtFormatted,
        nativeSymbol: chain.nativeToken,
      };
    } catch (error) {
      console.error('Error fetching balances:', error);
      return {
        native: '0.00',
        usdt: '0.00',
        nativeSymbol: chain.nativeToken,
      };
    }
  }

  async getTransactionStatus(txHash: string, chainId: number): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations: number;
    blockNumber?: number;
  }> {
    const providerData = this.chainProviders.get(chainId);
    if (!providerData) throw new Error('Provider not initialized');

    try {
      const receipt = await providerData.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { status: 'pending', confirmations: 0 };
      }

      const currentBlock = await providerData.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Error fetching transaction status:', error);
      return { status: 'failed', confirmations: 0 };
    }
  }
}

// Singleton instance
export const paymentServiceManager = new PaymentServiceManager();