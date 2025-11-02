'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  TrendingUp,
  Calendar,
  Shield,
  BarChart3,
  Brain,
  Moon,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Plus,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { useZKIdentity } from '@/components/identity/ZKIdentityProvider';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { zkMoodTrackingService } from '@/services/ZKMoodTrackingService';
import type { MoodEntry, MentalHealthAssessment, ZKMoodProof, ProgressAnalytics } from '@/services/ZKMoodTrackingService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ClientProfileData {
  personalInfo: {
    displayName: string;
    goals: string[];
    preferences: {
      reminderFrequency: 'daily' | 'weekly' | 'custom';
      privacyLevel: 'minimal' | 'standard' | 'maximum';
      dataRetention: '3months' | '6months' | '1year' | '2years';
    };
  };
  moodHistory: MoodEntry[];
  assessments: MentalHealthAssessment[];
  zkProofs: ZKMoodProof[];
  analytics: ProgressAnalytics | null;
}

const ZKClientProfile: React.FC = () => {
  const { currentSession } = useZKIdentity();
  const { address } = useWeb3Wallet();
  const [profileData, setProfileData] = useState<ClientProfileData>({
    personalInfo: {
      displayName: '',
      goals: [],
      preferences: {
        reminderFrequency: 'daily',
        privacyLevel: 'maximum',
        dataRetention: '1year'
      }
    },
    moodHistory: [],
    assessments: [],
    zkProofs: [],
    analytics: null
  });

  const [currentMood, setCurrentMood] = useState({
    moodScore: 5,
    energyLevel: 5,
    anxietyLevel: 5,
    sleepHours: 8,
    exerciseMinutes: 30,
    tags: [] as string[],
    notes: ''
  });

  const [isRecordingMood, setIsRecordingMood] = useState(false);
  const [showPrivateData, setShowPrivateData] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Mood tag options
  const moodTags = [
    'happy', 'sad', 'anxious', 'calm', 'stressed', 'excited', 
    'tired', 'energetic', 'focused', 'distracted', 'social', 'isolated',
    'motivated', 'unmotivated', 'grateful', 'frustrated'
  ];

  useEffect(() => {
    loadProfileData();
  }, [address, currentSession]);

  const loadProfileData = async () => {
    try {
      const savedProfile = localStorage.getItem(`client_profile_${address}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }
      
      // Generate analytics if we have data
      if (currentSession?.profile?.zkCommitment && profileData.moodHistory.length > 0) {
        generateAnalytics();
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const recordMoodEntry = async () => {
    if (!currentSession?.profile?.zkCommitment) return;

    setIsRecordingMood(true);
    try {
      const moodEntry: MoodEntry = {
        id: `mood_${Date.now()}`,
        timestamp: Date.now(),
        moodScore: currentMood.moodScore,
        energyLevel: currentMood.energyLevel,
        anxietyLevel: currentMood.anxietyLevel,
        sleepHours: currentMood.sleepHours,
        exerciseMinutes: currentMood.exerciseMinutes,
        tags: currentMood.tags,
        notes: currentMood.notes
      };

      // Generate ZK proof for mood entry
      const zkProof = await zkMoodTrackingService.recordMoodEntry(
        moodEntry,
        currentSession.profile.zkCommitment,
        currentSession.profile.zkCommitment
      );

      // Update profile data
      const updatedProfile = {
        ...profileData,
        moodHistory: [...profileData.moodHistory, moodEntry],
        zkProofs: [...profileData.zkProofs, zkProof]
      };

      setProfileData(updatedProfile);
      localStorage.setItem(`client_profile_${address}`, JSON.stringify(updatedProfile));

      // Reset form
      setCurrentMood({
        moodScore: 5,
        energyLevel: 5,
        anxietyLevel: 5,
        sleepHours: 8,
        exerciseMinutes: 30,
        tags: [],
        notes: ''
      });

      alert('Mood entry recorded with zero-knowledge proof! Your privacy is protected while contributing to research.');
      
      // Generate new analytics
      generateAnalytics();

    } catch (error) {
      console.error('Failed to record mood entry:', error);
      alert('Failed to record mood entry. Please try again.');
    } finally {
      setIsRecordingMood(false);
    }
  };

  const generateAnalytics = async () => {
    if (!currentSession?.profile?.zkCommitment) return;

    setIsLoadingAnalytics(true);
    try {
      const analytics = await zkMoodTrackingService.generateProgressAnalytics(
        currentSession.profile.zkCommitment,
        selectedTimeRange,
        currentSession.profile.zkCommitment
      );

      setProfileData(prev => ({
        ...prev,
        analytics
      }));

    } catch (error) {
      console.error('Failed to generate analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const submitAssessment = async (assessmentType: 'PHQ9' | 'GAD7') => {
    if (!currentSession?.profile?.zkCommitment) return;

    // Simulated assessment responses (in real app, would come from assessment form)
    const responses = Array.from({ length: 9 }, () => Math.floor(Math.random() * 4));
    const totalScore = responses.reduce((sum, score) => sum + score, 0);
    
    let severity: 'minimal' | 'mild' | 'moderate' | 'severe' = 'minimal';
    if (assessmentType === 'PHQ9') {
      if (totalScore >= 20) severity = 'severe';
      else if (totalScore >= 15) severity = 'moderate';
      else if (totalScore >= 10) severity = 'mild';
    }

    const assessment: MentalHealthAssessment = {
      id: `assessment_${Date.now()}`,
      type: assessmentType,
      timestamp: Date.now(),
      responses,
      totalScore,
      severity,
      anonymizedResponses: []
    };

    try {
      const zkProof = await zkMoodTrackingService.submitAssessment(
        assessment,
        currentSession.profile.zkCommitment,
        currentSession.profile.zkCommitment
      );

      const updatedProfile = {
        ...profileData,
        assessments: [...profileData.assessments, assessment],
        zkProofs: [...profileData.zkProofs, zkProof]
      };

      setProfileData(updatedProfile);
      localStorage.setItem(`client_profile_${address}`, JSON.stringify(updatedProfile));

      alert(`${assessmentType} assessment submitted with ZK privacy protection!`);
      
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    }
  };

  const toggleMoodTag = (tag: string) => {
    setCurrentMood(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const addGoal = (goal: string) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        goals: [...prev.personalInfo.goals, goal]
      }
    }));
  };

  const removeGoal = (goal: string) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        goals: prev.personalInfo.goals.filter(g => g !== goal)
      }
    }));
  };

  if (!currentSession?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Authentication Required</h2>
          <p className="text-gray-500">Please authenticate with your ZK identity to access your wellness profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {profileData.personalInfo.displayName.substring(0, 2).toUpperCase() || 'ME'}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">My Wellness Journey</h1>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Lock className="h-3 w-3" />
                      <span>ZK Protected</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4" />
                      <span>Anonymous ID: {currentSession.profile.zkCommitment?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{profileData.moodHistory.length} mood entries</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Brain className="h-4 w-4" />
                      <span>{profileData.assessments.length} assessments</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowPrivateData(!showPrivateData)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                {showPrivateData ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Hide Private Data</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Show Private Data</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Mood Recording */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Daily Mood Check-in
              </h2>
              
              <div className="space-y-6">
                {/* Mood Sliders */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mood Score: {currentMood.moodScore}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentMood.moodScore}
                      onChange={(e) => setCurrentMood(prev => ({ ...prev, moodScore: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Very Low</span>
                      <span>Great</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Energy Level: {currentMood.energyLevel}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentMood.energyLevel}
                      onChange={(e) => setCurrentMood(prev => ({ ...prev, energyLevel: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Exhausted</span>
                      <span>Energized</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anxiety Level: {currentMood.anxietyLevel}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentMood.anxietyLevel}
                      onChange={(e) => setCurrentMood(prev => ({ ...prev, anxietyLevel: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-red"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Very Calm</span>
                      <span>Very Anxious</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sleep Hours: {currentMood.sleepHours}h
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      value={currentMood.sleepHours}
                      onChange={(e) => setCurrentMood(prev => ({ ...prev, sleepHours: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                  </div>
                </div>

                {/* Mood Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How are you feeling? (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {moodTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleMoodTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          currentMood.tags.includes(tag)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Optional Notes (Encrypted)
                  </label>
                  <textarea
                    value={currentMood.notes}
                    onChange={(e) => setCurrentMood(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any additional thoughts or observations..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={recordMoodEntry}
                  disabled={isRecordingMood}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isRecordingMood ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Recording with ZK Proof...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Record Mood (ZK Protected)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Analytics & Progress */}
            <div className="space-y-6">
              
              {/* Progress Analytics */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Progress Analytics
                  </h3>
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="quarter">Past Quarter</option>
                  </select>
                </div>

                {profileData.analytics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {profileData.analytics.metrics.moodTrend > 0 ? '↗️' : '📈'}
                        </div>
                        <div className="text-xs text-blue-800">Mood Trend</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(profileData.analytics.metrics.stability * 100)}%
                        </div>
                        <div className="text-xs text-green-800">Stability</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Risk Level:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          profileData.analytics.riskAssessment.level === 'high' ? 'bg-red-100 text-red-800' :
                          profileData.analytics.riskAssessment.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {profileData.analytics.riskAssessment.level}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Record more mood entries to see analytics</p>
                    <button
                      onClick={generateAnalytics}
                      disabled={isLoadingAnalytics || profileData.moodHistory.length < 3}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isLoadingAnalytics ? 'Generating...' : 'Generate Analytics'}
                    </button>
                  </div>
                )}
              </div>

              {/* Mental Health Assessments */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Mental Health Assessments
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => submitAssessment('PHQ9')}
                    className="w-full p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    <div className="font-medium text-purple-800">PHQ-9 Depression Scale</div>
                    <div className="text-sm text-purple-600">Assess depression symptoms</div>
                  </button>
                  
                  <button
                    onClick={() => submitAssessment('GAD7')}
                    className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
                  >
                    <div className="font-medium text-blue-800">GAD-7 Anxiety Scale</div>
                    <div className="text-sm text-blue-600">Assess anxiety symptoms</div>
                  </button>
                </div>

                {profileData.assessments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Recent Results:</div>
                    {profileData.assessments.slice(-2).map(assessment => (
                      <div key={assessment.id} className="flex justify-between items-center text-sm py-1">
                        <span>{assessment.type}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          assessment.severity === 'severe' ? 'bg-red-100 text-red-800' :
                          assessment.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          assessment.severity === 'mild' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {assessment.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Settings */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacy & Data Control
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Privacy Level</label>
                    <select
                      value={profileData.personalInfo.preferences.privacyLevel}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          preferences: {
                            ...prev.personalInfo.preferences,
                            privacyLevel: e.target.value as any
                          }
                        }
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="maximum">Maximum (Zero-Knowledge)</option>
                      <option value="standard">Standard</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Data Retention</label>
                    <select
                      value={profileData.personalInfo.preferences.dataRetention}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          preferences: {
                            ...prev.personalInfo.preferences,
                            dataRetention: e.target.value as any
                          }
                        }
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="3months">3 Months</option>
                      <option value="6months">6 Months</option>
                      <option value="1year">1 Year</option>
                      <option value="2years">2 Years</option>
                    </select>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center text-green-800 text-xs">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Your data is protected with zero-knowledge proofs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mood History (if showing private data) */}
          {showPrivateData && profileData.moodHistory.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Mood History (Private View)
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {profileData.moodHistory.slice(-10).reverse().map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          Mood: {entry.moodScore}/10
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          Energy: {entry.energyLevel}/10
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                          Anxiety: {entry.anxietyLevel}/10
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZKClientProfile;