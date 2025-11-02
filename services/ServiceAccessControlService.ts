import { ethers } from 'ethers';
import { SubscriptionTier } from '@/types/subscription';
import { SUBSCRIPTION_TIERS } from '@/config/subscriptionConfig';

interface ServiceAccess {
  hasAccess: boolean;
  accessLevel: 'none' | 'basic' | 'standard' | 'premium' | 'enterprise';
  remainingMinutes: number;
  canBookEmergency: boolean;
  canAccessGroups: boolean;
  canRecordSessions: boolean;
  has24x7Support: boolean;
  hasPersonalTherapist: boolean;
  maxConcurrentSessions: number;
  emergencyDiscount: number;
  expiryDate?: Date;
  reason?: string;
}

interface SessionBookingRequest {
  therapistAddress: string;
  duration: number; // in minutes
  isEmergency: boolean;
  sessionType: 'individual' | 'group';
}

interface PaymentVerification {
  isValid: boolean;
  transactionHash?: string;
  amount?: number;
  timestamp?: Date;
  confirmations?: number;
  blockNumber?: number;
}

export class ServiceAccessControlService {
  private contractAddresses: Map<number, string> = new Map();
  private providers: Map<number, ethers.Provider> = new Map();
  
  // TeraPCore contract ABI (focused on access control methods)
  private readonly CONTRACT_ABI = [
    'function getSubscriptionStatus(address user) view returns (bool active, uint256 endTime, uint256 tierId)',
    'function getUserSubscription(address user) view returns (tuple(bool active, uint256 tierId, uint256 startTime, uint256 endTime, uint256 usedMinutes, uint256 remainingMinutes))',
    'function canBookSession(address user, address therapist, uint256 duration) view returns (bool canBook, string reason)',
    'function getServiceLimits(address user) view returns (tuple(uint256 monthlyMinutes, uint256 usedMinutes, uint256 remainingMinutes, bool emergencyAccess, bool groupAccess, bool recordingAccess, bool priorityBooking, bool personalTherapist, bool support24x7))',
    'function verifyPayment(bytes32 txHash, address user, uint256 amount) view returns (bool verified)',
    'function getUserReputation(address user) view returns (uint256 reputation)',
    'function isTherapistVerified(address therapist) view returns (bool verified)',
  ];

  constructor() {
    this.initializeContracts();
  }

