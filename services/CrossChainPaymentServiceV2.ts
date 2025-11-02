import { ethers } from 'ethers';
import { SUPPORTED_PAYMENT_CHAINS } from '@/config/subscriptionConfig';
import { paymentServiceManager } from './PaymentServiceManager';
import { serviceAccessControl } from './ServiceAccessControlService';

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

/**
 * Enhanced CrossChainPaymentService that integrates with real payment processing
 * and service access control
 */
export class CrossChainPaymentService {
  private readonly isTestnet: boolean;

  constructor(isTestnet: boolean = false) {
    this.isTestnet = isTestnet;
  }

  /**
   * Initialize wallet for a specific chain
   */
  async initializeWallet(chainId: number, signer: ethers.Signer) {
    await paymentServiceManager.initializeWallet(chainId, signer);
  }

  /**
   * Get payment quote with real-time pricing
   */
  async getPaymentQuote(request: PaymentRequest): Promise<{
    nativeTokenRequired: string;
    usdtRequired: string;
    processingFee: number;
    estimatedGas: number;
    totalCostUSD: number;
    gasEstimateUSD: number;
  }> {
    // Set appropriate destination address
    const destinationAddress = this.isTestnet ? PLATFORM_ADDRESSES.testnet : PLATFORM_ADDRESSES.mainnet;
    const enrichedRequest = {
      ...request,
      destinationAddress,
    };

    return await paymentServiceManager.getPaymentQuote(enrichedRequest);
  }

  /**
   * Process payment with full service integration
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Pre-payment validation
      await this.validatePaymentRequest(request);

      // Set appropriate destination address
      const destinationAddress = this.isTestnet ? PLATFORM_ADDRESSES.testnet : PLATFORM_ADDRESSES.mainnet;
      const enrichedRequest = {
        ...request,
        destinationAddress,
      };

      // Process the payment through PaymentServiceManager
      const paymentResult = await paymentServiceManager.processPayment(enrichedRequest);
      
      if (!paymentResult.success) {
        return paymentResult;
      }

      // Verify the payment on blockchain
      const chain = SUPPORTED_PAYMENT_CHAINS.find(c => c.id === request.sourceChain);
      if (chain?.chainId && paymentResult.transactionHash) {
        const verification = await serviceAccessControl.verifyPayment(
          paymentResult.transactionHash,
          request.metadata.userId,
          request.amount,
          chain.chainId
        );

        if (!verification.isValid) {
          return {
            success: false,
            error: 'Payment verification failed',
            transactionHash: paymentResult.transactionHash,
          };
        }
      }

      // Activate services based on payment type
      await this.activateServices(request, paymentResult.transactionHash!);

      // Update service access
      await serviceAccessControl.refreshServiceAccess(
        request.metadata.userId,
        chain?.chainId || 7000
      );

      return paymentResult;

    } catch (error) {
      console.error('Enhanced payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Check if user can make a payment for a specific service
   */
  async canMakePayment(
    userAddress: string,
    amount: number,
    sourceChain: string,
    currency: 'USDT' | 'NATIVE'
  ): Promise<{ canPay: boolean; reason?: string; insufficientBalance?: boolean }> {
    try {
      const chain = SUPPORTED_PAYMENT_CHAINS.find(c => c.id === sourceChain);
      if (!chain) {
        return { canPay: false, reason: 'Unsupported chain' };
      }

      // Check balances if it's an EVM chain
      if (chain.chainId !== null) {
        const balances = await paymentServiceManager.getUserBalances(userAddress, chain.chainId);
        
        const quote = await this.getPaymentQuote({
          amount,
          currency,
          sourceChain,
          destinationAddress: '', // Will be set in processing
          metadata: {
            userId: userAddress,
            paymentType: 'subscription',
          },
        });

        const requiredAmount = currency === 'USDT' 
          ? parseFloat(quote.usdtRequired)
          : parseFloat(quote.nativeTokenRequired);
        
        const availableBalance = currency === 'USDT' 
          ? parseFloat(balances.usdt)
          : parseFloat(balances.native);

        if (availableBalance < requiredAmount) {
          return {
            canPay: false,
            reason: `Insufficient ${currency} balance. Required: ${requiredAmount}, Available: ${availableBalance}`,
            insufficientBalance: true,
          };
        }
      }

      return { canPay: true };

    } catch (error) {
      console.error('Error checking payment capability:', error);
      return {
        canPay: false,
        reason: 'Failed to verify payment capability',
      };
    }
  }

