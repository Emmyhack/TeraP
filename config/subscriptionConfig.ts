import { SubscriptionTier } from '@/types/subscription';

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Essential Care',
    description: 'Perfect for getting started with mental wellness support',
    monthlyPrice: 29.99, // USD equivalent
    yearlyPrice: 299.99, // 2 months free
    benefits: {
      sessionMinutesPerMonth: 120, // 2 hours
      emergencySessionDiscount: 0,
      priorityBooking: false,
      groupSessionAccess: true,
      recordedSessionAccess: false,
      twentyFourSevenSupport: false,
      personalTherapistAssignment: false,
      advancedAnalytics: false,
      familyAccountSupport: false,
      maxConcurrentSessions: 1,
    },
    color: '#10B981', // emerald
    popular: false,
  },
  {
    id: 'standard',
    name: 'Complete Care',
    description: 'Enhanced support with priority access and personal therapist',
    monthlyPrice: 79.99, // USD equivalent
    yearlyPrice: 799.99, // 2 months free
    benefits: {
      sessionMinutesPerMonth: 300, // 5 hours
      emergencySessionDiscount: 15,
      priorityBooking: true,
      groupSessionAccess: true,
      recordedSessionAccess: true,
      twentyFourSevenSupport: false,
      personalTherapistAssignment: true,
      advancedAnalytics: true,
      familyAccountSupport: false,
      maxConcurrentSessions: 2,
    },
    color: '#3B82F6', // blue
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium Care',
    description: 'Comprehensive wellness support with 24/7 availability',
    monthlyPrice: 149.99, // USD equivalent
    yearlyPrice: 1499.99, // 2 months free
    benefits: {
      sessionMinutesPerMonth: 600, // 10 hours
      emergencySessionDiscount: 25,
      priorityBooking: true,
      groupSessionAccess: true,
      recordedSessionAccess: true,
      twentyFourSevenSupport: true,
      personalTherapistAssignment: true,
      advancedAnalytics: true,
      familyAccountSupport: true,
      maxConcurrentSessions: 3,
    },
    color: '#8B5CF6', // purple
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Organization Care',
    description: 'Unlimited access for organizations and families',
    monthlyPrice: 299.99, // USD equivalent
    yearlyPrice: 2999.99, // 2 months free
    benefits: {
      sessionMinutesPerMonth: 1200, // 20 hours
      emergencySessionDiscount: 50,
      priorityBooking: true,
      groupSessionAccess: true,
      recordedSessionAccess: true,
      twentyFourSevenSupport: true,
      personalTherapistAssignment: true,
      advancedAnalytics: true,
      familyAccountSupport: true,
      maxConcurrentSessions: 10,
    },
    color: '#F59E0B', // amber
    popular: false,
  },
];

export const EMERGENCY_SESSION_RATES = {
  base: 89.99, // $89.99 USD for 30 minutes
  urgent: 129.99, // $129.99 USD for immediate response (< 5 min)
  critical: 199.99, // $199.99 USD for crisis intervention (< 1 min)
  additional_minutes: 2.99, // $2.99 USD per additional minute
};