  private initializeContracts() {
    // ZetaChain Mainnet
    this.contractAddresses.set(7000, '0x1234567890123456789012345678901234567890'); // Replace with actual
    this.providers.set(7000, new ethers.JsonRpcProvider('https://zetachain-evm.blockpi.network/v1/rpc/public'));
    
    // ZetaChain Testnet
    this.contractAddresses.set(7001, '0x9876543210987654321098765432109876543210'); // Replace with actual
    this.providers.set(7001, new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public'));
  }

  /**
   * Check if user has access to a specific service based on their subscription
   */
  async checkServiceAccess(userAddress: string, chainId: number = 7000): Promise<ServiceAccess> {
    try {
      // First check on-chain subscription status
      const onChainAccess = await this.checkOnChainSubscription(userAddress, chainId);
      
      if (onChainAccess.hasAccess) {
        return onChainAccess;
      }

      // Fallback to local storage verification (for development/offline mode)
      const localAccess = await this.checkLocalSubscription(userAddress);
      
      return localAccess;
      
    } catch (error) {
      console.error('Error checking service access:', error);
      
      // Return safe defaults on error
      return {
        hasAccess: false,
        accessLevel: 'none',
        remainingMinutes: 0,
        canBookEmergency: false,
        canAccessGroups: false,
        canRecordSessions: false,
        has24x7Support: false,
        hasPersonalTherapist: false,
        maxConcurrentSessions: 0,
        emergencyDiscount: 0,
        reason: 'Service verification failed',
      };
    }
  }

  private async checkOnChainSubscription(userAddress: string, chainId: number): Promise<ServiceAccess> {
    const provider = this.providers.get(chainId);
    const contractAddress = this.contractAddresses.get(chainId);
    
    if (!provider || !contractAddress) {
      throw new Error(`Contract not available for chain ${chainId}`);
    }

    try {
      const contract = new ethers.Contract(contractAddress, this.CONTRACT_ABI, provider);
      
      // Get user subscription status
      const subscriptionStatus = await contract.getUserSubscription(userAddress);
      
      if (!subscriptionStatus.active) {
        return {
          hasAccess: false,
          accessLevel: 'none',
          remainingMinutes: 0,
          canBookEmergency: false,
          canAccessGroups: false,
          canRecordSessions: false,
          has24x7Support: false,
          hasPersonalTherapist: false,
          maxConcurrentSessions: 0,
          emergencyDiscount: 0,
          reason: 'No active subscription',
        };
      }

      // Get service limits
      const serviceLimits = await contract.getServiceLimits(userAddress);
      
      // Find the tier configuration
      const tier = SUBSCRIPTION_TIERS.find(t => t.id === this.getTierIdFromNumber(Number(subscriptionStatus.tierId)));
      
      if (!tier) {
        throw new Error('Invalid subscription tier');
      }

      return {
        hasAccess: true,
        accessLevel: this.getAccessLevelFromTier(tier.id),
        remainingMinutes: Number(serviceLimits.remainingMinutes),
        canBookEmergency: serviceLimits.emergencyAccess,
        canAccessGroups: serviceLimits.groupAccess,
        canRecordSessions: serviceLimits.recordingAccess,
        has24x7Support: serviceLimits.support24x7,
        hasPersonalTherapist: serviceLimits.personalTherapist,
        maxConcurrentSessions: tier.benefits.maxConcurrentSessions,
        emergencyDiscount: tier.benefits.emergencySessionDiscount,
        expiryDate: new Date(Number(subscriptionStatus.endTime) * 1000),
      };
      
    } catch (error) {
      console.error('On-chain subscription check failed:', error);
      throw error;
    }
  }

  private async checkLocalSubscription(userAddress: string): Promise<ServiceAccess> {
    try {
      const subscriptions = JSON.parse(localStorage.getItem(`subscriptions_${userAddress}`) || '[]');
      const activeSubscription = subscriptions.find((sub: any) => 
        sub.status === 'active' && new Date(sub.endDate) > new Date()
      );

      if (!activeSubscription) {
        return {
          hasAccess: false,
          accessLevel: 'none',
          remainingMinutes: 0,
          canBookEmergency: false,
          canAccessGroups: false,
          canRecordSessions: false,
          has24x7Support: false,
          hasPersonalTherapist: false,
          maxConcurrentSessions: 0,
          emergencyDiscount: 0,
          reason: 'No active local subscription',
        };
      }

      const tier = SUBSCRIPTION_TIERS.find(t => t.id === activeSubscription.tierId);
      if (!tier) {
        throw new Error('Invalid subscription tier');
      }

      return {
        hasAccess: true,
        accessLevel: this.getAccessLevelFromTier(tier.id),
        remainingMinutes: activeSubscription.remainingMinutes || tier.benefits.sessionMinutesPerMonth,
        canBookEmergency: tier.benefits.emergencySessionDiscount > 0,
        canAccessGroups: tier.benefits.groupSessionAccess,
        canRecordSessions: tier.benefits.recordedSessionAccess,
        has24x7Support: tier.benefits.twentyFourSevenSupport,
        hasPersonalTherapist: tier.benefits.personalTherapistAssignment,
        maxConcurrentSessions: tier.benefits.maxConcurrentSessions,
        emergencyDiscount: tier.benefits.emergencySessionDiscount,
        expiryDate: new Date(activeSubscription.endDate),
      };
      
    } catch (error) {
      console.error('Local subscription check failed:', error);
      throw error;
    }
  }

  /**
   * Verify if user can book a specific session
   */
  async canBookSession(
    userAddress: string,
    request: SessionBookingRequest,
    chainId: number = 7000
  ): Promise<{ canBook: boolean; reason?: string; requiredPayment?: number }> {
    try {
      const serviceAccess = await this.checkServiceAccess(userAddress, chainId);
      
      if (!serviceAccess.hasAccess) {
        return {
          canBook: false,
          reason: serviceAccess.reason || 'No active subscription',
        };
      }

      // Check if therapist is verified
      const isTherapistVerified = await this.verifyTherapist(request.therapistAddress, chainId);
      if (!isTherapistVerified) {
        return {
          canBook: false,
          reason: 'Therapist not verified',
        };
      }

      // Check session type permissions
      if (request.sessionType === 'group' && !serviceAccess.canAccessGroups) {
        return {
          canBook: false,
          reason: 'Group sessions not included in current plan',
        };
      }

      // Check emergency session permissions
      if (request.isEmergency && !serviceAccess.canBookEmergency) {
        return {
          canBook: false,
          reason: 'Emergency sessions not included in current plan',
        };
      }

      // Check remaining minutes
      if (serviceAccess.remainingMinutes < request.duration) {
        // Calculate top-up payment required
        const additionalMinutes = request.duration - serviceAccess.remainingMinutes;
        const topUpCost = await this.calculateTopUpCost(additionalMinutes, request.isEmergency);
        
        return {
          canBook: true,
          reason: 'Insufficient minutes, top-up required',
          requiredPayment: topUpCost,
        };
      }

      return {
        canBook: true,
      };
      
    } catch (error) {
      console.error('Error checking booking eligibility:', error);
      return {
        canBook: false,
        reason: 'Service verification failed',
      };
    }
  }

  /**
   * Verify payment for a service
   */
  async verifyPayment(
    transactionHash: string,
    userAddress: string,
    amount: number,
    chainId: number
  ): Promise<PaymentVerification> {
    try {
      const provider = this.providers.get(chainId);
      if (!provider) {
        throw new Error(`Provider not available for chain ${chainId}`);
      }

      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return { isValid: false };
      }

      // Verify transaction status
      if (receipt.status !== 1) {
        return { isValid: false };
      }

      // Get current block for confirmations
      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      // Verify minimum confirmations (adjust as needed)
      const requiredConfirmations = chainId === 1 ? 12 : 6; // More confirmations for Ethereum mainnet
      
      if (confirmations < requiredConfirmations) {
        return {
          isValid: false,
          confirmations,
          blockNumber: receipt.blockNumber,
        };
      }

      // Additional verification through smart contract if available
      const contractAddress = this.contractAddresses.get(chainId);
      if (contractAddress) {
        try {
          const contract = new ethers.Contract(contractAddress, this.CONTRACT_ABI, provider);
          const isVerified = await contract.verifyPayment(transactionHash, userAddress, ethers.parseEther(amount.toString()));
          
          if (!isVerified) {
            return { isValid: false };
          }
        } catch (contractError) {
          console.warn('Contract verification failed, using basic verification:', contractError);
        }
      }

      return {
        isValid: true,
        transactionHash,
        confirmations,
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
      };
      
    } catch (error) {
      console.error('Payment verification failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Consume service minutes after session completion
   */
  async consumeServiceMinutes(
    userAddress: string,
    minutes: number,
    sessionType: string,
    chainId: number = 7000
  ): Promise<{ success: boolean; remainingMinutes: number }> {
    try {
      // In production, this would update the smart contract
      // For now, update local storage
      
      const subscriptions = JSON.parse(localStorage.getItem(`subscriptions_${userAddress}`) || '[]');
      const activeSubscription = subscriptions.find((sub: any) => 
        sub.status === 'active' && new Date(sub.endDate) > new Date()
      );

      if (!activeSubscription) {
        throw new Error('No active subscription');
      }

      const currentRemaining = activeSubscription.remainingMinutes || 0;
      const newRemaining = Math.max(0, currentRemaining - minutes);
      
      // Update subscription
      activeSubscription.remainingMinutes = newRemaining;
      activeSubscription.usedMinutes = (activeSubscription.usedMinutes || 0) + minutes;
      activeSubscription.lastSessionDate = new Date().toISOString();

      // Save back to storage
      const updatedSubscriptions = subscriptions.map((sub: any) =>
        sub.id === activeSubscription.id ? activeSubscription : sub
      );
      
      localStorage.setItem(`subscriptions_${userAddress}`, JSON.stringify(updatedSubscriptions));

      // Log usage
      const usageLog = JSON.parse(localStorage.getItem(`usage_${userAddress}`) || '[]');
      usageLog.push({
        timestamp: new Date().toISOString(),
        minutes,
        sessionType,
        remainingMinutes: newRemaining,
      });
      localStorage.setItem(`usage_${userAddress}`, JSON.stringify(usageLog));

      return {
        success: true,
        remainingMinutes: newRemaining,
      };
      
    } catch (error) {
      console.error('Error consuming service minutes:', error);
      return {
        success: false,
        remainingMinutes: 0,
      };
    }
  }

  /**
   * Get user's service usage statistics
   */
  async getUsageStatistics(userAddress: string): Promise<{
    totalMinutesUsed: number;
    remainingMinutes: number;
    sessionsThisMonth: number;
    emergencySessionsUsed: number;
    lastSessionDate?: Date;
    utilizationRate: number;
  }> {
    try {
      const serviceAccess = await this.checkServiceAccess(userAddress);
      const usageLog = JSON.parse(localStorage.getItem(`usage_${userAddress}`) || '[]');
      
      // Calculate current month usage
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const thisMonthUsage = usageLog.filter((usage: any) => {
        const usageDate = new Date(usage.timestamp);
        return usageDate.getMonth() === currentMonth && usageDate.getFullYear() === currentYear;
      });

      const totalMinutesUsed = thisMonthUsage.reduce((total: number, usage: any) => total + usage.minutes, 0);
      const sessionsThisMonth = thisMonthUsage.length;
      const emergencySessionsUsed = thisMonthUsage.filter((usage: any) => usage.sessionType === 'emergency').length;
      
      const lastSession = usageLog[usageLog.length - 1];
      const lastSessionDate = lastSession ? new Date(lastSession.timestamp) : undefined;

      // Get tier info for utilization rate
      const subscriptions = JSON.parse(localStorage.getItem(`subscriptions_${userAddress}`) || '[]');
      const activeSubscription = subscriptions.find((sub: any) => 
        sub.status === 'active' && new Date(sub.endDate) > new Date()
      );

      const tier = activeSubscription ? SUBSCRIPTION_TIERS.find(t => t.id === activeSubscription.tierId) : null;
      const totalMonthlyMinutes = tier?.benefits.sessionMinutesPerMonth || 1;
      const utilizationRate = (totalMinutesUsed / totalMonthlyMinutes) * 100;

      return {
        totalMinutesUsed,
        remainingMinutes: serviceAccess.remainingMinutes,
        sessionsThisMonth,
        emergencySessionsUsed,
        lastSessionDate,
        utilizationRate,
      };
      
    } catch (error) {
      console.error('Error getting usage statistics:', error);
      return {
        totalMinutesUsed: 0,
        remainingMinutes: 0,
        sessionsThisMonth: 0,
        emergencySessionsUsed: 0,
        utilizationRate: 0,
      };
    }
  }

  private async verifyTherapist(therapistAddress: string, chainId: number): Promise<boolean> {
    try {
      const provider = this.providers.get(chainId);
      const contractAddress = this.contractAddresses.get(chainId);
      
      if (!provider || !contractAddress) {
        // Fallback verification for development
        return true; // Mock verification
      }

      const contract = new ethers.Contract(contractAddress, this.CONTRACT_ABI, provider);
      return await contract.isTherapistVerified(therapistAddress);
      
    } catch (error) {
      console.error('Therapist verification failed:', error);
      return false;
    }
  }

  private async calculateTopUpCost(minutes: number, isEmergency: boolean): Promise<number> {
    // Base rate: $2.99 per minute
    // Emergency sessions: $4.99 per minute
    const baseRate = isEmergency ? 4.99 : 2.99;
    return minutes * baseRate;
  }

  private getTierIdFromNumber(tierNumber: number): string {
    const tierMap = {
      0: 'basic',
      1: 'standard',
      2: 'premium',
      3: 'enterprise',
    };
    return tierMap[tierNumber as keyof typeof tierMap] || 'basic';
  }

  private getAccessLevelFromTier(tierId: string): 'none' | 'basic' | 'standard' | 'premium' | 'enterprise' {
    switch (tierId) {
      case 'basic':
        return 'basic';
      case 'standard':
        return 'standard';
      case 'premium':
        return 'premium';
      case 'enterprise':
        return 'enterprise';
      default:
        return 'none';
    }
  }

  /**
   * Refresh service access (useful after payments)
   */
  async refreshServiceAccess(userAddress: string, chainId: number = 7000): Promise<ServiceAccess> {
    // Clear any cached data
    // In production, this might invalidate cache layers
    
    return await this.checkServiceAccess(userAddress, chainId);
  }
}

// Singleton instance
export const serviceAccessControl = new ServiceAccessControlService();