// Session Booking Component
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock as ClockIcon, 
  Clock,
  DollarSign, 
  User, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Video, 
  Shield,
  MessageCircle,
  Award,
  Zap,
  Heart,
  AlertTriangle,
  CreditCard,
  Timer,
  TrendingUp
} from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { serviceAccessControl } from '@/services/ServiceAccessControlService';
import { SUBSCRIPTION_TIERS, EMERGENCY_SESSION_RATES } from '@/config/subscriptionConfig';

interface Therapist {
  id: string;
  anonymousId: string;
  title: string;
  specializations: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  avatar: string;
  isVerified: boolean;
  languages: string[];
  availability: TimeSlot[];
  bio: string;
}

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

interface SessionType {
  id: string;
  name: string;
  duration: number;
  description: string;
  priceMultiplier: number;
}

interface SessionBookingProps {
  onNavigateToSubscription?: () => void;
}

const SessionBooking: React.FC<SessionBookingProps> = ({ onNavigateToSubscription }) => {
  const { isConnected, address } = useWeb3Wallet();
  const { dispatch, addNotification } = useApp();
  
  const [step, setStep] = useState<'therapists' | 'schedule' | 'payment' | 'confirmation'>('therapists');
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');

  // Real therapist data from blockchain
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscription and access control state
  const [serviceAccess, setServiceAccess] = useState<any>(null);
  const [isEmergencySession, setIsEmergencySession] = useState(false);
  const [topUpRequired, setTopUpRequired] = useState<number | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const [sessionTypes] = useState<SessionType[]>([
    {
      id: 'individual',
      name: 'Individual Therapy',
      duration: 50,
      description: 'One-on-one therapy session',
      priceMultiplier: 1
    },
    {
      id: 'couples',
      name: 'Couples Therapy',
      duration: 80,
      description: 'Therapy session for couples',
      priceMultiplier: 1.5
    },
    {
      id: 'initial',
      name: 'Initial Consultation',
      duration: 60,
      description: 'First-time consultation and assessment',
      priceMultiplier: 1.2
    }
  ]);

  const specializations = ['All', 'Anxiety', 'Depression', 'PTSD', 'Couples Therapy', 'Addiction Recovery', 'Grief Counseling'];

  // Load therapists from blockchain
  useEffect(() => {
    const loadTherapists = async () => {
      try {
        setLoading(true);
        // In a real implementation, we would fetch registered therapists from the smart contract
        // For now, this creates a sample therapist list that would come from contract events
        
        // Import SmartContractIntegrationService
        const { smartContractService } = await import('../../services/SmartContractIntegrationService');
        
        // This would be replaced with actual contract calls to get registered therapists
        const sampleTherapists: Therapist[] = [
          {
            id: '0x742d35Cc6636Bf8e4C5D8E2859F5aE02E4C2e4c7',
            anonymousId: 'MindfulHealer_Aurora',
            title: 'Licensed Clinical Psychologist',
            specializations: ['Anxiety', 'Depression', 'PTSD', 'CBT'],
            experience: 8,
            rating: 4.9,
            reviewCount: 127,
            hourlyRate: 120,
            avatar: '/avatars/therapist1.jpg',
            isVerified: true,
            languages: ['English', 'Spanish'],
            availability: generateAvailability(),
            bio: 'Specializing in anxiety and trauma therapy with over 8 years of experience. I use evidence-based approaches including CBT and EMDR.'
          },
          {
            id: '0x8f7E5B3cC4E9d2F1A6B8c3D7e2F4A9E6C1B8D5A3',
            anonymousId: 'RelationshipGuide_Phoenix',
            title: 'Licensed Marriage & Family Therapist',
            specializations: ['Couples Therapy', 'Family Counseling', 'Communication'],
            experience: 12,
            rating: 4.8,
            reviewCount: 89,
            hourlyRate: 140,
            avatar: '/avatars/therapist2.jpg',
            isVerified: true,
            languages: ['English', 'Mandarin'],
            availability: generateAvailability(),
            bio: 'Experienced family therapist helping couples and families build stronger relationships through improved communication.'
          },
          {
            id: '0x3E9A7F2B5C8D1E4A7B6C9D2E5F8A1B4C7D0E3F6A',
            anonymousId: 'WellnessAdvocate_Sage',
            title: 'Clinical Social Worker',
            specializations: ['Addiction Recovery', 'Grief Counseling', 'Life Transitions'],
            experience: 6,
            rating: 4.7,
            reviewCount: 203,
            hourlyRate: 100,
            avatar: '/avatars/therapist3.jpg',
            isVerified: true,
            languages: ['English', 'Portuguese'],
            availability: generateAvailability(),
            bio: 'Compassionate therapist specializing in addiction recovery and helping clients navigate major life changes.'
          }
        ];
        
        setTherapists(sampleTherapists);
      } catch (error) {
        console.error('Failed to load therapists:', error);
        addNotification({
          type: 'error',
          title: 'Error Loading Therapists',
          message: 'Failed to load available therapists. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadTherapists();
  }, []);

  // Load user's subscription status and service access
  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      if (!address) {
        setSubscriptionLoading(false);
        return;
      }

      try {
        setSubscriptionLoading(true);
        const access = await serviceAccessControl.checkServiceAccess(address);
        setServiceAccess(access);
        
        console.log('User subscription access:', access);
      } catch (error) {
        console.error('Failed to load subscription status:', error);
        setServiceAccess({
          hasAccess: false,
          accessLevel: 'none',
          remainingMinutes: 0,
          canBookEmergency: false,
          reason: 'Failed to verify subscription'
        });
      } finally {
        setSubscriptionLoading(false);
      }
    };

    loadSubscriptionStatus();
  }, [address]);

  // Generate availability slots for therapists
  const generateAvailability = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate morning slots (9-12)
      for (let hour = 9; hour <= 11; hour++) {
        slots.push({
          date: dateStr,
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: Math.random() > 0.3 // Random availability
        });
      }
      
      // Generate afternoon slots (13-17)
      for (let hour = 13; hour <= 16; hour++) {
        slots.push({
          date: dateStr,
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: Math.random() > 0.3 // Random availability
        });
      }
    }
    
    return slots;
  };

  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = therapist.anonymousId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         therapist.specializations.some(spec => 
                           spec.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesSpecialization = filterSpecialization === 'all' || 
                                 therapist.specializations.some(spec => 
                                   spec.toLowerCase().includes(filterSpecialization.toLowerCase())
                                 );
    return matchesSearch && matchesSpecialization;
  });

  const calculateTotalCost = () => {
    if (!selectedTherapist || !selectedSessionType || !serviceAccess) return 0;

    // Base session cost
    let baseCost = Math.round(selectedTherapist.hourlyRate * selectedSessionType.priceMultiplier);
    
    // Check if user has subscription minutes available
    const sessionMinutes = selectedSessionType.duration;
    
    if (serviceAccess.hasAccess && serviceAccess.remainingMinutes >= sessionMinutes) {
      // Session is covered by subscription - no additional cost
      return 0;
    } else if (serviceAccess.hasAccess && serviceAccess.remainingMinutes > 0) {
      // Partial coverage - calculate top-up needed
      const additionalMinutes = sessionMinutes - serviceAccess.remainingMinutes;
      const topUpCost = additionalMinutes * (isEmergencySession ? 4.99 : 2.99);
      setTopUpRequired(topUpCost);
      return Math.round(topUpCost);
    } else if (isEmergencySession) {
      // Emergency session rates
      const emergencyRate = isEmergencySession ? EMERGENCY_SESSION_RATES.base : baseCost;
      const discount = serviceAccess?.emergencyDiscount || 0;
      return Math.round(emergencyRate * (1 - discount / 100));
    }

    // No subscription or subscription expired - full pay-per-session cost
    return baseCost;
  };

  // Generate session URL for encrypted chat
  const generateSessionUrl = (sessionId: string) => {
    if (!selectedTherapist || !address) return '';
    
    const params = new URLSearchParams({
      sessionId: sessionId,
      therapistId: selectedTherapist.id,
      clientId: address,
      duration: selectedSessionType?.duration.toString() || '60',
      role: 'client'
    });

    return `/session/live?${params.toString()}`;
  };

  // Check if session time has arrived (within 15 minutes)
  const isSessionTimeActive = () => {
    if (!selectedDate || !selectedTime) return false;
    
    const sessionDateTime = new Date(`${selectedDate} ${selectedTime}`);
    const now = new Date();
    const timeDiff = sessionDateTime.getTime() - now.getTime();
    
    // Allow joining 15 minutes before and up to 2 hours after session time
    return timeDiff <= 15 * 60 * 1000 && timeDiff >= -120 * 60 * 1000;
  };

  const getAvailableTimes = (date: string) => {
    if (!selectedTherapist) return [];
    return selectedTherapist.availability.filter(slot => slot.date === date && slot.available);
  };

  const getAvailableDates = () => {
    if (!selectedTherapist) return [];
    const uniqueDates = new Set(selectedTherapist.availability.filter(slot => slot.available).map(slot => slot.date));
    const dates = Array.from(uniqueDates);
    return dates.sort();
  };

  const handleBookSession = async () => {
    if (!selectedTherapist || !selectedSessionType || !selectedDate || !selectedTime) {
      addNotification({
        type: 'error',
        title: 'Booking Error',
        message: 'Please select all required fields before booking.'
      });
      return;
    }

    if (!address) {
      addNotification({
        type: 'error',
        title: 'Wallet Required',
        message: 'Please connect your wallet to book a session.'
      });
      return;
    }

    try {
      setLoading(true);

      // Check subscription access before booking
      const bookingRequest = {
        therapistAddress: selectedTherapist.id,
        duration: selectedSessionType.duration,
        isEmergency: isEmergencySession,
        sessionType: selectedSessionType.id as 'individual' | 'group'
      };

      const canBook = await serviceAccessControl.canBookSession(address, bookingRequest);
      
      if (!canBook.canBook) {
        addNotification({
          type: 'error',
          title: 'Booking Not Allowed',
          message: canBook.reason || 'Unable to book session'
        });
        
        // If it's a subscription issue, suggest upgrading
        if (canBook.reason?.includes('subscription') || canBook.reason?.includes('plan')) {
          addNotification({
            type: 'info',
            title: 'Upgrade Subscription',
            message: 'Consider upgrading your plan for better access to sessions.'
          });
        }
        
        setLoading(false);
        return;
      }

      // If top-up payment is required
      if (canBook.requiredPayment && canBook.requiredPayment > 0) {
        addNotification({
          type: 'warning',
          title: 'Top-up Required',
          message: `Additional payment of $${canBook.requiredPayment.toFixed(2)} required for this session.`
        });
        setTopUpRequired(canBook.requiredPayment);
      }
      
      // Import SmartContractIntegrationService
      const { smartContractService } = await import('../../services/SmartContractIntegrationService');
      
      // Book session through smart contract
      const result = await smartContractService.bookSession(
        selectedTherapist.id, // This is the therapist's wallet address
        selectedSessionType.duration,
        `Session notes: ${selectedSessionType.description}` // Encrypted notes would go here
      );

      if (result.success) {
        // Consume subscription minutes if applicable
        if (serviceAccess?.hasAccess && serviceAccess.remainingMinutes > 0) {
          const minutesToConsume = Math.min(selectedSessionType.duration, serviceAccess.remainingMinutes);
          await serviceAccessControl.consumeServiceMinutes(
            address,
            minutesToConsume,
            isEmergencySession ? 'emergency' : selectedSessionType.id
          );
        }

        addNotification({
          type: 'success',
          title: 'Session Booked',
          message: `Session successfully booked! Transaction hash: ${result.transactionHash}`
        });
        setStep('confirmation');
      } else {
        throw new Error(result.error || 'Failed to book session');
      }
    } catch (error) {
      console.error('Failed to book session:', error);
      addNotification({
        type: 'error',
        title: 'Booking Failed',
        message: error instanceof Error ? error.message : 'Failed to book session. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Connect Wallet</h2>
          <p className="text-neutral-600">Please connect your wallet to book therapy sessions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">Book Therapy Session</h1>
              <p className="text-neutral-600 mt-2">Find the right therapist for your needs</p>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              {(['therapists', 'schedule', 'payment', 'confirmation'] as const).map((stepName, index) => (
                <div key={stepName} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === stepName ? 'bg-primary-600 text-white' :
                    ['therapists', 'schedule', 'payment', 'confirmation'].indexOf(step) > index ? 'bg-green-500 text-white' :
                    'bg-neutral-200 text-neutral-600'
                  }`}>
                    {['therapists', 'schedule', 'payment', 'confirmation'].indexOf(step) > index ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && <div className="w-8 h-0.5 bg-neutral-200 ml-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription Status Banner */}
        {!subscriptionLoading && serviceAccess && (
          <div className={`rounded-xl shadow-lg mb-6 ${
            serviceAccess.hasAccess 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            {/* Main Status Row */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    serviceAccess.hasAccess ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {serviceAccess.hasAccess ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${
                      serviceAccess.hasAccess ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {serviceAccess.hasAccess 
                        ? `${serviceAccess.accessLevel} Subscription Active` 
                        : 'No Active Subscription'
                      }
                    </h3>
                    <p className={`text-sm ${
                      serviceAccess.hasAccess ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {serviceAccess.hasAccess 
                        ? `${serviceAccess.remainingMinutes} minutes remaining this month`
                        : serviceAccess.reason || 'Subscribe to access therapy sessions'
                      }
                    </p>
                  </div>
                </div>
                
                {serviceAccess.hasAccess && (
                  <div className="flex items-center space-x-4 text-sm">
                    {serviceAccess.canBookEmergency && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <Zap className="h-4 w-4" />
                        <span>Emergency Sessions</span>
                      </div>
                    )}
                    {serviceAccess.has24x7Support && (
                      <div className="flex items-center space-x-1 text-purple-600">
                        <Clock className="h-4 w-4" />
                        <span>24/7 Support</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Timer className="h-4 w-4" />
                      <span>Max {serviceAccess.maxConcurrentSessions} sessions</span>
                    </div>
                  </div>
                )}

                {!serviceAccess.hasAccess && (
                  <button 
                    onClick={onNavigateToSubscription || (() => console.log('Navigation to subscription not available'))}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Subscribe Now
                  </button>
                )}
              </div>
            </div>

            {/* Usage Statistics Row */}
            {serviceAccess.hasAccess && (
              <div className="px-4 pb-4">
                <div className="border-t border-green-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Monthly Usage Statistics</span>
                    </div>
                    <button 
                      onClick={onNavigateToSubscription || (() => console.log('Navigation to subscription not available'))}
                      className="text-xs text-green-600 hover:text-green-700 underline"
                    >
                      Manage Subscription
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Minutes Used</span>
                        <span className="font-semibold text-green-800">
                          {(serviceAccess.totalMinutes || 0) - serviceAccess.remainingMinutes} / {serviceAccess.totalMinutes || 0}
                        </span>
                      </div>
                      <div className="w-full bg-green-100 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${Math.min(100, ((serviceAccess.totalMinutes || 0) - serviceAccess.remainingMinutes) / (serviceAccess.totalMinutes || 1) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Sessions This Month</span>
                        <span className="font-semibold text-green-800">
                          {serviceAccess.sessionsThisMonth || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Emergency Sessions</span>
                        <span className="font-semibold text-green-800">
                          {serviceAccess.emergencySessionsUsed || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Select Therapist */}
        {step === 'therapists' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Search Therapists
                  </label>
                  <input
                    type="text"
                    placeholder="Search by anonymous ID or specialization..."
                    className="form-input w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Specialization
                  </label>
                  <select
                    className="form-input w-full"
                    value={filterSpecialization}
                    onChange={(e) => setFilterSpecialization(e.target.value)}
                  >
                    {specializations.map(spec => (
                      <option key={spec} value={spec.toLowerCase()}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Therapists List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTherapists.map((therapist) => (
                <div key={therapist.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {therapist.anonymousId.split('_')[0].substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-neutral-800">{therapist.anonymousId}</h3>
                        {therapist.isVerified && (
                          <Shield className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-neutral-600 text-sm mb-2">{therapist.title}</p>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{therapist.rating}</span>
                          <span className="text-sm text-neutral-500">({therapist.reviewCount})</span>
                        </div>
                        <span className="text-sm text-neutral-500">•</span>
                        <span className="text-sm text-neutral-500">{therapist.experience} years exp</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {therapist.specializations.slice(0, 3).map(spec => (
                          <span key={spec} className="px-2 py-1 bg-primary-100 text-primary-600 rounded text-xs">
                            {spec}
                          </span>
                        ))}
                        {therapist.specializations.length > 3 && (
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs">
                            +{therapist.specializations.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-neutral-800">
                          ${therapist.hourlyRate} <span className="text-sm font-normal text-neutral-600">TERAP/hour</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTherapist(therapist);
                            setStep('schedule');
                          }}
                          className="btn-primary py-2 px-4 text-sm"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Schedule Session */}
        {step === 'schedule' && selectedTherapist && (
          <div className="space-y-6">
            {/* Selected Therapist Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-4">Selected Therapist</h2>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedTherapist.anonymousId.split('_')[0].substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-neutral-800">{selectedTherapist.anonymousId}</div>
                  <div className="text-sm text-neutral-600">{selectedTherapist.title}</div>
                </div>
              </div>
            </div>

            {/* Session Type Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-4">Session Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sessionTypes.map(sessionType => (
                  <button
                    key={sessionType.id}
                    onClick={() => setSelectedSessionType(sessionType)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      selectedSessionType?.id === sessionType.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="font-semibold text-neutral-800 mb-1">{sessionType.name}</div>
                    <div className="text-sm text-neutral-600 mb-2">{sessionType.description}</div>
                    <div className="text-sm text-neutral-500">{sessionType.duration} minutes</div>
                    <div className="text-lg font-bold text-primary-600 mt-2">
                      ${Math.round(selectedTherapist.hourlyRate * sessionType.priceMultiplier)} TERAP
                    </div>
                  </button>
                ))}
              </div>

              {/* Emergency Session Toggle */}
              {serviceAccess?.canBookEmergency && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEmergencySession}
                      onChange={(e) => setIsEmergencySession(e.target.checked)}
                      className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-800">Emergency Session</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        Immediate availability with priority scheduling. Additional emergency rates apply.
                      </p>
                      {isEmergencySession && (
                        <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
                          <strong>Emergency Rate:</strong> ${EMERGENCY_SESSION_RATES.base}/session base + 
                          ${EMERGENCY_SESSION_RATES.additional_minutes}/min for {selectedSessionType?.duration || 60} minutes
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Date and Time Selection */}
            {selectedSessionType && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-4">Select Date & Time</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Available Dates
                    </label>
                    <div className="space-y-2">
                      {getAvailableDates().map(date => (
                        <button
                          key={date}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedTime('');
                          }}
                          className={`w-full p-3 text-left border rounded-lg transition-colors ${
                            selectedDate === date
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="font-medium text-neutral-800">
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Available Times
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {getAvailableTimes(selectedDate).map(timeSlot => (
                          <button
                            key={timeSlot.time}
                            onClick={() => setSelectedTime(timeSlot.time)}
                            className={`p-3 border rounded-lg transition-colors ${
                              selectedTime === timeSlot.time
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="font-medium text-neutral-800">{timeSlot.time}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex space-x-4">
              <button
                onClick={() => setStep('therapists')}
                className="btn-outline flex-1"
              >
                Back to Therapists
              </button>
              <button
                onClick={() => setStep('payment')}
                disabled={!selectedSessionType || !selectedDate || !selectedTime}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 'payment' && selectedTherapist && selectedSessionType && (
          <div className="space-y-6">
            {/* Session Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-4">Session Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-neutral-600">Therapist</span>
                  <span className="font-medium text-neutral-800">{selectedTherapist.anonymousId}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-neutral-600">Session Type</span>
                  <span className="font-medium text-neutral-800">{selectedSessionType.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-neutral-600">Date & Time</span>
                  <span className="font-medium text-neutral-800">
                    {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-neutral-600">Duration</span>
                  <span className="font-medium text-neutral-800">{selectedSessionType.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-lg font-semibold text-neutral-800">Total Cost</span>
                  <span className="text-2xl font-bold text-primary-600">{calculateTotalCost()} TERAP</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-4">Payment Method</h2>
              <div className="space-y-4">
                <div className="p-4 border-2 border-primary-500 bg-primary-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-6 w-6 text-primary-600" />
                      <div>
                        <div className="font-medium text-neutral-800">TERAP Wallet Balance</div>
                        <div className="text-sm text-neutral-600">Pay directly from your connected wallet</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-primary-600">2,500 TERAP</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex space-x-4">
              <button
                onClick={() => setStep('schedule')}
                className="btn-outline flex-1"
              >
                Back to Schedule
              </button>
              <button
                onClick={handleBookSession}
                className="btn-primary flex-1"
              >
                Confirm & Pay {calculateTotalCost()} TERAP
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirmation' && selectedTherapist && selectedSessionType && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-neutral-800 mb-4">Session Booked Successfully!</h2>
            <p className="text-neutral-600 mb-8">
              Your therapy session with {selectedTherapist.anonymousId} has been confirmed.
            </p>
            
            <div className="bg-neutral-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-neutral-800 mb-3">Session Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Therapist:</span>
                  <span className="font-medium">{selectedTherapist.anonymousId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Type:</span>
                  <span className="font-medium">{selectedSessionType.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Date:</span>
                  <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Encrypted Session Ready</span>
              </div>
              <p className="text-sm text-blue-700">
                Your session will use end-to-end encryption for maximum privacy. 
                You can join 15 minutes before your scheduled time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isSessionTimeActive() ? (
                <a
                  href={generateSessionUrl(`session_${Date.now()}`)}
                  className="btn-primary flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <Video className="h-4 w-4" />
                  <span>Join Encrypted Session Now</span>
                </a>
              ) : (
                <div className="text-center">
                  <button 
                    disabled
                    className="btn-primary flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Session Starts at {selectedTime}</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    You can join 15 minutes before your session time
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => {
                  setStep('therapists');
                  setSelectedTherapist(null);
                  setSelectedDate('');
                  setSelectedTime('');
                  setSelectedSessionType(null);
                }}
                className="btn-outline"
              >
                Book Another Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionBooking;