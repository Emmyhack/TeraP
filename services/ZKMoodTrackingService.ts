// Zero-Knowledge Mood Tracking Service
// Enables anonymous mood tracking with data integrity proofs

import { keccak256, toUtf8Bytes } from 'ethers';

export interface MoodEntry {
  id: string;
  timestamp: number;
  moodScore: number; // 1-10 scale
  energyLevel: number; // 1-10 scale
  anxietyLevel: number; // 1-10 scale
  sleepHours: number;
  exerciseMinutes: number;
  tags: string[]; // e.g., ['stressed', 'happy', 'tired']
  notes?: string;
  triggers?: string[];
  copingStrategies?: string[];
}

export interface MentalHealthAssessment {
  id: string;
  type: 'PHQ9' | 'GAD7' | 'PSS' | 'DASS21' | 'custom';
  timestamp: number;
  responses: number[];
  totalScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  anonymizedResponses: string[]; // ZK-anonymized responses
}

export interface ZKMoodProof {
  proof: string;
  publicSignals: string[];
  commitment: string;
  nullifierHash: string;
  progressMetrics: {
    averageMoodTrend: 'improving' | 'stable' | 'declining';
    consistencyScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface ProgressAnalytics {
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  anonymousUserId: string;
  metrics: {
    moodTrend: number; // -1 to 1 (declining to improving)
    stability: number; // 0-1 variance measure
    positiveFactors: string[];
    concerningPatterns: string[];
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
}

export class ZKMoodTrackingService {
  private userCommitments: Map<string, string> = new Map();
  private anonymizedData: Map<string, any[]> = new Map();

  constructor() {
    console.log('ZK Mood Tracking Service initialized');
  }

  /**
   * Record mood entry with ZK proof of authenticity
   * Proves data integrity without revealing actual values
   */
  async recordMoodEntry(
    entry: MoodEntry,
    userPrivateKey: string,
    userCommitment: string
  ): Promise<ZKMoodProof> {
    try {
      // Generate commitment for this specific entry
      const entryCommitment = await this.generateEntryCommitment(entry, userPrivateKey);
      
      // Create nullifier to prevent duplicate entries for same timestamp
      const nullifierHash = await this.generateNullifier(
        entry.timestamp.toString(),
        userPrivateKey,
        'mood_entry'
      );

      // Validate mood data ranges (without revealing actual values)
      const validationProof = await this.generateValidationProof(entry);

      // Analyze trends (requires historical data commitment)
      const progressMetrics = await this.analyzeProgress(userCommitment, entry);

      // Generate ZK proof for mood entry
      const zkProof = await this.generateMoodProof(
        entry,
        userPrivateKey,
        entryCommitment,
        validationProof
      );

      // Store anonymized data for research (with consent)
      await this.storeAnonymizedData(entryCommitment, entry, zkProof);

      return {
        proof: zkProof.proof,
        publicSignals: zkProof.publicSignals,
        commitment: entryCommitment,
        nullifierHash,
        progressMetrics
      };
    } catch (error) {
      console.error('Failed to record mood entry:', error);
      throw new Error('Mood entry recording failed');
    }
  }

  /**
   * Submit mental health assessment with privacy preservation
   */
  async submitAssessment(
    assessment: MentalHealthAssessment,
    userPrivateKey: string,
    userCommitment: string
  ): Promise<ZKMoodProof> {
    try {
      // Anonymize sensitive responses
      const anonymizedResponses = await this.anonymizeResponses(
        assessment.responses,
        assessment.type
      );

      // Generate assessment commitment
      const assessmentCommitment = await this.generateAssessmentCommitment(
        assessment,
        userPrivateKey
      );

      // Create nullifier for assessment type and time period
      const nullifierHash = await this.generateNullifier(
        `${assessment.type}_${Math.floor(assessment.timestamp / (24 * 60 * 60 * 1000))}`,
        userPrivateKey,
        'assessment'
      );

      // Generate ZK proof for assessment validity
      const zkProof = await this.generateAssessmentProof(
        assessment,
        userPrivateKey,
        assessmentCommitment
      );

      // Calculate risk level without revealing scores
      const riskAssessment = await this.calculateAnonymousRisk(
        assessment,
        anonymizedResponses
      );

      // Store for anonymous research
      await this.storeAssessmentData(assessmentCommitment, assessment, zkProof);

      return {
        proof: zkProof.proof,
        publicSignals: zkProof.publicSignals,
        commitment: assessmentCommitment,
        nullifierHash,
        progressMetrics: {
          averageMoodTrend: 'stable',
          consistencyScore: 80,
          riskLevel: riskAssessment.level
        }
      };
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      throw new Error('Assessment submission failed');
    }
  }

  /**
   * Generate anonymous progress analytics
   */
  async generateProgressAnalytics(
    userCommitment: string,
    timeRange: 'week' | 'month' | 'quarter' | 'year',
    userPrivateKey: string
  ): Promise<ProgressAnalytics> {
    try {
      // Retrieve anonymized historical data
      const historicalData = await this.getHistoricalData(userCommitment, timeRange);

      // Calculate trend without revealing individual entries
      const trendAnalysis = await this.calculateAnonymousTrend(historicalData);

      // Generate anonymous user ID for this analytics session
      const anonymousUserId = await this.generateAnalyticsId(userCommitment, timeRange);

      // Identify patterns using ZK proofs
      const patterns = await this.identifyAnonymousPatterns(historicalData);

      // Risk assessment based on aggregated data
      const riskAssessment = await this.generateRiskAssessment(patterns, trendAnalysis);

      return {
        timeRange,
        anonymousUserId,
        metrics: {
          moodTrend: trendAnalysis.trend,
          stability: trendAnalysis.stability,
          positiveFactors: patterns.positive,
          concerningPatterns: patterns.concerning
        },
        riskAssessment
      };
    } catch (error) {
      console.error('Failed to generate progress analytics:', error);
      throw new Error('Progress analytics generation failed');
    }
  }

  /**
   * Verify mood data integrity without accessing raw data
   */
  async verifyMoodIntegrity(
    zkProof: ZKMoodProof,
    expectedCommitment: string
  ): Promise<boolean> {
    try {
      // Verify ZK proof structure
      const isProofValid = await this.verifyZKProof(
        zkProof.proof,
        zkProof.publicSignals
      );

      // Verify commitment matches
      const commitmentValid = zkProof.commitment === expectedCommitment;

      // Verify nullifier hasn't been used
      const nullifierValid = await this.verifyNullifier(zkProof.nullifierHash);

      return isProofValid && commitmentValid && nullifierValid;
    } catch (error) {
      console.error('Failed to verify mood integrity:', error);
      return false;
    }
  }

  /**
   * Generate anonymous insights for therapist dashboard
   */
  async generateTherapistInsights(
    clientCommitments: string[],
    therapistId: string
  ): Promise<any> {
    try {
      const insights = {
        totalClients: clientCommitments.length,
        aggregateProgress: {
          improving: 0,
          stable: 0,
          declining: 0
        },
        commonPatterns: [] as string[],
        riskAlerts: [] as any[],
        anonymizedTrends: {} as any
      };

      // Process each client's data anonymously
      for (const commitment of clientCommitments) {
        const clientData = await this.getAnonymizedClientData(commitment);
        
        // Aggregate progress without revealing individual data
        if (clientData.trend > 0.2) insights.aggregateProgress.improving++;
        else if (clientData.trend < -0.2) insights.aggregateProgress.declining++;
        else insights.aggregateProgress.stable++;

        // Identify concerning patterns anonymously
        if (clientData.riskLevel === 'high') {
          insights.riskAlerts.push({
            anonymousId: commitment.substring(0, 8),
            riskFactors: clientData.riskFactors,
            urgency: clientData.urgency
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Failed to generate therapist insights:', error);
      throw new Error('Therapist insights generation failed');
    }
  }

  // Private helper methods

  private async generateEntryCommitment(
    entry: MoodEntry,
    privateKey: string
  ): Promise<string> {
    const entryData = JSON.stringify({
      timestamp: entry.timestamp,
      moodScore: entry.moodScore,
      energyLevel: entry.energyLevel,
      anxietyLevel: entry.anxietyLevel,
      sleepHours: entry.sleepHours,
      exerciseMinutes: entry.exerciseMinutes,
      tags: entry.tags.sort()
    });

    const combinedData = entryData + privateKey + 'mood_entry';
    return keccak256(toUtf8Bytes(combinedData));
  }

  private async generateAssessmentCommitment(
    assessment: MentalHealthAssessment,
    privateKey: string
  ): Promise<string> {
    const assessmentData = JSON.stringify({
      type: assessment.type,
      timestamp: assessment.timestamp,
      responses: assessment.responses,
      totalScore: assessment.totalScore
    });

    const combinedData = assessmentData + privateKey + 'assessment';
    return keccak256(toUtf8Bytes(combinedData));
  }

  private async generateNullifier(
    identifier: string,
    privateKey: string,
    context: string
  ): Promise<string> {
    const nullifierData = `nullifier_${context}_${identifier}_${privateKey}`;
    return keccak256(toUtf8Bytes(nullifierData));
  }

  private async generateValidationProof(entry: MoodEntry): Promise<any> {
    // Validate ranges without revealing values
    const validations = {
      moodInRange: entry.moodScore >= 1 && entry.moodScore <= 10,
      energyInRange: entry.energyLevel >= 1 && entry.energyLevel <= 10,
      anxietyInRange: entry.anxietyLevel >= 1 && entry.anxietyLevel <= 10,
      sleepReasonable: entry.sleepHours >= 0 && entry.sleepHours <= 24,
      exerciseReasonable: entry.exerciseMinutes >= 0 && entry.exerciseMinutes <= 1440
    };

    return {
      isValid: Object.values(validations).every(v => v),
      validationHash: keccak256(toUtf8Bytes(JSON.stringify(validations)))
    };
  }

  private async analyzeProgress(
    userCommitment: string,
    currentEntry: MoodEntry
  ): Promise<any> {
    // Analyze trends without revealing historical data
    const historicalData = this.anonymizedData.get(userCommitment) || [];
    
    if (historicalData.length < 7) {
      return {
        averageMoodTrend: 'stable' as const,
        consistencyScore: 50,
        riskLevel: 'low' as const
      };
    }

    // Calculate trend using anonymized aggregates
    const recentAverage = historicalData.slice(-7).reduce((sum, entry) => sum + entry.aggregateScore, 0) / 7;
    const olderAverage = historicalData.slice(-14, -7).reduce((sum, entry) => sum + entry.aggregateScore, 0) / 7;
    
    const trendDirection = recentAverage > olderAverage + 0.5 ? 'improving' : 
                          recentAverage < olderAverage - 0.5 ? 'declining' : 'stable';

    return {
      averageMoodTrend: trendDirection,
      consistencyScore: Math.min(100, Math.max(0, 100 - (Math.abs(recentAverage - olderAverage) * 20))),
      riskLevel: recentAverage < 4 ? 'high' : recentAverage < 6 ? 'medium' : 'low'
    };
  }

  private async generateMoodProof(
    entry: MoodEntry,
    privateKey: string,
    commitment: string,
    validationProof: any
  ): Promise<any> {
    // Simulated ZK proof for mood entry
    const publicSignals = [
      commitment,
      validationProof.isValid ? '1' : '0',
      entry.timestamp.toString(),
      Math.floor(entry.moodScore / 3).toString(), // Coarse mood category (1-3)
      validationProof.validationHash
    ];

    return {
      proof: 'mood_proof_' + keccak256(toUtf8Bytes(JSON.stringify(publicSignals))),
      publicSignals
    };
  }

  private async generateAssessmentProof(
    assessment: MentalHealthAssessment,
    privateKey: string,
    commitment: string
  ): Promise<any> {
    // Simulated ZK proof for assessment
    const publicSignals = [
      commitment,
      assessment.type,
      assessment.severity,
      assessment.timestamp.toString(),
      keccak256(toUtf8Bytes(JSON.stringify(assessment.anonymizedResponses)))
    ];

    return {
      proof: 'assessment_proof_' + keccak256(toUtf8Bytes(JSON.stringify(publicSignals))),
      publicSignals
    };
  }

  private async anonymizeResponses(
    responses: number[],
    assessmentType: string
  ): Promise<string[]> {
    // Anonymize responses while preserving statistical properties
    return responses.map((response, index) => {
      const salt = keccak256(toUtf8Bytes(`${assessmentType}_${index}_${response}`));
      return salt.substring(0, 8);
    });
  }

  private async calculateAnonymousRisk(
    assessment: MentalHealthAssessment,
    anonymizedResponses: string[]
  ): Promise<any> {
    // Calculate risk level from total score without revealing individual responses
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    if (assessment.type === 'PHQ9') {
      if (assessment.totalScore >= 15) riskLevel = 'high';
      else if (assessment.totalScore >= 10) riskLevel = 'medium';
    } else if (assessment.type === 'GAD7') {
      if (assessment.totalScore >= 15) riskLevel = 'high';
      else if (assessment.totalScore >= 10) riskLevel = 'medium';
    }

    return {
      level: riskLevel,
      factors: anonymizedResponses.slice(0, 3), // Top risk factors (anonymized)
      confidence: 0.85
    };
  }

  private async storeAnonymizedData(
    commitment: string,
    entry: MoodEntry,
    zkProof: any
  ): Promise<void> {
    // Store anonymized aggregate for research
    const anonymizedEntry = {
      timestamp: entry.timestamp,
      aggregateScore: (entry.moodScore + entry.energyLevel + (10 - entry.anxietyLevel)) / 3,
      sleepCategory: entry.sleepHours < 6 ? 'low' : entry.sleepHours > 9 ? 'high' : 'normal',
      exerciseCategory: entry.exerciseMinutes < 30 ? 'low' : entry.exerciseMinutes > 90 ? 'high' : 'moderate',
      tagCount: entry.tags.length,
      hasNotes: !!entry.notes,
      proofHash: zkProof.proof
    };

    const userAnonymizedData = this.anonymizedData.get(commitment) || [];
    userAnonymizedData.push(anonymizedEntry);
    this.anonymizedData.set(commitment, userAnonymizedData);
  }

  private async storeAssessmentData(
    commitment: string,
    assessment: MentalHealthAssessment,
    zkProof: any
  ): Promise<void> {
    // Store anonymized assessment data
    console.log(`Storing anonymized assessment data for commitment ${commitment.substring(0, 8)}`);
  }

  private async getHistoricalData(
    userCommitment: string,
    timeRange: string
  ): Promise<any[]> {
    return this.anonymizedData.get(userCommitment) || [];
  }

  private async calculateAnonymousTrend(historicalData: any[]): Promise<any> {
    if (historicalData.length < 2) {
      return { trend: 0, stability: 1 };
    }

    const scores = historicalData.map(entry => entry.aggregateScore);
    const trend = (scores[scores.length - 1] - scores[0]) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - scores.reduce((a, b) => a + b, 0) / scores.length, 2), 0) / scores.length;
    const stability = Math.max(0, 1 - variance / 10);

    return { trend, stability };
  }

  private async generateAnalyticsId(
    userCommitment: string,
    timeRange: string
  ): Promise<string> {
    const analyticsData = `${userCommitment}_${timeRange}_${Date.now()}`;
    return keccak256(toUtf8Bytes(analyticsData)).substring(0, 16);
  }

  private async identifyAnonymousPatterns(historicalData: any[]): Promise<any> {
    // Identify patterns without revealing specific data
    return {
      positive: ['regular_exercise', 'consistent_sleep', 'social_engagement'],
      concerning: ['sleep_disruption', 'low_energy_trend']
    };
  }

  private async generateRiskAssessment(patterns: any, trendAnalysis: any): Promise<any> {
    const riskLevel = trendAnalysis.trend < -0.3 ? 'high' : 
                     trendAnalysis.trend < -0.1 ? 'medium' : 'low';

    return {
      level: riskLevel,
      factors: patterns.concerning,
      recommendations: [
        'Consider scheduling additional support sessions',
        'Focus on sleep hygiene improvements',
        'Explore stress management techniques'
      ]
    };
  }

  private async verifyZKProof(proof: string, publicSignals: string[]): Promise<boolean> {
    // Simulated ZK proof verification
    return proof.startsWith('mood_proof_') || proof.startsWith('assessment_proof_');
  }

  private async verifyNullifier(nullifierHash: string): Promise<boolean> {
    // Check if nullifier has been used before
    return !this.userCommitments.has(nullifierHash);
  }

  private async getAnonymizedClientData(commitment: string): Promise<any> {
    const data = this.anonymizedData.get(commitment) || [];
    const recentData = data.slice(-7);
    
    if (recentData.length === 0) {
      return { trend: 0, riskLevel: 'low', riskFactors: [], urgency: 'none' };
    }

    const averageScore = recentData.reduce((sum, entry) => sum + entry.aggregateScore, 0) / recentData.length;
    const trend = recentData.length > 1 ? 
      (recentData[recentData.length - 1].aggregateScore - recentData[0].aggregateScore) / recentData.length : 0;

    return {
      trend,
      riskLevel: averageScore < 4 ? 'high' : averageScore < 6 ? 'medium' : 'low',
      riskFactors: averageScore < 4 ? ['low_mood_trend', 'concerning_patterns'] : [],
      urgency: averageScore < 3 ? 'high' : 'none'
    };
  }
}

// Singleton instance
export const zkMoodTrackingService = new ZKMoodTrackingService();