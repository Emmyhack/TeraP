// Encrypted Chat Interface Component
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Lock, 
  Shield, 
  Paperclip
} from 'lucide-react';
import { encryptedCommunicationService, EncryptedMessage, ChatSession } from '@/services/EncryptedCommunicationService';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';

interface EncryptedChatProps {
  sessionId: string;
  therapistId: string;
  clientId: string;
  userRole: 'therapist' | 'client';
  onSessionEnd: () => void;
}

export const EncryptedChat: React.FC<EncryptedChatProps> = ({
  sessionId,
  therapistId,
  clientId,
  userRole,
  onSessionEnd
}) => {
  const { address } = useWeb3Wallet();
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [encryptionStatus, setEncryptionStatus] = useState<'secure' | 'insecure'>('secure');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Initialize chat session
  useEffect(() => {
    async function initializeSession() {
      if (!address) return;

      try {
        const session = await encryptedCommunicationService.startChatSession(
          therapistId,
          clientId,
          sessionId
        );
        setChatSession(session);
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Add system message
        const systemMessage: EncryptedMessage = {
          id: `sys_${Date.now()}`,
          senderId: 'system',
          receiverId: address,
          encryptedContent: 'Secure encrypted session started. All messages are end-to-end encrypted.',
          messageType: 'system',
          timestamp: Date.now(),
          sessionId,
          iv: '',
          signature: ''
        };
        setMessages([systemMessage]);

      } catch (error) {
        console.error('Failed to initialize session:', error);
        setConnectionStatus('disconnected');
      }
    }

    initializeSession();
  }, [address, sessionId, therapistId, clientId]);

  // Listen for incoming messages and WebRTC events
  useEffect(() => {
    const handleEncryptedMessage = (event: CustomEvent) => {
      const message = event.detail as EncryptedMessage;
      if (message.sessionId === sessionId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleVoiceCallRequest = (event: CustomEvent) => {
      const data = event.detail;
      if (data.sessionId === sessionId) {
        setIsCallActive(true);
        // Auto-accept call for demo (in production, show accept/decline UI)
        acceptVoiceCall(data.callId);
      }
    };

    const handleRemoteStream = (event: CustomEvent) => {
      const { stream } = event.detail;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
      }
    };

    window.addEventListener('encryptedMessage', handleEncryptedMessage as EventListener);
    window.addEventListener('videoCallRequest', handleVoiceCallRequest as EventListener);
    window.addEventListener('remoteStream', handleRemoteStream as EventListener);

    return () => {
      window.removeEventListener('encryptedMessage', handleEncryptedMessage as EventListener);
      window.removeEventListener('videoCallRequest', handleVoiceCallRequest as EventListener);
      window.removeEventListener('remoteStream', handleRemoteStream as EventListener);
    };
  }, [sessionId]);

  // Accept incoming voice call
  const acceptVoiceCall = async (callId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
      
      setIsAudioActive(true);
      
    } catch (error) {
      console.error('Failed to accept voice call:', error);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!currentMessage.trim() || !address || !chatSession) return;

    try {
      const message = await encryptedCommunicationService.sendMessage(
        sessionId,
        address,
        currentMessage.trim()
      );
      
      setMessages(prev => [...prev, message]);
      setCurrentMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error notification
    }
  };

  // Start voice call
  const startVoiceCall = async () => {
    if (!address || !chatSession) return;

    try {
      const voiceCall = await encryptedCommunicationService.startVideoCall(sessionId, address);
      setIsCallActive(true);
      setIsAudioActive(true);
      
      // Get audio only
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
      
    } catch (error) {
      console.error('Failed to start voice call:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  // End voice call
  const endVoiceCall = async () => {
    try {
      // Stop local audio streams
      if (localAudioRef.current?.srcObject) {
        const stream = localAudioRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        localAudioRef.current.srcObject = null;
      }
      
      if (remoteAudioRef.current?.srcObject) {
        remoteAudioRef.current.srcObject = null;
      }
      
      // Find and end active call
      const calls = encryptedCommunicationService['videoCalls'];
      const activeCall = Array.from(calls.values()).find(call => call.sessionId === sessionId);
      
      if (activeCall) {
        await encryptedCommunicationService.endVideoCall(activeCall.callId);
      }
      
      setIsCallActive(false);
      setIsAudioActive(false);
    } catch (error) {
      console.error('Failed to end voice call:', error);
    }
  };

  // End session
  const handleEndSession = async () => {
    try {
      await encryptedCommunicationService.endSession(sessionId);
      onSessionEnd();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-900">
              Encrypted Session
            </span>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Voice Call Controls */}
          {!isCallActive ? (
            <button
              onClick={startVoiceCall}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Start Voice Call"
            >
              <Phone className="h-5 w-5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  if (localAudioRef.current?.srcObject) {
                    const stream = localAudioRef.current.srcObject as MediaStream;
                    const audioTrack = stream.getAudioTracks()[0];
                    if (audioTrack) {
                      audioTrack.enabled = !isAudioActive;
                      setIsAudioActive(!isAudioActive);
                    }
                  }
                }}
                className={`p-2 rounded-full transition-colors ${
                  isAudioActive 
                    ? 'text-blue-600 hover:bg-blue-50' 
                    : 'text-red-600 hover:bg-red-50 bg-red-50'
                }`}
                title={isAudioActive ? 'Mute audio' : 'Unmute audio'}
              >
                {isAudioActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={endVoiceCall}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="End Call"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </>
          )}

          <button
            onClick={handleEndSession}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Voice Call Area */}
      {isCallActive && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Voice Call Active - Encrypted</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mic className={`h-4 w-4 ${isAudioActive ? 'text-green-500' : 'text-red-500'}`} />
              <span>{isAudioActive ? 'Microphone On' : 'Microphone Off'}</span>
            </div>
          </div>
          
          {/* Hidden audio elements for WebRTC */}
          <audio ref={localAudioRef} autoPlay muted />
          <audio ref={remoteAudioRef} autoPlay />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id}>
            {message.messageType === 'system' ? (
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-full text-sm text-gray-600">
                  <Lock className="h-4 w-4" />
                  <span>{message.encryptedContent}</span>
                </div>
              </div>
            ) : (
              <div className={`flex ${message.senderId === address ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === address
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  <div className="flex items-start space-x-2">
                    {message.senderId !== address && (
                      <Shield className="h-4 w-4 mt-1 flex-shrink-0 text-gray-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">
                        {message.senderId === 'system' 
                          ? message.encryptedContent 
                          : `[Encrypted] ${message.encryptedContent.slice(0, 50)}...`
                        }
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.senderId === address && (
                          <Lock className="h-3 w-3 opacity-75" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type an encrypted message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            
            {/* Encryption indicator */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Lock className="h-4 w-4 text-green-500" />
            </div>
          </div>

          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Security Status */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>End-to-end encrypted • Messages auto-delete after session</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Session ID: {sessionId.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
};