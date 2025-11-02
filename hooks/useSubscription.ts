import { useState, useCallback, useEffect } from 'react';
import { SubscriptionTier, UserSubscription, CrossChainPayment } from '@/types/subscription';
import { SUBSCRIPTION_TIERS } from '@/config/subscriptionConfig';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { crossChainPaymentService } from '@/services/CrossChainPaymentServiceV2';
import { serviceAccessControl } from '@/services/ServiceAccessControlService';
import { smartContractService } from '@/services/SmartContractIntegrationService';

interface UseSubscriptionReturn {
  currentSubscription: UserSubscription | null;
  subscriptions: UserSubscription[];
  isLoading: boolean;
  error: string | null;
  subscribe: (tier: SubscriptionTier, payment: CrossChainPayment) => Promise<void>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
  upgradeSubscription: (newTier: SubscriptionTier) => Promise<void>;
  renewSubscription: (subscriptionId: string) => Promise<void>;
  getUsageStats: () => Promise<any>;
  checkServiceAccess: () => Promise<any>;
  getPaymentQuote: (tierId: string, billingCycle: 'monthly' | 'yearly', sourceChain: string, currency: 'USDT' | 'NATIVE') => Promise<any>;
  canMakePayment: (tierId: string, billingCycle: 'monthly' | 'yearly', sourceChain: string, currency: 'USDT' | 'NATIVE') => Promise<any>;
  getUserBalances: (chainId: number) => Promise<any>;
  trackPayment: (txHash: string, chainId: number) => Promise<any>;
  purchaseSessionTopUp: (minutes: number, isEmergency: boolean, sourceChain: string, currency: 'USDT' | 'NATIVE') => Promise<any>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isConnected, address } = useWeb3Wallet();

  // Load user subscriptions
  const loadSubscriptions = useCallback(async () => {
    if (!isConnected || !address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call your backend API
      // For now, we'll simulate with localStorage
      const storedSubscriptions = localStorage.getItem(`subscriptions_${address}`);
      const userSubscriptions = storedSubscriptions ? JSON.parse(storedSubscriptions) : [];
      
      setSubscriptions(userSubscriptions);
      
      // Find active subscription
      const activeSubscription = userSubscriptions.find((sub: UserSubscription) => 
        sub.status === 'active' && new Date(sub.endDate) > new Date()
      );
      
      setCurrentSubscription(activeSubscription || null);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Subscribe to a tier with real payment processing
  const subscribe = useCallback(async (tier: SubscriptionTier, payment: CrossChainPayment) => {
    if (!isConnected || !address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine billing cycle
      const billingCycle = payment.amount === tier.yearlyPrice ? 'yearly' : 'monthly';
      
      // Ensure compatible currency type
      const compatibleCurrency = payment.currency === 'TERAP' ? 'NATIVE' : payment.currency as 'USDT' | 'NATIVE';
      
      // Check if user can make payment
      const paymentCheck = await crossChainPaymentService.canMakePayment(
        address,
        payment.amount,
        payment.sourceChain,
        compatibleCurrency
      );
      
      if (!paymentCheck.canPay) {
        throw new Error(paymentCheck.reason || 'Cannot process payment');
      }

      // Process the subscription payment
      const paymentResult = await crossChainPaymentService.processSubscriptionPayment(
        tier.id,
        billingCycle,
        address,
        payment.sourceChain,
        compatibleCurrency
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      // Verify service access has been updated
      const serviceAccess = await serviceAccessControl.refreshServiceAccess(address);
      
      if (!serviceAccess.hasAccess) {
        console.warn('Payment processed but service access not yet updated');
      }

      // Create subscription record with payment info
      const startDate = new Date();
      const endDate = new Date();
      
      if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      const newSubscription: UserSubscription = {
        id: `sub_${Date.now()}`,
        userId: address,
        tierId: tier.id,
        tier: tier,
        status: 'active',
        startDate,
        endDate,
        paymentChain: payment.sourceChain,
        transactionHash: paymentResult.transactionHash!,
        zetaChainTxHash: paymentResult.zetaChainTxHash,
        usedMinutes: 0,
        remainingMinutes: tier.benefits.sessionMinutesPerMonth,
        autoRenewal: true,
        processingFee: paymentResult.processingFee,
        gasUsed: paymentResult.gasUsed,
        blockNumber: paymentResult.blockNumber,
      };
      
      // Update local storage (backup for UI state)
      const existingSubscriptions = JSON.parse(
        localStorage.getItem(`subscriptions_${address}`) || '[]'
      );
      
      // Cancel any existing active subscriptions
      const updatedSubscriptions = existingSubscriptions.map((sub: UserSubscription) => ({
        ...sub,
        status: sub.status === 'active' ? 'cancelled' : sub.status,
      }));
      
      updatedSubscriptions.push(newSubscription);
      localStorage.setItem(
        `subscriptions_${address}`,
        JSON.stringify(updatedSubscriptions)
      );
      
      // Create enhanced payment record
      const enhancedPayment: CrossChainPayment = {
        ...payment,
        transactionHash: paymentResult.transactionHash!,
        status: 'completed',
        confirmations: paymentResult.confirmations || 0,
        actualGasUsed: paymentResult.gasUsed || 0,
        processingFee: paymentResult.processingFee || 0,
        zetaChainTxHash: paymentResult.zetaChainTxHash,
        blockNumber: paymentResult.blockNumber,
        completedAt: new Date(),
      };
      
      const payments = JSON.parse(
        localStorage.getItem(`payments_${address}`) || '[]'
      );
      payments.push(enhancedPayment);
      localStorage.setItem(`payments_${address}`, JSON.stringify(payments));
      
      setCurrentSubscription(newSubscription);
      setSubscriptions(updatedSubscriptions);
      
      console.log('Subscription successfully created with real payment:', {
        subscription: newSubscription,
        payment: enhancedPayment,
        serviceAccess
      });
      
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'Subscription failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    if (!isConnected || !address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const existingSubscriptions = JSON.parse(
        localStorage.getItem(`subscriptions_${address}`) || '[]'
      );
      
      const updatedSubscriptions = existingSubscriptions.map((sub: UserSubscription) =>
        sub.id === subscriptionId ? { ...sub, status: 'cancelled', autoRenew: false } : sub
      );
      
      localStorage.setItem(
        `subscriptions_${address}`,
        JSON.stringify(updatedSubscriptions)
      );
      
      setSubscriptions(updatedSubscriptions);
      
      // Update current subscription if it was the cancelled one
      if (currentSubscription?.id === subscriptionId) {
        setCurrentSubscription(null);
      }
      
    } catch (err) {
      console.error('Cancel subscription error:', err);
      setError(err instanceof Error ? err.message : 'Cancellation failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, currentSubscription]);

  // Upgrade subscription
  const upgradeSubscription = useCallback(async (newTier: SubscriptionTier) => {
    if (!isConnected || !address || !currentSubscription) throw new Error('No active subscription');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate prorated amount for upgrade
      const daysRemaining = Math.ceil(
        (new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const currentTier = SUBSCRIPTION_TIERS.find(t => t.id === currentSubscription.tierId);
      if (!currentTier) throw new Error('Current tier not found');
      
      const proratedAmount = Math.round(
        (newTier.monthlyPrice - currentTier.monthlyPrice) * (daysRemaining / 30)
      );
      
      // Create upgrade payment
      const upgradePayment: CrossChainPayment = {
        id: `upgrade_${Date.now()}`,
        userId: address,
        subscriptionId: currentSubscription.id,
        amount: proratedAmount,
        currency: 'TERAP',
        sourceChain: currentSubscription.paymentChain,
        targetChain: 'zetachain',
        transactionHash: '',
        status: 'pending',
        timestamp: new Date(),
        gasEstimate: 50000,
      };
      
      // Update subscription tier
      const updatedSubscription = {
        ...currentSubscription,
        tierId: newTier.id,
        lastPayment: upgradePayment,
      };
      
      const existingSubscriptions = JSON.parse(
        localStorage.getItem(`subscriptions_${address}`) || '[]'
      );
      
      const updatedSubscriptions = existingSubscriptions.map((sub: UserSubscription) =>
        sub.id === currentSubscription.id ? updatedSubscription : sub
      );
      
      localStorage.setItem(
        `subscriptions_${address}`,
        JSON.stringify(updatedSubscriptions)
      );
      
      setCurrentSubscription(updatedSubscription);
      setSubscriptions(updatedSubscriptions);
      
    } catch (err) {
      console.error('Upgrade subscription error:', err);
      setError(err instanceof Error ? err.message : 'Upgrade failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, currentSubscription]);

  // Renew subscription
  const renewSubscription = useCallback(async (subscriptionId: string) => {
    if (!isConnected || !address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      if (!subscription) throw new Error('Subscription not found');
      
      const tier = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tierId);
      if (!tier) throw new Error('Tier not found');
      
      // Create renewal payment
      const renewalPayment: CrossChainPayment = {
        id: `renewal_${Date.now()}`,
        userId: address,
        subscriptionId: subscription.id,
        amount: tier.monthlyPrice,
        currency: 'TERAP',
        sourceChain: subscription.paymentChain,
        targetChain: 'zetachain',
        transactionHash: '',
        status: 'pending',
        timestamp: new Date(),
        gasEstimate: 50000,
      };
      
      // Extend subscription period
      const newEndDate = new Date(subscription.endDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1);
      
      const renewedSubscription = {
        ...subscription,
        status: 'active' as const,
        endDate: newEndDate,
        lastPayment: renewalPayment,
      };
      
      const existingSubscriptions = JSON.parse(
        localStorage.getItem(`subscriptions_${address}`) || '[]'
      );
      
      const updatedSubscriptions = existingSubscriptions.map((sub: UserSubscription) =>
        sub.id === subscriptionId ? renewedSubscription : sub
      );
      
      localStorage.setItem(
        `subscriptions_${address}`,
        JSON.stringify(updatedSubscriptions)
      );
      
      setSubscriptions(updatedSubscriptions);
      setCurrentSubscription(renewedSubscription);
      
    } catch (err) {
      console.error('Renewal error:', err);
      setError(err instanceof Error ? err.message : 'Renewal failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, subscriptions]);

  // Get usage statistics with real service access data
  const getUsageStats = useCallback(async () => {
    if (!currentSubscription || !address) return null;
    
    try {
      // Get real usage statistics from service access control
      const usageStats = await serviceAccessControl.getUsageStatistics(address);
      
      // Combine with subscription data
      return {
        ...usageStats,
        subscriptionTier: currentSubscription.tier.name,
        subscriptionExpiry: currentSubscription.endDate,
        autoRenewal: currentSubscription.autoRenewal,
        paymentChain: currentSubscription.paymentChain,
      };
    } catch (err) {
      console.error('Error getting usage stats:', err);
      
      // Fallback to basic subscription data
      if (currentSubscription) {
        return {
          usedMinutes: currentSubscription.usedMinutes,
          remainingMinutes: currentSubscription.remainingMinutes,
          totalMinutes: currentSubscription.tier.benefits.sessionMinutesPerMonth,
          utilizationRate: (currentSubscription.usedMinutes / currentSubscription.tier.benefits.sessionMinutesPerMonth) * 100,
          subscriptionTier: currentSubscription.tier.name,
          subscriptionExpiry: currentSubscription.endDate,
          autoRenewal: currentSubscription.autoRenewal,
          paymentChain: currentSubscription.paymentChain,
          sessionsThisMonth: 0,
          emergencySessionsUsed: 0,
        };
      }
      
      return null;
    }
  }, [currentSubscription, address]);

  // Check service access in real-time
  const checkServiceAccess = useCallback(async () => {
    if (!address) return null;
    
    try {
      return await serviceAccessControl.checkServiceAccess(address);
    } catch (err) {
      console.error('Error checking service access:', err);
      return null;
    }
  }, [address]);

  // Get payment quote for subscription
  const getPaymentQuote = useCallback(async (
    tierId: string,
    billingCycle: 'monthly' | 'yearly',
    sourceChain: string,
    currency: 'USDT' | 'NATIVE'
  ) => {
    if (!address) throw new Error('Wallet not connected');
    
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
    if (!tier) throw new Error('Invalid subscription tier');
    
    const amount = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
    
    return await crossChainPaymentService.getPaymentQuote({
      amount,
      currency,
      sourceChain,
      destinationAddress: '', // Will be set by service
      metadata: {
        subscriptionTierId: tierId,
        userId: address,
        paymentType: 'subscription',
        billingCycle,
      },
    });
  }, [address]);

  // Check payment capability
  const canMakePayment = useCallback(async (
    tierId: string,
    billingCycle: 'monthly' | 'yearly',
    sourceChain: string,
    currency: 'USDT' | 'NATIVE'
  ) => {
    if (!address) return { canPay: false, reason: 'Wallet not connected' };
    
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
    if (!tier) return { canPay: false, reason: 'Invalid subscription tier' };
    
    const amount = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
    
    return await crossChainPaymentService.canMakePayment(address, amount, sourceChain, currency);
  }, [address]);

  // Get user balances for payment planning
  const getUserBalances = useCallback(async (chainId: number) => {
    if (!address) throw new Error('Wallet not connected');
    
    return await crossChainPaymentService.getUserBalances(address, chainId);
  }, [address]);

  // Track payment status
  const trackPayment = useCallback(async (txHash: string, chainId: number) => {
    return await crossChainPaymentService.getTransactionStatus(txHash, chainId);
  }, []);

  // Purchase session top-up
  const purchaseSessionTopUp = useCallback(async (
    minutes: number,
    isEmergency: boolean,
    sourceChain: string,
    currency: 'USDT' | 'NATIVE'
  ) => {
    if (!address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await crossChainPaymentService.processSessionTopUp(
        minutes,
        isEmergency,
        address,
        sourceChain,
        currency
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Top-up failed');
      }
      
      // Refresh subscription data
      await loadSubscriptions();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Top-up failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, loadSubscriptions]);

  // Load subscriptions when wallet connects
  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Initialize smart contract integration when connected
  useEffect(() => {
    if (isConnected && address) {
      // Initialize contract services if needed
      console.log('Subscription hook initialized for address:', address);
    }
  }, [isConnected, address]);

  return {
    currentSubscription,
    subscriptions,
    isLoading,
    error,
    subscribe,
    cancelSubscription,
    upgradeSubscription,
    renewSubscription,
    getUsageStats,
    checkServiceAccess,
    getPaymentQuote,
    canMakePayment,
    getUserBalances,
    trackPayment,
    purchaseSessionTopUp,
  };
};