export const SUPPORTED_PAYMENT_CHAINS = [
  {
    id: 'zetachain-mainnet',
    name: 'ZetaChain',
    chainId: 7000,
    symbol: 'ZETA',
    icon: '⚡',
    nativeToken: 'ZETA',
    usdtAddress: '0x91d4F0D54090Df2D81e834c3c8CE71C6c3461d40', // USDT on ZetaChain
    processingFee: 0.5, // 0.5% processing fee
    gasEstimate: 50000,
    isTestnet: false,
  },
  {
    id: 'ethereum-mainnet', 
    name: 'Ethereum',
    chainId: 1,
    symbol: 'ETH',
    icon: '⟠',
    nativeToken: 'ETH',
    usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
    processingFee: 1.0, // 1% due to high gas costs
    gasEstimate: 100000,
    isTestnet: false,
  },
  {
    id: 'bsc-mainnet',
    name: 'BNB Smart Chain',
    chainId: 56,
    symbol: 'BNB',
    icon: '🟡',
    nativeToken: 'BNB',
    usdtAddress: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
    processingFee: 0.3,
    gasEstimate: 60000,
    isTestnet: false,
  },
  {
    id: 'polygon-mainnet',
    name: 'Polygon',
    chainId: 137,
    symbol: 'MATIC',
    icon: '🟣',
    nativeToken: 'MATIC',
    usdtAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT on Polygon
    processingFee: 0.2,
    gasEstimate: 80000,
    isTestnet: false,
  },
  {
    id: 'arbitrum-mainnet',
    name: 'Arbitrum One',
    chainId: 42161,
    symbol: 'ARB',
    icon: '🔷',
    nativeToken: 'ETH',
    usdtAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum
    processingFee: 0.4,
    gasEstimate: 70000,
    isTestnet: false,
  },
  {
    id: 'optimism-mainnet',
    name: 'Optimism',
    chainId: 10,
    symbol: 'OP',
    icon: '🔴',
    nativeToken: 'ETH',
    usdtAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT on Optimism
    processingFee: 0.4,
    gasEstimate: 70000,
    isTestnet: false,
  },
  {
    id: 'base-mainnet',
    name: 'Base',
    chainId: 8453,
    symbol: 'BASE',
    icon: '🔵',
    nativeToken: 'ETH',
    usdtAddress: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // USDT on Base
    processingFee: 0.3,
    gasEstimate: 60000,
    isTestnet: false,
  },
  {
    id: 'avalanche-mainnet',
    name: 'Avalanche C-Chain',
    chainId: 43114,
    symbol: 'AVAX',
    icon: '🔺',
    nativeToken: 'AVAX',
    usdtAddress: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDT on Avalanche
    processingFee: 0.3,
    gasEstimate: 80000,
    isTestnet: false,
  },
  {
    id: 'solana-mainnet',
    name: 'Solana',
    chainId: null, // Solana doesn't use EVM chain IDs
    symbol: 'SOL',
    icon: '◎',
    nativeToken: 'SOL',
    usdtAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT SPL token on Solana
    processingFee: 0.2,
    gasEstimate: 5000, // SOL lamports
    isTestnet: false,
  },
  {
    id: 'sui-mainnet',
    name: 'Sui Network',
    chainId: null, // Sui doesn't use EVM chain IDs
    symbol: 'SUI',
    icon: '💧',
    nativeToken: 'SUI',
    usdtAddress: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN', // USDT on Sui
    processingFee: 0.15,
    gasEstimate: 1000000, // SUI MIST
    isTestnet: false,
  },
  {
    id: 'ton-mainnet',
    name: 'TON Blockchain',
    chainId: null, // TON doesn't use EVM chain IDs
    symbol: 'TON',
    icon: '💎',
    nativeToken: 'TON',
    usdtAddress: 'kQCKt2WPGX-fh0cIAz38Ljd_OKQjoZE_cqk7QrYGsNyC7Ar2', // USDT jetton on TON
    processingFee: 0.25,
    gasEstimate: 0.01, // TON for gas
    isTestnet: false,
  },
  {
    id: 'somnia-mainnet',
    name: 'Somnia',
    chainId: 1001, // Somnia chain ID
    symbol: 'SOM',
    icon: '🌙',
    nativeToken: 'SOM',
    usdtAddress: '0x1234567890123456789012345678901234567890', // Placeholder USDT address for Somnia
    processingFee: 0.1,
    gasEstimate: 21000,
    isTestnet: false,
  },
  // Testnet options for development
  {
    id: 'zetachain-athens',
    name: 'ZetaChain Athens',
    chainId: 7001,
    symbol: 'aZETA',
    icon: '⚡',
    nativeToken: 'aZETA',
    usdtAddress: '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0', // Test USDT
    processingFee: 0.1,
    gasEstimate: 50000,
    isTestnet: true,
  },
];

export const NFT_AVATAR_TRAITS = {
  backgrounds: [
    'Serene Ocean', 'Peaceful Forest', 'Calming Mountains', 'Gentle Sunset',
    'Tranquil Garden', 'Misty Lake', 'Starry Night', 'Rainbow Sky'
  ],
  faces: [
    'Kind Eyes', 'Gentle Smile', 'Wise Expression', 'Caring Look',
    'Peaceful Gaze', 'Warm Demeanor', 'Friendly Features', 'Compassionate Face'
  ],
  accessories: [
    'Healing Crystal', 'Meditation Beads', 'Flower Crown', 'Peaceful Aura',
    'Wisdom Badge', 'Therapy Symbol', 'Mindfulness Ring', 'Wellness Charm'
  ],
  colors: [
    'Healing Green', 'Calming Blue', 'Peaceful Purple', 'Warm Gold',
    'Gentle Pink', 'Soothing Teal', 'Mindful Orange', 'Serene White'
  ],
  rarities: {
    common: 70, // 70% chance
    uncommon: 20, // 20% chance
    rare: 8, // 8% chance
    legendary: 2, // 2% chance
  }
};

export const ABUSE_ALERT_TYPES = [
  {
    id: 'mental_abuse',
    name: 'Mental/Emotional Abuse',
    severity: 'high',
    description: 'Psychological harm, manipulation, or emotional distress',
    escalationThreshold: 1, // immediate escalation
    responseTime: '< 2 minutes',
  },
  {
    id: 'physical_threat',
    name: 'Physical Threat',
    severity: 'critical',
    description: 'Threats of physical harm or violence',
    escalationThreshold: 0, // immediate network-wide alert
    responseTime: '< 1 minute',
  },
  {
    id: 'suicide_risk',
    name: 'Suicide Risk',
    severity: 'critical',
    description: 'Suicidal thoughts or self-harm indicators',
    escalationThreshold: 0, // immediate network-wide alert
    responseTime: '< 30 seconds',
  },
  {
    id: 'harassment',
    name: 'Harassment',
    severity: 'medium',
    description: 'Unwanted contact or inappropriate behavior',
    escalationThreshold: 2, // escalate after 2 reports
    responseTime: '< 5 minutes',
  },
  {
    id: 'session_abuse',
    name: 'Session Abuse',
    severity: 'high',
    description: 'Inappropriate conduct during therapy session',
    escalationThreshold: 1, // immediate escalation
    responseTime: '< 2 minutes',
  },
  {
    id: 'privacy_violation',
    name: 'Privacy Violation',
    severity: 'medium',
    description: 'Unauthorized recording or data sharing',
    escalationThreshold: 1,
    responseTime: '< 3 minutes',
  },
];