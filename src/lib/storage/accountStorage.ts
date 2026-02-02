/**
 * Account Storage
 * 
 * Manages account data, encryption keys, and cloud sync
 */

import { CryptoManager, type EncryptionKey, type EncryptedData } from '@/lib/encryption/cryptoManager';
import { StoryStorage } from './storyStorage';
import type { Story, Scene, Character } from '@/types/story';

const STORAGE_KEYS = {
  ACCOUNT: 'odysseyos_account',
  ENCRYPTION_KEY: 'odysseyos_encryption_key',
  SYNC_STATE: 'odysseyos_sync_state',
  BACKUP_METADATA: 'odysseyos_backup_metadata',
};

export interface Account {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  lastSyncAt?: Date;
  deviceId: string;
  devices: Array<{
    id: string;
    name: string;
    lastSeen: Date;
  }>;
}

export interface SyncState {
  lastSyncTimestamp: number;
  pendingChanges: Array<{
    type: 'story' | 'character' | 'scene';
    id: string;
    action: 'create' | 'update' | 'delete';
    timestamp: number;
  }>;
  conflicts: Array<{
    id: string;
    localVersion: any;
    remoteVersion: any;
    timestamp: number;
  }>;
}

export interface BackupMetadata {
  id: string;
  createdAt: Date;
  size: number;
  encrypted: boolean;
  description?: string;
}

export class AccountStorage {
  /**
   * Create new account
   */
  static async createAccount(
    email: string,
    username: string,
    password: string
  ): Promise<Account> {
    const account: Account = {
      id: `account-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      email,
      username,
      createdAt: new Date(),
      deviceId: this.getOrCreateDeviceId(),
      devices: [
        {
          id: this.getOrCreateDeviceId(),
          name: this.getDeviceName(),
          lastSeen: new Date(),
        },
      ],
    };

    // Generate encryption key from password
    const salt = CryptoManager.generateSalt();
    const key = await CryptoManager.deriveKeyFromPassword(password, salt);
    const keyId = `key-${account.id}`;

    // Store account and key
    localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
    localStorage.setItem(STORAGE_KEYS.ENCRYPTION_KEY, JSON.stringify({
      keyId,
      salt: Array.from(salt),
      // Note: We don't store the actual key, it's derived from password
    }));

    return account;
  }

  /**
   * Get current account
   */
  static getAccount(): Account | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading account:', error);
      return null;
    }
  }

  /**
   * Check if user has account
   */
  static hasAccount(): boolean {
    return this.getAccount() !== null;
  }

  /**
   * Get or create device ID
   */
  private static getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('odysseyos_device_id');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('odysseyos_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Get device name
   */
  private static getDeviceName(): string {
    if (typeof navigator === 'undefined') return 'Unknown Device';
    
    const platform = navigator.platform || 'Unknown';
    const userAgent = navigator.userAgent || '';
    
    if (userAgent.includes('Mobile')) {
      return 'Mobile Device';
    } else if (userAgent.includes('Tablet')) {
      return 'Tablet';
    } else {
      return platform;
    }
  }

  /**
   * Encrypt and prepare data for cloud sync
   */
  static async encryptForSync(
    data: any,
    password: string
  ): Promise<EncryptedData> {
    const saltData = localStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEY);
    if (!saltData) {
      throw new Error('No encryption key found');
    }

    const { salt } = JSON.parse(saltData);
    const key = await CryptoManager.deriveKeyFromPassword(
      password,
      new Uint8Array(salt)
    );

    const dataString = JSON.stringify(data);
    const encrypted = await CryptoManager.encrypt(dataString, key);
    encrypted.keyId = `key-${this.getAccount()?.id || 'unknown'}`;

    return encrypted;
  }

  /**
   * Decrypt data from cloud sync
   */
  static async decryptFromSync(
    encryptedData: EncryptedData,
    password: string
  ): Promise<any> {
    const saltData = localStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEY);
    if (!saltData) {
      throw new Error('No encryption key found');
    }

    const { salt } = JSON.parse(saltData);
    const key = await CryptoManager.deriveKeyFromPassword(
      password,
      new Uint8Array(salt)
    );

    const decrypted = await CryptoManager.decrypt(encryptedData, key);
    return JSON.parse(decrypted);
  }

  /**
   * Get sync state
   */
  static getSyncState(): SyncState {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_STATE);
      return data
        ? JSON.parse(data)
        : {
            lastSyncTimestamp: 0,
            pendingChanges: [],
            conflicts: [],
          };
    } catch (error) {
      console.error('Error loading sync state:', error);
      return {
        lastSyncTimestamp: 0,
        pendingChanges: [],
        conflicts: [],
      };
    }
  }

  /**
   * Save sync state
   */
  static saveSyncState(state: SyncState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving sync state:', error);
    }
  }

  /**
   * Create backup
   */
  static async createBackup(
    password: string,
    description?: string
  ): Promise<BackupMetadata> {
    const account = this.getAccount();
    if (!account) {
      throw new Error('No account found');
    }

    // Get all story data
    const story = StoryStorage.loadStory();
    const scenes = StoryStorage.loadScenes();
    const characters = StoryStorage.loadCharacters();
    const outline = StoryStorage.loadOutline();

    const backupData = {
      story,
      scenes,
      characters,
      outline,
      accountId: account.id,
      createdAt: new Date().toISOString(),
    };

    // Encrypt backup
    const encrypted = await this.encryptForSync(backupData, password);

    // Create backup metadata
    const backup: BackupMetadata = {
      id: `backup-${Date.now()}`,
      createdAt: new Date(),
      size: JSON.stringify(encrypted).length,
      encrypted: true,
      description,
    };

    // Store backup (in production, this would go to cloud storage)
    const backups = this.getBackups();
    backups.push({
      ...backup,
      data: encrypted,
    });
    localStorage.setItem(STORAGE_KEYS.BACKUP_METADATA, JSON.stringify(backups));

    return backup;
  }

  /**
   * Get all backups
   */
  static getBackups(): Array<BackupMetadata & { data?: EncryptedData }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BACKUP_METADATA);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading backups:', error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  static async restoreBackup(
    backupId: string,
    password: string
  ): Promise<void> {
    const backups = this.getBackups();
    const backup = backups.find((b) => b.id === backupId);

    if (!backup || !backup.data) {
      throw new Error('Backup not found');
    }

    // Decrypt backup
    const decrypted = await this.decryptFromSync(backup.data, password);

    // Restore data
    if (decrypted.story) {
      StoryStorage.saveStory(decrypted.story);
    }
    if (decrypted.scenes) {
      StoryStorage.saveScenes(decrypted.scenes);
    }
    if (decrypted.characters) {
      StoryStorage.saveCharacters(decrypted.characters);
    }
    if (decrypted.outline) {
      StoryStorage.saveOutline(decrypted.outline);
    }
  }
}
