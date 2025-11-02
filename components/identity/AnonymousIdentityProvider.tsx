'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { anonymousIdentityService, AnonymousProfile, IdentitySession } from '@/services/AnonymousIdentityService';

interface AnonymousIdentity {
  id: string;
  role: 'client' | 'therapist';
  publicKey: string;
  signingPublicKey: string;
  encryptedPrivateKey: string;
  specializations: string[];
  createdAt: number;
  lastActive: number;
  walletAddress: string;
}

interface AnonymousIdentityContextType {
  currentSession: IdentitySession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  createIdentity: (
    walletAddress: string,
    signature: string,
    signingMessage: string,
    role: 'client' | 'therapist', 
    profileData: {
      displayName: string;
      specializations?: string[];
      preferences?: AnonymousProfile['preferences'];
    }
  ) => Promise<AnonymousIdentity>;
  authenticate: (
    identityId: string, 
    walletAddress: string, 
    signature: string,
    signingMessage: string
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<AnonymousProfile>) => Promise<void>;
  getStoredIdentities: () => Promise<Array<{ id: string; displayName: string; role: 'client' | 'therapist'; lastActive: number }>>;
  establishSecureChannel: (recipientId: string) => Promise<string>;
  searchProviders: (criteria: any) => Promise<any[]>;
  deleteIdentity: (identityId: string, walletAddress: string, signature: string, signingMessage: string) => Promise<void>;
}

const AnonymousIdentityContext = createContext<AnonymousIdentityContextType | undefined>(undefined);

interface AnonymousIdentityProviderProps {
  children: ReactNode;
}

export const AnonymousIdentityProvider: React.FC<AnonymousIdentityProviderProps> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<IdentitySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!currentSession;

  useEffect(() => {
    // Check for existing session on mount
    const session = anonymousIdentityService.getCurrentSession();
    setCurrentSession(session);
    setIsLoading(false);
  }, []);

  const createIdentity = async (
    walletAddress: string,
    signature: string,
    signingMessage: string,
    role: 'client' | 'therapist',
    profileData: {
      displayName: string;
      specializations?: string[];
      preferences?: AnonymousProfile['preferences'];
    }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Creating identity in service...');
      const identity = await anonymousIdentityService.createIdentity(
        role,
        walletAddress, 
        signature, 
        profileData.specializations
      );
      
      console.log('Identity created in service:', identity);
      
      // Update the profile with the provided data
      const updatedProfile: AnonymousProfile = {
        id: identity.id,
        role,
        displayName: profileData.displayName,
        avatar: '',
        specializations: profileData.specializations,
        preferences: profileData.preferences,
        verificationLevel: 'unverified',
        createdAt: identity.createdAt,
        lastActive: identity.lastActive
      };
      
      // Store the updated profile
      await anonymousIdentityService.updateProfile(identity.id, updatedProfile);
      
      return identity;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create identity';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (
    identityId: string, 
    walletAddress: string, 
    signature: string,
    signingMessage: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const identity = await anonymousIdentityService.authenticate(
        identityId, 
        walletAddress, 
        signature, 
        signingMessage
      );
      
      if (identity) {
        // Create a basic session - we'll enhance this later
        const session: IdentitySession = {
          identity,
          profile: {
            id: identity.id,
            role: identity.role,
            displayName: 'Anonymous User',
            avatar: '',
            verificationLevel: 'unverified',
            createdAt: identity.createdAt,
            lastActive: identity.lastActive
          },
          sessionToken: signature,
          keys: {
            encryptionPrivateKey: '',
            signingPrivateKey: '',
            sharedSecrets: new Map()
          },
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };
        setCurrentSession(session);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    anonymousIdentityService.logout();
    setCurrentSession(null);
    setError(null);
  };

  const updateProfile = async (updates: Partial<AnonymousProfile>) => {
    if (!currentSession) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);
      await anonymousIdentityService.updateProfile(currentSession.identity.id, updates);
      
      // Update local session
      setCurrentSession(prev => prev ? {
        ...prev,
        profile: { ...prev.profile, ...updates }
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    }
  };

  const getStoredIdentities = async () => {
    try {
      setError(null);
      return await anonymousIdentityService.getStoredIdentities();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get stored identities';
      setError(errorMessage);
      throw err;
    }
  };

  const establishSecureChannel = async (recipientId: string) => {
    if (!currentSession) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);
      return await anonymousIdentityService.establishSecureChannel(recipientId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to establish secure channel';
      setError(errorMessage);
      throw err;
    }
  };

  const searchProviders = async (criteria: any) => {
    try {
      setError(null);
      return await anonymousIdentityService.searchProviders(criteria);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search providers';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteIdentity = async (
    identityId: string, 
    walletAddress: string, 
    signature: string, 
    signingMessage: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await anonymousIdentityService.deleteIdentity(
        identityId, 
        walletAddress, 
        signature, 
        signingMessage
      );
      
      // If it's the current session, log out
      if (currentSession && currentSession.identity.id === identityId) {
        setCurrentSession(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete identity';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };



  const contextValue: AnonymousIdentityContextType = {
    currentSession,
    isAuthenticated,
    isLoading,
    error,
    createIdentity,
    authenticate,
    logout,
    updateProfile,
    getStoredIdentities,
    establishSecureChannel,
    searchProviders,
    deleteIdentity
  };

  return (
    <AnonymousIdentityContext.Provider value={contextValue}>
      {children}
    </AnonymousIdentityContext.Provider>
  );
};

export const useAnonymousIdentity = (): AnonymousIdentityContextType => {
  const context = useContext(AnonymousIdentityContext);
  if (context === undefined) {
    throw new Error('useAnonymousIdentity must be used within an AnonymousIdentityProvider');
  }
  return context;
};