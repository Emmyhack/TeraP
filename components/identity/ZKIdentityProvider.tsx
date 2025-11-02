'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ZKIdentity, AnonymousProfile, AnonymousSession, ZKProof } from '@/services/ZKIdentityService';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';

interface ZKIdentityContextType {
  currentSession: AnonymousSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Core identity operations
  createZKIdentity: (profileData: Partial<AnonymousProfile>) => Promise<void>;
  authenticateWithZK: (commitment: string) => Promise<void>;
  logout: () => void;
  
  // Profile management
  updateProfile: (updates: Partial<AnonymousProfile>) => Promise<void>;
  
  // ZK proof operations
  generateProof: (signal: string, externalNullifier: string) => Promise<ZKProof>;
  
  // Identity management
  getStoredIdentities: () => Promise<Array<{
    commitment: string;
    displayName: string;
    role: 'client' | 'therapist';
    lastActive: number;
  }>>;
  deleteIdentity: (commitment: string) => Promise<void>;
}

const ZKIdentityContext = createContext<ZKIdentityContextType | undefined>(undefined);

interface ZKIdentityProviderProps {
  children: ReactNode;
}

export const ZKIdentityProvider: React.FC<ZKIdentityProviderProps> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<AnonymousSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zkIdentity, setZkIdentity] = useState<ZKIdentity | null>(null);

  const { isConnected: walletConnected, address: walletAddress, signMessage } = useWeb3Wallet();

  const isAuthenticated = !!currentSession && !!zkIdentity;

  // Create new ZK identity
  const createZKIdentity = async (profileData: Partial<AnonymousProfile>): Promise<void> => {
    if (!walletConnected || !walletAddress) {
      throw new Error('Wallet must be connected to create identity');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create wallet signature for identity binding
      const message = `Create Anonymous TeraP Identity\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      const signature = await signMessage(message);

      // Generate ZK identity using wallet signature as entropy
      const zkId = new ZKIdentity(signature.slice(0, 64)); // Use first 64 chars as secret
      
      // Create profile
      const profile: AnonymousProfile = {
        zkCommitment: zkId.commitment,
        role: profileData.role || 'client',
        displayName: profileData.displayName || 'Anonymous User',
        avatar: profileData.avatar,
        specializations: profileData.specializations,
        preferences: profileData.preferences,
        verificationLevel: 'unverified',
        createdAt: Date.now(),
        lastActive: Date.now(),
        reputation: {
          score: 0,
          reviewCount: 0
        }
      };

      // Store identity and profile
      const identityData = {
        zkIdentity: zkId.export(),
        profile,
        walletAddress,
        createdAt: Date.now()
      };

      localStorage.setItem(`zk_identity_${zkId.commitment}`, JSON.stringify(identityData));
      
      // Auto-authenticate
      const session: AnonymousSession = {
        zkCommitment: zkId.commitment,
        profile,
        sessionToken: `session_${Date.now()}_${zkId.commitment.slice(0, 8)}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        proofs: []
      };

      setZkIdentity(zkId);
      setCurrentSession(session);

      console.log('ZK Identity created and authenticated:', {
        commitment: zkId.commitment,
        role: profile.role,
        displayName: profile.displayName
      });

    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create ZK identity';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Authenticate with existing ZK identity
  const authenticateWithZK = async (commitment: string): Promise<void> => {
    if (!walletConnected || !walletAddress) {
      throw new Error('Wallet must be connected to authenticate');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load identity from storage
      const storedData = localStorage.getItem(`zk_identity_${commitment}`);
      if (!storedData) {
        throw new Error('Identity not found');
      }

      const identityData = JSON.parse(storedData);
      
      // Verify wallet ownership
      if (identityData.walletAddress !== walletAddress) {
        throw new Error('Identity belongs to different wallet');
      }

      // Restore ZK identity
      const zkId = ZKIdentity.import(identityData.zkIdentity);
      
      // Create session
      const session: AnonymousSession = {
        zkCommitment: commitment,
        profile: identityData.profile,
        sessionToken: `session_${Date.now()}_${commitment.slice(0, 8)}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        proofs: []
      };

      // Update last active
      identityData.profile.lastActive = Date.now();
      localStorage.setItem(`zk_identity_${commitment}`, JSON.stringify(identityData));

      setZkIdentity(zkId);
      setCurrentSession(session);

      console.log('Authenticated with ZK identity:', commitment);

    } catch (err: any) {
      const errorMessage = err?.message || 'Authentication failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = (): void => {
    setCurrentSession(null);
    setZkIdentity(null);
    setError(null);
    console.log('Logged out from ZK identity');
  };

  // Update profile
  const updateProfile = async (updates: Partial<AnonymousProfile>): Promise<void> => {
    if (!currentSession || !zkIdentity) {
      throw new Error('No active session');
    }

    try {
      const updatedProfile = { ...currentSession.profile, ...updates, lastActive: Date.now() };
      
      // Update storage
      const storedData = localStorage.getItem(`zk_identity_${zkIdentity.commitment}`);
      if (storedData) {
        const identityData = JSON.parse(storedData);
        identityData.profile = updatedProfile;
        localStorage.setItem(`zk_identity_${zkIdentity.commitment}`, JSON.stringify(identityData));
      }

      // Update session
      setCurrentSession(prev => prev ? { ...prev, profile: updatedProfile } : null);
      
      console.log('Profile updated');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Generate ZK proof
  const generateProof = async (signal: string, externalNullifier: string): Promise<ZKProof> => {
    if (!zkIdentity) {
      throw new Error('No ZK identity available');
    }

    try {
      const proof = await zkIdentity.generateProof(signal, externalNullifier);
      
      // Add proof to session
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          proofs: [...currentSession.proofs, proof]
        };
        setCurrentSession(updatedSession);
      }

      return proof;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to generate proof';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get stored identities for this wallet
  const getStoredIdentities = async (): Promise<Array<{
    commitment: string;
    displayName: string;
    role: 'client' | 'therapist';
    lastActive: number;
  }>> => {
    if (!walletAddress) {
      return [];
    }

    try {
      const identities = [];
      
      // Scan localStorage for identities belonging to this wallet
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('zk_identity_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const identityData = JSON.parse(data);
            if (identityData.walletAddress === walletAddress) {
              identities.push({
                commitment: identityData.zkIdentity.commitment,
                displayName: identityData.profile.displayName,
                role: identityData.profile.role,
                lastActive: identityData.profile.lastActive
              });
            }
          }
        }
      }

      return identities.sort((a, b) => b.lastActive - a.lastActive);
    } catch (err) {
      console.error('Failed to load identities:', err);
      return [];
    }
  };

  // Delete identity
  const deleteIdentity = async (commitment: string): Promise<void> => {
    if (!walletConnected || !walletAddress) {
      throw new Error('Wallet must be connected');
    }

    try {
      // Verify ownership
      const storedData = localStorage.getItem(`zk_identity_${commitment}`);
      if (!storedData) {
        throw new Error('Identity not found');
      }

      const identityData = JSON.parse(storedData);
      if (identityData.walletAddress !== walletAddress) {
        throw new Error('Cannot delete identity from different wallet');
      }

      // Remove from storage
      localStorage.removeItem(`zk_identity_${commitment}`);

      // If current session, logout
      if (currentSession && currentSession.zkCommitment === commitment) {
        logout();
      }

      console.log('Identity deleted:', commitment);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to delete identity';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Auto-load session on wallet connection
  useEffect(() => {
    const loadExistingSession = async () => {
      if (walletConnected && walletAddress && !currentSession) {
        const identities = await getStoredIdentities();
        if (identities.length > 0) {
          // Auto-load the most recent identity
          try {
            await authenticateWithZK(identities[0].commitment);
          } catch (err) {
            console.warn('Auto-authentication failed:', err);
          }
        }
      }
    };

    loadExistingSession();
  }, [walletConnected, walletAddress]);

  const contextValue: ZKIdentityContextType = {
    currentSession,
    isAuthenticated,
    isLoading,
    error,
    createZKIdentity,
    authenticateWithZK,
    logout,
    updateProfile,
    generateProof,
    getStoredIdentities,
    deleteIdentity
  };

  return (
    <ZKIdentityContext.Provider value={contextValue}>
      {children}
    </ZKIdentityContext.Provider>
  );
};

export const useZKIdentity = (): ZKIdentityContextType => {
  const context = useContext(ZKIdentityContext);
  if (context === undefined) {
    throw new Error('useZKIdentity must be used within a ZKIdentityProvider');
  }
  return context;
};