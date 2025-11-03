import { encryptedCommunicationService } from './EncryptedCommunicationService';

export class RealtimeChatService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'wss://api.terap.io/ws';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Realtime chat connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'encrypted_message':
        window.dispatchEvent(new CustomEvent('encryptedMessage', { detail: data.message }));
        break;
      case 'user_joined':
        window.dispatchEvent(new CustomEvent('userJoined', { detail: data }));
        break;
      case 'user_left':
        window.dispatchEvent(new CustomEvent('userLeft', { detail: data }));
        break;
      case 'typing':
        window.dispatchEvent(new CustomEvent('userTyping', { detail: data }));
        break;
    }
  }

  sendMessage(sessionId: string, message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'encrypted_message',
        sessionId,
        message
      }));
    }
  }

  joinSession(sessionId: string, userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join_session',
        sessionId,
        userId
      }));
    }
  }

  leaveSession(sessionId: string, userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave_session',
        sessionId,
        userId
      }));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const realtimeChatService = new RealtimeChatService();