  /**
   * Get transaction status across chains
   */
  async getTransactionStatus(txHash: string, chainId: number): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations: number;
    blockNumber?: number;
  }> {
    return await paymentServiceManager.getTransactionStatus(txHash, chainId);
  }

  /**
   * Get user balances for payment planning
   */
  async getUserBalances(userAddress: string, chainId: number): Promise<{
    native: string;
    usdt: string;
    nativeSymbol: string;
  }> {
    return await paymentServiceManager.getUserBalances(userAddress, chainId);
  }

  /**
   * Process subscription payment with service activation
   */
  async processSubscriptionPayment(
    tierId: string,
    billingCycle: 'monthly' | 'yearly',
    userAddress: string,
    sourceChain: string,
    currency: 'USDT' | 'NATIVE'
  ): Promise<PaymentResult> {
    const { SUBSCRIPTION_TIERS } = await import('@/config/subscriptionConfig');
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
    
    if (!tier) {
      return {
        success: false,
        error: 'Invalid subscription tier',
      };
    }

    const amount = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;

    return await this.processPayment({
      amount,
      currency,
      sourceChain,
      destinationAddress: '', // Will be set in processing
      metadata: {
        subscriptionTierId: tierId,
        userId: userAddress,
        paymentType: 'subscription',
        billingCycle,
      },
    });
  }

  /**
   * Process session top-up payment
   */
  async processSessionTopUp(
    minutes: number,
    isEmergency: boolean,
    userAddress: string,
    sourceChain: string,
    currency: 'USDT' | 'NATIVE'
  ): Promise<PaymentResult> {
    // Calculate cost: $2.99 per minute normal, $4.99 emergency
    const rate = isEmergency ? 4.99 : 2.99;
    const amount = minutes * rate;

    return await this.processPayment({
      amount,
      currency,
      sourceChain,
      destinationAddress: '', // Will be set in processing
      metadata: {
        userId: userAddress,
        paymentType: 'session_topup',
      },
    });
  }

  private async validatePaymentRequest(request: PaymentRequest): Promise<void> {
    // Validate amount
    if (request.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Validate chain
    const chain = SUPPORTED_PAYMENT_CHAINS.find(c => c.id === request.sourceChain);
    if (!chain) {
      throw new Error('Unsupported payment chain');
    }

    // Validate user access if it's a service payment
    if (request.metadata.paymentType !== 'subscription') {
      const serviceAccess = await serviceAccessControl.checkServiceAccess(request.metadata.userId);
      if (!serviceAccess.hasAccess) {
        throw new Error('No active subscription for service payment');
      }
    }
  }

  private async activateServices(request: PaymentRequest, transactionHash: string): Promise<void> {
    switch (request.metadata.paymentType) {
      case 'subscription':
        await this.activateSubscription(request, transactionHash);
        break;
      case 'session_topup':
        await this.addSessionMinutes(request, transactionHash);
        break;
      case 'emergency_session':
        await this.authorizeEmergencySession(request, transactionHash);
        break;
    }
  }

  private async activateSubscription(request: PaymentRequest, transactionHash: string): Promise<void> {
    if (!request.metadata.subscriptionTierId) return;

    // This would typically call a backend API
    // For now, update localStorage
    const subscriptions = JSON.parse(localStorage.getItem(`subscriptions_${request.metadata.userId}`) || '[]');
    
    // Deactivate existing subscriptions
    const updatedSubscriptions = subscriptions.map((sub: any) => ({
      ...sub,
      status: sub.status === 'active' ? 'cancelled' : sub.status,
    }));

    // Add new subscription
    const { SUBSCRIPTION_TIERS } = await import('@/config/subscriptionConfig');
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === request.metadata.subscriptionTierId);
    
    if (tier) {
      const startDate = new Date();
      const endDate = new Date();
      
      if (request.metadata.billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      updatedSubscriptions.push({
        id: `sub_${Date.now()}`,
        userId: request.metadata.userId,
        tierId: request.metadata.subscriptionTierId,
        tier: tier,
        status: 'active',
        startDate,
        endDate,
        paymentChain: request.sourceChain,
        transactionHash,
        usedMinutes: 0,
        remainingMinutes: tier.benefits.sessionMinutesPerMonth,
        autoRenewal: true,
        activatedAt: new Date().toISOString(),
      });
    }

    localStorage.setItem(`subscriptions_${request.metadata.userId}`, JSON.stringify(updatedSubscriptions));
  }

  private async addSessionMinutes(request: PaymentRequest, transactionHash: string): Promise<void> {
    // Calculate minutes purchased (reverse calculation from amount)
    const rate = 2.99; // Standard rate
    const minutesPurchased = Math.floor(request.amount / rate);

    // Update user's available minutes
    const subscriptions = JSON.parse(localStorage.getItem(`subscriptions_${request.metadata.userId}`) || '[]');
    const activeSubscription = subscriptions.find((sub: any) => 
      sub.status === 'active' && new Date(sub.endDate) > new Date()
    );

    if (activeSubscription) {
      activeSubscription.remainingMinutes = (activeSubscription.remainingMinutes || 0) + minutesPurchased;
      
      const updatedSubscriptions = subscriptions.map((sub: any) =>
        sub.id === activeSubscription.id ? activeSubscription : sub
      );
      
      localStorage.setItem(`subscriptions_${request.metadata.userId}`, JSON.stringify(updatedSubscriptions));
    }

    // Log top-up transaction
    const topUps = JSON.parse(localStorage.getItem(`topups_${request.metadata.userId}`) || '[]');
    topUps.push({
      transactionHash,
      amount: request.amount,
      minutesPurchased,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(`topups_${request.metadata.userId}`, JSON.stringify(topUps));
  }

  private async authorizeEmergencySession(request: PaymentRequest, transactionHash: string): Promise<void> {
    // Log emergency session authorization
    const emergencyAuth = {
      transactionHash,
      userId: request.metadata.userId,
      amount: request.amount,
      sessionId: request.metadata.sessionId,
      authorizedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    const emergencySessions = JSON.parse(localStorage.getItem(`emergency_sessions_${request.metadata.userId}`) || '[]');
    emergencySessions.push(emergencyAuth);
    localStorage.setItem(`emergency_sessions_${request.metadata.userId}`, JSON.stringify(emergencySessions));
  }
}

// Singleton instance
export const crossChainPaymentService = new CrossChainPaymentService();