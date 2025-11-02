// Therapist Dashboard Component
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, Clock, BookOpen, Settings, Award, TrendingUp, Star, CheckCircle } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { ContractService } from '@/utils/contractService';

interface TherapistSession {
  id: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  type: 'individual' | 'group';
  status: 'scheduled' | 'completed' | 'cancelled';
  fee: number;
}

const TherapistDashboard: React.FC = () => {
  const { isConnected, address } = useWeb3Wallet();
  const { dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'sessions' | 'earnings' | 'profile'>('sessions');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<TherapistSession[]>([]);

  // Load therapist sessions from blockchain
  useEffect(() => {
    async function loadTherapistData() {
      if (!isConnected || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const contractService = new ContractService();

        // Load therapist sessions from smart contract
        const therapistSessions = await contractService.getTherapistSessions(address);
        setSessions(therapistSessions || []);

      } catch (error) {
        console.error('Error loading therapist data:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }

    loadTherapistData();
  }, [isConnected, address]);

  const totalEarnings = sessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.fee, 0);

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Connect Wallet</h2>
          <p className="text-neutral-600">Please connect your wallet to access the therapist dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Loading Therapist Dashboard</h2>
          <p className="text-neutral-600">Fetching your sessions and earnings from the blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">Therapist Dashboard</h1>
              <p className="text-neutral-600 mt-2">Welcome back, Dr. {address?.slice(0, 8)}...</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{upcomingSessions.length}</div>
                <div className="text-sm text-neutral-600">Upcoming Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-600">${totalEarnings}</div>
                <div className="text-sm text-neutral-600">Total Earnings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
            {(['sessions', 'earnings', 'profile'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow">
                <Calendar className="h-8 w-8 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Schedule Session</h3>
                <p className="text-neutral-600">Create new therapy session</p>
              </button>
              <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow">
                <Users className="h-8 w-8 text-accent-600 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Wellness Circle</h3>
                <p className="text-neutral-600">Join or create support groups</p>
              </button>
              <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow">
                <Star className="h-8 w-8 text-secondary-600 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Update Profile</h3>
                <p className="text-neutral-600">Manage credentials & specializations</p>
              </button>
            </div>

            {/* Sessions List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Recent Sessions</h2>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        session.status === 'completed' ? 'bg-green-500' : 
                        session.status === 'scheduled' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium text-neutral-800">
                          Client {session.clientId}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {session.date} at {session.time} • {session.duration} minutes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium text-neutral-800">${session.fee} TERAP</div>
                        <div className={`text-sm capitalize ${
                          session.status === 'completed' ? 'text-green-600' : 
                          session.status === 'scheduled' ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {session.status}
                        </div>
                      </div>
                      {session.status === 'scheduled' && (
                        <button className="btn-primary py-2 px-4 text-sm">
                          Start Session
                        </button>
                      )}
                      {session.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Earnings Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary-600">${totalEarnings}</div>
                <div className="text-sm text-neutral-600">Total Earned</div>
              </div>
              <div className="text-center p-4 bg-accent-50 rounded-lg">
                <Clock className="h-8 w-8 text-accent-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-accent-600">
                  {sessions.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-neutral-600">Sessions Completed</div>
              </div>
              <div className="text-center p-4 bg-secondary-50 rounded-lg">
                <Star className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-secondary-600">4.9</div>
                <div className="text-sm text-neutral-600">Average Rating</div>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <Users className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-neutral-600">
                  {new Set(sessions.map(s => s.clientId)).size}
                </div>
                <div className="text-sm text-neutral-600">Unique Clients</div>
              </div>
            </div>
            <button className="btn-primary w-full">
              Withdraw Earnings
            </button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Therapist Profile</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  placeholder="Enter your license number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Specializations
                </label>
                <textarea
                  className="form-input w-full h-32"
                  placeholder="List your areas of specialization..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Hourly Rate (TERAP)
                </label>
                <input
                  type="number"
                  className="form-input w-full"
                  placeholder="100"
                />
              </div>
              <button className="btn-primary">
                Update Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistDashboard;