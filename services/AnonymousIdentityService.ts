import { CryptoService } from './CryptoService';

const cryptoService = new CryptoService();

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

export interface AnonymousProfile {
  id: string;
  role: 'client' | 'therapist';
  displayName: string;
  avatar: string;
  specializations?: string[]; // For therapists
  preferences?: {
    language: string;
    timezone: string;
    communicationStyle: 'formal' | 'casual' | 'supportive';
  };
  verificationLevel: 'unverified' | 'identity_verified' | 'professionally_verified';
  createdAt: number;
  lastActive: number;
}

export interface SessionKeys {
  encryptionPrivateKey: string;
  signingPrivateKey: string;
  sharedSecrets: Map<string, string>; // userId -> sharedSecret
}

export interface IdentitySession {
  identity: AnonymousIdentity;
  profile: AnonymousProfile;
  sessionToken: string;
  keys: SessionKeys;
  expiresAt: number;
}

class AnonymousIdentityService {
  private static instance: AnonymousIdentityService;
  private currentSession: IdentitySession | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private cryptoService: CryptoService;
  
  constructor() {
    this.cryptoService = new CryptoService();
  }

  public static getInstance(): AnonymousIdentityService {
    if (!AnonymousIdentityService.instance) {
      AnonymousIdentityService.instance = new AnonymousIdentityService();
    }
    return AnonymousIdentityService.instance;
  }

  /**
   * Create a new anonymous identity for a user
   */
    async createIdentity(
    role: 'client' | 'therapist',
    walletAddress: string,
    signature: string,
    specializations?: string[]
  ): Promise<AnonymousIdentity> {
    try {
      const identity = this.cryptoService.createAnonymousIdentity(
        role,
        walletAddress,
        signature,
        specializations
      );
      
      // Create a basic profile for the new identity
      const basicProfile: AnonymousProfile = {
        id: identity.id,
        role: identity.role,
        displayName: 'New User', // Will be updated by the client
        avatar: '',
        specializations: identity.specializations,
        verificationLevel: 'unverified',
        createdAt: identity.createdAt,
        lastActive: identity.lastActive
      };

      // Store identity with profile in the expected format
      await this.storeIdentity(identity, basicProfile);
      
      return identity;
    } catch (error) {
      throw new Error(`Failed to create anonymous identity: ${error}`);
    }
  }

  /**
   * Authenticate with an existing identity
   */
  async authenticate(
    identityId: string, 
    walletAddress: string, 
    signature: string,
    signingMessage: string
  ): Promise<AnonymousIdentity | null> {
    try {
      // Verify the signing message is recent and valid
      if (!cryptoService.verifySigningMessage(signingMessage)) {
        throw new Error('Signing message expired or invalid');
      }
      
      const storedIdentity = localStorage.getItem(`terap_identity_${identityId}`);
      if (!storedIdentity) {
        return null;
      }
      
      const identity = JSON.parse(storedIdentity) as AnonymousIdentity;
      
      // Verify wallet ownership by trying to decrypt keys
      const keys = cryptoService.decryptWithWallet(identity, walletAddress, signature);
      if (!keys) {
        return null;
      }
      
      // Ensure the wallet address matches the identity
      if (identity.walletAddress !== walletAddress) {
        return null;
      }
      
      // Update last active
      identity.lastActive = Date.now();
      localStorage.setItem(`terap_identity_${identityId}`, JSON.stringify(identity));
      
      return identity;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current authenticated session
   */
  getCurrentSession(): IdentitySession | null {
    if (!this.currentSession) {
      return null;
    }

    // Check if session has expired
    if (Date.now() > this.currentSession.expiresAt) {
      this.logout();
      return null;
    }

    return this.currentSession;
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    if (this.currentSession) {
      // Securely wipe private keys from memory
      cryptoService.wipeSensitiveData(this.currentSession.keys.encryptionPrivateKey);
      cryptoService.wipeSensitiveData(this.currentSession.keys.signingPrivateKey);
      
      // Clear shared secrets
      this.currentSession.keys.sharedSecrets.clear();
    }
    
    this.currentSession = null;
  }

  /**
   * Establish a secure communication channel with another user
   */
  async establishSecureChannel(recipientId: string): Promise<string> {
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Check if we already have a shared secret
    const existingSecret = session.keys.sharedSecrets.get(recipientId);
    if (existingSecret) {
      return existingSecret;
    }

    // Get recipient's public key
    const recipientIdentity = await this.getPublicIdentity(recipientId);
    if (!recipientIdentity) {
      throw new Error('Recipient not found');
    }

    // Generate shared secret
    const sharedSecret = cryptoService.deriveSharedSecret(
      session.keys.encryptionPrivateKey,
      recipientIdentity.publicKey
    );

    // Store for future use
    session.keys.sharedSecrets.set(recipientId, sharedSecret);
    
    return sharedSecret;
  }

  /**
   * Update profile information
   */
  async updateProfile(
    identityId: string, 
    updates: Partial<AnonymousProfile>
  ): Promise<void> {
    const { identity, profile } = await this.retrieveIdentity(identityId);
    
    if (!identity || !profile) {
      throw new Error('Identity not found');
    }

    const updatedProfile = { ...profile, ...updates };
    await this.storeIdentity(identity, updatedProfile);
    
    // Update current session if it's the same user
    if (this.currentSession && this.currentSession.identity.id === identityId) {
      this.currentSession.profile = updatedProfile;
    }
  }

  /**
   * Get public identity information (safe to share)
   */
  async getPublicIdentity(identityId: string): Promise<{
    id: string;
    publicKey: string;
    displayName: string;
    avatar: string;
    role: 'client' | 'therapist';
    verificationLevel: AnonymousProfile['verificationLevel'];
    specializations?: string[];
  } | null> {
    const { profile } = await this.retrieveIdentity(identityId);
    
    if (!profile) {
      return null;
    }

    const identity = await this.getStoredIdentity(identityId);
    if (!identity) {
      return null;
    }

    return {
      id: profile.id,
      publicKey: identity.publicKey,
      displayName: profile.displayName,
      avatar: profile.avatar,
      role: profile.role,
      verificationLevel: profile.verificationLevel,
      specializations: profile.specializations
    };
  }

  /**
   * Search for therapists or support groups (anonymized results)
   */
  async searchProviders(criteria: {
    role?: 'therapist';
    specializations?: string[];
    verificationLevel?: AnonymousProfile['verificationLevel'];
    language?: string;
  }): Promise<Array<{
    id: string;
    displayName: string;
    avatar: string;
    specializations: string[];
    verificationLevel: AnonymousProfile['verificationLevel'];
    isOnline: boolean;
  }>> {
    // In production, this would query a secure database
    // For now, return mock data
    return [
      {
        id: 'therapist_001',
        displayName: 'Dr. Anonymous',
        avatar: this.generateAvatar('therapist_001'),
        specializations: ['Anxiety', 'Depression', 'PTSD'],
        verificationLevel: 'professionally_verified',
        isOnline: true
      },
      {
        id: 'therapist_002', 
        displayName: 'Counselor Hope',
        avatar: this.generateAvatar('therapist_002'),
        specializations: ['Addiction Recovery', 'Family Therapy'],
        verificationLevel: 'professionally_verified',
        isOnline: false
      }
    ];
  }

  /**
   * Generate a deterministic avatar based on user ID
   */
  private generateAvatar(userId: string): string {
    // Generate a deterministic color and pattern based on user ID
    const hash = cryptoService.hashProfile({ userId });
    const hue = parseInt(hash.substring(0, 8), 16) % 360;
    const saturation = 65 + (parseInt(hash.substring(8, 16), 16) % 35);
    const lightness = 45 + (parseInt(hash.substring(16, 24), 16) % 20);
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:hsl(${hue}, ${saturation}%, ${lightness}%);stop-opacity:1" />
            <stop offset="100%" style="stop-color:hsl(${hue + 30}, ${saturation}%, ${lightness - 10}%);stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#grad)" />
        <circle cx="35" cy="35" r="8" fill="white" opacity="0.9" />
        <circle cx="65" cy="35" r="8" fill="white" opacity="0.9" />
        <path d="M 30 65 Q 50 85 70 65" stroke="white" stroke-width="3" fill="none" opacity="0.9" />
      </svg>
    `)}`;
  }

  /**
   * Store identity securely (simplified for demo - use secure storage in production)
   */
  private async storeIdentity(identity: AnonymousIdentity, profile: AnonymousProfile): Promise<void> {
    // In production, use encrypted database or secure key-value store
    const data = {
      identity: {
        id: identity.id,
        publicKey: identity.publicKey,
        signingPublicKey: identity.signingPublicKey,
        encryptedPrivateKey: identity.encryptedPrivateKey,
        createdAt: identity.createdAt,
        lastActive: identity.lastActive,
        role: identity.role,
        specializations: identity.specializations,
        walletAddress: identity.walletAddress
      },
      profile
    };
    
    localStorage.setItem(`terap_identity_${identity.id}`, JSON.stringify(data));
  }

  /**
   * Retrieve stored identity
   */
  private async retrieveIdentity(identityId: string): Promise<{
    identity: AnonymousIdentity | null;
    profile: AnonymousProfile | null;
  }> {
    try {
      const data = localStorage.getItem(`terap_identity_${identityId}`);
      if (!data) {
        return { identity: null, profile: null };
      }

      const parsed = JSON.parse(data);
      return {
        identity: parsed.identity,
        profile: parsed.profile
      };
    } catch (error) {
      return { identity: null, profile: null };
    }
  }

  /**
   * Get stored identity without profile
   */
  private async getStoredIdentity(identityId: string): Promise<AnonymousIdentity | null> {
    const { identity } = await this.retrieveIdentity(identityId);
    return identity;
  }

  /**
   * List all stored identities for the current device
   */
  async getStoredIdentities(): Promise<Array<{ id: string; displayName: string; role: 'client' | 'therapist'; lastActive: number }>> {
    const identities: Array<{ id: string; displayName: string; role: 'client' | 'therapist'; lastActive: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('terap_identity_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          identities.push({
            id: data.identity.id,
            displayName: data.profile.displayName,
            role: data.profile.role,
            lastActive: data.profile.lastActive
          });
        } catch (error) {
          // Skip invalid entries
        }
      }
    }
    
    return identities.sort((a, b) => b.lastActive - a.lastActive);
  }

  /**
   * Delete an identity permanently
   */
  async deleteIdentity(
    identityId: string, 
    walletAddress: string, 
    signature: string,
    signingMessage: string
  ): Promise<void> {
    // Verify wallet signature before deletion
    if (!cryptoService.verifySigningMessage(signingMessage)) {
      throw new Error('Signing message expired or invalid');
    }
    
    const { identity } = await this.retrieveIdentity(identityId);
    if (!identity) {
      throw new Error('Identity not found');
    }

    // Verify wallet ownership
    if (identity.walletAddress !== walletAddress) {
      throw new Error('Unauthorized: wallet does not own this identity');
    }

    try {
      cryptoService.decryptWithWallet(identity, walletAddress, signature);
    } catch (error) {
      throw new Error('Invalid wallet signature');
    }

    // Remove from storage
    localStorage.removeItem(`terap_identity_${identityId}`);
    
    // Clear session if it's the current user
    if (this.currentSession && this.currentSession.identity.id === identityId) {
      this.logout();
    }
  }

  /**
   * Update wallet signature for an identity (re-encrypt with new signature)
   */
  async updateWalletSignature(
    identityId: string,
    oldSignature: string,
    newSignature: string,
    walletAddress: string,
    signingMessage: string
  ): Promise<void> {
    if (!cryptoService.verifySigningMessage(signingMessage)) {
      throw new Error('Signing message expired or invalid');
    }
    
    const { identity, profile } = await this.retrieveIdentity(identityId);
    if (!identity || !profile) {
      throw new Error('Identity not found');
    }

    // Verify current wallet access
    let keys;
    try {
      keys = cryptoService.decryptWithWallet(identity, walletAddress, oldSignature);
    } catch (error) {
      throw new Error('Invalid current wallet signature');
    }

    // Re-encrypt with new signature
    const newEncryptedPrivateKey = cryptoService.encryptPrivateKeyWithWallet(
      JSON.stringify({
        boxPrivateKey: Buffer.from(keys.boxPrivateKey).toString('base64'),
        signingPrivateKey: Buffer.from(keys.signingPrivateKey).toString('base64')
      }),
      walletAddress,
      newSignature
    );

    const updatedIdentity: AnonymousIdentity = {
      ...identity,
      encryptedPrivateKey: newEncryptedPrivateKey
    };

    await this.storeIdentity(updatedIdentity, profile);
  }
}

export const anonymousIdentityService = AnonymousIdentityService.getInstance();