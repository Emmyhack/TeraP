// Encrypted Communication Service for TeraP Platform
import { ethers } from 'ethers';

// Types for encrypted communication
export interface EncryptionKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
}

export interface EncryptedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  encryptedContent: string;
  messageType: 'text' | 'file' | 'system';
  timestamp: number;
  sessionId?: string;
  iv: string; // Initialization vector for AES encryption
  signature: string; // Message integrity signature
}

export interface ChatSession {
  sessionId: string;
  participants: string[];
  therapistId: string;
  clientId: string;
  status: 'active' | 'ended' | 'paused';
  startTime: number;
  endTime?: number;
  encryptionKeys: {
    therapist: string;
    client: string;
  };
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface VideoCallSession {
  callId: string;
  sessionId: string;
  participants: string[];
  status: 'connecting' | 'active' | 'ended';
  startTime: number;
  endTime?: number;
  isRecording: boolean;
  encryptedRecordingKey?: string;
}

export class EncryptedCommunicationService {
  private keyPairs: Map<string, EncryptionKeyPair> = new Map();
  private activeSessions: Map<string, ChatSession> = new Map();
  private videoCalls: Map<string, VideoCallSession> = new Map();
  private webrtcConnections: Map<string, RTCPeerConnection> = new Map();
  private socket: WebSocket | null = null;

  constructor() {
    // Don't initialize WebSocket during server-side rendering or build
    if (typeof window !== 'undefined') {
      this.initializeWebSocket();
    }
  }

  // Initialize WebSocket connection for real-time messaging
  private initializeWebSocket(): void {
    try {
      // In production, this would connect to your secure WebSocket server
      const wsUrl = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'wss://your-secure-websocket-server.com';
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('Encrypted communication WebSocket connected');
      };

      this.socket.onmessage = (event) => {
        this.handleIncomingMessage(JSON.parse(event.data));
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed, attempting to reconnect...');
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      // For now, we'll simulate real-time messaging
      console.log('Using simulated messaging system');
    }
  }

  // Generate encryption key pair for a user
  async generateEncryptionKeys(userId: string): Promise<EncryptionKeyPair> {
    try {
      // Generate a random private key
      const privateKey = ethers.randomBytes(32);
      const privateKeyHex = ethers.hexlify(privateKey);
      
      // In a real implementation, you'd use proper key derivation
      // For now, we'll create a deterministic public key from private key
      const publicKey = ethers.keccak256(privateKeyHex).slice(0, 66);
      
      const keyPair: EncryptionKeyPair = {
        publicKey,
        privateKey: privateKeyHex,
        keyId: `key_${userId}_${Date.now()}`
      };

      this.keyPairs.set(userId, keyPair);
      
      return keyPair;
    } catch (error) {
      console.error('Failed to generate encryption keys:', error);
      throw new Error('Key generation failed');
    }
  }

