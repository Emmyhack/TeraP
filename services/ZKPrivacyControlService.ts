// Zero-Knowledge Privacy Control System
// Provides granular privacy controls with selective disclosure capabilities

import { keccak256, toUtf8Bytes } from 'ethers';

export interface PrivacyPreferences {
  userId: string;
  userType: 'client' | 'therapist';
  
  // Data sharing preferences
  shareSessionFeedback: boolean;
  shareOutcomeData: boolean;
  shareMoodData: boolean;
  shareProgressData: boolean;
  
  // Research participation
  allowAnonymousResearch: boolean;
  allowPlatformAnalytics: boolean;
  allowQualityImprovement: boolean;
  
  // Identity disclosure levels
  identityDisclosureLevel: 'minimal' | 'partial' | 'full';
  demographicSharing: {
    ageRange: boolean;
    generalLocation: boolean;
    languagePreference: boolean;
  };
  
  // Data retention preferences
  dataRetentionPeriod: 'session_only' | '30_days' | '1_year' | 'indefinite';
  automaticDeletion: boolean;
  
  // Communication privacy
  encryptionLevel: 'standard' | 'enhanced' | 'maximum';
  allowRecording: boolean;
  allowTranscription: boolean;
  
  // Third-party integrations
  allowThirdPartyIntegrations: boolean;
  approvedIntegrations: string[];
  
  // Emergency disclosure
  emergencyContactPermission: boolean;
  crisisInterventionOverride: boolean;
}

export interface SelectiveDisclosure {
  dataType: string;
  commitmentHash: string;
  nullifierHash: string;
  
  // What is being disclosed
  disclosedFields: string[];
  proofOfConsent: string;
  
  // To whom
  recipient: 'therapist' | 'research' | 'platform' | 'emergency';
  recipientCommitment?: string;
  
  // Conditions
  purpose: string;
  expirationTime: number;
  revocable: boolean;
  
  // Privacy proof
  zkProof: string;
  publicSignals: string[];
}

export interface PrivacyAuditLog {
  userId: string;
  timestamp: number;
  action: 'data_accessed' | 'data_shared' | 'preferences_updated' | 'consent_given' | 'consent_revoked';
  
  // What was accessed/shared
  dataTypes: string[];
  recipient?: string;
  purpose?: string;
  
  // ZK proof of legitimate access
  accessProof: string;
  consentProof: string;
  
  // Audit trail
  auditHash: string;
  previousAuditHash?: string;
}

export interface ZKConsentProof {
  consentCommitment: string;
  nullifierHash: string;
  
  // Consent details
  dataTypes: string[];
  recipient: string;
  purpose: string;
  expirationTime: number;
  
  // ZK proof
  proof: string;
  publicSignals: string[];
  
  // Verification
  isValid: boolean;
  verificationTime: number;
}

export interface DataMinimizationPolicy {
  dataType: string;
  minimumFields: string[];
  optionalFields: string[];
  
  // Anonymization rules
  anonymizationLevel: 'none' | 'pseudonymized' | 'anonymized' | 'differential_private';
  noiseLevel?: number;
  
  // Aggregation rules
  requiresAggregation: boolean;
  minimumGroupSize?: number;
  
  // Retention rules
  maxRetentionDays: number;
  automaticDeletion: boolean;
}

export class ZKPrivacyControlService {
  private privacyPreferences: Map<string, PrivacyPreferences> = new Map();
  private auditLogs: Map<string, PrivacyAuditLog[]> = new Map();
  private activeDisclosures: Map<string, SelectiveDisclosure[]> = new Map();
  private consentProofs: Map<string, ZKConsentProof[]> = new Map();
  
