'use client';

import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Stethoscope, 
  Settings, 
  LogOut, 
  Edit3, 
  Save, 
  X,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle
} from 'lucide-react';
import { useZKIdentity } from './ZKIdentityProvider';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const UserProfile: React.FC = () => {
  const { currentSession, logout, updateProfile } = useZKIdentity();
  const { address: walletAddress, chainId } = useWeb3Wallet();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editData, setEditData] = useState({
    displayName: currentSession?.profile?.displayName || '',
    specializations: currentSession?.profile?.specializations || [],
    language: currentSession?.profile?.preferences?.language || 'en',
    timezone: currentSession?.profile?.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    communicationStyle: currentSession?.profile?.preferences?.communicationStyle || 'supportive'
  });

  const specializations = [
    'Anxiety', 'Depression', 'PTSD', 'Addiction Recovery', 'Couples Therapy',
    'Family Counseling', 'Grief Counseling', 'Eating Disorders', 'OCD',
    'Bipolar Disorder', 'ADHD', 'Autism Spectrum', 'Life Transitions',
    'Stress Management', 'Sleep Disorders', 'Chronic Pain', 'LGBTQ+ Issues'
  ];

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      
      await updateProfile({
        displayName: editData.displayName,
        specializations: currentSession?.profile?.role === 'therapist' ? editData.specializations : undefined,
        preferences: {
          language: editData.language,
          timezone: editData.timezone,
          communicationStyle: editData.communicationStyle
        }
      });
      
      setIsEditing(false);
      alert('Profile updated successfully!');
      
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = confirm('Are you sure you want to logout? You will need to authenticate again to access your identity.');
    if (confirmed) {
      await logout();
    }
  };

  const toggleSpecialization = (spec: string) => {
    setEditData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  if (!currentSession?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Profile Found</h2>
          <p className="text-gray-500">Unable to load user profile information.</p>
        </div>
      </div>
    );
  }

  const profile = currentSession.profile;
  const isTherapist = profile.role === 'therapist';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isTherapist ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {isTherapist ? (
                      <Stethoscope className={`h-8 w-8 ${isTherapist ? 'text-green-600' : 'text-blue-600'}`} />
                    ) : (
                      <User className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.displayName}
                        onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="text-2xl font-bold text-gray-900 border-b-2 border-blue-300 focus:border-blue-500 outline-none bg-transparent"
                        placeholder="Display Name"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-gray-900">{profile.displayName}</h1>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isTherapist 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isTherapist ? 'Therapist' : 'Client'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4" />
                      <span>Anonymous ID: {profile.zkCommitment?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Active since {new Date(profile.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Profile Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Profile Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  {isEditing ? (
                    <select
                      value={editData.language}
                      onChange={(e) => setEditData(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{profile.preferences?.language || 'English'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  {isEditing ? (
                    <select
                      value={editData.timezone}
                      onChange={(e) => setEditData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profile.preferences?.timezone || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Communication Style</label>
                  {isEditing ? (
                    <select
                      value={editData.communicationStyle}
                      onChange={(e) => setEditData(prev => ({ ...prev, communicationStyle: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                      <option value="supportive">Supportive</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 flex items-center capitalize">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {profile.preferences?.communicationStyle || 'Supportive'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Specializations (for therapists) */}
            {isTherapist && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h2>
                
                {isEditing ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-3">Select your areas of expertise:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {specializations.map((spec) => (
                        <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editData.specializations.includes(spec)}
                            onChange={() => toggleSpecialization(spec)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{spec}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations && profile.specializations.length > 0 ? (
                      profile.specializations.map((spec: string) => (
                        <span
                          key={spec}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {spec}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No specializations set</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Wallet Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Wallet</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
                  <p className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                    {walletAddress || 'Not connected'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chain ID</label>
                  <p className="text-gray-900">{chainId || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Identity Commitment</label>
                  <p className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                    {profile.zkCommitment?.slice(0, 20)}...{profile.zkCommitment?.slice(-20)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats & Activity */}
            {!isTherapist && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Stats</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-blue-800">Sessions</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-green-800">Circles Joined</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-purple-800">TRP Balance</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">0</div>
                    <div className="text-sm text-yellow-800">DAO Votes</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;