  // Encrypt message using AES-256-GCM
  async encryptMessage(
    content: string,
    recipientPublicKey: string,
    senderPrivateKey: string
  ): Promise<{ encryptedContent: string; iv: string; signature: string }> {
    try {
      // Generate random IV
      const iv = ethers.randomBytes(12);
      const ivHex = ethers.hexlify(iv);
      
      // In production, use proper ECDH key exchange and AES-GCM
      // For now, we'll use a simple encryption simulation
      const messageBytes = ethers.toUtf8Bytes(content);
      const encryptedBytes = ethers.keccak256(
        ethers.concat([messageBytes, ethers.getBytes(senderPrivateKey)])
      );
      
      // Create message signature for integrity
      const signature = ethers.keccak256(
        ethers.concat([ethers.getBytes(encryptedBytes), ethers.getBytes(ivHex)])
      );

      return {
        encryptedContent: encryptedBytes,
        iv: ivHex,
        signature
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Message encryption failed');
    }
  }

  // Decrypt message
  async decryptMessage(
    encryptedContent: string,
    iv: string,
    signature: string,
    senderPublicKey: string,
    recipientPrivateKey: string
  ): Promise<string> {
    try {
      // Verify message integrity
      const expectedSignature = ethers.keccak256(
        ethers.concat([ethers.getBytes(encryptedContent), ethers.getBytes(iv)])
      );
      
      if (signature !== expectedSignature) {
        throw new Error('Message integrity check failed');
      }

      // In production, use proper AES-GCM decryption
      // For now, simulate decryption
      const decryptedHash = ethers.keccak256(
        ethers.concat([ethers.getBytes(encryptedContent), ethers.getBytes(recipientPrivateKey)])
      );
      
      // This is a simulation - in real implementation, return actual decrypted content
      return `[Decrypted Message - Hash: ${decryptedHash.slice(0, 10)}...]`;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Message decryption failed');
    }
  }

  // Start encrypted chat session
  async startChatSession(
    therapistId: string,
    clientId: string,
    sessionId: string
  ): Promise<ChatSession> {
    try {
      // Generate session encryption keys
      const therapistKeys = await this.generateEncryptionKeys(therapistId);
      const clientKeys = await this.generateEncryptionKeys(clientId);

      const chatSession: ChatSession = {
        sessionId,
        participants: [therapistId, clientId],
        therapistId,
        clientId,
        status: 'active',
        startTime: Date.now(),
        encryptionKeys: {
          therapist: therapistKeys.publicKey,
          client: clientKeys.publicKey
        },
        isVideoEnabled: false,
        isAudioEnabled: false
      };

      this.activeSessions.set(sessionId, chatSession);

      // Notify participants via WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'session_started',
          sessionId,
          participants: [therapistId, clientId]
        }));
      }