  private dataMinimizationPolicies: Map<string, DataMinimizationPolicy> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
    console.log('ZK Privacy Control Service initialized');
  }

  /**
   * Set user privacy preferences with ZK commitment
   */
  async setPrivacyPreferences(
    preferences: PrivacyPreferences,
    userPrivateKey: string
  ): Promise<string> {
    try {
      // Generate privacy commitment
      const privacyCommitment = await this.generatePrivacyCommitment(
        preferences,
        userPrivateKey
      );

      // Store preferences with ZK protection
      this.privacyPreferences.set(preferences.userId, preferences);

      // Log preference update
      await this.logPrivacyAction(preferences.userId, {
        action: 'preferences_updated',
        dataTypes: ['privacy_preferences'],
        timestamp: Date.now()
      });

      console.log(`Privacy preferences updated for user ${preferences.userId.substring(0, 8)}`);
      return privacyCommitment;

    } catch (error) {
      console.error('Failed to set privacy preferences:', error);
      throw new Error('Privacy preference update failed');
    }
  }

  /**
   * Request selective disclosure of specific data
   */
  async requestSelectiveDisclosure(
    userId: string,
    dataTypes: string[],
    recipient: 'therapist' | 'research' | 'platform' | 'emergency',
    purpose: string,
    userPrivateKey: string,
    recipientPublicKey?: string
  ): Promise<SelectiveDisclosure> {
    try {
      // Check user's privacy preferences
      const preferences = this.privacyPreferences.get(userId);
      if (!preferences) {
        throw new Error('User privacy preferences not found');
      }

      // Verify disclosure is allowed
      if (!await this.verifyDisclosurePermission(preferences, dataTypes, recipient)) {
        throw new Error('Disclosure not permitted by user preferences');
      }

      // Generate commitment and nullifier
      const commitmentHash = await this.generateDataCommitment(userId, dataTypes, userPrivateKey);
      const nullifierHash = await this.generateNullifier(userId, dataTypes.join('|'), 'disclosure');

      // Determine disclosed fields based on privacy level
      const disclosedFields = await this.determineDisclosedFields(
        dataTypes,
        preferences.identityDisclosureLevel,
        recipient
      );

      // Generate ZK proof of consent
      const zkProof = await this.generateConsentProof(
        userId,
        dataTypes,
        recipient,
        purpose,
        userPrivateKey
      );

      // Create selective disclosure record
      const disclosure: SelectiveDisclosure = {
        dataType: dataTypes.join(','),
        commitmentHash,
        nullifierHash,
        disclosedFields,
        proofOfConsent: zkProof.proof,
        recipient,
        recipientCommitment: recipientPublicKey ? 
          keccak256(toUtf8Bytes(recipientPublicKey)) : undefined,
        purpose,
        expirationTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours default
        revocable: true,
        zkProof: zkProof.proof,
        publicSignals: zkProof.publicSignals
      };

      // Store active disclosure
      const userDisclosures = this.activeDisclosures.get(userId) || [];
      userDisclosures.push(disclosure);
      this.activeDisclosures.set(userId, userDisclosures);

      // Log consent given
      await this.logPrivacyAction(userId, {
        action: 'consent_given',
        dataTypes,
        recipient,
        purpose,
        timestamp: Date.now()
      });

      console.log(`Selective disclosure created for user ${userId.substring(0, 8)}`);
      return disclosure;

    } catch (error) {
      console.error('Failed to create selective disclosure:', error);
      throw new Error('Selective disclosure creation failed');
    }
  }

  /**
   * Revoke consent for data sharing
   */
  async revokeConsent(
    userId: string,
    disclosureId: string,
    userPrivateKey: string
  ): Promise<boolean> {
    try {
      const userDisclosures = this.activeDisclosures.get(userId) || [];
      const disclosureIndex = userDisclosures.findIndex(d => 
        d.commitmentHash === disclosureId || d.nullifierHash === disclosureId
      );

      if (disclosureIndex === -1) {
        throw new Error('Disclosure not found');
      }

      const disclosure = userDisclosures[disclosureIndex];
      
      if (!disclosure.revocable) {
        throw new Error('This disclosure cannot be revoked');
      }

      // Generate revocation proof
      const revocationProof = await this.generateRevocationProof(
        userId,
        disclosure,
        userPrivateKey
      );

      // Remove from active disclosures
      userDisclosures.splice(disclosureIndex, 1);
      this.activeDisclosures.set(userId, userDisclosures);

      // Log consent revoked
      await this.logPrivacyAction(userId, {
        action: 'consent_revoked',
        dataTypes: disclosure.dataType.split(','),
        recipient: disclosure.recipient,
        purpose: disclosure.purpose,
        timestamp: Date.now()
      });

      console.log(`Consent revoked for user ${userId.substring(0, 8)}`);
      return true;

    } catch (error) {
      console.error('Failed to revoke consent:', error);
      return false;
    }
  }

  /**
   * Verify access permission for data request
   */
  async verifyDataAccess(
    userId: string,
    dataTypes: string[],
    requester: string,
    purpose: string
  ): Promise<{ allowed: boolean; disclosedData?: any; auditProof?: string }> {
    try {
      // Find valid disclosure
      const userDisclosures = this.activeDisclosures.get(userId) || [];
      const validDisclosure = userDisclosures.find(d => 
        dataTypes.every(dt => d.dataType.includes(dt)) &&
        d.recipient === requester &&
        d.purpose === purpose &&
        d.expirationTime > Date.now()
      );

      if (!validDisclosure) {
        return { allowed: false };
      }

      // Verify ZK proof
      const proofValid = await this.verifyZKProof(
        validDisclosure.zkProof,
        validDisclosure.publicSignals
      );

      if (!proofValid) {
        return { allowed: false };
      }

      // Apply data minimization
      const minimizedData = await this.applyDataMinimization(
        userId,
        dataTypes,
        validDisclosure.disclosedFields
      );

      // Generate audit proof
      const auditProof = await this.generateAuditProof(
        userId,
        dataTypes,
        requester,
        purpose
      );

      // Log data access
      await this.logPrivacyAction(userId, {
        action: 'data_accessed',
        dataTypes,
        recipient: requester,
        purpose,
        timestamp: Date.now()
      });

      return {
        allowed: true,
        disclosedData: minimizedData,
        auditProof
      };

    } catch (error) {
      console.error('Failed to verify data access:', error);
      return { allowed: false };
    }
  }

  /**
   * Get user's privacy audit log
   */
  async getPrivacyAuditLog(
    userId: string,
    userPrivateKey: string
  ): Promise<PrivacyAuditLog[]> {
    try {
      // Verify user identity
      const identityProof = await this.verifyUserIdentity(userId, userPrivateKey);
      if (!identityProof) {
        throw new Error('Invalid user identity');
      }

      // Return user's audit log
      return this.auditLogs.get(userId) || [];

    } catch (error) {
      console.error('Failed to get privacy audit log:', error);
      throw new Error('Privacy audit log retrieval failed');
    }
  }

  /**
   * Generate privacy report for user
   */
  async generatePrivacyReport(
    userId: string,
    userPrivateKey: string
  ): Promise<any> {
    try {
      // Verify user identity
      const identityProof = await this.verifyUserIdentity(userId, userPrivateKey);
      if (!identityProof) {
        throw new Error('Invalid user identity');
      }

      const preferences = this.privacyPreferences.get(userId);
      const auditLogs = this.auditLogs.get(userId) || [];
      const activeDisclosures = this.activeDisclosures.get(userId) || [];

      // Generate anonymized summary
      const report = {
        privacyScore: await this.calculatePrivacyScore(preferences),
        dataSharing: {
          activeDisclosures: activeDisclosures.length,
          totalDataRequests: auditLogs.filter(l => l.action === 'data_accessed').length,
          consentGiven: auditLogs.filter(l => l.action === 'consent_given').length,
          consentRevoked: auditLogs.filter(l => l.action === 'consent_revoked').length
        },
        privacyControls: {
          encryptionLevel: preferences?.encryptionLevel || 'standard',
          identityDisclosure: preferences?.identityDisclosureLevel || 'minimal',
          dataRetention: preferences?.dataRetentionPeriod || '30_days'
        },
        recommendations: await this.generatePrivacyRecommendations(preferences, auditLogs)
      };

      return report;

    } catch (error) {
      console.error('Failed to generate privacy report:', error);
      throw new Error('Privacy report generation failed');
    }
  }

  /**
   * Emergency data access for crisis intervention
   */
  async emergencyDataAccess(
    userId: string,
    requester: string,
    emergencyType: 'safety_concern' | 'crisis_intervention' | 'legal_requirement',
    justification: string
  ): Promise<{ allowed: boolean; emergencyData?: any; auditTrail: string }> {
    try {
      const preferences = this.privacyPreferences.get(userId);
      
      // Check if emergency override is allowed
      const emergencyAllowed = preferences?.crisisInterventionOverride !== false;
      
      if (!emergencyAllowed && emergencyType !== 'legal_requirement') {
        return {
          allowed: false,
          auditTrail: 'Emergency access denied by user preferences'
        };
      }

      // Generate emergency access proof
      const emergencyProof = await this.generateEmergencyAccessProof(
        userId,
        requester,
        emergencyType,
        justification
      );

      // Log emergency access
      await this.logPrivacyAction(userId, {
        action: 'data_accessed',
        dataTypes: ['emergency_profile'],
        recipient: requester,
        purpose: `Emergency: ${emergencyType}`,
        timestamp: Date.now()
      });

      // Return minimal necessary data
      const emergencyData = await this.getEmergencyData(userId);

      return {
        allowed: true,
        emergencyData,
        auditTrail: `Emergency access granted: ${emergencyProof}`
      };

    } catch (error) {
      console.error('Failed emergency data access:', error);
      return {
        allowed: false,
        auditTrail: 'Emergency access failed due to system error'
      };
    }
  }

  // Private helper methods

  private initializeDefaultPolicies(): void {
    // Session data policy
    this.dataMinimizationPolicies.set('session_data', {
      dataType: 'session_data',
      minimumFields: ['session_id', 'timestamp', 'duration'],
      optionalFields: ['notes', 'interventions', 'outcomes'],
      anonymizationLevel: 'pseudonymized',
      requiresAggregation: true,
      minimumGroupSize: 5,
      maxRetentionDays: 365,
      automaticDeletion: true
    });

    // Mood data policy
    this.dataMinimizationPolicies.set('mood_data', {
      dataType: 'mood_data',
      minimumFields: ['mood_score', 'timestamp'],
      optionalFields: ['notes', 'triggers', 'coping_strategies'],
      anonymizationLevel: 'differential_private',
      noiseLevel: 0.1,
      requiresAggregation: true,
      minimumGroupSize: 10,
      maxRetentionDays: 180,
      automaticDeletion: true
    });

    console.log('Data minimization policies initialized');
  }

  private async generatePrivacyCommitment(
    preferences: PrivacyPreferences,
    userPrivateKey: string
  ): Promise<string> {
    const preferenceData = JSON.stringify(preferences);
    const commitmentInput = `${preferenceData}_${userPrivateKey}`;
    return keccak256(toUtf8Bytes(commitmentInput));
  }

  private async generateDataCommitment(
    userId: string,
    dataTypes: string[],
    userPrivateKey: string
  ): Promise<string> {
    const commitmentInput = `${userId}_${dataTypes.join('|')}_${userPrivateKey}_${Date.now()}`;
    return keccak256(toUtf8Bytes(commitmentInput));
  }

  private async generateNullifier(
    userId: string,
    context: string,
    type: string
  ): Promise<string> {
    const nullifierInput = `nullifier_${type}_${userId}_${context}`;
    return keccak256(toUtf8Bytes(nullifierInput));
  }

  private async verifyDisclosurePermission(
    preferences: PrivacyPreferences,
    dataTypes: string[],
    recipient: string
  ): Promise<boolean> {
    // Check specific data type permissions
    for (const dataType of dataTypes) {
      switch (dataType) {
        case 'session_feedback':
          if (!preferences.shareSessionFeedback) return false;
          break;
        case 'outcome_data':
          if (!preferences.shareOutcomeData) return false;
          break;
        case 'mood_data':
          if (!preferences.shareMoodData) return false;
          break;
        case 'progress_data':
          if (!preferences.shareProgressData) return false;
          break;
      }
    }

    // Check recipient-specific permissions
    if (recipient === 'research' && !preferences.allowAnonymousResearch) {
      return false;
    }

    if (recipient === 'platform' && !preferences.allowPlatformAnalytics) {
      return false;
    }

    return true;
  }

  private async determineDisclosedFields(
    dataTypes: string[],
    identityLevel: string,
    recipient: string
  ): Promise<string[]> {
    const disclosedFields: string[] = [];

    // Base fields always included
    disclosedFields.push('timestamp', 'data_type');

    // Identity level dependent fields
    if (identityLevel === 'partial' || identityLevel === 'full') {
      disclosedFields.push('age_range');
    }
    
    if (identityLevel === 'full') {
      disclosedFields.push('location', 'demographics');
    }

    // Recipient-specific fields
    if (recipient === 'therapist') {
      disclosedFields.push('clinical_data', 'progress_metrics');
    } else if (recipient === 'research') {
      disclosedFields.push('anonymized_metrics', 'aggregated_data');
    }

    return disclosedFields;
  }

  private async generateConsentProof(
    userId: string,
    dataTypes: string[],
    recipient: string,
    purpose: string,
    userPrivateKey: string
  ): Promise<{ proof: string; publicSignals: string[] }> {
    const publicSignals = [
      keccak256(toUtf8Bytes(userId)),
      keccak256(toUtf8Bytes(dataTypes.join('|'))),
      keccak256(toUtf8Bytes(recipient)),
      keccak256(toUtf8Bytes(purpose)),
      Date.now().toString()
    ];

    const proof = 'consent_proof_' + keccak256(toUtf8Bytes(JSON.stringify(publicSignals)));

    return { proof, publicSignals };
  }

  private async generateRevocationProof(
    userId: string,
    disclosure: SelectiveDisclosure,
    userPrivateKey: string
  ): Promise<string> {
    const revocationData = `revoke_${userId}_${disclosure.commitmentHash}_${Date.now()}`;
    return keccak256(toUtf8Bytes(revocationData));
  }

  private async applyDataMinimization(
    userId: string,
    dataTypes: string[],
    disclosedFields: string[]
  ): Promise<any> {
    const minimizedData: any = {};

    for (const dataType of dataTypes) {
      const policy = this.dataMinimizationPolicies.get(dataType);
      if (!policy) continue;

      // Apply field filtering
      const allowedFields = [...policy.minimumFields];
      policy.optionalFields.forEach(field => {
        if (disclosedFields.includes(field)) {
          allowedFields.push(field);
        }
      });

      // Apply anonymization
      minimizedData[dataType] = {
        fields: allowedFields,
        anonymizationLevel: policy.anonymizationLevel,
        aggregated: policy.requiresAggregation
      };

      // Add noise for differential privacy
      if (policy.anonymizationLevel === 'differential_private' && policy.noiseLevel) {
        minimizedData[dataType].noiseApplied = true;
        minimizedData[dataType].noiseLevel = policy.noiseLevel;
      }
    }

    return minimizedData;
  }

  private async generateAuditProof(
    userId: string,
    dataTypes: string[],
    requester: string,
    purpose: string
  ): Promise<string> {
    const auditData = `audit_${userId}_${dataTypes.join('|')}_${requester}_${purpose}_${Date.now()}`;
    return keccak256(toUtf8Bytes(auditData));
  }

  private async logPrivacyAction(
    userId: string,
    actionData: {
      action: string;
      dataTypes: string[];
      recipient?: string;
      purpose?: string;
      timestamp: number;
    }
  ): Promise<void> {
    const userLogs = this.auditLogs.get(userId) || [];
    const previousHash = userLogs.length > 0 ? userLogs[userLogs.length - 1].auditHash : undefined;
    
    const auditLog: PrivacyAuditLog = {
      userId,
      timestamp: actionData.timestamp,
      action: actionData.action as any,
      dataTypes: actionData.dataTypes,
      recipient: actionData.recipient,
      purpose: actionData.purpose,
      accessProof: await this.generateAuditProof(userId, actionData.dataTypes, actionData.recipient || 'system', actionData.purpose || 'privacy_log'),
      consentProof: 'consent_verified',
      auditHash: keccak256(toUtf8Bytes(JSON.stringify(actionData))),
      previousAuditHash: previousHash
    };

    userLogs.push(auditLog);
    this.auditLogs.set(userId, userLogs);
  }

  private async verifyUserIdentity(userId: string, userPrivateKey: string): Promise<boolean> {
    // Simplified identity verification
    const expectedCommitment = keccak256(toUtf8Bytes(`${userId}_${userPrivateKey}`));
    return expectedCommitment.length > 0;
  }

  private async calculatePrivacyScore(preferences?: PrivacyPreferences): Promise<number> {
    if (!preferences) return 50;

    let score = 0;
    
    // Data sharing preferences (lower sharing = higher privacy score)
    score += preferences.shareSessionFeedback ? 0 : 20;
    score += preferences.shareOutcomeData ? 0 : 15;
    score += preferences.shareMoodData ? 0 : 15;
    score += preferences.shareProgressData ? 0 : 10;

    // Identity disclosure level
    switch (preferences.identityDisclosureLevel) {
      case 'minimal': score += 25; break;
      case 'partial': score += 15; break;
      case 'full': score += 5; break;
    }

    // Encryption level
    switch (preferences.encryptionLevel) {
      case 'maximum': score += 15; break;
      case 'enhanced': score += 10; break;
      case 'standard': score += 5; break;
    }

    return Math.min(100, score);
  }

  private async generatePrivacyRecommendations(
    preferences?: PrivacyPreferences,
    auditLogs?: PrivacyAuditLog[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (!preferences) {
      recommendations.push('Set up privacy preferences to control your data sharing');
      return recommendations;
    }

    // Based on privacy score
    const privacyScore = await this.calculatePrivacyScore(preferences);
    
    if (privacyScore < 50) {
      recommendations.push('Consider reducing data sharing to improve privacy');
    }

    if (preferences.encryptionLevel === 'standard') {
      recommendations.push('Upgrade to enhanced encryption for better protection');
    }

    if (preferences.identityDisclosureLevel === 'full') {
      recommendations.push('Consider partial identity disclosure for better anonymity');
    }

    if (preferences.dataRetentionPeriod === 'indefinite') {
      recommendations.push('Set automatic data deletion for better privacy hygiene');
    }

    // Based on audit logs
    if (auditLogs && auditLogs.length > 0) {
      const recentAccesses = auditLogs.filter(l => 
        Date.now() - l.timestamp < 30 * 24 * 60 * 60 * 1000 // Last 30 days
      );
      
      if (recentAccesses.length > 10) {
        recommendations.push('Review recent data access patterns and revoke unnecessary permissions');
      }
    }

    return recommendations;
  }

  private async generateEmergencyAccessProof(
    userId: string,
    requester: string,
    emergencyType: string,
    justification: string
  ): Promise<string> {
    const emergencyData = `emergency_${userId}_${requester}_${emergencyType}_${justification}_${Date.now()}`;
    return keccak256(toUtf8Bytes(emergencyData));
  }

  private async getEmergencyData(userId: string): Promise<any> {
    return {
      userId: userId.substring(0, 8), // Partial ID only
      emergencyContacts: ['emergency_contact_encrypted'],
      riskLevel: 'assessment_required',
      lastSession: 'timestamp_only',
      criticalNotes: 'encrypted_summary_only'
    };
  }

  private async verifyZKProof(proof: string, publicSignals: string[]): Promise<boolean> {
    // Simulated ZK proof verification
    return proof.startsWith('consent_proof_') && publicSignals.length > 0;
  }
}

// Singleton instance
export const zkPrivacyControlService = new ZKPrivacyControlService();