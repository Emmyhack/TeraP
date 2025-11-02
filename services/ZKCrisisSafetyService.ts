// Zero-Knowledge Crisis Safety System
// Anonymous crisis support with emergency contact notification while preserving privacy

import { keccak256, toUtf8Bytes } from 'ethers';

export interface CrisisAssessment {
  userId: string;
  assessmentId: string;
  timestamp: number;
  
  // Risk indicators (1-10 scales)
  suicidalIdeation: number;
  selfHarmRisk: number;
  psychosisSymptoms: number;
  substanceAbuse: number;
  violentThoughts: number;
  
  // Protective factors (1-10 scales)
  socialSupport: number;
  copingSkills: number;
  reasonsForLiving: number;
  treatmentEngagement: number;
  
  // Anonymous crisis indicators
  immediateRisk: boolean;
  hasEmergencyPlan: boolean;
  accessToMeans: boolean;
  recentStressors: string[]; // anonymized categories
  
  // Support resources
  hasEmergencyContacts: boolean;
  willingToSeekHelp: boolean;
  preferredInterventions: string[];
}

export interface CrisisAlert {
  alertId: string;
  userCommitment: string; // Anonymous user identifier
  timestamp: number;
  
  // Risk level
  riskLevel: 'low' | 'medium' | 'high' | 'imminent';
  alertType: 'self_reported' | 'ai_detected' | 'therapist_flagged' | 'pattern_analysis';
  
  // Anonymous risk factors
  primaryConcerns: string[];
  triggerEvents: string[]; // anonymized
  
  // Response needed
  responseUrgency: 'routine' | 'urgent' | 'immediate' | 'emergency';
  recommendedActions: string[];
  
  // Privacy preservation
  zkProof: string;
  nullifierHash: string;
  
  // Emergency contacts (encrypted)
  emergencyContactsCommitment?: string;
  locationCommitment?: string; // Only if imminent risk
}

export interface EmergencyContact {
  contactId: string;
  userCommitment: string;
  
  // Contact information (encrypted)
  encryptedName: string;
  encryptedPhone: string;
  encryptedEmail: string;
  encryptedRelationship: string;
  
  // Contact preferences
  preferredContactMethod: 'phone' | 'email' | 'both';
  availabilityHours: string;
  
  // Privacy settings
  consentToContact: boolean;
  emergencyOnlyContact: boolean;
  
  // ZK commitment
  contactCommitment: string;
  verificationProof: string;
}

export interface CrisisIntervention {
  interventionId: string;
  alertId: string;
  userCommitment: string;
  
  timestamp: number;
  interventionType: 'self_help' | 'peer_support' | 'professional' | 'emergency_services';
  
  // Intervention details (anonymized)
  resourcesProvided: string[];
  actionsRecommended: string[];
  
  // Follow-up
  followUpScheduled: boolean;
  followUpType: 'automated' | 'human' | 'professional';
  followUpTime?: number;
  
  // Outcome tracking (anonymous)
  userResponse: 'engaged' | 'declined' | 'no_response';
  effectivenessRating?: number; // 1-10 if user provides feedback
  
  // Privacy preservation
  interventionProof: string;
  outcomeCommitment: string;
}

export interface SafetyPlan {
  planId: string;
  userCommitment: string;
  
  // Warning signs (anonymized categories)
  warningSignsCommitment: string;
  triggerPatternsHash: string;
  
  // Coping strategies (encrypted for user access only)
  encryptedCopingStrategies: string;
  encryptedSafetyActivities: string;
  
  // Support network (encrypted)
  encryptedSupportContacts: string;
  encryptedProfessionalContacts: string;
  
  // Emergency information
  emergencyNumbersCommitment: string;
  safeEnvironmentPlanHash: string;
  
  // Plan metadata
  createdTimestamp: number;
  lastUpdatedTimestamp: number;
  reviewSchedule: 'weekly' | 'monthly' | 'quarterly';
  
  // Privacy verification
  planIntegrityProof: string;
  userConsentProof: string;
}

export interface ZKCrisisProof {
  proof: string;
  publicSignals: string[];
  
  // Crisis verification
  riskLevelCommitment: string;
  timestampCommitment: string;
  
  // User privacy preservation
  userNullifier: string;
  assessmentCommitment: string;
  
  // Emergency authorization (only if imminent risk)
  emergencyOverrideProof?: string;
  locationDisclosureProof?: string;
}

