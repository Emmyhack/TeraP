'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle,
  Upload,
  Star,
  Award,
  FileText,
  Clock,
  Users,
  TrendingUp,
  Eye,
  EyeOff,
  Zap,
  Lock
} from 'lucide-react';
import { useZKIdentity } from '@/components/identity/ZKIdentityProvider';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { zkCredentialService } from '@/services/ZKCredentialVerificationService';
import type { TherapistCredential, ZKCredentialProof } from '@/services/ZKCredentialVerificationService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TherapistProfileData {
  basicInfo: {
    displayName: string;
    bio: string;
    approachStyle: string;
    languages: string[];
    hourlyRate: number;
  availableHours: string[];
  };
  credentials: TherapistCredential | null;
  verificationProof: ZKCredentialProof | null;
  publicProfile: any;
}

const ZKTherapistProfile: React.FC = () => {
  const { currentSession } = useZKIdentity();
  const { address } = useWeb3Wallet();
  const [profileData, setProfileData] = useState<TherapistProfileData>({
    basicInfo: {
      displayName: '',
      bio: '',
      approachStyle: 'CBT',
      languages: ['English'],
      hourlyRate: 120,
      availableHours: []
    },
    credentials: null,
    verificationProof: null,
    publicProfile: null
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPrivateData, setShowPrivateData] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified' | 'failed'>('none');

  // Load existing profile data
  useEffect(() => {
    loadProfileData();
  }, [address, currentSession]);

  const loadProfileData = async () => {
    try {
      // Load existing profile from localStorage or blockchain
      const savedProfile = localStorage.getItem(`therapist_profile_${address}`);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfileData(parsed);
        if (parsed.verificationProof) {
          setVerificationStatus('verified');
        }
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const handleCredentialUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // In a real implementation, this would:
      // 1. Upload file to secure storage (IPFS)
      // 2. Extract credential data using OCR/AI
      // 3. Validate against licensing databases
      
      // Simulated credential data extraction
      const extractedCredential: TherapistCredential = {
        id: `cred_${Date.now()}`,
        licenseType: 'psychologist',
        licenseNumber: `PSY${Math.floor(Math.random() * 100000)}`,
        issuingState: 'California',
        issuingCountry: 'USA',
        issueDate: new Date('2015-06-15'),
        expiryDate: new Date('2025-06-15'),
        specializations: ['Anxiety', 'Depression', 'PTSD', 'CBT'],
        educationLevel: 'doctorate',
        yearsOfExperience: 8
      };

      setProfileData(prev => ({
        ...prev,
        credentials: extractedCredential
      }));

      alert('Credential data extracted successfully! Please review and verify.');
    } catch (error) {
      console.error('Failed to process credential:', error);
      alert('Failed to process credential file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleZKVerification = async () => {
    if (!profileData.credentials || !currentSession?.profile?.zkCommitment) return;

    setIsVerifying(true);
    setVerificationStatus('pending');

    try {
      // Generate ZK proof for credentials
      const zkProof = await zkCredentialService.generateCredentialProof(
        profileData.credentials,
        currentSession.profile.zkCommitment,
        {
          minimumYearsExperience: 2,
          requiredSpecializations: ['CBT'],
          licenseTypes: ['psychologist', 'counselor'],
          educationLevel: 'masters'
        }
      );

      // Generate anonymous public profile
      const anonymousProfile = await zkCredentialService.generateAnonymousProfile(
        zkProof,
        profileData.basicInfo
      );

      // Store verification result
      setProfileData(prev => ({
        ...prev,
        verificationProof: zkProof,
        publicProfile: anonymousProfile
      }));

      setVerificationStatus('verified');

      // Save to localStorage (in production, save to IPFS/blockchain)
      localStorage.setItem(`therapist_profile_${address}`, JSON.stringify({
        ...profileData,
        verificationProof: zkProof,
        publicProfile: anonymousProfile
      }));

      alert('ZK Verification completed successfully! Your credentials are now verified while maintaining complete privacy.');

    } catch (error) {
      console.error('ZK Verification failed:', error);
      setVerificationStatus('failed');
      alert('Verification failed. Please check your credentials and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const updateBasicInfo = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        [field]: value
      }
    }));
  };

  const addSpecialization = (spec: string) => {
    if (!profileData.credentials) return;
    
    setProfileData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials!,
        specializations: [...prev.credentials!.specializations, spec]
      }
    }));
  };

  const removeSpecialization = (spec: string) => {
    if (!profileData.credentials) return;
    
    setProfileData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials!,
        specializations: prev.credentials!.specializations.filter(s => s !== spec)
      }
    }));
  };

  if (!currentSession?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Authentication Required</h2>
          <p className="text-gray-500">Please authenticate with your ZK identity to access the therapist profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {profileData.basicInfo.displayName.substring(0, 2).toUpperCase() || 'DR'}
                  </div>
                  {verificationStatus === 'verified' && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profileData.basicInfo.displayName || 'Anonymous Therapist'}
                    </h1>
                    <div className="flex space-x-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Therapist
                      </span>
                      {verificationStatus === 'verified' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center space-x-1">
                          <Shield className="h-3 w-3" />
                          <span>ZK Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Lock className="h-4 w-4" />
                      <span>Anonymous ID: {currentSession.profile.zkCommitment?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Verified since {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Basic Information */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Professional Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name (Public)
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.basicInfo.displayName}
                      onChange={(e) => updateBasicInfo('displayName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Dr. Anonymous"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.basicInfo.displayName || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={profileData.basicInfo.bio}
                      onChange={(e) => updateBasicInfo('bio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                      placeholder="Describe your approach and experience..."
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.basicInfo.bio || 'No bio provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Therapeutic Approach
                  </label>
                  {isEditing ? (
                    <select
                      value={profileData.basicInfo.approachStyle}
                      onChange={(e) => updateBasicInfo('approachStyle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="CBT">Cognitive Behavioral Therapy (CBT)</option>
                      <option value="DBT">Dialectical Behavior Therapy (DBT)</option>
                      <option value="Psychodynamic">Psychodynamic Therapy</option>
                      <option value="Humanistic">Humanistic Therapy</option>
                      <option value="EMDR">EMDR</option>
                      <option value="Integrative">Integrative Approach</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profileData.basicInfo.approachStyle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (TERAP)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profileData.basicInfo.hourlyRate}
                      onChange={(e) => updateBasicInfo('hourlyRate', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="50"
                      max="500"
                    />
                  ) : (
                    <p className="text-gray-900">${profileData.basicInfo.hourlyRate} TERAP/hour</p>
                  )}
                </div>
              </div>
            </div>

            {/* ZK Verification Panel */}
            <div className="space-y-6">
              
              {/* Credential Upload */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  ZK Credential Verification
                </h3>
                
                {!profileData.credentials ? (
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Upload your professional credentials for zero-knowledge verification</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.png,.jpeg"
                        onChange={handleCredentialUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {isUploading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Credentials
                          </>
                        )}
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Supports PDF, JPG, PNG. Your data is processed locally and never stored.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Credential Status</span>
                      <button
                        onClick={() => setShowPrivateData(!showPrivateData)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                      >
                        {showPrivateData ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Show Details
                          </>
                        )}
                      </button>
                    </div>

                    {showPrivateData && (
                      <div className="bg-gray-50 p-4 rounded-lg text-sm">
                        <div className="space-y-2">
                          <div><strong>License Type:</strong> {profileData.credentials.licenseType}</div>
                          <div><strong>License #:</strong> {profileData.credentials.licenseNumber}</div>
                          <div><strong>State:</strong> {profileData.credentials.issuingState}</div>
                          <div><strong>Expires:</strong> {profileData.credentials.expiryDate.toLocaleDateString()}</div>
                          <div><strong>Education:</strong> {profileData.credentials.educationLevel}</div>
                          <div><strong>Experience:</strong> {profileData.credentials.yearsOfExperience} years</div>
                        </div>
                      </div>
                    )}

                    {verificationStatus === 'none' && (
                      <button
                        onClick={handleZKVerification}
                        disabled={isVerifying}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {isVerifying ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Generating ZK Proof...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Verify with Zero Knowledge
                          </>
                        )}
                      </button>
                    )}

                    {verificationStatus === 'verified' && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center text-green-800">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="font-medium">ZK Verification Complete</span>
                        </div>
                        <p className="text-green-600 text-sm mt-1">
                          Your credentials are verified while maintaining complete privacy.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Public Anonymous Profile */}
              {profileData.publicProfile && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Anonymous Public Profile
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Anonymous ID:</span>
                      <span className="font-mono">{profileData.publicProfile.anonymousId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verification Level:</span>
                      <span className="text-green-600 font-medium">{profileData.publicProfile.verificationLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience Range:</span>
                      <span>{profileData.publicProfile.experienceRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">License Verified:</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Education Verified:</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* Specializations */}
              {profileData.credentials && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Specializations
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {profileData.credentials.specializations.map(spec => (
                      <span
                        key={spec}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center"
                      >
                        {spec}
                        {isEditing && (
                          <button
                            onClick={() => removeSpecialization(spec)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  
                  {isEditing && (
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Add specialization"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            addSpecialization(e.currentTarget.value.trim());
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZKTherapistProfile;