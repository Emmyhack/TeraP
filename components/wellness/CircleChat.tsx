'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Heart, Shield, Users, Settings, ArrowLeft, Lock } from 'lucide-react';
import { encryptedCommunicationService, EncryptedMessage, ChatSession } from '@/services/EncryptedCommunicationService';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';

interface CircleMessage extends EncryptedMessage {
  isAnonymous: boolean;
  reactions: { emoji: string; count: number; users: string[] }[];
  displayName: string;
}

interface CircleChatProps {
  circleId: string;
  circleName: string;
  onBack: () => void;
}

const CircleChat: React.FC<CircleChatProps> = ({ circleId, circleName, onBack }) => {
  const { address } = useWeb3Wallet();
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [onlineMembers, setOnlineMembers] = useState(12);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize encrypted circle chat
  useEffect(() => {
    async function initializeCircleChat() {
      if (!address) return;

      try {
        const session = await encryptedCommunicationService.startChatSession(
          'facilitator_' + circleId,
          address,
          'circle_' + circleId
        );
        setChatSession(session);
        setIsConnected(true);
        
        const welcomeMessage: CircleMessage = {
          id: `welcome_${Date.now()}`,
          senderId: 'system',
          receiverId: address,
          encryptedContent: 'Welcome to the encrypted wellness circle. All messages are end-to-end encrypted.',
          messageType: 'system',
          timestamp: Date.now(),
          sessionId: session.sessionId,
          iv: '',
          signature: '',
          isAnonymous: false,
          reactions: [],
          displayName: 'System'
        };
        setMessages([welcomeMessage]);

      } catch (error) {
        console.error('Failed to initialize circle chat:', error);
        setIsConnected(false);
      }
    }

    initializeCircleChat();
  }, [address, circleId]);

  // Listen for incoming messages
  useEffect(() => {
    const handleEncryptedMessage = (event: CustomEvent) => {
      const message = event.detail as EncryptedMessage;
      if (message.sessionId === chatSession?.sessionId) {
        const circleMessage: CircleMessage = {
          ...message,
          isAnonymous: message.senderId.includes('Anonymous'),
          reactions: [],
          displayName: message.senderId.includes('Anonymous') 
            ? message.senderId 
            : message.senderId.includes('facilitator') 
              ? 'Facilitator' 
              : 'Member'
        };
        setMessages(prev => [...prev, circleMessage]);
      }
    };

    window.addEventListener('encryptedMessage', handleEncryptedMessage as EventListener);
    return () => {
      window.removeEventListener('encryptedMessage', handleEncryptedMessage as EventListener);
    };
  }, [chatSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !address || !chatSession) return;

    try {
      const senderId = isAnonymous 
        ? `Anonymous_User_${Math.floor(Math.random() * 1000)}` 
        : address;
        
      const message = await encryptedCommunicationService.sendMessage(
        chatSession.sessionId,
        senderId,
        newMessage.trim()
      );
      
      const circleMessage: CircleMessage = {
        ...message,
        isAnonymous,
        reactions: [],
        displayName: isAnonymous ? senderId : 'You'
      };
      
      setMessages(prev => [...prev, circleMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (existingReaction.users.includes('current_user')) {
            existingReaction.count--;
            existingReaction.users = existingReaction.users.filter(u => u !== 'current_user');
          } else {
            existingReaction.count++;
            existingReaction.users.push('current_user');
          }
        } else {
          msg.reactions.push({ emoji, count: 1, users: ['current_user'] });
        }
      }
      return msg;
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-neutral-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-800">{circleName}</h1>
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Users className="h-4 w-4" />
                <span>12 members online</span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-neutral-100 rounded-lg">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-80px)]">
        {/* Guidelines Banner */}
        <div className="bg-accent-50 border border-accent-200 rounded-lg m-4 p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-accent-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-accent-800 mb-1">Circle Guidelines</h3>
              <p className="text-sm text-accent-700">
                This is a safe space. Be respectful, maintain confidentiality, and support each other with kindness.
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {message.messageType !== 'system' && (
                    <Lock className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`font-medium ${message.isAnonymous ? 'text-neutral-600' : 'text-primary-600'}`}>
                    {message.displayName}
                  </span>
                  {message.displayName === 'Facilitator' && (
                    <span className="px-2 py-1 bg-accent-100 text-accent-600 rounded text-xs font-medium">
                      Facilitator
                    </span>
                  )}
                  {message.messageType === 'system' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                      System
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-500">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <p className="text-neutral-700 mb-3">{message.encryptedContent}</p>
              
              {/* Reactions */}
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {['💙', '🌟', '💪', '🤗'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(message.id, emoji)}
                      className="p-1 hover:bg-neutral-100 rounded text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {message.reactions.length > 0 && (
                  <div className="flex space-x-2 ml-2">
                    {message.reactions.map((reaction, idx) => (
                      <span key={idx} className="text-xs bg-neutral-100 px-2 py-1 rounded-full">
                        {reaction.emoji} {reaction.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="anonymous" className="text-sm text-neutral-700">
              Post anonymously
            </label>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Share your encrypted thoughts with the circle..."
                className="w-full form-input pr-10"
                disabled={!isConnected}
              />
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
            <div className="flex items-center space-x-2">
              <Shield className="h-3 w-3 text-green-500" />
              <span>End-to-end encrypted • Anonymous mode: {isAnonymous ? 'ON' : 'OFF'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>Circle ID: {circleId.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleChat;