/**
 * Backup Manager
 * 
 * Provides backup and recovery for localStorage data
 * Prevents data loss from corruption or quota issues
 * FIXED: Proper date serialization/deserialization
 */

import {
  serializeWithDates,
  deserializeWithDates,
  normalizeDatesInObject,
} from '@/utils/dateSerialization';

/**
 * Backup metadata
 */
interface BackupMetadata {
  key: string;
  timestamp: number;
  size: number;
}

/**
 * Backup Manager for localStorage data
 */
export class BackupManager {
  private static readonly BACKUP_INTERVAL_MS = 30000; // 30 seconds
  private static readonly MAX_BACKUPS = 10;
  private static readonly BACKUP_PREFIX = '_backup_';

  /**
   * Create a backup of data
   */
  static createBackup(data: unknown, baseKey: string): void {
    try {
      const timestamp = Date.now();
      const backupKey = `${baseKey}${this.BACKUP_PREFIX}${timestamp}`;
      // FIXED: Serialize with date handling
      const jsonString = serializeWithDates(data);
      const size = new Blob([jsonString]).size;

      // Check if we have space
      if (!this.hasSpace(size)) {
        // Clean old backups to make space
        this.cleanOldBackups(baseKey);
      }

      localStorage.setItem(backupKey, jsonString);
      
      // Store metadata
      const metadata: BackupMetadata = {
        key: backupKey,
        timestamp,
        size,
      };
      this.saveBackupMetadata(baseKey, metadata);
    } catch (error) {
      console.error('Failed to create backup:', error);
      // Don't throw - backup failure shouldn't break main operation
    }
  }

  /**
   * Get latest backup
   */
  static getLatestBackup(baseKey: string): unknown | null {
    try {
      const backups = this.getAllBackups(baseKey);
      if (backups.length === 0) {
        return null;
      }

      // Get most recent backup
      const latest = backups.sort((a, b) => b.timestamp - a.timestamp)[0];
      const backupData = localStorage.getItem(latest.key);
      
      if (!backupData) {
        return null;
      }

      // FIXED: Deserialize with date handling
      const deserialized = deserializeWithDates(backupData);
      // Normalize dates in case some weren't properly serialized
      return normalizeDatesInObject(deserialized, [
        'createdAt',
        'updatedAt',
        'computedAt',
        'timestamp',
      ]);
    } catch (error) {
      console.error('Failed to get backup:', error);
      return null;
    }
  }

  /**
   * Restore from latest backup
   */
  static restoreFromBackup(baseKey: string): boolean {
    try {
      const backup = this.getLatestBackup(baseKey);
      if (!backup) {
        return false;
      }

      // FIXED: Restore with date serialization
      localStorage.setItem(baseKey, serializeWithDates(backup));
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Get all backups for a key
   */
  private static getAllBackups(baseKey: string): BackupMetadata[] {
    const backups: BackupMetadata[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`${baseKey}${this.BACKUP_PREFIX}`)) {
          const metadata = this.getBackupMetadata(key);
          if (metadata) {
            backups.push(metadata);
          }
        }
      }
    } catch (error) {
      console.error('Error getting backups:', error);
    }

    return backups;
  }

  /**
   * Clean old backups, keeping only the most recent N
   */
  private static cleanOldBackups(baseKey: string): void {
    try {
      const backups = this.getAllBackups(baseKey);
      
      if (backups.length <= this.MAX_BACKUPS) {
        return;
      }

      // Sort by timestamp (oldest first)
      const sorted = backups.sort((a, b) => a.timestamp - b.timestamp);
      
      // Delete oldest backups
      const toDelete = sorted.slice(0, backups.length - this.MAX_BACKUPS);
      toDelete.forEach(backup => {
        localStorage.removeItem(backup.key);
        this.removeBackupMetadata(backup.key);
      });
    } catch (error) {
      console.error('Error cleaning backups:', error);
    }
  }

  /**
   * Check if we have space for backup
   */
  private static hasSpace(size: number): boolean {
    try {
      // Try to estimate available space
      // This is approximate - browsers don't expose exact quota
      const testKey = '_space_test';
      localStorage.setItem(testKey, 'x'.repeat(Math.min(size, 1024)));
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save backup metadata
   */
  private static saveBackupMetadata(baseKey: string, metadata: BackupMetadata): void {
    try {
      const metadataKey = `${baseKey}_backup_metadata`;
      const existing = this.getBackupMetadataList(baseKey);
      existing.push(metadata);
      localStorage.setItem(metadataKey, JSON.stringify(existing));
    } catch {
      // Ignore metadata errors
    }
  }

  /**
   * Get backup metadata
   */
  private static getBackupMetadata(key: string): BackupMetadata | null {
    try {
      const baseKey = key.split(this.BACKUP_PREFIX)[0];
      const metadataList = this.getBackupMetadataList(baseKey);
      return metadataList.find(m => m.key === key) || null;
    } catch {
      return null;
    }
  }

  /**
   * Get backup metadata list
   */
  private static getBackupMetadataList(baseKey: string): BackupMetadata[] {
    try {
      const metadataKey = `${baseKey}_backup_metadata`;
      const stored = localStorage.getItem(metadataKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Remove backup metadata
   */
  private static removeBackupMetadata(key: string): void {
    try {
      const baseKey = key.split(this.BACKUP_PREFIX)[0];
      const metadataList = this.getBackupMetadataList(baseKey);
      const filtered = metadataList.filter(m => m.key !== key);
      const metadataKey = `${baseKey}_backup_metadata`;
      localStorage.setItem(metadataKey, JSON.stringify(filtered));
    } catch {
      // Ignore errors
    }
  }

  /**
   * Clear all backups for a key
   */
  static clearBackups(baseKey: string): void {
    try {
      const backups = this.getAllBackups(baseKey);
      backups.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
      localStorage.removeItem(`${baseKey}_backup_metadata`);
    } catch (error) {
      console.error('Error clearing backups:', error);
    }
  }
}
