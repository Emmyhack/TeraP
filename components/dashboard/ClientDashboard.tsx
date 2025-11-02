// Client Dashboard Component
'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Users, BookOpen, TrendingUp, Heart, MessageCircle, Award, Shield, User, Book } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import { ContractService } from '@/utils/contractService';

interface ClientSession {
  id: string;
  therapistId: string;
  therapistName: string;
  date: string;
  time: string;
  type: 'individual' | 'group';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface WellnessCircle {
  id: string;
  name: string;
  description: string;
  members: number;
  category: 'anxiety' | 'depression' | 'addiction' | 'general';
  isPrivate: boolean;
}

const ClientDashboard: React.FC = () => {
  const { isConnected, address } = useWeb3Wallet();
  const { dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'sessions' | 'wellness' | 'progress' | 'resources'>('sessions');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [wellnessCircles, setWellnessCircles] = useState<WellnessCircle[]>([]);

  // Load user sessions and wellness circles from blockchain
  useEffect(() => {
    async function loadUserData() {
      if (!isConnected || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const contractService = new ContractService();

        // Load user sessions from smart contract
        const userSessions = await contractService.getUserSessions(address);
        setSessions(userSessions || []);

        // Load wellness circles from smart contract
        const circles = await contractService.getWellnessCircles();
        setWellnessCircles(circles || []);

      } catch (error) {
        console.error('Error loading user data:', error);
        // Keep empty arrays on error
        setSessions([]);
        setWellnessCircles([]);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [isConnected, address]);

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Connect Wallet</h2>
          <p className="text-neutral-600">Please connect your wallet to access your wellness journey.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Loading Your Dashboard</h2>
          <p className="text-neutral-600">Fetching your sessions and wellness data from the blockchain...</p>
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
              <h1 className="text-3xl font-bold text-neutral-800">Your Wellness Journey</h1>
              <p className="text-neutral-600 mt-2">Welcome back! Continue your path to better mental health.</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{upcomingSessions.length}</div>
                <div className="text-sm text-neutral-600">Upcoming Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-600">{completedSessions.length}</div>
                <div className="text-sm text-neutral-600">Sessions Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-600">{wellnessCircles.length}</div>
                <div className="text-sm text-neutral-600">Wellness Circles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow">
            <Calendar className="h-8 w-8 text-primary-600 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Book Session</h3>
            <p className="text-neutral-600">Schedule therapy session</p>
          </button>
          <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow">
            <MessageCircle className="h-8 w-8 text-accent-600 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Join Circle</h3>
            <p className="text-neutral-600">Connect with support groups</p>
          </button>
          <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow">
            <Heart className="h-8 w-8 text-secondary-600 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Mood Check</h3>
            <p className="text-neutral-600">Track your daily mood</p>
          </button>
          <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow">
            <Shield className="h-8 w-8 text-neutral-600 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Crisis Support</h3>
            <p className="text-neutral-600">Immediate help resources</p>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
            {(['sessions', 'wellness', 'progress', 'resources'] as const).map((tab) => (
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
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Upcoming Sessions</h2>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border-l-4 border-primary-500">
                      <div className="flex items-center space-x-4">
                        <User className="h-8 w-8 text-primary-600" />
                        <div>
                          <div className="font-medium text-neutral-800">{session.therapistName}</div>
                          <div className="text-sm text-neutral-600">
                            {session.date} at {session.time} • {session.type} session
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button className="btn-outline">Reschedule</button>
                        <button className="btn-primary">Join Session</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No upcoming sessions. Book your next therapy session!</p>
                  <button className="btn-primary mt-4">Book Session</button>
                </div>
              )}
            </div>

            {/* Session History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Session History</h2>
              <div className="space-y-4">
                {completedSessions.map((session) => (
                  <div key={session.id} className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-neutral-800">{session.therapistName}</div>
                      <div className="text-sm text-neutral-600">{session.date}</div>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-neutral-600 bg-white p-3 rounded border-l-4 border-accent-300">
                        <strong>Session Notes:</strong> {session.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wellness' && (
          <div className="space-y-6">
            {/* My Wellness Circles */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">My Wellness Circles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wellnessCircles.map((circle) => (
                  <div key={circle.id} className="border border-neutral-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-800">{circle.name}</h3>
                        <p className="text-neutral-600 text-sm mt-1">{circle.description}</p>
                      </div>
                      <span className="px-2 py-1 bg-primary-100 text-primary-600 rounded text-xs font-medium capitalize">
                        {circle.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-neutral-600">
                        {circle.members} members • {circle.isPrivate ? 'Private' : 'Public'}
                      </div>
                      <button className="btn-primary py-2 px-4 text-sm">Enter Circle</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-outline w-full mt-6">Browse More Wellness Circles</button>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Your Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-primary-50 rounded-lg">
                <TrendingUp className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-primary-600">78%</div>
                <div className="text-sm text-neutral-600">Overall Progress</div>
              </div>
              <div className="text-center p-6 bg-accent-50 rounded-lg">
                <Heart className="h-12 w-12 text-accent-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-accent-600">7.2</div>
                <div className="text-sm text-neutral-600">Average Mood (7 days)</div>
              </div>
              <div className="text-center p-6 bg-secondary-50 rounded-lg">
                <Calendar className="h-12 w-12 text-secondary-600 mx-auto mb-4" />
                <div className="text-2xl font-bold text-secondary-600">{completedSessions.length}</div>
                <div className="text-sm text-neutral-600">Sessions Completed</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-neutral-600 mb-4">Track your daily mood to see detailed progress insights</p>
              <button className="btn-primary">Log Today's Mood</button>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Mental Health Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 border border-neutral-200 rounded-lg">
                  <Book className="h-8 w-8 text-primary-600 mb-4" />
                  <h3 className="font-semibold text-neutral-800 mb-2">Self-Help Guides</h3>
                  <p className="text-neutral-600 text-sm mb-4">Evidence-based techniques for managing anxiety and depression</p>
                  <button className="btn-outline w-full">Browse Guides</button>
                </div>
                <div className="p-6 border border-neutral-200 rounded-lg">
                  <MessageCircle className="h-8 w-8 text-accent-600 mb-4" />
                  <h3 className="font-semibold text-neutral-800 mb-2">Crisis Hotlines</h3>
                  <p className="text-neutral-600 text-sm mb-4">24/7 support when you need immediate help</p>
                  <button className="btn-outline w-full">View Contacts</button>
                </div>
                <div className="p-6 border border-neutral-200 rounded-lg">
                  <Heart className="h-8 w-8 text-secondary-600 mb-4" />
                  <h3 className="font-semibold text-neutral-800 mb-2">Wellness Tools</h3>
                  <p className="text-neutral-600 text-sm mb-4">Meditation, breathing exercises, and mood tracking</p>
                  <button className="btn-outline w-full">Try Tools</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;