import CryptoJS from 'crypto-js';
import nacl from 'tweetnacl';

interface AnonymousIdentity {
  id: string;
  role: 'client' | 'therapist';
  publicKey: string;
  signingPublicKey: string;
  encryptedPrivateKey: string;
  specializations: string[];
  createdAt: number;
  lastActive: number;
  walletAddress: string;
}
import { decodeUTF8, encodeUTF8, decodeBase64, encodeBase64 } from 'tweetnacl-util';
import { v4 as uuidv4 } from 'uuid';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  encryptedData: string;
  nonce: string;
  senderPublicKey: string;
  timestamp: number;
}

export interface UserIdentity {
  id: string;
  publicKey: string;
  encryptedPrivateKey: string;
  profileHash: string;
  createdAt: number;
  role: 'client' | 'therapist';
}

export class CryptoService {
  private static instance: CryptoService;
  
  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  /**
   * Generate a new Ed25519 key pair for signing and encryption
   */
  generateKeyPair(): KeyPair {
    const keyPair = nacl.box.keyPair();
    return {
      publicKey: encodeBase64(keyPair.publicKey),
      privateKey: encodeBase64(keyPair.secretKey)
    };
  }

  /**
   * Generate a signing key pair for authentication
   */
  generateSigningKeyPair(): KeyPair {
    const keyPair = nacl.sign.keyPair();
    return {
      publicKey: encodeBase64(keyPair.publicKey),
      privateKey: encodeBase64(keyPair.secretKey)
    };
  }

  /**
   * Encrypt a private key with wallet-derived key
   */
  encryptPrivateKeyWithWallet(privateKey: string, walletAddress: string, signature: string): string {
    // Use wallet signature as encryption key source
    const keySource = walletAddress + signature;
    const key = CryptoJS.SHA256(keySource);
    
    const encrypted = CryptoJS.AES.encrypt(privateKey, key.toString());
    return encrypted.toString();
  }