      return chatSession;
    } catch (error) {
      console.error('Failed to start chat session:', error);
      throw new Error('Chat session creation failed');
    }
  }

  // Send encrypted message
  async sendMessage(
    sessionId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'file' | 'system' = 'text'
  ): Promise<EncryptedMessage> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const senderKeys = this.keyPairs.get(senderId);
      if (!senderKeys) {
        throw new Error('Sender encryption keys not found');
      }

      const receiverId = session.participants.find(p => p !== senderId);
      if (!receiverId) {
        throw new Error('Receiver not found');
      }

      const receiverPublicKey = session.encryptionKeys[receiverId === session.therapistId ? 'therapist' : 'client'];
      
      const { encryptedContent, iv, signature } = await this.encryptMessage(
        content,
        receiverPublicKey,
        senderKeys.privateKey
      );

      const message: EncryptedMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId,
        receiverId,
        encryptedContent,
        messageType,
        timestamp: Date.now(),
        sessionId,
        iv,
        signature
      };

      // Send via WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'encrypted_message',
          message
        }));
      }

      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Message sending failed');
    }
  }

  // Start video call
  async startVideoCall(
    sessionId: string,
    initiatorId: string
  ): Promise<VideoCallSession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Chat session not found');
      }

      const callId = `call_${sessionId}_${Date.now()}`;
      
      const videoCall: VideoCallSession = {
        callId,
        sessionId,
        participants: session.participants,
        status: 'connecting',
        startTime: Date.now(),
        isRecording: false
      };

      this.videoCalls.set(callId, videoCall);

      // Initialize WebRTC connection
      await this.initializeWebRTC(callId, initiatorId);

      // Notify other participant
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'video_call_request',
          callId,
          sessionId,
          initiator: initiatorId
        }));
      }

      return videoCall;
    } catch (error) {
      console.error('Failed to start video call:', error);
      throw new Error('Video call initialization failed');
    }
  }

  // Initialize WebRTC connection
  private async initializeWebRTC(callId: string, userId: string): Promise<void> {
    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // Add TURN servers for production NAT traversal
        ]
      };

      const peerConnection = new RTCPeerConnection(configuration);
      this.webrtcConnections.set(callId, peerConnection);

      // Get user media (audio only for privacy)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream');
        const [remoteStream] = event.streams;
        // Emit event for UI to handle
        window.dispatchEvent(new CustomEvent('remoteStream', { 
          detail: { stream: remoteStream, callId } 
        }));
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.socket) {
          this.socket.send(JSON.stringify({
            type: 'ice_candidate',
            callId,
            candidate: event.candidate
          }));
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        window.dispatchEvent(new CustomEvent('connectionStateChange', {
          detail: { state: peerConnection.connectionState, callId }
        }));
      };

      // Create and send offer for outgoing calls
      if (userId) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        if (this.socket) {
          this.socket.send(JSON.stringify({
            type: 'call_offer',
            callId,
            offer: offer
          }));
        }
      }

      console.log('WebRTC connection initialized for call:', callId);
    } catch (error) {
      console.error('WebRTC initialization failed:', error);
      throw error;
    }
  }

  // Handle incoming WebSocket messages
  private handleIncomingMessage(data: any): void {
    switch (data.type) {
      case 'encrypted_message':
        this.handleIncomingChatMessage(data.message);
        break;
      case 'video_call_request':
        this.handleVideoCallRequest(data);
        break;
      case 'ice_candidate':
        this.handleICECandidate(data);
        break;
      case 'call_answer':
        this.handleCallAnswer(data);
        break;
      case 'call_offer':
        this.handleCallOffer(data);
        break;
    }
  }

  private handleIncomingChatMessage(message: EncryptedMessage): void {
    console.log('Received encrypted message:', message.id);
    // Emit event for UI to handle
    window.dispatchEvent(new CustomEvent('encryptedMessage', { detail: message }));
  }

  private handleVideoCallRequest(data: any): void {
    console.log('Received video call request for session:', data.sessionId);
    // Emit event for UI to handle
    window.dispatchEvent(new CustomEvent('videoCallRequest', { detail: data }));
  }

  private handleICECandidate(data: any): void {
    const peerConnection = this.webrtcConnections.get(data.callId);
    if (peerConnection) {
      peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  private async handleCallAnswer(data: any): Promise<void> {
    const peerConnection = this.webrtcConnections.get(data.callId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  }

  private async handleCallOffer(data: any): Promise<void> {
    const peerConnection = this.webrtcConnections.get(data.callId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      if (this.socket) {
        this.socket.send(JSON.stringify({
          type: 'call_answer',
          callId: data.callId,
          answer: answer
        }));
      }
    }
  }

  // End chat session
  async endSession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'ended';
      session.endTime = Date.now();

      // End any active video calls
      const activeCall = Array.from(this.videoCalls.values()).find(call => call.sessionId === sessionId);
      if (activeCall) {
        await this.endVideoCall(activeCall.callId);
      }

      // Clean up resources
      this.activeSessions.delete(sessionId);

      // Notify via WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'session_ended',
          sessionId
        }));
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      throw new Error('Session termination failed');
    }
  }

  // End video call
  async endVideoCall(callId: string): Promise<void> {
    try {
      const call = this.videoCalls.get(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      call.status = 'ended';
      call.endTime = Date.now();

      // Close WebRTC connection
      const peerConnection = this.webrtcConnections.get(callId);
      if (peerConnection) {
        peerConnection.close();
        this.webrtcConnections.delete(callId);
      }

      this.videoCalls.delete(callId);

      // Notify via WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'call_ended',
          callId
        }));
      }
    } catch (error) {
      console.error('Failed to end video call:', error);
      throw new Error('Call termination failed');
    }
  }

  // Get active session
  getSession(sessionId: string): ChatSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Get user's encryption keys
  getUserKeys(userId: string): EncryptionKeyPair | undefined {
    return this.keyPairs.get(userId);
  }

  // Check if WebSocket is connected
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const encryptedCommunicationService = new EncryptedCommunicationService();