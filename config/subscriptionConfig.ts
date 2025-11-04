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
    id: 'zetachain-athens',
    name: 'ZetaChain Athens',
    chainId: 7001,
    symbol: 'aZETA',
    icon: '⚡',
    nativeToken: 'aZETA',
    usdtAddress: '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0',
    processingFee: 0.1,
    gasEstimate: 50000,
    isTestnet: true,
  },
  {
    id: 'ethereum-sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    symbol: 'ETH',
    icon: '⟠',
    nativeToken: 'ETH',
    usdtAddress: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
    processingFee: 0.5,
    gasEstimate: 100000,
    isTestnet: true,
  },
  {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    chainId: 97,
    symbol: 'tBNB',
    icon: '🟡',
    nativeToken: 'tBNB',
    usdtAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    processingFee: 0.2,
    gasEstimate: 60000,
    isTestnet: true,
  },
  {
    id: 'polygon-mumbai',
    name: 'Polygon Mumbai',
    chainId: 80001,
    symbol: 'MATIC',
    icon: '🟣',
    nativeToken: 'MATIC',
    usdtAddress: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
    processingFee: 0.1,
    gasEstimate: 80000,
    isTestnet: true,
  },
  {
    id: 'arbitrum-goerli',
    name: 'Arbitrum Goerli',
    chainId: 421613,
    symbol: 'ETH',
    icon: '🔷',
    nativeToken: 'ETH',
    usdtAddress: '0x533046F316590C19d99c74eE661c6d541b64471C',
    processingFee: 0.2,
    gasEstimate: 70000,
    isTestnet: true,
  },
  {
    id: 'optimism-goerli',
    name: 'Optimism Goerli',
    chainId: 420,
    symbol: 'ETH',
    icon: '🔴',
    nativeToken: 'ETH',
    usdtAddress: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    processingFee: 0.2,
    gasEstimate: 70000,
    isTestnet: true,
  },
  {
    id: 'base-goerli',
    name: 'Base Goerli',
    chainId: 84531,
    symbol: 'ETH',
    icon: '🔵',
    nativeToken: 'ETH',
    usdtAddress: '0x853154e2A5604E5C74a2546E2871Ad44932eB92C',
    processingFee: 0.2,
    gasEstimate: 60000,
    isTestnet: true,
  },
  {
    id: 'avalanche-fuji',
    name: 'Avalanche Fuji',
    chainId: 43113,
    symbol: 'AVAX',
    icon: '🔺',
    nativeToken: 'AVAX',
    usdtAddress: '0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3',
    processingFee: 0.2,
    gasEstimate: 80000,
    isTestnet: true,
  },
  {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    chainId: null,
    symbol: 'SOL',
    icon: '◎',
    nativeToken: 'SOL',
    usdtAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    processingFee: 0.1,
    gasEstimate: 5000,
    isTestnet: true,
  },
  {
    id: 'sui-testnet',
    name: 'Sui Testnet',
    chainId: null,
    symbol: 'SUI',
    icon: '💧',
    nativeToken: 'SUI',
    usdtAddress: '0x26b3bc67befc214058ca78ea9a2690298d731a2d4bce70833ceaedd4ac4dab2::usdt::USDT',
    processingFee: 0.1,
    gasEstimate: 1000000,
    isTestnet: true,
  },
  {
    id: 'ton-testnet',
    name: 'TON Testnet',
    chainId: null,
    symbol: 'TON',
    icon: '💎',
    nativeToken: 'TON',
    usdtAddress: 'kQAiboDEv_qRrcEdrYdwbVLNOXBHwShFbtKGbQVJ2OKxY_Di',
    processingFee: 0.1,
    gasEstimate: 0.01,
    isTestnet: true,
  },
  {
    id: 'somnia-testnet',
    name: 'Somnia Testnet',
    chainId: 1002,
    symbol: 'SOM',
    icon: '🌙',
    nativeToken: 'SOM',
    usdtAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    processingFee: 0.05,
    gasEstimate: 21000,
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