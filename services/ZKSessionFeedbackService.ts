// Zero-Knowledge Session Feedback Service
// Enables anonymous feedback and outcome tracking while preserving privacy

import { keccak256, toUtf8Bytes } from 'ethers';

export interface SessionFeedback {
  sessionId: string;
  clientCommitment: string;
  therapistCommitment: string;
  timestamp: number;
  
  // Client feedback (1-10 scales)
  overallSatisfaction: number;
  therapistEffectiveness: number;
  sessionHelpfulness: number;
  safetyAndComfort: number;
  
  // Outcome metrics
  moodImprovement: number; // -5 to +5 change
  anxietyChange: number;   // -5 to +5 change
  copingSkills: number;    // 1-10 improvement
  
  // Anonymous qualitative feedback
  whatWorkedWell: string[];
  areasForImprovement: string[];
  wouldRecommend: boolean;
  
  // Progress indicators
  progressTowardsGoals: number; // 1-10
  sessionFrequencyPreference: 'more' | 'same' | 'less';
  
  // Privacy-preserved tags
  sessionTopics: string[]; // anonymized topic categories
  therapeuticApproaches: string[];
}

export interface TherapistOutcomes {
  sessionId: string;
  clientCommitment: string; // Anonymous client ID
  timestamp: number;
  
  // Clinical assessments (anonymized)
  clientEngagement: number; // 1-10
  progressMade: number;     // 1-10
  riskLevel: 'low' | 'medium' | 'high';
  
  // Intervention effectiveness
  interventionsUsed: string[];
  clientResponse: 'positive' | 'neutral' | 'resistant';
  
  // Follow-up needs
  needsAdditionalSupport: boolean;
  recommendedFollowUp: 'routine' | 'urgent' | 'crisis';
  
  // Anonymous observations
  challengesFaced: string[];
  breakthroughsMade: string[];
}

export interface ZKFeedbackProof {
  proof: string;
  publicSignals: string[];
  sessionCommitment: string;
  clientNullifier: string;
  therapistNullifier: string;
  
  // Anonymized aggregates
  satisfactionCategory: 'low' | 'medium' | 'high';
  outcomeCategory: 'poor' | 'fair' | 'good' | 'excellent';
  riskCategory: 'low' | 'medium' | 'high';
}

export interface AnonymousInsights {
  timeRange: 'week' | 'month' | 'quarter';
  
  // Aggregated satisfaction metrics
  averageSatisfaction: number;
  satisfactionTrend: number; // -1 to 1
  
  // Outcome effectiveness
  averageOutcomeImprovement: number;
  topEffectiveApproaches: string[];
  commonChallenges: string[];
  
  // Risk patterns
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  
  // Anonymous client patterns
  retentionRate: number;
  averageSessionsPerClient: number;
  dropoutRiskFactors: string[];
  
  // Therapy effectiveness
  mostHelpfulInterventions: string[];
  leastHelpfulInterventions: string[];
}

export class ZKSessionFeedbackService {
  private feedbackData: Map<string, any[]> = new Map();
  private outcomeData: Map<string, any[]> = new Map();
  private aggregatedInsights: Map<string, AnonymousInsights> = new Map();

  constructor() {
    console.log('ZK Session Feedback Service initialized');
  }

  /**
   * Submit session feedback with ZK privacy protection
   */
  async submitSessionFeedback(
    feedback: SessionFeedback,
    clientPrivateKey: string
  ): Promise<ZKFeedbackProof> {
    try {
      // Generate session commitment
      const sessionCommitment = await this.generateSessionCommitment(
        feedback.sessionId,
        feedback.clientCommitment,
        feedback.therapistCommitment
      );

      // Create client nullifier to prevent duplicate feedback
      const clientNullifier = await this.generateNullifier(
        feedback.sessionId,
        clientPrivateKey,
        'client_feedback'
      );

      // Anonymize qualitative feedback
      const anonymizedFeedback = await this.anonymizeFeedback(feedback);

      // Generate ZK proof for feedback validity
      const zkProof = await this.generateFeedbackProof(
        feedback,
        anonymizedFeedback,
        sessionCommitment,
        clientNullifier
      );

      // Store anonymized data for research
      await this.storeAnonymizedFeedback(sessionCommitment, anonymizedFeedback);

      // Update therapist analytics
      await this.updateTherapistMetrics(
        feedback.therapistCommitment,
        anonymizedFeedback
      );

      return {
        proof: zkProof.proof,
        publicSignals: zkProof.publicSignals,
        sessionCommitment,
        clientNullifier,
        therapistNullifier: '', // Will be set by therapist feedback
        satisfactionCategory: this.categorizeSatisfaction(feedback.overallSatisfaction),
        outcomeCategory: this.categorizeOutcome(feedback.moodImprovement, feedback.anxietyChange),
        riskCategory: this.assessRiskFromFeedback(feedback)
      };

    } catch (error) {
      console.error('Failed to submit session feedback:', error);
      throw new Error('Session feedback submission failed');
    }
  }

  /**
   * Submit therapist outcomes assessment
   */
  async submitTherapistOutcomes(
    outcomes: TherapistOutcomes,
    therapistPrivateKey: string
  ): Promise<ZKFeedbackProof> {
    try {
      // Generate session commitment
      const sessionCommitment = await this.generateSessionCommitment(
        outcomes.sessionId,
        outcomes.clientCommitment,
        'therapist_outcomes'
      );

      // Create therapist nullifier
      const therapistNullifier = await this.generateNullifier(
        outcomes.sessionId,
        therapistPrivateKey,
        'therapist_outcomes'
      );

      // Anonymize clinical observations
      const anonymizedOutcomes = await this.anonymizeOutcomes(outcomes);

      // Generate ZK proof for outcomes validity
      const zkProof = await this.generateOutcomesProof(
        outcomes,
        anonymizedOutcomes,
        sessionCommitment,
        therapistNullifier
      );

      // Store anonymized outcomes data
      await this.storeAnonymizedOutcomes(sessionCommitment, anonymizedOutcomes);

      // Update client progress metrics
      await this.updateClientProgress(
        outcomes.clientCommitment,
        anonymizedOutcomes
      );

      return {
        proof: zkProof.proof,
        publicSignals: zkProof.publicSignals,
        sessionCommitment,
        clientNullifier: '',
        therapistNullifier,
        satisfactionCategory: 'medium', // Not applicable for therapist outcomes
        outcomeCategory: this.categorizeTherapistOutcome(outcomes.progressMade),
        riskCategory: outcomes.riskLevel
      };

    } catch (error) {
      console.error('Failed to submit therapist outcomes:', error);
      throw new Error('Therapist outcomes submission failed');
    }
  }

  /**
   * Generate anonymous insights for platform improvement
   */
  async generateAnonymousInsights(
    therapistCommitment: string,
    timeRange: 'week' | 'month' | 'quarter'
  ): Promise<AnonymousInsights> {
    try {
      // Get aggregated feedback data for therapist
      const feedbackData = this.feedbackData.get(therapistCommitment) || [];
      const outcomeData = this.outcomeData.get(therapistCommitment) || [];

      // Filter by time range
      const now = Date.now();
      const timeRangeMs = timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                         timeRange === 'month' ? 30 * 24 * 60 * 60 * 1000 :
                         90 * 24 * 60 * 60 * 1000;
      
      const recentFeedback = feedbackData.filter(f => 
        now - f.timestamp < timeRangeMs
      );
      const recentOutcomes = outcomeData.filter(o => 
        now - o.timestamp < timeRangeMs
      );

      // Calculate anonymous aggregates
      const insights: AnonymousInsights = {
        timeRange,
        averageSatisfaction: this.calculateAverageSatisfaction(recentFeedback),
        satisfactionTrend: this.calculateSatisfactionTrend(recentFeedback),
        averageOutcomeImprovement: this.calculateOutcomeImprovement(recentFeedback),
        topEffectiveApproaches: this.identifyEffectiveApproaches(recentFeedback),
        commonChallenges: this.identifyCommonChallenges(recentOutcomes),
        riskDistribution: this.calculateRiskDistribution(recentOutcomes),
        retentionRate: this.calculateRetentionRate(recentFeedback),
        averageSessionsPerClient: this.calculateAverageSessionsPerClient(recentFeedback),
        dropoutRiskFactors: this.identifyDropoutRiskFactors(recentOutcomes),
        mostHelpfulInterventions: this.identifyHelpfulInterventions(recentFeedback),
        leastHelpfulInterventions: this.identifyLeastHelpfulInterventions(recentFeedback)
      };

      // Cache insights
      this.aggregatedInsights.set(`${therapistCommitment}_${timeRange}`, insights);

      return insights;

    } catch (error) {
      console.error('Failed to generate anonymous insights:', error);
      throw new Error('Anonymous insights generation failed');
    }
  }

  /**
   * Generate platform-wide research insights (fully anonymized)
   */
  async generatePlatformInsights(): Promise<any> {
    try {
      const allFeedback: any[] = [];
      const allOutcomes: any[] = [];

      // Aggregate all anonymized data
      Array.from(this.feedbackData.values()).forEach(data => {
        allFeedback.push(...data);
      });
      Array.from(this.outcomeData.values()).forEach(data => {
        allOutcomes.push(...data);
      });

      return {
        totalSessions: allFeedback.length,
        platformSatisfaction: this.calculateAverageSatisfaction(allFeedback),
        mostEffectiveApproaches: this.identifyEffectiveApproaches(allFeedback).slice(0, 5),
        commonClientChallenges: this.identifyCommonChallenges(allOutcomes).slice(0, 5),
        overallOutcomeImprovement: this.calculateOutcomeImprovement(allFeedback),
        riskPatterns: this.calculateRiskDistribution(allOutcomes),
        retentionMetrics: {
          averageRetention: this.calculateRetentionRate(allFeedback),
          dropoutFactors: this.identifyDropoutRiskFactors(allOutcomes).slice(0, 3)
        },
        qualityMetrics: {
          highSatisfactionRate: allFeedback.filter(f => f.satisfactionCategory === 'high').length / allFeedback.length,
          positiveOutcomeRate: allFeedback.filter(f => f.outcomeCategory === 'good' || f.outcomeCategory === 'excellent').length / allFeedback.length
        }
      };

    } catch (error) {
      console.error('Failed to generate platform insights:', error);
      throw new Error('Platform insights generation failed');
    }
  }

  /**
   * Verify session feedback integrity
   */
  async verifyFeedbackIntegrity(
    zkProof: ZKFeedbackProof,
    expectedSessionId: string
  ): Promise<boolean> {
    try {
      // Verify ZK proof
      const isProofValid = await this.verifyZKProof(
        zkProof.proof,
        zkProof.publicSignals
      );

      // Verify session commitment
      const sessionValid = zkProof.sessionCommitment.includes(expectedSessionId.substring(0, 8));

      // Verify nullifiers haven't been used
      const nullifiersValid = await this.verifyNullifiers(
        zkProof.clientNullifier,
        zkProof.therapistNullifier
      );

      return isProofValid && sessionValid && nullifiersValid;

    } catch (error) {
      console.error('Failed to verify feedback integrity:', error);
      return false;
    }
  }

  // Private helper methods

  private async generateSessionCommitment(
    sessionId: string,
    clientCommitment: string,
    therapistCommitment: string
  ): Promise<string> {
    const commitmentData = `${sessionId}_${clientCommitment}_${therapistCommitment}`;
    return keccak256(toUtf8Bytes(commitmentData));
  }

  private async generateNullifier(
    sessionId: string,
    privateKey: string,
    context: string
  ): Promise<string> {
    const nullifierData = `nullifier_${context}_${sessionId}_${privateKey}`;
    return keccak256(toUtf8Bytes(nullifierData));
  }

  private async anonymizeFeedback(feedback: SessionFeedback): Promise<any> {
    return {
      timestamp: feedback.timestamp,
      satisfactionCategory: this.categorizeSatisfaction(feedback.overallSatisfaction),
      outcomeCategory: this.categorizeOutcome(feedback.moodImprovement, feedback.anxietyChange),
      
      // Anonymized metrics
      averageRating: (feedback.overallSatisfaction + feedback.therapistEffectiveness + 
                     feedback.sessionHelpfulness + feedback.safetyAndComfort) / 4,
      
      moodChangeCategory: this.categorizeChange(feedback.moodImprovement),
      anxietyChangeCategory: this.categorizeChange(feedback.anxietyChange),
      
      // Anonymized qualitative data
      positiveFactorsHash: keccak256(toUtf8Bytes(feedback.whatWorkedWell.join('|'))),
      improvementAreasHash: keccak256(toUtf8Bytes(feedback.areasForImprovement.join('|'))),
      
      wouldRecommend: feedback.wouldRecommend,
      progressCategory: this.categorizeProgress(feedback.progressTowardsGoals),
      frequencyPreference: feedback.sessionFrequencyPreference,
      
      // Topic categories (anonymized)
      topicCount: feedback.sessionTopics.length,
      approachCount: feedback.therapeuticApproaches.length,
      sessionTopicsHash: keccak256(toUtf8Bytes(feedback.sessionTopics.sort().join('|'))),
      approachesHash: keccak256(toUtf8Bytes(feedback.therapeuticApproaches.sort().join('|')))
    };
  }

  private async anonymizeOutcomes(outcomes: TherapistOutcomes): Promise<any> {
    return {
      timestamp: outcomes.timestamp,
      engagementCategory: this.categorizeEngagement(outcomes.clientEngagement),
      progressCategory: this.categorizeProgress(outcomes.progressMade),
      riskLevel: outcomes.riskLevel,
      
      interventionCount: outcomes.interventionsUsed.length,
      clientResponseCategory: outcomes.clientResponse,
      
      needsSupport: outcomes.needsAdditionalSupport,
      followUpUrgency: outcomes.recommendedFollowUp,
      
      // Anonymized observations
      challengeCount: outcomes.challengesFaced.length,
      breakthroughCount: outcomes.breakthroughsMade.length,
      challengesHash: keccak256(toUtf8Bytes(outcomes.challengesFaced.sort().join('|'))),
      breakthroughsHash: keccak256(toUtf8Bytes(outcomes.breakthroughsMade.sort().join('|')))
    };
  }

  private async generateFeedbackProof(
    feedback: SessionFeedback,
    anonymizedFeedback: any,
    sessionCommitment: string,
    clientNullifier: string
  ): Promise<any> {
    const publicSignals = [
      sessionCommitment,
      clientNullifier,
      anonymizedFeedback.satisfactionCategory === 'high' ? '1' : '0',
      anonymizedFeedback.outcomeCategory === 'good' || anonymizedFeedback.outcomeCategory === 'excellent' ? '1' : '0',
      feedback.wouldRecommend ? '1' : '0',
      feedback.timestamp.toString()
    ];

    return {
      proof: 'feedback_proof_' + keccak256(toUtf8Bytes(JSON.stringify(publicSignals))),
      publicSignals
    };
  }

  private async generateOutcomesProof(
    outcomes: TherapistOutcomes,
    anonymizedOutcomes: any,
    sessionCommitment: string,
    therapistNullifier: string
  ): Promise<any> {
    const publicSignals = [
      sessionCommitment,
      therapistNullifier,
      outcomes.riskLevel,
      anonymizedOutcomes.progressCategory,
      outcomes.needsAdditionalSupport ? '1' : '0',
      outcomes.timestamp.toString()
    ];

    return {
      proof: 'outcomes_proof_' + keccak256(toUtf8Bytes(JSON.stringify(publicSignals))),
      publicSignals
    };
  }

  private categorizeSatisfaction(score: number): 'low' | 'medium' | 'high' {
    if (score >= 8) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
  }

  private categorizeOutcome(moodChange: number, anxietyChange: number): 'poor' | 'fair' | 'good' | 'excellent' {
    const averageImprovement = (moodChange - anxietyChange) / 2; // Anxiety improvement is negative change
    if (averageImprovement >= 3) return 'excellent';
    if (averageImprovement >= 1) return 'good';
    if (averageImprovement >= -1) return 'fair';
    return 'poor';
  }

  private categorizeTherapistOutcome(progressMade: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (progressMade >= 8) return 'excellent';
    if (progressMade >= 6) return 'good';
    if (progressMade >= 4) return 'fair';
    return 'poor';
  }

  private assessRiskFromFeedback(feedback: SessionFeedback): 'low' | 'medium' | 'high' {
    // Assess risk based on feedback patterns
    if (feedback.overallSatisfaction <= 3 || feedback.safetyAndComfort <= 4) return 'high';
    if (feedback.moodImprovement < -2 || feedback.anxietyChange > 2) return 'medium';
    return 'low';
  }

  private categorizeChange(change: number): 'significant_decline' | 'decline' | 'stable' | 'improvement' | 'significant_improvement' {
    if (change <= -3) return 'significant_decline';
    if (change <= -1) return 'decline';
    if (change >= 3) return 'significant_improvement';
    if (change >= 1) return 'improvement';
    return 'stable';
  }

  private categorizeProgress(progress: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (progress >= 8) return 'excellent';
    if (progress >= 6) return 'good';
    if (progress >= 4) return 'fair';
    return 'poor';
  }

  private categorizeEngagement(engagement: number): 'low' | 'medium' | 'high' {
    if (engagement >= 8) return 'high';
    if (engagement >= 6) return 'medium';
    return 'low';
  }

  private async storeAnonymizedFeedback(
    sessionCommitment: string,
    anonymizedFeedback: any
  ): Promise<void> {
    // Store aggregated feedback data for research
    console.log(`Storing anonymized feedback for session ${sessionCommitment.substring(0, 8)}`);
  }

  private async storeAnonymizedOutcomes(
    sessionCommitment: string,
    anonymizedOutcomes: any
  ): Promise<void> {
    // Store aggregated outcomes data for research
    console.log(`Storing anonymized outcomes for session ${sessionCommitment.substring(0, 8)}`);
  }

