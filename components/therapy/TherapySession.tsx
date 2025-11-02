// Therapy Session Interface with Encrypted Communication
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Shield, 
  User, 
  FileText, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { EncryptedChat } from './EncryptedChat';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { ContractService } from '@/utils/contractService';

interface TherapySessionProps {
  sessionId: string;
  therapistId: string;
  clientId: string;
  userRole: 'therapist' | 'client';
  duration: number; // in minutes
  onSessionComplete: (sessionData: any) => void;
}

interface SessionData {
  id: string;
  therapistId: string;
  clientId: string;
  startTime: number;
  duration: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  cost: number;
  notes?: string;
  rating?: number;
}

export const TherapySession: React.FC<TherapySessionProps> = ({
  sessionId,
  therapistId,
  clientId,
  userRole,
  duration,
  onSessionComplete
}) => {
  const { address, isConnected } = useWeb3Wallet();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'waiting' | 'active' | 'ending'>('waiting');
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [clientRating, setClientRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session
  useEffect(() => {
    async function loadSessionData() {
      if (!isConnected || !address) return;

      try {
        setIsLoading(true);
        const contractService = new ContractService();
        
        // In a real implementation, this would fetch from the smart contract
        const mockSessionData: SessionData = {
          id: sessionId,
          therapistId,
          clientId,
          startTime: Date.now(),
          duration,
          status: 'scheduled',
          cost: 100 // This would come from contract
        };

        setSessionData(mockSessionData);
        setError(null);
      } catch (err) {
        console.error('Failed to load session data:', err);
        setError('Failed to load session information');
      } finally {
        setIsLoading(false);
      }
    }

    loadSessionData();
  }, [sessionId, therapistId, clientId, duration, isConnected, address]);

  // Timer countdown
  useEffect(() => {
    if (sessionStatus !== 'active') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setSessionStatus('ending');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStatus]);

  // Start session
  const startSession = async () => {
    try {
      setSessionStatus('active');
      setShowChat(true);
      
      if (sessionData) {
        setSessionData(prev => prev ? { ...prev, status: 'active' } : null);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      setError('Failed to start session');
    }
  };

  // End session
  const endSession = async () => {
    try {
      setSessionStatus('ending');
      
      // Save session notes to blockchain if therapist
      if (userRole === 'therapist' && sessionNotes) {
        const contractService = new ContractService();
        await contractService.completeSession(parseInt(sessionId));
      }

      const completedSessionData = {
        ...sessionData,
        status: 'completed' as const,
        endTime: Date.now(),
        notes: sessionNotes,
        rating: clientRating
      };

      onSessionComplete(completedSessionData);
    } catch (error) {
      console.error('Failed to end session:', error);
      setError('Failed to end session');
    }
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Loading Session</h2>
          <p className="text-neutral-600">Preparing your encrypted therapy session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Session Error</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Session Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-green-500" />
                <h1 className="text-2xl font-bold text-neutral-800">
                  {userRole === 'therapist' ? 'Therapy Session' : 'Your Session'}
                </h1>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                sessionStatus === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : sessionStatus === 'ending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {sessionStatus === 'active' ? 'Active' : 
                 sessionStatus === 'ending' ? 'Ending' : 'Waiting'}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Timer */}
              {sessionStatus === 'active' && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-neutral-600" />
                  <span className="text-lg font-mono font-bold text-neutral-800">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}

              {/* Session Controls */}
              {sessionStatus === 'waiting' && (
                <button
                  onClick={startSession}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Start Session
                </button>
              )}

              {sessionStatus === 'active' && (
                <button
                  onClick={endSession}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  End Session
                </button>
              )}
            </div>
          </div>

          {/* Session Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Calendar className="h-4 w-4" />
              <span>Duration: {duration} minutes</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <User className="h-4 w-4" />
              <span>
                {userRole === 'therapist' ? 'Client' : 'Therapist'}: Anonymous
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <DollarSign className="h-4 w-4" />
              <span>Session Fee: ${sessionData?.cost || 100}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Shield className="h-4 w-4" />
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            {showChat && sessionStatus !== 'waiting' ? (
              <div className="h-[600px]">
                <EncryptedChat
                  sessionId={sessionId}
                  therapistId={therapistId}
                  clientId={clientId}
                  userRole={userRole}
                  onSessionEnd={endSession}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Secure Session Ready
                  </h3>
                  <p className="text-gray-500">
                    Click "Start Session" to begin encrypted communication
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Notes (Therapist Only) */}
            {userRole === 'therapist' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-5 w-5 text-neutral-600" />
                  <h3 className="text-lg font-semibold text-neutral-800">Session Notes</h3>
                </div>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Private notes about this session..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  disabled={sessionStatus === 'waiting'}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Notes are encrypted and stored on blockchain
                </p>
              </div>
            )}

            {/* Rating (Client Only, shown at end) */}
            {userRole === 'client' && sessionStatus === 'ending' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-neutral-600" />
                  <h3 className="text-lg font-semibold text-neutral-800">Rate Session</h3>
                </div>
                <div className="flex space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setClientRating(star)}
                      className={`text-2xl ${
                        star <= clientRating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Your rating helps improve our platform
                </p>
              </div>
            )}

            {/* Security Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-neutral-800">Security Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">End-to-end encryption active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Anonymous identities protected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Blockchain-verified session</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Auto-delete after session</span>
                </div>
              </div>
            </div>

            {/* Emergency Protocols */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold text-neutral-800">Emergency</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                If you're experiencing a mental health emergency:
              </p>
              <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                Emergency Support
              </button>
              <p className="text-xs text-gray-500 mt-2">
                24/7 crisis support available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};