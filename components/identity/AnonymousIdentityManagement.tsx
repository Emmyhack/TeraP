'use client';

import React, { useState, useEffect } from 'react';
import { Shield, User, Stethoscope, Wallet, Plus, LogIn, Trash2, Edit3, Eye, EyeOff } from 'lucide-react';
import { useAnonymousIdentity } from './AnonymousIdentityProvider';
import { useWallet } from '@/hooks/useWallet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface StoredIdentity {
  id: string;
  displayName: string;
  role: 'client' | 'therapist';
  lastActive: number;
}

const AnonymousIdentityManagement: React.FC = () => {
  const {
    currentSession,
    isAuthenticated,
    isLoading: authLoading,
    error,
    createIdentity,
    authenticate,
    logout,
    getStoredIdentities,
    deleteIdentity,
    updateProfile
  } = useAnonymousIdentity();

  const {
    isConnected: walletConnected,
    address: walletAddress,
    isConnecting: walletConnecting,
    error: walletError,
    connectWallet,
    disconnectWallet,
    signMessage
  } = useWallet();

  const [mode, setMode] = useState<'select' | 'create' | 'login'>('select');
  const [storedIdentities, setStoredIdentities] = useState<StoredIdentity[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<StoredIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    displayName: '',
    role: 'client' as 'client' | 'therapist',
    specializations: [] as string[],
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    communicationStyle: 'supportive' as 'formal' | 'casual' | 'supportive'
  });

  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    specializations: [] as string[],
    language: 'en',
    communicationStyle: 'supportive' as 'formal' | 'casual' | 'supportive'
  });

  const specializations = [
    'Anxiety', 'Depression', 'PTSD', 'Addiction Recovery', 'Couples Therapy',
    'Family Counseling', 'Grief Counseling', 'Eating Disorders', 'OCD',
    'Bipolar Disorder', 'ADHD', 'Autism Spectrum', 'Life Transitions',
    'Stress Management', 'Sleep Disorders', 'Chronic Pain', 'LGBTQ+ Issues'
  ];

  useEffect(() => {
    loadStoredIdentities();
  }, []);

  useEffect(() => {
    if (currentSession) {
      setProfileForm({
        displayName: currentSession.profile.displayName,
        specializations: currentSession.profile.specializations || [],
        language: currentSession.profile.preferences?.language || 'en',
        communicationStyle: currentSession.profile.preferences?.communicationStyle || 'supportive'
      });
    }
  }, [currentSession]);

  // Debug logging
  useEffect(() => {
    console.log('Wallet State:', {
      walletConnected,
      walletAddress,
      walletConnecting,
      walletError
    });
  }, [walletConnected, walletAddress, walletConnecting, walletError]);

  useEffect(() => {
    console.log('Auth State:', {
      isAuthenticated,
      currentSession: !!currentSession,
      error
    });
  }, [isAuthenticated, currentSession, error]);

  const loadStoredIdentities = async () => {
    try {
      const identities = await getStoredIdentities();
      setStoredIdentities(identities);
      
      if (identities.length === 0) {
        setMode('create');
      }
    } catch (err) {
      console.error('Failed to load identities:', err);
    }
  };

  const handleCreateIdentity = async () => {
    if (!formData.displayName.trim()) {
      return;
    }

    if (!walletConnected || !walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      // Generate signing message
      const signingMessage = await import('@/services/CryptoService').then(module => {
        const cryptoService = new module.CryptoService();
        return cryptoService.generateSigningMessage(walletAddress, 'create_identity');
      });
      
      // Sign the message with wallet
      const signature = await signMessage(signingMessage);
      
      console.log('Creating identity with data:', {
        walletAddress,
        role: formData.role,
        displayName: formData.displayName
      });

      const newIdentity = await createIdentity(
        walletAddress,
        signature,
        signingMessage,
        formData.role,
        {
          displayName: formData.displayName,
          specializations: formData.role === 'therapist' ? formData.specializations : undefined,
          preferences: {
            language: formData.language,
            timezone: formData.timezone,
            communicationStyle: formData.communicationStyle
          }
        }
      );

      console.log('Identity created:', newIdentity);

      // Auto-authenticate the newly created identity
      if (newIdentity) {
        console.log('Auto-authenticating with new identity...');
        
        // Generate a new signing message for authentication
        const authSigningMessage = await import('@/services/CryptoService').then(module => {
          const cryptoService = new module.CryptoService();
          return cryptoService.generateSigningMessage(walletAddress, 'authenticate');
        });
        
        // Sign the authentication message
        const authSignature = await signMessage(authSigningMessage);
        
        // Authenticate with the new identity
        await authenticate(newIdentity.id, walletAddress, authSignature, authSigningMessage);
        
        console.log('Authentication completed');
      }

      // Reset form
      setFormData({
        displayName: '',
        role: 'client',
        specializations: [],
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        communicationStyle: 'supportive'
      });
      
      // No need to change mode or load identities - user is now authenticated
    } catch (error) {
      console.error('Failed to create identity:', error);
      alert(`Failed to create identity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!selectedIdentity || !walletConnected || !walletAddress) {
      alert('Please connect your wallet and select an identity');
      return;
    }

    try {
      setIsLoading(true);
      
      // Generate signing message
      const signingMessage = await import('@/services/CryptoService').then(module => {
        const cryptoService = new module.CryptoService();
        return cryptoService.generateSigningMessage(walletAddress, 'authenticate');
      });
      
      // Sign the message with wallet
      const signature = await signMessage(signingMessage);
      
      await authenticate(selectedIdentity.id, walletAddress, signature, signingMessage);
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

    const handleDeleteIdentity = async (identity: StoredIdentity) => {
    if (!walletConnected || !walletAddress) {
      alert('Please connect your wallet to delete this identity');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete the identity "${identity.displayName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsLoading(true);
      
      // Generate signing message for deletion
      const signingMessage = await import('@/services/CryptoService').then(module => {
        const cryptoService = new module.CryptoService();
        return cryptoService.generateSigningMessage(walletAddress, 'delete_identity');
      });
      
      // Sign the message with wallet
      const signature = await signMessage(signingMessage);
      
      await deleteIdentity(identity.id, walletAddress, signature, signingMessage);
      loadStoredIdentities();
    } catch (error) {
      console.error('Failed to delete identity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await updateProfile({
        displayName: profileForm.displayName,
        specializations: profileForm.specializations,
        preferences: {
          language: profileForm.language,
          timezone: formData.timezone,
          communicationStyle: profileForm.communicationStyle
        }
      });
      
      setProfileEditMode(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    const currentSpecs = mode === 'create' ? formData.specializations : profileForm.specializations;
    const updated = currentSpecs.includes(spec)
      ? currentSpecs.filter(s => s !== spec)
      : [...currentSpecs, spec];
    
    if (mode === 'create') {
      setFormData(prev => ({ ...prev, specializations: updated }));
    } else {
      setProfileForm(prev => ({ ...prev, specializations: updated }));
    }
  };

  // If authenticated, show profile management
  if (isAuthenticated && currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500">
                  <img 
                    src={currentSession.profile.avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-800">
                    {currentSession.profile.displayName}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      currentSession.profile.role === 'therapist'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {currentSession.profile.role === 'therapist' ? 'Therapist' : 'Client'}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      currentSession.profile.verificationLevel === 'professionally_verified'
                        ? 'bg-green-100 text-green-800'
                        : currentSession.profile.verificationLevel === 'identity_verified'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currentSession.profile.verificationLevel === 'professionally_verified' 
                        ? 'Verified' 
                        : currentSession.profile.verificationLevel === 'identity_verified'
                        ? 'ID Verified'
                        : 'Unverified'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setProfileEditMode(!profileEditMode)}
                  className="btn-outline flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
                <button onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Profile Edit Form */}
          {profileEditMode && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-neutral-800 mb-6">Edit Profile</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="form-input w-full"
                    required
                  />
                </div>

                {currentSession.profile.role === 'therapist' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Specializations
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {specializations.map(spec => (
                        <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileForm.specializations.includes(spec)}
                            onChange={() => toggleSpecialization(spec)}
                            className="form-checkbox"
                          />
                          <span className="text-sm text-neutral-700">{spec}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Language
                    </label>
                    <select
                      value={profileForm.language}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, language: e.target.value }))}
                      className="form-input w-full"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Communication Style
                    </label>
                    <select
                      value={profileForm.communicationStyle}
                      onChange={(e) => setProfileForm(prev => ({ 
                        ...prev, 
                        communicationStyle: e.target.value as 'formal' | 'casual' | 'supportive'
                      }))}
                      className="form-input w-full"
                    >
                      <option value="supportive">Supportive</option>
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setProfileEditMode(false)}
                    className="btn-outline flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Profile Information */}
          {!profileEditMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Profile Information</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-neutral-600">Role:</span>
                    <p className="font-medium text-neutral-800 capitalize">{currentSession.profile.role}</p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-600">Language:</span>
                    <p className="font-medium text-neutral-800">{currentSession.profile.preferences?.language || 'English'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-600">Communication Style:</span>
                    <p className="font-medium text-neutral-800 capitalize">
                      {currentSession.profile.preferences?.communicationStyle || 'Supportive'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-600">Member Since:</span>
                    <p className="font-medium text-neutral-800">
                      {new Date(currentSession.profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {currentSession.profile.role === 'therapist' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-neutral-800 mb-4">Specializations</h2>
                  <div className="flex flex-wrap gap-2">
                    {(currentSession.profile.specializations || []).map(spec => (
                      <span
                        key={spec}
                        className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800">TeraP Anonymous</h1>
          <p className="text-neutral-600 mt-2">Secure & Private Mental Health Support</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Mode Selector */}
          {mode === 'select' && storedIdentities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-6">Select Identity</h2>
              <div className="space-y-3 mb-6">
                {storedIdentities.map(identity => (
                  <div
                    key={identity.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedIdentity?.id === identity.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                    onClick={() => setSelectedIdentity(identity)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {identity.role === 'therapist' ? (
                          <Stethoscope className="h-5 w-5 text-blue-600" />
                        ) : (
                          <User className="h-5 w-5 text-green-600" />
                        )}
                        <div>
                          <div className="font-medium text-neutral-800">{identity.displayName}</div>
                          <div className="text-sm text-neutral-600 capitalize">{identity.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIdentity(identity);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedIdentity && (
                <div className="space-y-4">
                  {!walletConnected ? (
                    <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <Wallet className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                      <p className="text-amber-800 mb-4">Connect your wallet to authenticate with this identity</p>
                      <button
                        onClick={connectWallet}
                        className="btn-primary"
                        disabled={walletConnecting}
                      >
                        {walletConnecting ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Wallet className="h-4 w-4 mr-2" />
                            Connect Wallet
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <Wallet className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-green-800 font-medium">Wallet Connected</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">{walletAddress}</p>
                      </div>

                      <button
                        onClick={handleLogin}
                        className="btn-primary w-full"
                        disabled={isLoading || authLoading}
                      >
                        {(isLoading || authLoading) ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <LogIn className="h-4 w-4 mr-2" />
                            Sign In with Wallet
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {walletError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{walletError}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => setMode('create')}
                  className="btn-outline w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Identity
                </button>
              </div>
            </div>
          )}

          {/* Create Identity Form */}
          {mode === 'create' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-800">Create Anonymous Identity</h2>
                  {walletConnected && (
                    <div className="text-sm text-green-600 mt-1">
                      ✓ Wallet connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </div>
                  )}
                </div>
                {storedIdentities.length > 0 && (
                  <button
                    onClick={() => setMode('select')}
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    Back to Selection
                  </button>
                )}
              </div>

              <form onSubmit={handleCreateIdentity} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="form-input w-full"
                    placeholder="Choose an anonymous name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-neutral-50">
                      <input
                        type="radio"
                        name="role"
                        value="client"
                        checked={formData.role === 'client'}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'client' | 'therapist' }))}
                        className="form-radio"
                      />
                      <User className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Client</span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-neutral-50">
                      <input
                        type="radio"
                        name="role"
                        value="therapist"
                        checked={formData.role === 'therapist'}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'client' | 'therapist' }))}
                        className="form-radio"
                      />
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Therapist</span>
                    </label>
                  </div>
                </div>

                {formData.role === 'therapist' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Specializations (select all that apply)
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {specializations.map(spec => (
                        <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.specializations.includes(spec)}
                            onChange={() => toggleSpecialization(spec)}
                            className="form-checkbox"
                          />
                          <span className="text-sm text-neutral-700">{spec}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wallet Connection Section */}
                {!walletConnected ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Wallet className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Wallet Required</span>
                    </div>
                    <p className="text-blue-800 text-sm mb-4">
                      Your identity will be secured by your wallet signature instead of a password. 
                      This provides stronger security and eliminates the need to remember passwords.
                    </p>
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="btn-secondary"
                      disabled={walletConnecting}
                    >
                      {walletConnecting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Wallet className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Wallet Connected</span>
                    </div>
                    <p className="text-green-800 text-sm mb-2">
                      Your identity will be secured with wallet address:
                    </p>
                    <p className="text-xs text-green-700 font-mono bg-green-100 p-2 rounded">
                      {walletAddress}
                    </p>
                  </div>
                )}

                {walletError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{walletError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={isLoading || !walletConnected}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      {walletConnected ? 'Create Anonymous Identity' : 'Connect Wallet First'}
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnonymousIdentityManagement;