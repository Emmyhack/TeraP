// Integration Test for ZK Privacy Services
// Tests all ZK services together to ensure proper integration

import { zkCredentialService } from './ZKCredentialVerificationService';
import { zkMoodTrackingService } from './ZKMoodTrackingService';
import { zkSessionFeedbackService } from './ZKSessionFeedbackService';
import { zkPrivacyControlService } from './ZKPrivacyControlService';
import { zkCrisisSafetyService } from './ZKCrisisSafetyService';

export interface IntegrationTestResults {
  credentialVerification: boolean;
  moodTracking: boolean;
  sessionFeedback: boolean;
  privacyControls: boolean;
  crisisSafety: boolean;
  crossServiceCompatibility: boolean;
  privacyPreservation: boolean;
  overallScore: number;
}

export class ZKIntegrationTester {
  private testResults: Partial<IntegrationTestResults> = {};

  async runFullIntegrationTest(): Promise<IntegrationTestResults> {
    console.log('🧪 Starting ZK Services Integration Test...');

    try {
      // Test individual services
      await this.testCredentialVerification();
      await this.testMoodTracking();
      await this.testSessionFeedback();
      await this.testPrivacyControls();
      await this.testCrisisSafety();

      // Test cross-service compatibility
      await this.testCrossServiceCompatibility();

      // Test privacy preservation
      await this.testPrivacyPreservation();

      // Calculate overall score
      const results = this.calculateOverallResults();

      console.log('✅ Integration Test Complete!', results);
      return results;

    } catch (error) {
      console.error('❌ Integration Test Failed:', error);
      throw error;
    }
  }

  private async testCredentialVerification(): Promise<void> {
    console.log('🔐 Testing ZK Credential Verification...');

    try {
      // Test credential proof generation
      const testCredential = {
        id: 'test_cred_001',
        licenseType: 'psychologist' as const,
        licenseNumber: 'PSY12345',
        issuingState: 'California',
        issuingCountry: 'USA',
        issueDate: new Date('2015-01-01'),
        expiryDate: new Date('2025-01-01'),
        specializations: ['CBT', 'Anxiety', 'Depression'],
        educationLevel: 'doctorate' as const,
        yearsOfExperience: 8
      };

      const zkProof = await zkCredentialService.generateCredentialProof(
        testCredential,
        'test_private_key_123',
        {
          minimumYearsExperience: 5,
          requiredSpecializations: ['CBT'],
          licenseTypes: ['psychologist'],
          educationLevel: 'masters'
        }
      );

      // Test proof verification
      const verification = await zkCredentialService.verifyCredentialProof(zkProof, {
        credentialId: testCredential.id,
        therapistCommitment: zkProof.commitment,
        verificationLevel: 'enhanced',
        requiredCriteria: {
          minimumYearsExperience: 5,
          requiredSpecializations: ['CBT']
        }
      });

      // Test anonymous profile generation
      const anonymousProfile = await zkCredentialService.generateAnonymousProfile(zkProof, {
        displayName: 'Dr. Test',
        bio: 'Test therapist',
        approachStyle: 'CBT',
        availableHours: ['9-17'],
        languages: ['English']
      });

      const success = verification.isValid && 
                     verification.meetsRequirements && 
                     anonymousProfile.anonymousId.length > 0;

      this.testResults.credentialVerification = success;
      console.log(`  ${success ? '✅' : '❌'} Credential Verification: ${success ? 'PASS' : 'FAIL'}`);

    } catch (error) {
      console.error('  ❌ Credential Verification Error:', error);
      this.testResults.credentialVerification = false;
    }
  }

  private async testMoodTracking(): Promise<void> {
    console.log('📊 Testing ZK Mood Tracking...');

    try {
      // Test mood entry recording
      const moodEntry = {
        id: 'test_mood_entry_001',
        userId: 'test_client_001',
        timestamp: Date.now(),
        moodScore: 7,
        energyLevel: 6,
        anxietyLevel: 3,
        stressLevel: 4,
        sleepQuality: 8,
        sleepHours: 8,
        exerciseMinutes: 30,
        tags: ['calm', 'focused'],
        notes: 'Feeling better today',
        triggers: [],
        copingStrategies: ['meditation']
      };

      const moodProof = await zkMoodTrackingService.recordMoodEntry(
        moodEntry,
        'test_client_private_key',
        'test_encryption_key'
      );

      // Test assessment submission
      const assessment = {
        id: 'test_assessment_001',
        userId: 'test_client_001',
        type: 'PHQ9' as const,
        responses: [2, 1, 3, 2, 1, 2, 1, 1, 0],
        totalScore: 13,
        severity: 'mild' as const,
        timestamp: Date.now(),
        isAnonymous: true,
        anonymizedResponses: ['2', '1', '3', '2', '1', '2', '1', '1', '0']
      };

      const assessmentResult = await zkMoodTrackingService.submitAssessment(
        assessment,
        'test_client_private_key',
        'test_encryption_key'
      );

      // Test analytics generation
      const analytics = await zkMoodTrackingService.generateProgressAnalytics(
        'test_client_001',
        'week',
        'test_client_private_key'
      );

      const success = moodProof.proof.length > 0 && 
                     assessmentResult.proof.length > 0 &&
                     analytics.metrics !== undefined;

      this.testResults.moodTracking = success;
      console.log(`  ${success ? '✅' : '❌'} Mood Tracking: ${success ? 'PASS' : 'FAIL'}`);

    } catch (error) {
      console.error('  ❌ Mood Tracking Error:', error);
      this.testResults.moodTracking = false;
    }
  }

  private async testSessionFeedback(): Promise<void> {
    console.log('💬 Testing ZK Session Feedback...');

    try {
      // Test client feedback submission
      const sessionFeedback = {
        sessionId: 'test_session_001',
        clientCommitment: 'client_commitment_hash',
        therapistCommitment: 'therapist_commitment_hash',
        timestamp: Date.now(),
        
        overallSatisfaction: 8,
        therapistEffectiveness: 9,
        sessionHelpfulness: 8,
        safetyAndComfort: 10,
        
        moodImprovement: 3,
        anxietyChange: -2,
        copingSkills: 7,
        
        whatWorkedWell: ['Active listening', 'Clear explanations'],
        areasForImprovement: ['More time for questions'],
        wouldRecommend: true,
        
        progressTowardsGoals: 7,
        sessionFrequencyPreference: 'same' as const,
        
        sessionTopics: ['anxiety', 'coping_strategies'],
        therapeuticApproaches: ['CBT']
      };

      const feedbackProof = await zkSessionFeedbackService.submitSessionFeedback(
        sessionFeedback,
        'test_client_private_key'
      );

      // Test therapist outcomes submission
      const therapistOutcomes = {
        sessionId: 'test_session_001',
        clientCommitment: 'client_commitment_hash',
        timestamp: Date.now(),
        
        clientEngagement: 8,
        progressMade: 7,
        riskLevel: 'low' as const,
        
        interventionsUsed: ['CBT techniques', 'Breathing exercises'],
        clientResponse: 'positive' as const,
        
        needsAdditionalSupport: false,
        recommendedFollowUp: 'routine' as const,
        
        challengesFaced: ['Initial resistance'],
        breakthroughsMade: ['Insight about triggers']
      };

      const outcomesProof = await zkSessionFeedbackService.submitTherapistOutcomes(
        therapistOutcomes,
        'test_therapist_private_key'
      );

      // Test insights generation
      const insights = await zkSessionFeedbackService.generateAnonymousInsights(
        'therapist_commitment_hash',
        'week'
      );

      const success = feedbackProof.proof.length > 0 && 
                     outcomesProof.proof.length > 0 &&
                     insights.averageSatisfaction >= 0;

      this.testResults.sessionFeedback = success;
      console.log(`  ${success ? '✅' : '❌'} Session Feedback: ${success ? 'PASS' : 'FAIL'}`);

    } catch (error) {
      console.error('  ❌ Session Feedback Error:', error);
      this.testResults.sessionFeedback = false;
    }
  }

  private async testPrivacyControls(): Promise<void> {
    console.log('🔒 Testing ZK Privacy Controls...');

    try {
      // Test privacy preferences setup
      const privacyPreferences = {
        userId: 'test_user_001',
        userType: 'client' as const,
        
        shareSessionFeedback: true,
        shareOutcomeData: false,
        shareMoodData: true,
        shareProgressData: true,
        
        allowAnonymousResearch: true,
        allowPlatformAnalytics: false,
        allowQualityImprovement: true,
        
        identityDisclosureLevel: 'minimal' as const,
        demographicSharing: {
          ageRange: true,
          generalLocation: false,
          languagePreference: true
        },
        
        dataRetentionPeriod: '1_year' as const,
        automaticDeletion: true,
        
        encryptionLevel: 'enhanced' as const,
        allowRecording: false,
        allowTranscription: true,
        
        allowThirdPartyIntegrations: false,
        approvedIntegrations: [],
        
        emergencyContactPermission: true,
        crisisInterventionOverride: true
      };

      const privacyCommitment = await zkPrivacyControlService.setPrivacyPreferences(
        privacyPreferences,
        'test_user_private_key'
      );

      // Test selective disclosure
      const disclosure = await zkPrivacyControlService.requestSelectiveDisclosure(
        'test_user_001',
        ['mood_data'],
        'research',
        'Mental health research study',
        'test_user_private_key',
        'researcher_public_key'
      );

      // Test data access verification
      const accessResult = await zkPrivacyControlService.verifyDataAccess(
        'test_user_001',
        ['mood_data'],
        'research',
        'Mental health research study'
      );

      // Test privacy report generation
      const privacyReport = await zkPrivacyControlService.generatePrivacyReport(
        'test_user_001',
        'test_user_private_key'
      );

      const success = privacyCommitment.length > 0 && 
                     disclosure.commitmentHash.length > 0 &&
                     accessResult.allowed === true &&
                     privacyReport.privacyScore > 0;

      this.testResults.privacyControls = success;
      console.log(`  ${success ? '✅' : '❌'} Privacy Controls: ${success ? 'PASS' : 'FAIL'}`);

    } catch (error) {
      console.error('  ❌ Privacy Controls Error:', error);
      this.testResults.privacyControls = false;
    }
  }

  private async testCrisisSafety(): Promise<void> {
    console.log('🆘 Testing ZK Crisis Safety...');

    try {
      // Test crisis assessment
      const crisisAssessment = {
        userId: 'test_client_001',
        assessmentId: 'crisis_assessment_001',
        timestamp: Date.now(),
        
        suicidalIdeation: 2,
        selfHarmRisk: 1,
        psychosisSymptoms: 0,
        substanceAbuse: 1,
        violentThoughts: 0,
        
        socialSupport: 7,
        copingSkills: 6,
        reasonsForLiving: 8,
        treatmentEngagement: 7,
        
        immediateRisk: false,
        hasEmergencyPlan: true,
        accessToMeans: false,
        recentStressors: ['work_stress', 'relationship_problems'],
        
        hasEmergencyContacts: true,
        willingToSeekHelp: true,
        preferredInterventions: ['therapy', 'support_group']
      };

      const assessmentResult = await zkCrisisSafetyService.conductCrisisAssessment(
        crisisAssessment,
        'test_client_private_key'
      );

      // Test safety plan creation
      const safetyPlanId = await zkCrisisSafetyService.createSafetyPlan(
        'test_client_001',
        { triggers: ['stress', 'isolation'], warningigns: ['mood_drop'] },
        { strategies: ['call_friend', 'meditation'], activities: ['exercise'] },
        { personal: ['friend_john'], professional: ['therapist_dr_smith'] },
        'test_client_private_key',
        'encryption_key_123'
      );

      // Test emergency contact addition
      const contactId = await zkCrisisSafetyService.addEmergencyContact(
        'test_client_001',
        {
          name: 'Emergency Contact',
          phone: '+1234567890',
          email: 'emergency@example.com',
          relationship: 'Friend',
          preferences: { method: 'phone', consent: true, emergencyOnly: true }
        },
        'test_client_private_key',
        'encryption_key_123'
      );

      // Test crisis insights generation
      const insights = await zkCrisisSafetyService.generateAnonymousCrisisInsights('week');

      const success = assessmentResult.riskLevel !== undefined && 
                     safetyPlanId.length > 0 &&
                     contactId.length > 0 &&
                     insights.totalAssessments >= 0;

      this.testResults.crisisSafety = success;
      console.log(`  ${success ? '✅' : '❌'} Crisis Safety: ${success ? 'PASS' : 'FAIL'}`);

    } catch (error) {
      console.error('  ❌ Crisis Safety Error:', error);
      this.testResults.crisisSafety = false;
    }
  }

  private async testCrossServiceCompatibility(): Promise<void> {
    console.log('🔗 Testing Cross-Service Compatibility...');

    try {
      // Test that services can work together
      // Example: Crisis assessment triggering privacy-controlled data sharing

      // 1. Create a therapist with verified credentials
      const therapistCredential = {
        id: 'test_cred_002',
        licenseType: 'psychologist' as const,
        licenseNumber: 'PSY67890',
        issuingState: 'New York',
        issuingCountry: 'USA',
        issueDate: new Date('2010-01-01'),
        expiryDate: new Date('2026-01-01'),
        specializations: ['Crisis Intervention', 'CBT'],
        educationLevel: 'doctorate' as const,
        yearsOfExperience: 12
      };

      const therapistZKProof = await zkCredentialService.generateCredentialProof(
        therapistCredential,
        'therapist_private_key_456',
        {}
      );

      // 2. Client has mood tracking data
      const moodEntry = {
        id: 'cross_test_mood_entry',
        userId: 'client_cross_test',
        timestamp: Date.now(),
        moodScore: 3, // Low mood
        energyLevel: 2,
        anxietyLevel: 8, // High anxiety
        stressLevel: 9,
        sleepQuality: 3,
        sleepHours: 4,
        exerciseMinutes: 0,
        tags: ['overwhelmed', 'hopeless'],
        notes: 'Having a really difficult time',
        triggers: ['work', 'isolation'],
        copingStrategies: []
      };

      const moodProof = await zkMoodTrackingService.recordMoodEntry(
        moodEntry,
        'client_cross_test_key',
        'cross_test_encryption_key'
      );

      // 3. Crisis assessment based on mood data
      const crisisAssessment = {
        userId: 'client_cross_test',
        assessmentId: 'cross_test_assessment',
        timestamp: Date.now(),
        suicidalIdeation: 6, // Elevated risk
        selfHarmRisk: 5,
        psychosisSymptoms: 1,
        substanceAbuse: 2,
        violentThoughts: 0,
        socialSupport: 3, // Low support
        copingSkills: 2,
        reasonsForLiving: 4,
        treatmentEngagement: 6,
        immediateRisk: false,
        hasEmergencyPlan: false,
        accessToMeans: true,
        recentStressors: ['work_stress', 'social_isolation'],
        hasEmergencyContacts: true,
        willingToSeekHelp: true,
        preferredInterventions: ['therapy']
      };

      const crisisResult = await zkCrisisSafetyService.conductCrisisAssessment(
        crisisAssessment,
        'client_cross_test_key'
      );

      // 4. Privacy-controlled data sharing for intervention
      const privacyPrefs = {
        userId: 'client_cross_test',
        userType: 'client' as const,
        shareSessionFeedback: true,
        shareOutcomeData: true,
        shareMoodData: true,
        shareProgressData: true,
        allowAnonymousResearch: true,
        allowPlatformAnalytics: true,
        allowQualityImprovement: true,
        identityDisclosureLevel: 'partial' as const,
        demographicSharing: {
          ageRange: true,
          generalLocation: false,
          languagePreference: true
        },
        dataRetentionPeriod: '1_year' as const,
        automaticDeletion: true,
        encryptionLevel: 'enhanced' as const,
        allowRecording: false,
        allowTranscription: true,
        allowThirdPartyIntegrations: false,
        approvedIntegrations: [],
        emergencyContactPermission: true,
        crisisInterventionOverride: true
      };

      await zkPrivacyControlService.setPrivacyPreferences(
        privacyPrefs,
        'client_cross_test_key'
      );

      // Test that all services produced valid results
      const success = therapistZKProof.proof.length > 0 && 
                     moodProof.proof.length > 0 &&
                     crisisResult.riskLevel === 'high' &&
                     crisisResult.recommendedActions.length > 0;

      this.testResults.crossServiceCompatibility = success;
      console.log(`  ${success ? '✅' : '❌'} Cross-Service Compatibility: ${success ? 'PASS' : 'FAIL'}`);

    } catch (error) {
      console.error('  ❌ Cross-Service Compatibility Error:', error);
      this.testResults.crossServiceCompatibility = false;
    }
  }

  private async testPrivacyPreservation(): Promise<void> {
    console.log('🛡️ Testing Privacy Preservation...');

    try {
      // Test that no personal data is exposed in ZK proofs
      const testData = {
        personalInfo: 'John Doe, SSN: 123-45-6789',
        privateKey: 'super_secret_key_789',
        sensitiveData: 'Patient has severe depression with suicidal thoughts'
      };

      // Test credential verification doesn't expose personal data
      const credential = {
        id: 'privacy_test_cred',
        licenseType: 'counselor' as const,
        licenseNumber: 'COUN12345',
        issuingState: 'Texas',
        issuingCountry: 'USA',
        issueDate: new Date('2018-01-01'),
        expiryDate: new Date('2024-01-01'),
        specializations: ['Trauma', 'Anxiety'],
        educationLevel: 'masters' as const,
        yearsOfExperience: 5
      };

      const zkProof = await zkCredentialService.generateCredentialProof(
        credential,
        testData.privateKey,
        {}
      );

      // Verify that proof doesn't contain personal data
      const proofString = JSON.stringify(zkProof);
      const containsPersonalData = proofString.includes('John Doe') || 
                                  proofString.includes('123-45-6789') ||
                                  proofString.includes('super_secret_key');

      // Test mood tracking privacy
      const moodEntry = {
        id: 'privacy_test_mood_entry',
        userId: testData.personalInfo,
        timestamp: Date.now(),
        moodScore: 4,
        energyLevel: 3,
        anxietyLevel: 7,
        stressLevel: 8,
        sleepQuality: 4,
        sleepHours: 6,
        exerciseMinutes: 0,
        tags: ['depressed', 'anxious'],
        notes: testData.sensitiveData,
        triggers: ['family_issues'],
        copingStrategies: ['therapy']
      };

      const moodProof = await zkMoodTrackingService.recordMoodEntry(
        moodEntry,
        testData.privateKey,
        'privacy_test_encryption_key'
      );

      const moodProofString = JSON.stringify(moodProof);
      const moodContainsSensitive = moodProofString.includes('John Doe') ||
                                   moodProofString.includes('severe depression') ||
                                   moodProofString.includes('suicidal thoughts');

      // Test that commitments are different for same input (randomness)
      const proof1 = await zkCredentialService.generateCredentialProof(credential, testData.privateKey, {});
      const proof2 = await zkCredentialService.generateCredentialProof(credential, testData.privateKey, {});
      
      const proofsAreDifferent = proof1.proof !== proof2.proof;

      const success = !containsPersonalData && 
                     !moodContainsSensitive &&
                     proofsAreDifferent &&
                     zkProof.commitment.length > 0 &&
                     moodProof.commitment.length > 0;

      this.testResults.privacyPreservation = success;
      console.log(`  ${success ? '✅' : '❌'} Privacy Preservation: ${success ? 'PASS' : 'FAIL'}`);

    } catch (error) {
      console.error('  ❌ Privacy Preservation Error:', error);
      this.testResults.privacyPreservation = false;
    }
  }

  private calculateOverallResults(): IntegrationTestResults {
    const results: IntegrationTestResults = {
      credentialVerification: this.testResults.credentialVerification || false,
      moodTracking: this.testResults.moodTracking || false,
      sessionFeedback: this.testResults.sessionFeedback || false,
      privacyControls: this.testResults.privacyControls || false,
      crisisSafety: this.testResults.crisisSafety || false,
      crossServiceCompatibility: this.testResults.crossServiceCompatibility || false,
      privacyPreservation: this.testResults.privacyPreservation || false,
      overallScore: 0
    };

    // Calculate overall score (percentage of tests passed)
    const totalTests = Object.keys(results).length - 1; // Exclude overallScore
    const passedTests = Object.values(results).filter((test, index) => 
      index < totalTests && test === true
    ).length;
    
    results.overallScore = Math.round((passedTests / totalTests) * 100);

    return results;
  }

  // Helper method for running specific test suites
  async runSpecificTest(testName: keyof IntegrationTestResults): Promise<boolean> {
    switch (testName) {
      case 'credentialVerification':
        await this.testCredentialVerification();
        break;
      case 'moodTracking':
        await this.testMoodTracking();
        break;
      case 'sessionFeedback':
        await this.testSessionFeedback();
        break;
      case 'privacyControls':
        await this.testPrivacyControls();
        break;
      case 'crisisSafety':
        await this.testCrisisSafety();
        break;
      case 'crossServiceCompatibility':
        await this.testCrossServiceCompatibility();
        break;
      case 'privacyPreservation':
        await this.testPrivacyPreservation();
        break;
      default:
        throw new Error(`Unknown test: ${testName}`);
    }

    return this.testResults[testName] || false;
  }
}

// Export singleton tester
export const zkIntegrationTester = new ZKIntegrationTester();

// Helper function for quick testing
export async function runZKIntegrationTest(): Promise<IntegrationTestResults> {
  return await zkIntegrationTester.runFullIntegrationTest();
}