/**
 * Crypto Manager
 * 
 * Handles end-to-end encryption for story data
 * Uses Web Crypto API for client-side encryption
 */

export interface EncryptionKey {
  key: CryptoKey;
  id: string;
  createdAt: Date;
}

export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Initialization vector
  keyId: string; // Key identifier
  algorithm: string;
}

export class CryptoManager {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM

  /**
   * Generate a new encryption key
   */
  static async generateKey(): Promise<EncryptionKey> {
    const key = await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    const keyId = `key-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return {
      key,
      id: keyId,
      createdAt: new Date(),
    };
  }

  /**
   * Derive key from password
   */
  static async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Use type assertion to work around TypeScript strict typing
    const deriveKey = crypto.subtle.deriveKey as any;
    return deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data
   */
  static async encrypt(
    data: string,
    key: CryptoKey
  ): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Convert to base64
    const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      data: encryptedBase64,
      iv: ivBase64,
      keyId: '', // Will be set by caller
      algorithm: this.ALGORITHM,
    };
  }

  /**
   * Decrypt data
   */
  static async decrypt(
    encryptedData: EncryptedData,
    key: CryptoKey
  ): Promise<string> {
    // Convert from base64
    const encryptedArray = Uint8Array.from(
      atob(encryptedData.data),
      (c) => c.charCodeAt(0)
    );
    const iv = Uint8Array.from(
      atob(encryptedData.iv),
      (c) => c.charCodeAt(0)
    );

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      encryptedArray
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Export key to base64 (for backup)
   */
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    const exportedArray = Array.from(new Uint8Array(exported));
    return btoa(String.fromCharCode(...exportedArray));
  }

  /**
   * Import key from base64
   */
  static async importKey(keyData: string): Promise<CryptoKey> {
    const keyArray = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
      'raw',
      keyArray,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate salt for password derivation
   */
  static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Hash password for storage (not for encryption, for verification)
   */
  static async hashPassword(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = salt;

    const combined = new Uint8Array(passwordBuffer.length + saltBuffer.length);
    combined.set(passwordBuffer);
    combined.set(saltBuffer, passwordBuffer.length);

    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return btoa(String.fromCharCode(...hashArray));
  }
}