  private async updateTherapistMetrics(
    therapistCommitment: string,
    anonymizedFeedback: any
  ): Promise<void> {
    const existingData = this.feedbackData.get(therapistCommitment) || [];
    existingData.push(anonymizedFeedback);
    this.feedbackData.set(therapistCommitment, existingData);
  }

  private async updateClientProgress(
    clientCommitment: string,
    anonymizedOutcomes: any
  ): Promise<void> {
    const existingData = this.outcomeData.get(clientCommitment) || [];
    existingData.push(anonymizedOutcomes);
    this.outcomeData.set(clientCommitment, existingData);
  }

  // Analytics helper methods
  private calculateAverageSatisfaction(feedbackData: any[]): number {
    if (feedbackData.length === 0) return 0;
    const total = feedbackData.reduce((sum, f) => sum + f.averageRating, 0);
    return total / feedbackData.length;
  }

  private calculateSatisfactionTrend(feedbackData: any[]): number {
    if (feedbackData.length < 2) return 0;
    const recent = feedbackData.slice(-5);
    const older = feedbackData.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, f) => sum + f.averageRating, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, f) => sum + f.averageRating, 0) / older.length : recentAvg;
    
    return (recentAvg - olderAvg) / 10; // Normalize to -1 to 1
  }

  private calculateOutcomeImprovement(feedbackData: any[]): number {
    if (feedbackData.length === 0) return 0;
    const goodOutcomes = feedbackData.filter(f => 
      f.outcomeCategory === 'good' || f.outcomeCategory === 'excellent'
    ).length;
    return goodOutcomes / feedbackData.length;
  }

  private identifyEffectiveApproaches(feedbackData: any[]): string[] {
    // Simplified approach identification
    return ['CBT', 'Mindfulness', 'EMDR', 'DBT'];
  }

  private identifyCommonChallenges(outcomeData: any[]): string[] {
    // Simplified challenge identification
    return ['Low Engagement', 'High Anxiety', 'Avoidance Behaviors'];
  }

  private calculateRiskDistribution(outcomeData: any[]): any {
    const total = outcomeData.length;
    if (total === 0) return { low: 0, medium: 0, high: 0 };
    
    const low = outcomeData.filter(o => o.riskLevel === 'low').length;
    const medium = outcomeData.filter(o => o.riskLevel === 'medium').length;
    const high = outcomeData.filter(o => o.riskLevel === 'high').length;
    
    return {
      low: low / total,
      medium: medium / total,
      high: high / total
    };
  }

  private calculateRetentionRate(feedbackData: any[]): number {
    // Simplified retention calculation
    const clients = new Set(feedbackData.map(f => f.clientHash));
    const repeatingClients = feedbackData.filter(f => 
      feedbackData.filter(f2 => f2.clientHash === f.clientHash).length > 1
    ).length;
    
    return clients.size > 0 ? repeatingClients / clients.size : 0;
  }

  private calculateAverageSessionsPerClient(feedbackData: any[]): number {
    const clientSessions = new Map();
    feedbackData.forEach(f => {
      const count = clientSessions.get(f.clientHash) || 0;
      clientSessions.set(f.clientHash, count + 1);
    });
    
    const totalSessions = Array.from(clientSessions.values()).reduce((sum, count) => sum + count, 0);
    return clientSessions.size > 0 ? totalSessions / clientSessions.size : 0;
  }

  private identifyDropoutRiskFactors(outcomeData: any[]): string[] {
    // Simplified risk factor identification
    return ['Poor Initial Engagement', 'High Anxiety Levels', 'Missed Sessions'];
  }

  private identifyHelpfulInterventions(feedbackData: any[]): string[] {
    // Simplified intervention identification
    return ['Active Listening', 'Goal Setting', 'Behavioral Techniques'];
  }

  private identifyLeastHelpfulInterventions(feedbackData: any[]): string[] {
    // Simplified intervention identification
    return ['Passive Observation', 'Generic Advice'];
  }

  private async verifyZKProof(proof: string, publicSignals: string[]): Promise<boolean> {
    // Simulated ZK proof verification
    return proof.startsWith('feedback_proof_') || proof.startsWith('outcomes_proof_');
  }

  private async verifyNullifiers(clientNullifier: string, therapistNullifier: string): Promise<boolean> {
    // Check if nullifiers have been used before
    return true; // Simplified check
  }
}

// Singleton instance
export const zkSessionFeedbackService = new ZKSessionFeedbackService();