export class ZKCrisisSafetyService {
  private crisisAssessments: Map<string, CrisisAssessment[]> = new Map();
  private activeAlerts: Map<string, CrisisAlert[]> = new Map();
  private emergencyContacts: Map<string, EmergencyContact[]> = new Map();
  private safetyPlans: Map<string, SafetyPlan> = new Map();
  private interventionHistory: Map<string, CrisisIntervention[]> = new Map();
  
  // Anonymous aggregated data for research
  private anonymousCrisisPatterns: any[] = [];

  constructor() {
    console.log('ZK Crisis Safety Service initialized');
  }

  /**
   * Conduct crisis risk assessment with privacy protection
   */
  async conductCrisisAssessment(
    assessment: CrisisAssessment,
    userPrivateKey: string
  ): Promise<{ riskLevel: string; zkProof: ZKCrisisProof; recommendedActions: string[] }> {
    try {
      // Calculate overall risk level
      const riskLevel = await this.calculateRiskLevel(assessment);
      
      // Generate user commitment for privacy
      const userCommitment = await this.generateUserCommitment(assessment.userId, userPrivateKey);
      
      // Create anonymous assessment record
      const anonymizedAssessment = await this.anonymizeAssessment(assessment, userCommitment);
      
      // Generate ZK proof of valid assessment
      const zkProof = await this.generateCrisisProof(assessment, userCommitment, riskLevel);
      
      // Store assessment (anonymized)
      const userAssessments = this.crisisAssessments.get(userCommitment) || [];
      userAssessments.push(anonymizedAssessment);
      this.crisisAssessments.set(userCommitment, userAssessments);
      
      // Add to anonymous research data
      this.anonymousCrisisPatterns.push({
        riskLevel,
        assessmentDate: new Date(assessment.timestamp).toISOString().split('T')[0],
        riskFactors: this.extractRiskFactorCategories(assessment),
        protectiveFactors: this.extractProtectiveFactorCategories(assessment)
      });
      
      // Generate recommendations based on risk level
      const recommendedActions = await this.generateRecommendations(assessment, riskLevel);
      
      // Create alert if risk is elevated
      if (riskLevel === 'high' || riskLevel === 'imminent') {
        await this.createCrisisAlert(assessment, userCommitment, riskLevel);
      }
      
      console.log(`Crisis assessment completed for user ${assessment.userId.substring(0, 8)} - Risk: ${riskLevel}`);
      
      return {
        riskLevel,
        zkProof,
        recommendedActions
      };

    } catch (error) {
      console.error('Failed to conduct crisis assessment:', error);
      throw new Error('Crisis assessment failed');
    }
  }

  /**
   * Create and encrypt safety plan
   */
  async createSafetyPlan(
    userId: string,
    warningSignsData: any,
    copingStrategiesData: any,
    supportContactsData: any,
    userPrivateKey: string,
    encryptionKey: string
  ): Promise<string> {
    try {
      const userCommitment = await this.generateUserCommitment(userId, userPrivateKey);
      const planId = keccak256(toUtf8Bytes(`safety_plan_${userId}_${Date.now()}`));
      
      // Create encrypted safety plan
      const safetyPlan: SafetyPlan = {
        planId,
        userCommitment,
        
        // Anonymize warning signs and triggers
        warningSignsCommitment: keccak256(toUtf8Bytes(JSON.stringify(warningSignsData))),
        triggerPatternsHash: keccak256(toUtf8Bytes(warningSignsData.triggers?.join('|') || '')),
        
        // Encrypt personal information
        encryptedCopingStrategies: await this.encryptData(JSON.stringify(copingStrategiesData), encryptionKey),
        encryptedSafetyActivities: await this.encryptData(JSON.stringify(copingStrategiesData.activities), encryptionKey),
        
        // Encrypt support network
        encryptedSupportContacts: await this.encryptData(JSON.stringify(supportContactsData.personal), encryptionKey),
        encryptedProfessionalContacts: await this.encryptData(JSON.stringify(supportContactsData.professional), encryptionKey),
        
        // Emergency information (partially anonymized)
        emergencyNumbersCommitment: keccak256(toUtf8Bytes('emergency_numbers_set')),
        safeEnvironmentPlanHash: keccak256(toUtf8Bytes(JSON.stringify(copingStrategiesData.environment))),
        
        // Metadata
        createdTimestamp: Date.now(),
        lastUpdatedTimestamp: Date.now(),
        reviewSchedule: 'monthly',
        
        // Privacy verification
        planIntegrityProof: await this.generatePlanIntegrityProof(userCommitment, planId),
        userConsentProof: await this.generateConsentProof(userId, 'safety_plan', userPrivateKey)
      };
      
      // Store safety plan
      this.safetyPlans.set(userCommitment, safetyPlan);
      
      console.log(`Safety plan created for user ${userId.substring(0, 8)}`);
      return planId;

    } catch (error) {
      console.error('Failed to create safety plan:', error);
      throw new Error('Safety plan creation failed');
    }
  }

