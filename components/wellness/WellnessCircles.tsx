// Wellness Circle Component
'use client';

import React, { useState } from 'react';
import { Users, MessageCircle, Lock, Globe, Calendar, Heart, Shield, Plus } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { useApp } from '@/stores/AppProvider';
import CircleChat from './CircleChat';

interface WellnessCircle {
  id: string;
  name: string;
  description: string;
  category: 'anxiety' | 'depression' | 'addiction' | 'grief' | 'general' | 'trauma';
  members: number;
  maxMembers: number;
  isPrivate: boolean;
  entryStake: number;
  facilitator: string;
  created: string;
  isJoined: boolean;
  onlineNow: number;
}

interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isAnonymous: boolean;
}

const WellnessCircles: React.FC = () => {
  const { isConnected, address } = useWeb3Wallet();
  const { dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-circles' | 'create'>('browse');
  const [selectedCircle, setSelectedCircle] = useState<WellnessCircle | null>(null);
  const [activeChatCircle, setActiveChatCircle] = useState<WellnessCircle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data
  const [circles] = useState<WellnessCircle[]>([
    {
      id: '1',
      name: 'Anxiety Support Circle',
      description: 'A safe space to share experiences and coping strategies for anxiety management. Weekly guided discussions with licensed facilitators.',
      category: 'anxiety',
      members: 24,
      maxMembers: 30,
      isPrivate: false,
      entryStake: 10,
      facilitator: 'Dr. Sarah Johnson',
      created: '2025-09-15',
      isJoined: true,
      onlineNow: 8
    },
    {
      id: '2',
      name: 'Mindfulness & Meditation',
      description: 'Daily meditation sessions and mindfulness practices. Learn techniques for stress reduction and emotional regulation.',
      category: 'general',
      members: 18,
      maxMembers: 25,
      isPrivate: false,
      entryStake: 5,
      facilitator: 'Michael Chen',
      created: '2025-10-01',
      isJoined: false,
      onlineNow: 12
    },
    {
      id: '3',
      name: 'Trauma Recovery Support',
      description: 'Private group for trauma survivors. Peer support and healing-focused discussions in a confidential environment.',
      category: 'trauma',
      members: 12,
      maxMembers: 15,
      isPrivate: true,
      entryStake: 25,
      facilitator: 'Dr. Emily Rodriguez',
      created: '2025-08-20',
      isJoined: false,
      onlineNow: 3
    },
    {
      id: '4',
      name: 'Depression Recovery Group',
      description: 'Supportive community for those dealing with depression. Share experiences, coping strategies, and celebrate small victories.',
      category: 'depression',
      members: 31,
      maxMembers: 35,
      isPrivate: false,
      entryStake: 15,
      facilitator: 'Dr. James Wilson',
      created: '2025-09-01',
      isJoined: true,
      onlineNow: 7
    }
  ]);

  const [messages] = useState<Message[]>([
    {
      id: '1',
      author: 'Anonymous_User_42',
      content: 'Had a really good day today. Managed to go for a walk and practice the breathing techniques we discussed. Thank you all for the support! 💙',
      timestamp: '2 hours ago',
      isAnonymous: true
    },
    {
      id: '2',
      author: 'Sarah',
      content: 'Remember that healing isn\'t linear. Some days are better than others, and that\'s completely normal. You\'re all doing great! 🌟',
      timestamp: '4 hours ago',
      isAnonymous: false
    }
  ]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'anxiety', label: 'Anxiety' },
    { value: 'depression', label: 'Depression' },
    { value: 'trauma', label: 'Trauma' },
    { value: 'addiction', label: 'Addiction' },
    { value: 'grief', label: 'Grief' },
    { value: 'general', label: 'General Support' }
  ];

  const filteredCircles = circles.filter(circle => {
    const matchesSearch = circle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         circle.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || circle.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const myCircles = circles.filter(circle => circle.isJoined);

  const handleJoinCircle = (circle: WellnessCircle) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        type: 'success',
        title: 'Circle Joined',
        message: `Successfully joined ${circle.name}! Welcome to the community.`,
        timestamp: new Date()
      }
    });
  };

  const handleCreateCircle = (data: any) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        type: 'success',
        title: 'Circle Created',
        message: 'Wellness Circle created successfully! Members can now join.',
        timestamp: new Date()
      }
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Connect Wallet</h2>
          <p className="text-neutral-600">Please connect your wallet to join wellness circles.</p>
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
              <h1 className="text-3xl font-bold text-neutral-800">Wellness Circles</h1>
              <p className="text-neutral-600 mt-2">Join supportive communities on your healing journey</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{myCircles.length}</div>
                <div className="text-sm text-neutral-600">Your Circles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-600">{circles.length}</div>
                <div className="text-sm text-neutral-600">Available Circles</div>
              </div>
              <button 
                onClick={() => setActiveTab('create')}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Circle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
            {(['browse', 'my-circles', 'create'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Search Circles
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    className="form-input w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Category
                  </label>
                  <select
                    className="form-input w-full"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Circles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCircles.map((circle) => (
                <div key={circle.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-800">{circle.name}</h3>
                        {circle.isPrivate ? (
                          <Lock className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <Globe className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <span className="px-2 py-1 bg-primary-100 text-primary-600 rounded text-xs font-medium capitalize">
                        {circle.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-neutral-800">
                        {circle.members}/{circle.maxMembers}
                      </div>
                      <div className="text-xs text-neutral-500">members</div>
                    </div>
                  </div>

                  <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{circle.description}</p>

                  <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{circle.onlineNow} online now</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{circle.entryStake} TERAP</span>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-500 mb-4">
                    Facilitated by {circle.facilitator}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedCircle(circle)}
                      className="btn-outline flex-1 text-sm py-2"
                    >
                      View Details
                    </button>
                    {circle.isJoined ? (
                      <button 
                        onClick={() => setActiveChatCircle(circle)}
                        className="btn-primary flex-1 text-sm py-2"
                      >
                        Enter Circle
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinCircle(circle)}
                        className="btn-primary flex-1 text-sm py-2"
                        disabled={circle.members >= circle.maxMembers}
                      >
                        {circle.members >= circle.maxMembers ? 'Full' : 'Join Circle'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'my-circles' && (
          <div className="space-y-6">
            {myCircles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myCircles.map((circle) => (
                  <div key={circle.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-neutral-800">{circle.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{circle.onlineNow} online</span>
                      </div>
                    </div>

                    <p className="text-neutral-600 text-sm mb-4">{circle.description}</p>

                    {/* Recent Activity */}
                    <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-neutral-800 mb-3">Recent Messages</h4>
                      <div className="space-y-2">
                        {messages.slice(0, 2).map((message) => (
                          <div key={message.id} className="text-xs">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-neutral-700">{message.author}</span>
                              <span className="text-neutral-400">{message.timestamp}</span>
                            </div>
                            <p className="text-neutral-600">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveChatCircle(circle)}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Enter Circle</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">No Circles Yet</h3>
                <p className="text-neutral-600 mb-6">
                  Join wellness circles to connect with supportive communities
                </p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="btn-primary"
                >
                  Browse Circles
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Create Wellness Circle</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Circle Name *
                  </label>
                  <input
                    type="text"
                    className="form-input w-full"
                    placeholder="Enter circle name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Category *
                  </label>
                  <select className="form-input w-full">
                    <option value="">Select category...</option>
                    {categories.slice(1).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description *
                </label>
                <textarea
                  className="form-input w-full h-32"
                  placeholder="Describe the purpose and guidelines of your circle..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Max Members *
                  </label>
                  <input
                    type="number"
                    className="form-input w-full"
                    placeholder="25"
                    min="5"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Entry Stake (TERAP) *
                  </label>
                  <input
                    type="number"
                    className="form-input w-full"
                    placeholder="10"
                    min="1"
                  />
                </div>
                <div className="flex items-center space-x-3 pt-7">
                  <input
                    type="checkbox"
                    id="private"
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="private" className="text-sm text-neutral-700">
                    Private Circle
                  </label>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-accent-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-neutral-800 mb-2">Circle Guidelines</h4>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• Maintain confidentiality and respect privacy</li>
                      <li>• Use supportive and non-judgmental language</li>
                      <li>• No medical advice - encourage professional help</li>
                      <li>• Report harmful behavior to moderators</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCreateCircle({});
                    setActiveTab('my-circles');
                  }}
                  className="btn-primary flex-1"
                >
                  Create Circle
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Circle Detail Modal */}
      {selectedCircle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-neutral-800">{selectedCircle.name}</h2>
                <button
                  onClick={() => setSelectedCircle(null)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-sm font-medium capitalize">
                    {selectedCircle.category}
                  </span>
                  {selectedCircle.isPrivate ? (
                    <div className="flex items-center space-x-1 text-sm text-neutral-600">
                      <Lock className="h-4 w-4" />
                      <span>Private Circle</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-sm text-green-600">
                      <Globe className="h-4 w-4" />
                      <span>Public Circle</span>
                    </div>
                  )}
                </div>

                <p className="text-neutral-600">{selectedCircle.description}</p>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{selectedCircle.members}</div>
                    <div className="text-sm text-neutral-600">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-600">{selectedCircle.entryStake}</div>
                    <div className="text-sm text-neutral-600">TERAP Entry</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-neutral-600">Facilitated by</div>
                  <div className="font-medium text-neutral-800">{selectedCircle.facilitator}</div>
                </div>

                {selectedCircle.isJoined ? (
                  <button
                    onClick={() => {
                      setActiveChatCircle(selectedCircle);
                      setSelectedCircle(null);
                    }}
                    className="btn-primary w-full"
                  >
                    Enter Circle
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleJoinCircle(selectedCircle);
                      setSelectedCircle(null);
                    }}
                    className="btn-primary w-full"
                    disabled={selectedCircle.members >= selectedCircle.maxMembers}
                  >
                    {selectedCircle.members >= selectedCircle.maxMembers ? 'Circle Full' : 'Join Circle'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Circle Chat */}
      {activeChatCircle && (
        <div className="fixed inset-0 z-50">
          <CircleChat
            circleId={activeChatCircle.id}
            circleName={activeChatCircle.name}
            onBack={() => setActiveChatCircle(null)}
          />
        </div>
      )}
    </div>
  );
};

export default WellnessCircles;