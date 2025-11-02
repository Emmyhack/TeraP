// Subscription and therapy system types
export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number; // in TERAP tokens
  yearlyPrice: number; // in TERAP tokens (discounted)
  benefits: {
    sessionMinutesPerMonth: number;
    emergencySessionDiscount: number; // percentage discount
    priorityBooking: boolean;
    groupSessionAccess: boolean;
    recordedSessionAccess: boolean;
    twentyFourSevenSupport: boolean;
    personalTherapistAssignment: boolean;
    advancedAnalytics: boolean;
    familyAccountSupport: boolean;
    maxConcurrentSessions: number;
  };
  color: string; // for UI theming
  popular: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tierId: string;
  tier: SubscriptionTier;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  paymentChain: string; // which blockchain was used for payment
  transactionHash: string;
  zetaChainTxHash?: string; // Added for cross-chain tracking
  usedMinutes: number;
  remainingMinutes: number;
  autoRenewal: boolean;
  processingFee?: number;
  gasUsed?: number;
  blockNumber?: number;
}

export interface SessionBookingRequest {
  id: string;
  patientId: string;
  therapistId?: string; // optional - can be auto-assigned
  sessionType: 'individual' | 'group' | 'emergency';
  preferredDuration: number; // in minutes
  scheduledDateTime?: Date; // optional for emergency sessions
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  sessionTopics: string[];
  paymentMethod: 'subscription' | 'direct_pay';
  crossChainPayment?: {
    chain: string;
    tokenAddress: string;
    amount: string;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  encryptionKey?: string; // for session encryption
}

export interface AnonymousProfile {
  id: string;
  walletAddress: string;
  anonymousId: string; // generated anonymous identifier
  nftAvatar: {
    tokenId: string;
    imageUrl: string;
    traits: Record<string, any>;
  };
  userType: 'patient' | 'therapist';
  encryptionPublicKey: string;
  preferences: {
    sessionTypes: string[];
    availableHours: string[];
    maxSessionDuration: number;
    communicationPreferences: ('text' | 'voice' | 'video')[];
  };
  verificationStatus: 'unverified' | 'pending' | 'verified';
  reputation: {
    score: number;
    totalSessions: number;
    successfulSessions: number;
    patientFeedback?: number; // for therapists
    therapistFeedback?: number; // for patients
  };
}

export interface TherapistProfile extends AnonymousProfile {
  specializations: string[];
  languages: string[];
  experienceYears: number;
  credentials: {
    licenseNumber: string; // encrypted
    certifications: string[];
    education: string[];
  };
  availability: {
    timezone: string;
    schedule: Record<string, { start: string; end: string }[]>; // day of week -> time slots
  };
  sessionRates: {
    individual: number;
    group: number;
    emergency: number;
  };
  emergencyAvailability: boolean;
}

export interface EncryptedSession {
  id: string;
  bookingId: string;
  participants: string[]; // anonymous IDs
  startTime: Date;
  endTime: Date;
  actualDuration: number;
  sessionType: 'text' | 'voice' | 'video';
  encryptionKey: string;
  messageCount: number;
  status: 'scheduled' | 'active' | 'completed' | 'terminated';
  terminationReason?: 'completed' | 'patient_left' | 'therapist_left' | 'emergency' | 'abuse_reported';
  reportedAbuse?: boolean;
  emergencyBroadcast?: boolean;
}

export interface EmergencyAlert {
  id: string;
  reporterId: string; // anonymous ID
  sessionId?: string;
  alertType: 'mental_abuse' | 'physical_threat' | 'suicide_risk' | 'harassment' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string; // encrypted
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // for privacy
  };
  timestamp: Date;
  status: 'reported' | 'acknowledged' | 'responding' | 'resolved';
  responders: string[]; // anonymous IDs of nearby therapists/volunteers
  escalationLevel: number; // 1-5, higher means broader network alert
}

export interface CrossChainPayment {
  id: string;
  userId: string;
  sessionId?: string;
  subscriptionId?: string;
  amount: number;
  currency: 'USDT' | 'NATIVE' | 'TERAP'; // Enhanced to include specific types
  sourceChain: string;
  targetChain: string; // ZetaChain for processing
  transactionHash: string;
  zetaChainTxHash?: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'completed';
  timestamp: Date;
  gasEstimate: number;
  actualGasUsed?: number;
  processingFee?: number;
  confirmations?: number;
  blockNumber?: number;
  completedAt?: Date;
}