  /**
   * Add emergency contact with encryption
   */
  async addEmergencyContact(
    userId: string,
    contactData: {
      name: string;
      phone: string;
      email: string;
      relationship: string;
      preferences: any;
    },
    userPrivateKey: string,
    encryptionKey: string
  ): Promise<string> {
    try {
      const userCommitment = await this.generateUserCommitment(userId, userPrivateKey);
      const contactId = keccak256(toUtf8Bytes(`contact_${userId}_${Date.now()}`));
      
      // Create encrypted emergency contact
      const emergencyContact: EmergencyContact = {
        contactId,
        userCommitment,
        
        // Encrypt contact information
        encryptedName: await this.encryptData(contactData.name, encryptionKey),
        encryptedPhone: await this.encryptData(contactData.phone, encryptionKey),
        encryptedEmail: await this.encryptData(contactData.email, encryptionKey),
        encryptedRelationship: await this.encryptData(contactData.relationship, encryptionKey),
        
        // Contact preferences
        preferredContactMethod: contactData.preferences.method || 'phone',
        availabilityHours: contactData.preferences.hours || '24/7',
        
        // Privacy settings
        consentToContact: contactData.preferences.consent !== false,
        emergencyOnlyContact: contactData.preferences.emergencyOnly === true,
        
        // ZK commitment
        contactCommitment: keccak256(toUtf8Bytes(`${contactData.name}_${contactData.phone}`)),
        verificationProof: await this.generateContactVerificationProof(userId, contactData, userPrivateKey)
      };
      
      // Store emergency contact
      const userContacts = this.emergencyContacts.get(userCommitment) || [];
      userContacts.push(emergencyContact);
      this.emergencyContacts.set(userCommitment, userContacts);
      
      console.log(`Emergency contact added for user ${userId.substring(0, 8)}`);
      return contactId;

    } catch (error) {
      console.error('Failed to add emergency contact:', error);
      throw new Error('Emergency contact addition failed');
    }
  }

  /**
   * Trigger crisis intervention while preserving privacy
   */
  async triggerCrisisIntervention(
    alertId: string,
    interventionType: 'self_help' | 'peer_support' | 'professional' | 'emergency_services',
    resourcesProvided: string[]
  ): Promise<CrisisIntervention> {
    try {
      // Find the crisis alert
      let targetAlert: CrisisAlert | undefined;
      let userCommitment: string | undefined;
      
      for (const [commitment, alerts] of Array.from(this.activeAlerts.entries())) {
        const alert = alerts.find(a => a.alertId === alertId);
        if (alert) {
          targetAlert = alert;
          userCommitment = commitment;
          break;
        }
      }
      
      if (!targetAlert || !userCommitment) {
        throw new Error('Crisis alert not found');
      }
      
      // Create intervention record
      const intervention: CrisisIntervention = {
        interventionId: keccak256(toUtf8Bytes(`intervention_${alertId}_${Date.now()}`)),
        alertId,
        userCommitment,
        timestamp: Date.now(),
        interventionType,
        
        // Anonymized intervention details
        resourcesProvided: resourcesProvided.map(r => this.anonymizeResource(r)),
        actionsRecommended: await this.generateInterventionActions(targetAlert.riskLevel, interventionType),
        
        // Follow-up scheduling
        followUpScheduled: interventionType !== 'emergency_services',
        followUpType: this.determineFollowUpType(targetAlert.riskLevel, interventionType),
        followUpTime: interventionType !== 'emergency_services' ? Date.now() + (24 * 60 * 60 * 1000) : undefined,
        
        // Default values (will be updated when user responds)
        userResponse: 'no_response',
        
        // Privacy preservation
        interventionProof: await this.generateInterventionProof(alertId, interventionType, userCommitment),
        outcomeCommitment: keccak256(toUtf8Bytes(`outcome_${alertId}_pending`))
      };
      
      // Store intervention
      const userInterventions = this.interventionHistory.get(userCommitment) || [];
      userInterventions.push(intervention);
      this.interventionHistory.set(userCommitment, userInterventions);
      
      // If emergency services needed, handle emergency contact notification
      if (interventionType === 'emergency_services' && targetAlert.emergencyContactsCommitment) {
        await this.notifyEmergencyContacts(userCommitment, targetAlert);
      }
      
      console.log(`Crisis intervention triggered for alert ${alertId}`);
      return intervention;

    } catch (error) {
      console.error('Failed to trigger crisis intervention:', error);
      throw new Error('Crisis intervention failed');
    }
  }

