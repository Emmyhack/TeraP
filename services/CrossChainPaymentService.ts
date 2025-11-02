import { ethers } from 'ethers';
import { SUPPORTED_PAYMENT_CHAINS } from '@/config/subscriptionConfig';
import { paymentServiceManager, PaymentServiceManager } from './PaymentServiceManager';
import { serviceAccessControl } from './ServiceAccessControlService';

// ERC20 ABI for token balance and transfer operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Platform destination addresses for different environments
const PLATFORM_ADDRESSES = {
  // Main platform treasury on ZetaChain
  mainnet: '0xTeraPPlatformMainnetAddress123456789012345678901', // Replace with actual
  testnet: '0xTeraPPlatformTestnetAddress123456789012345678901', // Replace with actual
};

interface PaymentRequest {
  amount: number; // USD amount
  currency: 'USDT' | 'NATIVE'; // Payment currency preference
  sourceChain: string;
  destinationAddress: string; // TeraP platform address on ZetaChain
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

export class CrossChainPaymentService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private zetaClient: any = null;
  private paymentManager: PaymentServiceManager;
  private readonly isTestnet: boolean;

  constructor(isTestnet: boolean = false) {
    this.isTestnet = isTestnet;
    this.paymentManager = paymentServiceManager;
  }

  private async initializeZetaClient() {
    try {
      // Initialize ZetaChain client for cross-chain operations
      // For now, we'll simulate cross-chain functionality
      // In production, integrate with ZetaChain SDK when available
      this.zetaClient = {
        isReady: true,
        network: 'mainnet',
      };
    } catch (error) {
      console.error('Failed to initialize ZetaChain client:', error);
    }
  }