  /**
   * Decrypt a private key with wallet-derived key
   */
  decryptPrivateKeyWithWallet(encryptedPrivateKey: string, walletAddress: string, signature: string): string {
    try {
      const keySource = walletAddress + signature;
      const key = CryptoJS.SHA256(keySource);
      
      const decrypted = CryptoJS.AES.decrypt(encryptedPrivateKey, key.toString());
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!result) {
        throw new Error('Decryption failed');
      }
      
      return result;
    } catch (error) {
      throw new Error('Failed to decrypt private key. Invalid wallet signature.');
    }
  }

  /**
   * Generate a deterministic message for wallet signing
   */
  generateSigningMessage(walletAddress: string, action: string = 'authenticate'): string {
    const timestamp = Math.floor(Date.now() / 1000);
    // Create message that expires in 1 hour to prevent replay attacks
    const expirationTime = timestamp + 3600;
    
    return `TeraP Anonymous Identity ${action}\n\nWallet: ${walletAddress}\nExpires: ${expirationTime}\nNonce: ${timestamp}`;
  }

  /**
   * Verify that a signature was created recently (within 1 hour)
   */
  verifySigningMessage(message: string): boolean {
    try {
      const lines = message.split('\n');
      const expiresLine = lines.find(line => line.startsWith('Expires: '));
      
      if (!expiresLine) return false;
      
      const expirationTime = parseInt(expiresLine.split('Expires: ')[1]);
      const currentTime = Math.floor(Date.now() / 1000);
      
      return currentTime < expirationTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a unique ID for anonymous identities
   */
  private generateId(): string {
    const randomBytes = CryptoJS.lib.WordArray.random(16);
    return randomBytes.toString();
  }

  /**
   * Encrypt a message using NaCl box (Curve25519 + XSalsa20 + Poly1305)
   */
  encryptMessage(
    message: string, 
    recipientPublicKey: string, 
    senderPrivateKey: string
  ): EncryptedMessage {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageBytes = decodeUTF8(message);
    const publicKeyBytes = decodeBase64(recipientPublicKey);
    const privateKeyBytes = decodeBase64(senderPrivateKey);
    
    const encrypted = nacl.box(messageBytes, nonce, publicKeyBytes, privateKeyBytes);
    
    // Get sender's public key from private key
    const senderKeyPair = nacl.box.keyPair.fromSecretKey(privateKeyBytes);
    
    return {
      encryptedData: encodeBase64(encrypted),
      nonce: encodeBase64(nonce),
      senderPublicKey: encodeBase64(senderKeyPair.publicKey),
      timestamp: Date.now()
    };
  }

  /**
   * Decrypt a message using NaCl box
   */
  decryptMessage(
    encryptedMessage: EncryptedMessage, 
    recipientPrivateKey: string
  ): string {
    try {
      const encryptedBytes = decodeBase64(encryptedMessage.encryptedData);
      const nonceBytes = decodeBase64(encryptedMessage.nonce);
      const senderPublicKeyBytes = decodeBase64(encryptedMessage.senderPublicKey);
      const recipientPrivateKeyBytes = decodeBase64(recipientPrivateKey);
      
      const decrypted = nacl.box.open(
        encryptedBytes, 
        nonceBytes, 
        senderPublicKeyBytes, 
        recipientPrivateKeyBytes
      );
      
      if (!decrypted) {
        throw new Error('Failed to decrypt message');
      }
      
      return encodeUTF8(decrypted);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Decryption failed: ${errorMessage}`);
    }
  }

  /**
   * Sign a message for authentication
   */
  signMessage(message: string, signingPrivateKey: string): string {
    const messageBytes = decodeUTF8(message);
    const privateKeyBytes = decodeBase64(signingPrivateKey);
    
    const signature = nacl.sign.detached(messageBytes, privateKeyBytes);
    return encodeBase64(signature);
  }

  /**
   * Verify a message signature
   */
  verifySignature(
    message: string, 
    signature: string, 
    signingPublicKey: string
  ): boolean {
    try {
      const messageBytes = decodeUTF8(message);
      const signatureBytes = decodeBase64(signature);
      const publicKeyBytes = decodeBase64(signingPublicKey);
      
      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a secure hash of profile data
   */
  hashProfile(profileData: any): string {
    const dataStr = JSON.stringify(profileData, Object.keys(profileData).sort());
    return CryptoJS.SHA256(dataStr).toString();
  }

  /**
   * Generate a secure anonymous user ID
   */
  generateAnonymousId(): string {
    return uuidv4();
  }

  /**
   * Create an anonymous identity with role using wallet signing
   */
  createAnonymousIdentity(
    role: 'client' | 'therapist',
    walletAddress: string,
    signature: string,
    specializations?: string[]
  ): AnonymousIdentity {
    const keyPair = nacl.box.keyPair();
    const signingKeyPair = nacl.sign.keyPair();
    
    const publicKey = Buffer.from(keyPair.publicKey).toString('base64');
    const privateKey = Buffer.from(keyPair.secretKey).toString('base64');
    const signingPublicKey = Buffer.from(signingKeyPair.publicKey).toString('base64');
    const signingPrivateKey = Buffer.from(signingKeyPair.secretKey).toString('base64');
    
    const encryptedPrivateKey = this.encryptPrivateKeyWithWallet(
      JSON.stringify({
        boxPrivateKey: privateKey,
        signingPrivateKey: signingPrivateKey
      }),
      walletAddress,
      signature
    );
    
    const identity: AnonymousIdentity = {
      id: this.generateId(),
      role,
      publicKey,
      signingPublicKey,
      encryptedPrivateKey,
      specializations: specializations || [],
      createdAt: Date.now(),
      lastActive: Date.now(),
      walletAddress
    };
    
    return identity;
  }

  /**
   * Decrypt private keys using wallet signature
   */
  decryptWithWallet(identity: any, walletAddress: string, signature: string): {
    boxPrivateKey: Uint8Array;
    signingPrivateKey: Uint8Array;
  } {
    try {
      const decryptedKeys = JSON.parse(
        this.decryptPrivateKeyWithWallet(identity.encryptedPrivateKey, walletAddress, signature)
      );
      
      return {
        boxPrivateKey: Buffer.from(decryptedKeys.boxPrivateKey, 'base64'),
        signingPrivateKey: Buffer.from(decryptedKeys.signingPrivateKey, 'base64')
      };
    } catch (error) {
      throw new Error('Invalid wallet signature');
    }
  }  /**
   * Generate a secure session token
   */
  generateSessionToken(): string {
    const randomBytes = nacl.randomBytes(32);
    return encodeBase64(randomBytes);
  }

  /**
   * Derive a shared secret for secure channel
   */
  deriveSharedSecret(myPrivateKey: string, theirPublicKey: string): string {
    const privateKeyBytes = decodeBase64(myPrivateKey);
    const publicKeyBytes = decodeBase64(theirPublicKey);
    
    // Use nacl.box.before to compute shared secret
    const sharedSecret = nacl.box.before(publicKeyBytes, privateKeyBytes);
    return encodeBase64(sharedSecret);
  }

  /**
   * Encrypt data with a shared secret (for faster symmetric encryption)
   */
  encryptWithSharedSecret(data: string, sharedSecret: string): {
    encrypted: string;
    nonce: string;
  } {
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const dataBytes = decodeUTF8(data);
    const secretBytes = decodeBase64(sharedSecret);
    
    const encrypted = nacl.secretbox(dataBytes, nonce, secretBytes);
    
    return {
      encrypted: encodeBase64(encrypted),
      nonce: encodeBase64(nonce)
    };
  }

  /**
   * Decrypt data with a shared secret
   */
  decryptWithSharedSecret(
    encrypted: string, 
    nonce: string, 
    sharedSecret: string
  ): string {
    const encryptedBytes = decodeBase64(encrypted);
    const nonceBytes = decodeBase64(nonce);
    const secretBytes = decodeBase64(sharedSecret);
    
    const decrypted = nacl.secretbox.open(encryptedBytes, nonceBytes, secretBytes);
    if (!decrypted) {
      throw new Error('Failed to decrypt with shared secret');
    }
    
    return encodeUTF8(decrypted);
  }

  /**
   * Securely wipe sensitive data from memory (best effort)
   */
  wipeSensitiveData(data: string): void {
    // Note: In JavaScript, we can't truly wipe memory, but we can overwrite the reference
    // For better security, use WebAssembly modules or secure enclaves in production
    if (typeof data === 'string') {
      // Overwrite with random data
      for (let i = 0; i < data.length; i++) {
        data = data.substring(0, i) + String.fromCharCode(Math.floor(Math.random() * 256)) + data.substring(i + 1);
      }
    }
  }
}

export const cryptoService = CryptoService.getInstance();