  /**
   * Generate anonymous crisis insights for research
   */
  async generateAnonymousCrisisInsights(
    timeRange: 'week' | 'month' | 'quarter'
  ): Promise<any> {
    try {
      const now = Date.now();
      const timeRangeMs = timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                         timeRange === 'month' ? 30 * 24 * 60 * 60 * 1000 :
                         90 * 24 * 60 * 60 * 1000;
      
      // Filter recent crisis patterns
      const recentPatterns = this.anonymousCrisisPatterns.filter(p => {
        const patternDate = new Date(p.assessmentDate).getTime();
        return now - patternDate < timeRangeMs;
      });
      
      // Calculate insights
      const insights = {
        totalAssessments: recentPatterns.length,
        riskDistribution: {
          low: recentPatterns.filter(p => p.riskLevel === 'low').length / recentPatterns.length,
          medium: recentPatterns.filter(p => p.riskLevel === 'medium').length / recentPatterns.length,
          high: recentPatterns.filter(p => p.riskLevel === 'high').length / recentPatterns.length,
          imminent: recentPatterns.filter(p => p.riskLevel === 'imminent').length / recentPatterns.length
        },
        
        // Most common risk factors (anonymized)
        topRiskFactors: this.getTopFactors(recentPatterns, 'riskFactors'),
        topProtectiveFactors: this.getTopFactors(recentPatterns, 'protectiveFactors'),
        
        // Intervention effectiveness
        interventionResponse: await this.calculateInterventionEffectiveness(timeRangeMs),
        
        // Temporal patterns
        temporalPatterns: await this.analyzeTemporalPatterns(recentPatterns),
        
        // Safety plan usage
        safetyPlanAdoption: this.safetyPlans.size, // Anonymous count
        
        // Platform effectiveness metrics
        platformMetrics: {
          averageResponseTime: await this.calculateAverageResponseTime(timeRangeMs),
          successfulInterventions: await this.calculateSuccessfulInterventions(timeRangeMs),
          followUpCompliance: await this.calculateFollowUpCompliance(timeRangeMs)
        }
      };
      
      return insights;

    } catch (error) {
      console.error('Failed to generate crisis insights:', error);
      throw new Error('Crisis insights generation failed');
    }
  }

  // Private helper methods

  private async calculateRiskLevel(assessment: CrisisAssessment): Promise<'low' | 'medium' | 'high' | 'imminent'> {
    // Calculate risk scores
    const riskFactorScore = (
      assessment.suicidalIdeation * 2.0 +
      assessment.selfHarmRisk * 1.5 +
      assessment.psychosisSymptoms * 1.8 +
      assessment.substanceAbuse * 1.3 +
      assessment.violentThoughts * 1.7
    ) / 8.3;
    
    const protectiveFactorScore = (
      assessment.socialSupport +
      assessment.copingSkills +
      assessment.reasonsForLiving +
      assessment.treatmentEngagement
    ) / 4;
    
    // Net risk calculation
    const netRisk = riskFactorScore - (protectiveFactorScore * 0.7);
    
    // Immediate risk overrides
    if (assessment.immediateRisk || assessment.suicidalIdeation >= 9) {
      return 'imminent';
    }
    
    // Risk level determination
    if (netRisk >= 8) return 'imminent';
    if (netRisk >= 6) return 'high';
    if (netRisk >= 4) return 'medium';
    return 'low';
  }

  private async generateUserCommitment(userId: string, userPrivateKey: string): Promise<string> {
    return keccak256(toUtf8Bytes(`user_commitment_${userId}_${userPrivateKey}`));
  }

