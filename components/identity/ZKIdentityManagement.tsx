'use client';

import React, { useState, useEffect } from 'react';
import { Shield, User, Stethoscope, Wallet, Plus, LogIn, Trash2, Key, CheckCircle } from 'lucide-react';
import { useZKIdentity } from './ZKIdentityProvider';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import UserProfile from './UserProfile';

interface StoredZKIdentity {
  commitment: string;
  displayName: string;
  role: 'client' | 'therapist';
  lastActive: number;
}

const ZKIdentityManagement: React.FC = () => {
  const {
    currentSession,
    isAuthenticated,
    isLoading: authLoading,
    error,
    createZKIdentity,
    authenticateWithZK,
    logout,
    getStoredIdentities,
    deleteIdentity,
    updateProfile
  } = useZKIdentity();

  const {
    isConnected: walletConnected,
    address: walletAddress,
    isConnecting: walletConnecting,
    error: walletError,
    connectWallet,
    chainId
  } = useWeb3Wallet();

  const [mode, setMode] = useState<'select' | 'create' | 'login'>('select');
  const [storedIdentities, setStoredIdentities] = useState<StoredZKIdentity[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<StoredZKIdentity | null>(null);
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

  const specializations = [
    'Anxiety', 'Depression', 'PTSD', 'Addiction Recovery', 'Couples Therapy',
    'Family Counseling', 'Grief Counseling', 'Eating Disorders', 'OCD',
    'Bipolar Disorder', 'ADHD', 'Autism Spectrum', 'Life Transitions',
    'Stress Management', 'Sleep Disorders', 'Chronic Pain', 'LGBTQ+ Issues'
  ];

  useEffect(() => {
    loadStoredIdentities();
  }, [walletConnected, walletAddress]);

  const loadStoredIdentities = async () => {
    if (!walletConnected) return;
    
    try {
      const identities = await getStoredIdentities();
      setStoredIdentities(identities);
      
      if (identities.length === 0) {
        setMode('create');
      } else {
        setMode('select');
      }
    } catch (err) {
      console.error('Failed to load identities:', err);
    }
  };

  const handleCreateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      alert('Please enter a display name');
      return;
    }

    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      await createZKIdentity({
        role: formData.role,
        displayName: formData.displayName,
        specializations: formData.role === 'therapist' ? formData.specializations : undefined,
        preferences: {
          language: formData.language,
          timezone: formData.timezone,
          communicationStyle: formData.communicationStyle
        }
      });

      // Reset form
      setFormData({
        displayName: '',
        role: 'client',
        specializations: [],
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        communicationStyle: 'supportive'
      });

      console.log('ZK Identity created and authenticated successfully');
      
    } catch (error: any) {
      console.error('Failed to create ZK identity:', error);
      alert(`Failed to create identity: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!selectedIdentity) {
      alert('Please select an identity');
      return;
    }

    try {
      setIsLoading(true);
      await authenticateWithZK(selectedIdentity.commitment);
      console.log('Authenticated successfully');
    } catch (error: any) {
      console.error('Authentication failed:', error);
      alert(`Authentication failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteIdentity = async (identity: StoredZKIdentity) => {
    const confirmed = confirm(`Are you sure you want to delete the identity "${identity.displayName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsLoading(true);
      await deleteIdentity(identity.commitment);
      loadStoredIdentities();
      alert('Identity deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete identity:', error);
      alert(`Failed to delete identity: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  // If already authenticated, show user profile
  if (isAuthenticated) {
    return <UserProfile />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-neutral-900">Zero-Knowledge Identity</h1>
            </div>
            <p className="text-neutral-600 max-w-md mx-auto">
              Create or access your anonymous identity for secure, private therapy sessions
            </p>
          </div>

          {/* Wallet Connection Status */}
          <div className="mb-6">
            {!walletConnected ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Wallet className="h-5 w-5 text-amber-600 mr-2" />
                  <span className="font-medium text-amber-900">Wallet Required</span>
                </div>
                <p className="text-amber-800 text-sm mb-4">
                  Connect your Web3 wallet to create or access anonymous identities. Your wallet secures your identity without revealing your real identity.
                </p>
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
                {walletError && (
                  <p className="text-red-600 text-sm mt-2">{walletError}</p>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-900">Wallet Connected</span>
                  </div>
                  <div className="text-sm text-green-700">
                    Chain: {chainId} | {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {walletConnected && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
              {/* Mode Selection */}
              <div className="border-b border-neutral-200 p-4">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setMode('select')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      mode === 'select'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    Existing Identity
                  </button>
                  <button
                    onClick={() => setMode('create')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      mode === 'create'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    New Identity
                  </button>
                </div>
              </div>

              <div className="p-6">
                {mode === 'select' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-800 mb-4">Select Identity</h2>
                      
                      {storedIdentities.length === 0 ? (
                        <div className="text-center py-8">
                          <Key className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                          <p className="text-neutral-600 mb-4">No identities found for this wallet</p>
                          <button
                            onClick={() => setMode('create')}
                            className="btn-primary"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Identity
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {storedIdentities.map((identity) => (
                            <div
                              key={identity.commitment}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedIdentity?.commitment === identity.commitment
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                              }`}
                              onClick={() => setSelectedIdentity(identity)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {identity.role === 'therapist' ? (
                                    <Stethoscope className="h-5 w-5 text-blue-600 mr-3" />
                                  ) : (
                                    <User className="h-5 w-5 text-green-600 mr-3" />
                                  )}
                                  <div>
                                    <p className="font-medium text-neutral-900">{identity.displayName}</p>
                                    <p className="text-sm text-neutral-600 capitalize">{identity.role}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-neutral-500">
                                    {new Date(identity.lastActive).toLocaleDateString()}
                                  </span>
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
                      )}

                      {selectedIdentity && (
                        <div className="mt-6">
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
                                Access Identity
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {mode === 'create' && (
                  <form onSubmit={handleCreateIdentity} className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-800 mb-4">Create ZK Identity</h2>
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-3">
                        Select Your Role
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            formData.role === 'client'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, role: 'client' }))}
                        >
                          <User className="h-6 w-6 text-green-600 mb-2" />
                          <h3 className="font-medium text-neutral-900">Client</h3>
                          <p className="text-sm text-neutral-600">Seeking therapy and support</p>
                        </div>
                        <div
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            formData.role === 'therapist'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, role: 'therapist' }))}
                        >
                          <Stethoscope className="h-6 w-6 text-blue-600 mb-2" />
                          <h3 className="font-medium text-neutral-900">Therapist</h3>
                          <p className="text-sm text-neutral-600">Providing professional support</p>
                        </div>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="form-input w-full"
                        placeholder="Choose a display name"
                        required
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        This will be shown to other users. Choose carefully as it cannot be changed easily.
                      </p>
                    </div>

                    {/* Specializations for Therapists */}
                    {formData.role === 'therapist' && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-3">
                          Specializations
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
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

                    <button
                      type="submit"
                      className="btn-primary w-full"
                      disabled={isLoading || !formData.displayName.trim()}
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Create Anonymous Identity
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZKIdentityManagement;