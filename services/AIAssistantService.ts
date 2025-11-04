import { blockchainDataService } from './BlockchainDataService';

interface ExternalHealthData {
  condition: string;
  symptoms: string[];
  treatments: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PlatformTherapist {
  id: string;
  name: string;
  specialization: string[];
  rating: number;
  availability: string;
  hourlyRate: number;
  verified: boolean;
}

export class AIAssistantService {
  private openaiApiKey: string | undefined;

  constructor() {
    // Handle both server and client-side API key access
    this.openaiApiKey = typeof window === 'undefined' 
      ? process.env.OPENAI_API_KEY 
      : process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  }

  async fetchExternalHealthInfo(condition: string): Promise<ExternalHealthData | null> {
    try {
      // Use OpenAI to get health information
      if (!this.openaiApiKey) {
        return this.getFallbackHealthInfo(condition);
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'You are a mental health information assistant. Provide factual, helpful information about mental health conditions. Format response as JSON with condition, symptoms array, treatments array, and severity level.'
          }, {
            role: 'user',
            content: `Provide information about ${condition} including symptoms and evidence-based treatments.`
          }],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) throw new Error('OpenAI API failed');

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      try {
        return JSON.parse(content);
      } catch {
        return this.getFallbackHealthInfo(condition);
      }
    } catch (error) {
      console.warn('External health info fetch failed:', error);
      return this.getFallbackHealthInfo(condition);
    }
  }

  private getFallbackHealthInfo(condition: string): ExternalHealthData {
    const fallbackData: { [key: string]: ExternalHealthData } = {
      anxiety: {
        condition: 'Anxiety Disorders',
        symptoms: ['Excessive worry', 'Restlessness', 'Fatigue', 'Difficulty concentrating', 'Muscle tension'],
        treatments: ['Cognitive Behavioral Therapy (CBT)', 'Exposure Therapy', 'Mindfulness-based interventions', 'Relaxation techniques'],
        severity: 'medium'
      },
      depression: {
        condition: 'Major Depressive Disorder',
        symptoms: ['Persistent sadness', 'Loss of interest', 'Fatigue', 'Sleep disturbances', 'Feelings of worthlessness'],
        treatments: ['Cognitive Behavioral Therapy (CBT)', 'Interpersonal Therapy (IPT)', 'Behavioral Activation', 'Mindfulness-based therapy'],
        severity: 'high'
      },
      panic: {
        condition: 'Panic Disorder',
        symptoms: ['Sudden intense fear', 'Heart palpitations', 'Sweating', 'Trembling', 'Shortness of breath'],
        treatments: ['Panic-focused CBT', 'Exposure therapy', 'Breathing techniques', 'Progressive muscle relaxation'],
        severity: 'high'
      }
    };

    const lowerCondition = condition.toLowerCase();
    for (const [key, data] of Object.entries(fallbackData)) {
      if (lowerCondition.includes(key)) {
        return data;
      }
    }

    return {
      condition: 'General Mental Health Concern',
      symptoms: ['Emotional distress', 'Changes in mood', 'Difficulty coping'],
      treatments: ['Supportive counseling', 'Stress management', 'Coping skills training'],
      severity: 'low'
    };
  }

  async getPlatformTherapists(specialization?: string): Promise<PlatformTherapist[]> {
    try {
      // Fetch real therapists from blockchain
      const therapists = await blockchainDataService.getVerifiedTherapists();
      
      return therapists.map(t => ({
        id: t.id,
        name: t.name,
        specialization: t.specializations,
        rating: t.rating,
        availability: t.isAvailable ? 'Available now' : 'Busy',
        hourlyRate: t.hourlyRate,
        verified: t.isVerified
      })).filter(t => 
        !specialization || t.specialization.some(s => 
          s.toLowerCase().includes(specialization.toLowerCase())
        )
      );
    } catch (error) {
      console.warn('Failed to fetch platform therapists:', error);
      return this.getFallbackTherapists(specialization);
    }
  }

  private getFallbackTherapists(specialization?: string): PlatformTherapist[] {
    const allTherapists = [
      {
        id: '1',
        name: 'Dr. Sarah Chen',
        specialization: ['Anxiety Disorders', 'Panic Attacks', 'CBT'],
        rating: 4.9,
        availability: 'Available today',
        hourlyRate: 120,
        verified: true
      },
      {
        id: '2',
        name: 'Dr. Michael Rodriguez',
        specialization: ['Depression', 'Mood Disorders', 'IPT'],
        rating: 4.8,
        availability: 'Available tomorrow',
        hourlyRate: 110,
        verified: true
      },
      {
        id: '3',
        name: 'Dr. Emily Johnson',
        specialization: ['Crisis Intervention', 'Trauma', 'EMDR'],
        rating: 4.9,
        availability: 'Available now',
        hourlyRate: 150,
        verified: true
      },
      {
        id: '4',
        name: 'Dr. David Kim',
        specialization: ['General Counseling', 'Stress Management', 'Mindfulness'],
        rating: 4.7,
        availability: 'Available this week',
        hourlyRate: 100,
        verified: true
      },
      {
        id: '5',
        name: 'Dr. Lisa Wang',
        specialization: ['Anxiety', 'Social Phobia', 'Exposure Therapy'],
        rating: 4.8,
        availability: 'Available today',
        hourlyRate: 130,
        verified: true
      }
    ];

    if (!specialization) return allTherapists.slice(0, 3);

    return allTherapists.filter(t => 
      t.specialization.some(s => 
        s.toLowerCase().includes(specialization.toLowerCase())
      )
    ).slice(0, 3);
  }

  async generateEnhancedResponse(userInput: string, userHistory?: any): Promise<{
    response: string;
    suggestions: string[];
    therapists: PlatformTherapist[];
    externalInfo?: ExternalHealthData;
  }> {
    try {
      // Use OpenAI to generate comprehensive response
      const aiResponse = await this.getOpenAIResponse(userInput, userHistory);
      
      // Check if therapist recommendation is needed
      const needsTherapist = this.shouldRecommendTherapist(userInput);
      const therapists = needsTherapist ? await this.getPlatformTherapists() : [];
      
      // Generate suggestions based on context
      const suggestions = this.generateContextualSuggestions(userInput, needsTherapist);
      
      return {
        response: aiResponse,
        suggestions,
        therapists
      };
    } catch (error) {
      console.error('AI response generation failed:', error);
      return this.getFallbackResponse(userInput);
    }
  }

  private async getOpenAIResponse(userInput: string, userHistory?: any): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not available');
    }

    const systemPrompt = `You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible. You have access to your full training data and can discuss any topic including science, technology, history, current events, mathematics, literature, philosophy, and more. Provide detailed, accurate information.

${userHistory ? `User context: ${JSON.stringify(userHistory)}` : ''}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        max_tokens: 2000,
        temperature: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I\'m having trouble generating a response right now.';
  }

  private shouldRecommendTherapist(input: string): boolean {
    const mentalHealthKeywords = [
      'anxious', 'anxiety', 'depressed', 'depression', 'panic', 'stress', 'therapy', 'therapist',
      'counseling', 'mental health', 'sad', 'worried', 'overwhelmed', 'crisis', 'help me',
      'struggling', 'difficult time', 'emotional', 'mood', 'feelings'
    ];
    
    const lowerInput = input.toLowerCase();
    return mentalHealthKeywords.some(keyword => lowerInput.includes(keyword));
  }

  private generateContextualSuggestions(input: string, needsTherapist: boolean): string[] {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('suicide') || lowerInput.includes('crisis')) {
      return ['Connect me to crisis support', 'Call emergency services', 'Find crisis therapist'];
    }
    
    if (needsTherapist) {
      return ['Find a therapist', 'Book a session', 'Learn about therapy types', 'View crisis resources'];
    }
    
    // General suggestions for any topic
    return ['Tell me more', 'How can TeraP help?', 'Find mental health resources', 'Ask another question'];
  }

  private getFallbackResponse(userInput: string): {
    response: string;
    suggestions: string[];
    therapists: PlatformTherapist[];
  } {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('suicide') || lowerInput.includes('crisis')) {
      return {
        response: `🚨 I'm concerned about what you're sharing. Please reach out for immediate help:

• Call 988 (Suicide Prevention Lifeline)
• Text HOME to 741741 (Crisis Text Line)
• Call 911 for emergency help

You're not alone, and help is available.`,
        suggestions: ['Connect to crisis support', 'Call emergency services'],
        therapists: []
      };
    }
    
    return {
      response: `I'm here to help with any questions you have! While I'm having trouble accessing my full knowledge base right now, I can still assist you. What would you like to know about?`,
      suggestions: ['Ask about mental health', 'Find a therapist', 'Learn about TeraP platform'],
      therapists: []
    };
  }
}

export const aiAssistantService = new AIAssistantService();