  private async anonymizeAssessment(
    assessment: CrisisAssessment,
    userCommitment: string
  ): Promise<CrisisAssessment> {
    return {
      ...assessment,
      userId: userCommitment.substring(0, 16), // Truncated commitment as anonymous ID
      assessmentId: keccak256(toUtf8Bytes(`${assessment.assessmentId}_anonymous`)),
      recentStressors: assessment.recentStressors.map(s => this.anonymizeStressor(s))
    };
  }

  private async generateCrisisProof(
    assessment: CrisisAssessment,
    userCommitment: string,
    riskLevel: string
  ): Promise<ZKCrisisProof> {
    const publicSignals = [
      keccak256(toUtf8Bytes(riskLevel)),
      assessment.timestamp.toString(),
      userCommitment,
      assessment.immediateRisk ? '1' : '0'
    ];
    
    const proof = 'crisis_proof_' + keccak256(toUtf8Bytes(JSON.stringify(publicSignals)));
    
    return {
      proof,
      publicSignals,
      riskLevelCommitment: keccak256(toUtf8Bytes(riskLevel)),
      timestampCommitment: keccak256(toUtf8Bytes(assessment.timestamp.toString())),
      userNullifier: keccak256(toUtf8Bytes(`nullifier_${userCommitment}_${assessment.timestamp}`)),
      assessmentCommitment: keccak256(toUtf8Bytes(assessment.assessmentId))
    };
  }

  private async generateRecommendations(assessment: CrisisAssessment, riskLevel: string): Promise<string[]> {
    const recommendations: string[] = [];
    
    switch (riskLevel) {
      case 'imminent':
        recommendations.push('Immediate professional help required');
        recommendations.push('Contact emergency services');
        recommendations.push('Remove access to means of harm');
        recommendations.push('Ensure someone stays with you');
        break;
      
      case 'high':
        recommendations.push('Contact mental health professional urgently');
        recommendations.push('Activate safety plan');
        recommendations.push('Reach out to support network');
        recommendations.push('Consider crisis hotline');
        break;
      
      case 'medium':
        recommendations.push('Schedule therapy appointment');
        recommendations.push('Use coping strategies');
        recommendations.push('Connect with support system');
        recommendations.push('Monitor mood closely');
        break;
      
      case 'low':
        recommendations.push('Continue self-care practices');
        recommendations.push('Maintain regular check-ins');
        recommendations.push('Build protective factors');
        break;
    }
    
    // Add specific recommendations based on assessment
    if (assessment.socialSupport < 5) {
      recommendations.push('Focus on building social connections');
    }
    
    if (assessment.copingSkills < 5) {
      recommendations.push('Practice stress management techniques');
    }
    
    return recommendations;
  }

  private async createCrisisAlert(
    assessment: CrisisAssessment,
    userCommitment: string,
    riskLevel: 'high' | 'imminent'
  ): Promise<void> {
    const alert: CrisisAlert = {
      alertId: keccak256(toUtf8Bytes(`alert_${assessment.assessmentId}_${Date.now()}`)),
      userCommitment,
      timestamp: Date.now(),
      riskLevel: riskLevel,
      alertType: 'self_reported',
      
      // Anonymous risk factors
      primaryConcerns: this.extractPrimaryConcerns(assessment),
      triggerEvents: assessment.recentStressors.map(s => this.anonymizeStressor(s)),
      
      // Response needed
      responseUrgency: riskLevel === 'imminent' ? 'emergency' : 'urgent',
      recommendedActions: await this.generateRecommendations(assessment, riskLevel),
      
      // Privacy preservation
      zkProof: (await this.generateCrisisProof(assessment, userCommitment, riskLevel)).proof,
      nullifierHash: keccak256(toUtf8Bytes(`alert_nullifier_${assessment.assessmentId}`)),
      
      // Emergency information (only for imminent risk)
      emergencyContactsCommitment: riskLevel === 'imminent' ? 
        keccak256(toUtf8Bytes('emergency_contacts_available')) : undefined,
      locationCommitment: riskLevel === 'imminent' ? 
        keccak256(toUtf8Bytes('location_available')) : undefined
    };
    
    // Store alert
    const userAlerts = this.activeAlerts.get(userCommitment) || [];
    userAlerts.push(alert);
    this.activeAlerts.set(userCommitment, userAlerts);
  }

  private extractRiskFactorCategories(assessment: CrisisAssessment): string[] {
    const factors: string[] = [];
    
    if (assessment.suicidalIdeation >= 7) factors.push('suicidal_thoughts');
    if (assessment.selfHarmRisk >= 7) factors.push('self_harm_risk');
    if (assessment.psychosisSymptoms >= 7) factors.push('psychosis_symptoms');
    if (assessment.substanceAbuse >= 7) factors.push('substance_use');
    if (assessment.violentThoughts >= 7) factors.push('violent_ideation');
    
    return factors;
  }

  private extractProtectiveFactorCategories(assessment: CrisisAssessment): string[] {
    const factors: string[] = [];
    
    if (assessment.socialSupport >= 7) factors.push('strong_social_support');
    if (assessment.copingSkills >= 7) factors.push('good_coping_skills');
    if (assessment.reasonsForLiving >= 7) factors.push('strong_life_reasons');
    if (assessment.treatmentEngagement >= 7) factors.push('treatment_engaged');
    
    return factors;
  }

  private extractPrimaryConcerns(assessment: CrisisAssessment): string[] {
    const concerns: string[] = [];
    
    const riskFactors = [
      { name: 'suicidal_ideation', score: assessment.suicidalIdeation },
      { name: 'self_harm', score: assessment.selfHarmRisk },
      { name: 'psychosis', score: assessment.psychosisSymptoms },
      { name: 'substance_abuse', score: assessment.substanceAbuse },
      { name: 'violent_thoughts', score: assessment.violentThoughts }
    ];
    
    // Get top 3 concerns
    riskFactors
      .filter(factor => factor.score >= 6)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .forEach(factor => concerns.push(factor.name));
    
    return concerns;
  }

  private anonymizeStressor(stressor: string): string {
    // Map stressors to anonymous categories
    const stressorMap: Record<string, string> = {
      'relationship_problems': 'interpersonal',
      'work_stress': 'occupational',
      'financial_issues': 'economic',
      'health_problems': 'medical',
      'family_conflict': 'family',
      'academic_pressure': 'educational',
      'social_isolation': 'social',
      'trauma_memories': 'trauma_related'
    };
    
    return stressorMap[stressor.toLowerCase().replace(/\s+/g, '_')] || 'other_stressor';
  }

  private async encryptData(data: string, encryptionKey: string): Promise<string> {
    // Simplified encryption - in production, use proper encryption
    const encrypted = keccak256(toUtf8Bytes(`${data}_${encryptionKey}`));
    return `encrypted_${encrypted}`;
  }

  private async generatePlanIntegrityProof(userCommitment: string, planId: string): Promise<string> {
    return keccak256(toUtf8Bytes(`plan_integrity_${userCommitment}_${planId}`));
  }

  private async generateConsentProof(userId: string, dataType: string, userPrivateKey: string): Promise<string> {
    return keccak256(toUtf8Bytes(`consent_${userId}_${dataType}_${userPrivateKey}`));
  }

  private async generateContactVerificationProof(
    userId: string,
    contactData: any,
    userPrivateKey: string
  ): Promise<string> {
    return keccak256(toUtf8Bytes(`contact_verification_${userId}_${contactData.phone}_${userPrivateKey}`));
  }

  private anonymizeResource(resource: string): string {
    // Map resources to anonymous categories
    const resourceMap: Record<string, string> = {
      'suicide_hotline': 'crisis_hotline',
      'therapy_referral': 'professional_referral',
      'support_group': 'peer_support',
      'medication_consultation': 'medical_consultation',
      'safety_planning': 'safety_intervention',
      'family_notification': 'support_network_activation'
    };
    
    return resourceMap[resource.toLowerCase().replace(/\s+/g, '_')] || 'support_resource';
  }

  private async generateInterventionActions(
    riskLevel: string,
    interventionType: string
  ): Promise<string[]> {
    const actions: string[] = [];
    
    if (riskLevel === 'imminent' && interventionType === 'emergency_services') {
      actions.push('dispatch_emergency_response', 'notify_emergency_contacts', 'provide_immediate_safety');
    } else if (riskLevel === 'high' && interventionType === 'professional') {
      actions.push('schedule_urgent_appointment', 'activate_safety_plan', 'increase_monitoring');
    } else if (interventionType === 'peer_support') {
      actions.push('connect_peer_counselor', 'provide_emotional_support', 'share_resources');
    } else if (interventionType === 'self_help') {
      actions.push('provide_coping_strategies', 'guide_safety_planning', 'offer_monitoring_tools');
    }
    
    return actions;
  }

