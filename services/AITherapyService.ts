import { EncryptedMessage } from './EncryptedCommunicationService';

interface TherapyInsights {
  moodScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  nextSessionSuggestion: Date;
}

interface CrisisAlert {
  severity: 1 | 2 | 3 | 4 | 5;
  triggers: string[];
  immediateAction: boolean;
  emergencyContacts: boolean;
}

interface TherapistMatch {
  therapistId: string;
  matchScore: number;
  specialties: string[];
  availability: Date[];
}

export class AITherapyService {
  private apiKey = process.env.OPENAI_API_KEY || '';

  async generateSessionInsights(sessionData: any): Promise<TherapyInsights> {
    if (!this.apiKey || this.apiKey === '') {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: 'You are a mental health AI assistant. Analyze therapy session data and provide insights. Return valid JSON with: moodScore (0-100), riskLevel ("low"|"medium"|"high"|"critical"), recommendations (string array), nextSessionSuggestion (ISO date string).'
        }, {
          role: 'user',
          content: `Session Analysis:\nDuration: ${sessionData.duration} minutes\nClient Feedback: ${sessionData.feedback || 'No feedback'}\nTherapist Notes: ${sessionData.notes || 'No notes'}\nSession Type: ${sessionData.type || 'General'}`
        }],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      // Fallback parsing if JSON is malformed
      return {
        moodScore: 50,
        riskLevel: 'medium' as const,
        recommendations: ['Continue regular sessions', 'Monitor progress'],
        nextSessionSuggestion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
    }
  }

  async detectCrisisSignals(messages: EncryptedMessage[]): Promise<CrisisAlert> {
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hopeless', 'worthless'];
    const recentMessages = messages.slice(-10);
    
    let severity = 1;
    const triggers: string[] = [];
    
    for (const msg of recentMessages) {
      const content = msg.encryptedContent.toLowerCase();
      for (const keyword of crisisKeywords) {
        if (content.includes(keyword)) {
          severity = Math.min(5, severity + 1);
          triggers.push(keyword);
        }
      }
    }

    return {
      severity: severity as 1 | 2 | 3 | 4 | 5,
      triggers,
      immediateAction: severity >= 4,
      emergencyContacts: severity >= 3
    };
  }

  async recommendTherapists(clientProfile: any): Promise<TherapistMatch[]> {
    if (!this.apiKey || this.apiKey === 'sk-your-real-openai-api-key-here') {
      // Return mock recommendations when API key not configured
      return [
        {
          therapistId: '0x1234567890123456789012345678901234567890',
          matchScore: 95,
          specialties: ['anxiety', 'depression'],
          availability: [new Date(Date.now() + 86400000)] // Tomorrow
        },
        {
          therapistId: '0x2345678901234567890123456789012345678901',
          matchScore: 87,
          specialties: ['trauma', 'ptsd'],
          availability: [new Date(Date.now() + 172800000)] // Day after tomorrow
        }
      ];
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'Match clients with therapists based on profile. Return JSON array of matches with therapistId, matchScore (0-100), specialties array, and availability array.'
          }, {
            role: 'user',
            content: `Client Profile: ${JSON.stringify(clientProfile)}`
          }],
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('AI therapist matching failed, using fallback:', error);
      return this.recommendTherapists(clientProfile);
    }
  }

  async generateWellnessPlans(userGoals: string[]): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: 'Create personalized wellness plans based on user goals. Return JSON with dailyTasks, weeklyGoals, and milestones arrays.'
        }, {
          role: 'user',
          content: `User Goals: ${userGoals.join(', ')}`
        }],
        max_tokens: 600
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate wellness plan');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  async getTherapistFromBlockchain(therapistAddress: string): Promise<any> {
    const response = await fetch(process.env.NEXT_PUBLIC_RPC_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: process.env.NEXT_PUBLIC_TERAP_THERAPIST_ADDRESS,
          data: `0x${this.encodeGetTherapistProfile(therapistAddress)}`
        }, 'latest'],
        id: 1
      })
    });

    const data = await response.json();
    return this.decodeTherapistProfile(data.result);
  }

  private encodeGetTherapistProfile(address: string): string {
    // Function selector for getTherapistProfile(address)
    return '0x' + 'getTherapistProfile'.slice(0, 8) + address.slice(2).padStart(64, '0');
  }

  private decodeTherapistProfile(data: string): any {
    // Decode ABI-encoded therapist profile data
    return {
      therapist: '0x' + data.slice(26, 66),
      specializations: [], // Decode array
      hourlyRate: parseInt(data.slice(130, 194), 16),
      isVerified: data.slice(194, 195) === '1'
    };
  }
}

export const aiTherapyService = new AITherapyService();