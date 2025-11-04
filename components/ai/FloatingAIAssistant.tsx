'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Heart, Brain, AlertTriangle } from 'lucide-react';
import { aiAssistantService } from '@/services/AIAssistantService';
import { useZKIdentity } from '@/components/identity/ZKIdentityProvider';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface TherapistRecommendation {
  name: string;
  specialization: string;
  rating: number;
  availability: string;
}

interface TherapyRecommendation {
  type: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  firstAid?: string[];
}

export function FloatingAIAssistant() {
  const { currentSession } = useZKIdentity();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI wellness assistant powered by real mental health data. I can help you find verified therapists on our platform, provide evidence-based information, and offer immediate support. How are you feeling today?",
      timestamp: new Date(),
      suggestions: ['I need help with anxiety', 'Find me a therapist', 'I\'m having a crisis', 'Show my therapy history']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  const generateAIResponse = async (userInput: string): Promise<Message> => {
    try {
      // Get user history if available
      const userHistory = currentSession ? {
        previousSessions: [], // Would fetch from blockchain
        preferences: currentSession.profile
      } : undefined;

      // Use AI service to generate enhanced response
      const aiResponse = await aiAssistantService.generateEnhancedResponse(userInput, userHistory);
      
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: aiResponse.response,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions
      };
    } catch (error) {
      console.error('AI response generation failed:', error);
      
      // Fallback to basic response
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "I'm having trouble accessing external resources right now, but I'm still here to help. Could you tell me more about what you're experiencing?",
        timestamp: new Date(),
        suggestions: ['I need immediate help', 'Find a therapist', 'Show platform resources']
      };
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // Simulate AI processing time
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(content);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Wellness Assistant</h3>
              <p className="text-xs opacity-90">Always here to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-80">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-3 ${
                message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="flex items-start space-x-2">
                  {message.type === 'ai' && (
                    <Bot className="w-4 h-4 mt-1 text-blue-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    {message.suggestions && (
                      <div className="mt-3 space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left text-xs bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl p-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-blue-500" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="How can I help you today?"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FloatingAIAssistant;