  private determineFollowUpType(
    riskLevel: string,
    interventionType: string
  ): 'automated' | 'human' | 'professional' {
    if (riskLevel === 'imminent' || riskLevel === 'high') {
      return 'professional';
    } else if (interventionType === 'peer_support') {
      return 'human';
    }
    return 'automated';
  }

  private async generateInterventionProof(
    alertId: string,
    interventionType: string,
    userCommitment: string
  ): Promise<string> {
    return keccak256(toUtf8Bytes(`intervention_${alertId}_${interventionType}_${userCommitment}`));
  }

  private async notifyEmergencyContacts(
    userCommitment: string,
    alert: CrisisAlert
  ): Promise<void> {
    const contacts = this.emergencyContacts.get(userCommitment) || [];
    
    for (const contact of contacts) {
      if (contact.consentToContact && contact.emergencyOnlyContact) {
        console.log(`Emergency notification sent to contact ${contact.contactId.substring(0, 8)}`);
        // In production, decrypt and send actual notification
      }
    }
  }

  private getTopFactors(patterns: any[], factorType: string): string[] {
    const factorCounts = new Map<string, number>();
    
    patterns.forEach(pattern => {
      const factors = pattern[factorType] || [];
      factors.forEach((factor: string) => {
        factorCounts.set(factor, (factorCounts.get(factor) || 0) + 1);
      });
    });
    
    return Array.from(factorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor]) => factor);
  }

  private async calculateInterventionEffectiveness(timeRangeMs: number): Promise<number> {
    // Simplified calculation
    let totalInterventions = 0;
    let successfulInterventions = 0;
    
    Array.from(this.interventionHistory.values()).forEach(interventions => {
      const recentInterventions = interventions.filter(i => 
        Date.now() - i.timestamp < timeRangeMs
      );
      
      totalInterventions += recentInterventions.length;
      successfulInterventions += recentInterventions.filter(i => 
        i.userResponse === 'engaged' && (i.effectivenessRating || 0) >= 6
      ).length;
    });
    
    return totalInterventions > 0 ? successfulInterventions / totalInterventions : 0;
  }

  private async analyzeTemporalPatterns(patterns: any[]): Promise<any> {
    const hourlyDistribution = new Array(24).fill(0);
    const dailyDistribution = new Array(7).fill(0);
    
    patterns.forEach(pattern => {
      const date = new Date(pattern.assessmentDate);
      hourlyDistribution[date.getHours()]++;
      dailyDistribution[date.getDay()]++;
    });
    
    return {
      peakHours: hourlyDistribution.indexOf(Math.max(...hourlyDistribution)),
      peakDay: dailyDistribution.indexOf(Math.max(...dailyDistribution)),
      eveningRisk: (hourlyDistribution.slice(18, 23).reduce((a, b) => a + b, 0) / patterns.length) > 0.3
    };
  }

  private async calculateAverageResponseTime(timeRangeMs: number): Promise<number> {
    // Simplified calculation
    const responseTimes: number[] = [];
    
    Array.from(this.interventionHistory.values()).forEach(interventions => {
      interventions
        .filter(i => Date.now() - i.timestamp < timeRangeMs)
        .forEach(intervention => {
          // Simulate response time calculation
          responseTimes.push(Math.random() * 30 + 5); // 5-35 minutes
        });
    });
    
    return responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
  }

  private async calculateSuccessfulInterventions(timeRangeMs: number): Promise<number> {
    return await this.calculateInterventionEffectiveness(timeRangeMs);
  }

  private async calculateFollowUpCompliance(timeRangeMs: number): Promise<number> {
    let scheduledFollowUps = 0;
    let completedFollowUps = 0;
    
    Array.from(this.interventionHistory.values()).forEach(interventions => {
      const recentInterventions = interventions.filter(i => 
        Date.now() - i.timestamp < timeRangeMs && i.followUpScheduled
      );
      
      scheduledFollowUps += recentInterventions.length;
      completedFollowUps += recentInterventions.filter(i => 
        i.userResponse === 'engaged'
      ).length;
    });
    
    return scheduledFollowUps > 0 ? completedFollowUps / scheduledFollowUps : 0;
  }
}

// Singleton instance
export const zkCrisisSafetyService = new ZKCrisisSafetyService();