  async initializeWallet(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  async getPaymentQuote(request: PaymentRequest): Promise<{
    nativeTokenRequired: string;
    usdtRequired: string;
    processingFee: number;
    estimatedGas: number;
    totalCostUSD: number;
  }> {
    const chain = SUPPORTED_PAYMENT_CHAINS.find(c => c.id === request.sourceChain);
    if (!chain) throw new Error('Unsupported chain');

    const processingFee = (request.amount * chain.processingFee) / 100;
    const totalCostUSD = request.amount + processingFee;

    // Get current token prices (in real implementation, fetch from price oracle)
    let tokenPrices;
    if (chain.chainId === null) {
      // Handle non-EVM chains by symbol
      tokenPrices = await this.getTokenPrices(chain.symbol);
    } else {
      // Handle EVM chains by chainId
      tokenPrices = await this.getTokenPrices(chain.chainId);
    }
    
    const nativeTokenRequired = (totalCostUSD / tokenPrices.native).toFixed(6);
    const usdtRequired = totalCostUSD.toFixed(2);

    return {
      nativeTokenRequired,
      usdtRequired,
      processingFee,
      estimatedGas: chain.gasEstimate,
      totalCostUSD,
    };
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const chain = SUPPORTED_PAYMENT_CHAINS.find(c => c.id === request.sourceChain);
      if (!chain) throw new Error('Unsupported chain');

      const quote = await this.getPaymentQuote(request);
      
      let txResult: any;

      // Handle non-EVM chains
      if (chain.chainId === null) {
        txResult = await this.processNonEvmPayment(request, chain, quote);
      } else {
        // Handle EVM chains
        if (!this.provider || !this.signer) {
          throw new Error('Wallet not initialized for EVM chain');
        }

        // Switch to the correct network
        await this.switchNetwork(chain.chainId);
        
        if (request.currency === 'USDT') {
          txResult = await this.processUSDTPayment(request, chain, quote);
        } else {
          txResult = await this.processNativeTokenPayment(request, chain, quote);
        }
      }

      // Initiate cross-chain transfer via ZetaChain
      const zetaTx = await this.initiateCrossChainTransfer(
        txResult.transactionHash,
        chain,
        request
      );

      return {
        success: true,
        transactionHash: txResult.transactionHash,
        zetaChainTxHash: zetaTx?.hash,
        gasUsed: txResult.gasUsed,
        processingFee: quote.processingFee,
      };

    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async processNonEvmPayment(
    request: PaymentRequest,
    chain: any,
    quote: any
  ): Promise<any> {
    // Simulate non-EVM blockchain payments
    // In production, integrate with respective chain SDKs
    
    console.log(`Processing ${chain.name} payment:`, {
      amount: quote.totalCostUSD,
      currency: request.currency,
      chain: chain.symbol
    });

    switch (chain.symbol) {
      case 'SOL':
        return await this.processSolanaPayment(request, quote);
        
      case 'SUI':
        return await this.processSuiPayment(request, quote);
        
      case 'TON':
        return await this.processTonPayment(request, quote);
        
      case 'SOM':
        return await this.processSomniaPayment(request, quote);
        
      default:
        throw new Error(`Unsupported non-EVM chain: ${chain.symbol}`);
    }
  }

  private async processSolanaPayment(request: PaymentRequest, quote: any): Promise<any> {
    try {
      // Real Solana payment processing using @solana/web3.js
      const connection = new (await import('@solana/web3.js')).Connection(
        'https://api.mainnet-beta.solana.com', 
        'confirmed'
      );

      // In a real implementation, this would:
      // 1. Connect to Solana wallet (Phantom, Solflare, etc.)
      // 2. Create and sign transaction
      // 3. Send transaction to Solana network
      // 4. Wait for confirmation
      
      console.log('Processing Solana payment:', {
        amount: quote.totalCostUSD,
        currency: request.currency,
        network: 'mainnet-beta'
      });

      // For now, we return a structured response that matches Solana transaction format
      // This would be replaced with actual transaction execution
      throw new Error('Solana wallet integration required. Please connect a Solana wallet to complete this payment.');
      
    } catch (error) {
      console.error('Solana payment failed:', error);
      throw new Error(`Solana payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processSuiPayment(request: PaymentRequest, quote: any): Promise<any> {
    try {
      console.log('Processing Sui payment:', {
        amount: quote.totalCostUSD,
        currency: request.currency,
        network: 'mainnet'
      });

      // Real Sui payment processing would use @mysten/sui.js
      // This would involve:
      // 1. Connect to Sui wallet
      // 2. Create transaction block
      // 3. Sign and execute transaction
      // 4. Wait for transaction confirmation
      
      throw new Error('Sui wallet integration required. Please connect a Sui wallet to complete this payment.');
      
    } catch (error) {
      console.error('Sui payment failed:', error);
      throw new Error(`Sui payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processTonPayment(request: PaymentRequest, quote: any): Promise<any> {
    try {
      console.log('Processing TON payment:', {
        amount: quote.totalCostUSD,
        currency: request.currency,
        network: 'mainnet'
      });

      // Real TON payment processing would use @ton/ton SDK
      // This would involve:
      // 1. Connect to TON wallet
      // 2. Create transaction
      // 3. Sign and send transaction
      // 4. Wait for confirmation
      
      throw new Error('TON wallet integration required. Please connect a TON wallet to complete this payment.');
      
    } catch (error) {
      console.error('TON payment failed:', error);
      throw new Error(`TON payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processSomniaPayment(request: PaymentRequest, quote: any): Promise<any> {
    // Simulate Somnia payment processing
    // In production: integrate with Somnia SDK
    
    const mockTxHash = `som_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    console.log('Somnia payment simulation:', {
      amount: quote.totalCostUSD,
      currency: request.currency,
      txHash: mockTxHash
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      transactionHash: mockTxHash,
      gasUsed: 21000,
      hash: mockTxHash,
      status: 'confirmed'
    };
  }

  private async processUSDTPayment(
    request: PaymentRequest,
    chain: any,
    quote: any
  ): Promise<any> {
    if (!this.signer) throw new Error('Signer not available');

    const usdtContract = new ethers.Contract(
      chain.usdtAddress,
      ERC20_ABI,
      this.signer
    );

    // Check USDT balance
    const userAddress = await this.signer.getAddress();
    const balance = await usdtContract.balanceOf(userAddress);
    const decimals = await usdtContract.decimals();
    const requiredAmount = ethers.parseUnits(quote.usdtRequired, decimals);

    if (balance < requiredAmount) {
      throw new Error(`Insufficient USDT balance. Required: ${quote.usdtRequired} USDT`);
    }

    // Transfer USDT to TeraP platform address
    const transferTx = await usdtContract.transfer(
      request.destinationAddress,
      requiredAmount,
      {
        gasLimit: chain.gasEstimate,
      }
    );

    const receipt = await transferTx.wait();
    
    if (!receipt) {
      throw new Error('Transaction receipt not available');
    }
    
    return {
      transactionHash: receipt.hash,
      gasUsed: receipt.gasUsed,
    };
  }

  private async processNativeTokenPayment(
    request: PaymentRequest,
    chain: any,
    quote: any
  ): Promise<any> {
    if (!this.signer) throw new Error('Signer not available');

    const userAddress = await this.signer.getAddress();
    const balance = await this.provider!.getBalance(userAddress);
    const requiredAmount = ethers.parseEther(quote.nativeTokenRequired);

    if (balance < requiredAmount) {
      throw new Error(`Insufficient ${chain.nativeToken} balance. Required: ${quote.nativeTokenRequired} ${chain.nativeToken}`);
    }

    // Send native token to TeraP platform address
    const tx = await this.signer.sendTransaction({
      to: request.destinationAddress,
      value: requiredAmount,
      gasLimit: chain.gasEstimate,
    });

    const receipt = await tx.wait();
    
    if (!receipt) {
      throw new Error('Transaction receipt not available');
    }
    
    return {
      transactionHash: receipt.hash,
      gasUsed: receipt.gasUsed,
    };
  }

  private async initiateCrossChainTransfer(
    sourceTransactionHash: string,
    sourceChain: any,
    request: PaymentRequest
  ): Promise<any> {
    try {
      if (!this.zetaClient || !this.zetaClient.isReady) {
        console.warn('ZetaChain client not available, simulating cross-chain transfer');
        
        // Simulate cross-chain transaction for demo purposes
        return {
          hash: `zeta_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          status: 'pending',
          sourceChain: sourceChain.id,
          targetChain: 'zetachain-mainnet',
          amount: request.amount,
          timestamp: new Date(),
        };
      }

      // Encode payment metadata for cross-chain message
      const paymentData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'string', 'string', 'uint256'],
        [
          request.metadata.userId,
          request.metadata.paymentType,
          sourceTransactionHash,
          Math.floor(request.amount * 100), // Convert to cents for precision
        ]
      );

      // In production, this would integrate with ZetaChain's omnichain contracts
      // For now, we simulate the cross-chain call
      console.log('Cross-chain payment data:', {
        sourceChain: sourceChain.id,
        targetChain: 'zetachain-mainnet',
        amount: request.amount,
        metadata: request.metadata,
        paymentData: paymentData.substring(0, 50) + '...',
      });

      // Simulate successful cross-chain transaction
      return {
        hash: `zeta_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        status: 'confirmed',
        sourceChain: sourceChain.id,
        targetChain: 'zetachain-mainnet',
        amount: request.amount,
        timestamp: new Date(),
        gasUsed: 150000,
      };

    } catch (error) {
      console.error('Cross-chain transfer failed:', error);
      throw error;
    }
  }

  private async switchNetwork(chainId: number | null): Promise<void> {
    // Handle non-EVM chains
    if (chainId === null) {
      console.log('Non-EVM chain detected, skipping network switch');
      return;
    }

    if (!this.provider) throw new Error('Provider not available');

    try {
      // Request to switch network
      await (this.provider as any).send('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` },
      ]);
    } catch (switchError: any) {
      // If network is not added, add it
      if (switchError.code === 4902) {
        const chain = SUPPORTED_PAYMENT_CHAINS.find(c => c.chainId === chainId);
        if (chain) {
          await this.addNetwork(chain);
        }
      } else {
        throw switchError;
      }
    }
  }

  private async addNetwork(chain: any): Promise<void> {
    if (!this.provider) throw new Error('Provider not available');

    const networkConfig = this.getNetworkConfig(chain.chainId);
    
    await (this.provider as any).send('wallet_addEthereumChain', [networkConfig]);
  }

  private getNetworkConfig(chainId: number): any {
    const configs: { [key: number]: any } = {
      1: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://etherscan.io'],
      },
      56: {
        chainId: '0x38',
        chainName: 'BNB Smart Chain',
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        nativeCurrency: { name: 'BNB Token', symbol: 'BNB', decimals: 18 },
        blockExplorerUrls: ['https://bscscan.com'],
      },
      137: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        rpcUrls: ['https://polygon-rpc.com/'],
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        blockExplorerUrls: ['https://polygonscan.com'],
      },
      42161: {
        chainId: '0xa4b1',
        chainName: 'Arbitrum One',
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://arbiscan.io'],
      },
      10: {
        chainId: '0xa',
        chainName: 'Optimism',
        rpcUrls: ['https://mainnet.optimism.io'],
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://optimistic.etherscan.io'],
      },
      8453: {
        chainId: '0x2105',
        chainName: 'Base',
        rpcUrls: ['https://mainnet.base.org'],
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://basescan.org'],
      },
      43114: {
        chainId: '0xa86a',
        chainName: 'Avalanche C-Chain',
        rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
        nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
        blockExplorerUrls: ['https://snowtrace.io'],
      },
      7000: {
        chainId: '0x1b58',
        chainName: 'ZetaChain Mainnet',
        rpcUrls: ['https://zetachain-evm.blockpi.network/v1/rpc/public'],
        nativeCurrency: { name: 'Zeta', symbol: 'ZETA', decimals: 18 },
        blockExplorerUrls: ['https://zetascan.com'],
      },
      7001: {
        chainId: '0x1b59',
        chainName: 'ZetaChain Athens Testnet',
        rpcUrls: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
        nativeCurrency: { name: 'aZeta', symbol: 'aZETA', decimals: 18 },
        blockExplorerUrls: ['https://zetachain-testnet.blockscout.com'],
      },
      1001: {
        chainId: '0x3e9',
        chainName: 'Somnia Network',
        rpcUrls: ['https://rpc.somnia.network'],
        nativeCurrency: { name: 'Somnia', symbol: 'SOM', decimals: 18 },
        blockExplorerUrls: ['https://explorer.somnia.network'],
      },
    };

    return configs[chainId] || null;
  }

  private async getTokenPrices(chainIdOrSymbol: number | string | null): Promise<{ native: number; usdt: number }> {
    try {
      // Map chainId/symbol to CoinGecko API IDs
      const coinGeckoIds: { [key: number | string]: string } = {
        1: 'ethereum', // ETH
        56: 'binancecoin', // BNB
        137: 'matic-network', // MATIC
        42161: 'ethereum', // ETH on Arbitrum
        10: 'ethereum', // ETH on Optimism
        8453: 'ethereum', // ETH on Base
        43114: 'avalanche-2', // AVAX
        7000: 'zetachain', // ZETA
        7001: 'zetachain', // aZETA testnet
        1001: 'somnia', // Somnia (if available)
        'SOL': 'solana',
        'SUI': 'sui',
        'TON': 'the-open-network',
      };

      const coinId = coinGeckoIds[chainIdOrSymbol || 'unknown'];
      
      if (!coinId) {
        console.warn(`Price not available for ${chainIdOrSymbol}, using fallback`);
        return { native: 1, usdt: 1.00 };
      }

      // Fetch real prices from CoinGecko API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId},tether&vs_currencies=usd`
      );

      if (!response.ok) {
        throw new Error(`Price API error: ${response.status}`);
      }

      const prices = await response.json();
      
      return {
        native: prices[coinId]?.usd || 1,
        usdt: prices.tether?.usd || 1.00
      };

    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      
      // Fallback to hardcoded prices if API fails
      const fallbackPrices: { [key: number | string]: { native: number; usdt: number } } = {
        1: { native: 2500, usdt: 1.00 }, // ETH
        56: { native: 600, usdt: 1.00 }, // BNB
        137: { native: 0.80, usdt: 1.00 }, // MATIC
        42161: { native: 2500, usdt: 1.00 }, // ETH on Arbitrum
        10: { native: 2500, usdt: 1.00 }, // ETH on Optimism
        8453: { native: 2500, usdt: 1.00 }, // ETH on Base
        43114: { native: 35, usdt: 1.00 }, // AVAX
        7000: { native: 0.65, usdt: 1.00 }, // ZETA
        7001: { native: 0.65, usdt: 1.00 }, // aZETA testnet
        1001: { native: 0.45, usdt: 1.00 }, // Somnia
        'SOL': { native: 180, usdt: 1.00 },
        'SUI': { native: 3.2, usdt: 1.00 },
        'TON': { native: 5.8, usdt: 1.00 },
      };

      const key = chainIdOrSymbol || 'unknown';
      return fallbackPrices[key] || { native: 1, usdt: 1.00 };
    }
  }

  async getUserBalances(userAddress: string, chainId: number | null, chainSymbol?: string): Promise<{
    native: string;
    usdt: string;
    nativeSymbol: string;
  }> {
    const chain = SUPPORTED_PAYMENT_CHAINS.find(c => 
      chainId ? c.chainId === chainId : c.symbol === chainSymbol
    );
    if (!chain) throw new Error('Unsupported chain');

    // Handle non-EVM chains with simulated balances
    if (chainId === null) {
      return this.getNonEvmBalances(userAddress, chain);
    }

    if (!this.provider) throw new Error('Provider not initialized');

    // Get native token balance
    const nativeBalance = await this.provider.getBalance(userAddress);
    const nativeFormatted = ethers.formatEther(nativeBalance);

    // Get USDT balance
    const usdtContract = new ethers.Contract(
      chain.usdtAddress,
      ERC20_ABI,
      this.provider
    );
    
    const usdtBalance = await usdtContract.balanceOf(userAddress);
    const decimals = await usdtContract.decimals();
    const usdtFormatted = ethers.formatUnits(usdtBalance, decimals);

    return {
      native: nativeFormatted,
      usdt: usdtFormatted,
      nativeSymbol: chain.nativeToken,
    };
  }

  private async getNonEvmBalances(userAddress: string, chain: any): Promise<{
    native: string;
    usdt: string;
    nativeSymbol: string;
  }> {
    // Simulate balance fetching for non-EVM chains
    // In production, integrate with respective chain SDKs
    
    switch (chain.symbol) {
      case 'SOL':
        // Simulate Solana wallet integration
        return {
          native: '5.25', // Mock SOL balance
          usdt: '1250.00', // Mock USDT balance
          nativeSymbol: 'SOL'
        };
        
      case 'SUI':
        // Simulate Sui wallet integration
        return {
          native: '125.75', // Mock SUI balance
          usdt: '890.50', // Mock USDT balance
          nativeSymbol: 'SUI'
        };
        
      case 'TON':
        // Simulate TON wallet integration
        return {
          native: '45.20', // Mock TON balance
          usdt: '750.25', // Mock USDT balance
          nativeSymbol: 'TON'
        };
        
      case 'SOM':
        // Simulate Somnia wallet integration
        return {
          native: '1000.50', // Mock SOM balance
          usdt: '500.00', // Mock USDT balance
          nativeSymbol: 'SOM'
        };
        
      default:
        return {
          native: '0.00',
          usdt: '0.00',
          nativeSymbol: chain.nativeToken
        };
    }
  }
}

// Singleton instance
export const crossChainPaymentService = new CrossChainPaymentService();