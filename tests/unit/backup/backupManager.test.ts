/**
 * Backup Manager Tests
 * 
 * Tests for backup creation, recovery, and cleanup
 */

import { BackupManager } from '@/lib/storage/backupManager';
import { setupLocalStorageMock, clearAllMocks } from '../../helpers/testUtils';
import { createMockStory } from '../../helpers/testFactories';
import { serializeWithDates } from '@/utils/dateSerialization';

describe('BackupManager', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    clearAllMocks();
  });

  afterEach(() => {
    clearAllMocks();
  });

  describe('Backup Creation', () => {
    it('should create backup before save', () => {
      const data = [createMockStory()];
      BackupManager.createBackup(data, 'test_key');

      const backup = BackupManager.getLatestBackup('test_key');
      expect(backup).toBeDefined();
      expect(Array.isArray(backup)).toBe(true);
      expect((backup as any[]).length).toBe(1);
    });

    it('should preserve Date objects in backup', () => {
      const story = createMockStory();
      const data = [story];

      BackupManager.createBackup(data, 'test_key');
      const backup = BackupManager.getLatestBackup('test_key') as any[];

      expect(backup[0].version.createdAt).toBeInstanceOf(Date);
      expect(backup[0].version.updatedAt).toBeInstanceOf(Date);
    });

    it('should create backup with timestamp', () => {
      const data = [createMockStory()];
      BackupManager.createBackup(data, 'test_key');

      const backup = BackupManager.getLatestBackup('test_key');
      expect(backup).toBeDefined();
    });
  });

  describe('Backup Recovery', () => {
    it('should recover from corrupted JSON', () => {
      // Create valid backup
      const original = [createMockStory()];
      BackupManager.createBackup(original, 'test_key');

      // Corrupt main data
      localStorage.setItem('test_key', 'invalid json{');

      // Restore
      const restored = BackupManager.restoreFromBackup('test_key');
      expect(restored).toBe(true);

      const restoredData = localStorage.getItem('test_key');
      expect(restoredData).toBe(serializeWithDates(original));
    });

    it('should handle missing backup gracefully', () => {
      localStorage.setItem('test_key', 'invalid json');
      // Clear backups
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('_backup_')) {
          localStorage.removeItem(key);
        }
      }

      const restored = BackupManager.restoreFromBackup('test_key');
      expect(restored).toBe(false);
    });

    it('should restore latest backup when multiple exist', () => {
      const data1 = [createMockStory({ id: 'story-1' as any })];
      const data2 = [createMockStory({ id: 'story-2' as any })];

      BackupManager.createBackup(data1, 'test_key');
      // Wait a bit to ensure different timestamp
      jest.advanceTimersByTime(100);
      BackupManager.createBackup(data2, 'test_key');

      const latest = BackupManager.getLatestBackup('test_key') as any[];
      expect(latest[0].id).toBe('story-2');
    });
  });

  describe('Backup Cleanup', () => {
    it('should keep only last 10 backups', () => {
      // Create 15 backups
      for (let i = 0; i < 15; i++) {
        BackupManager.createBackup([createMockStory({ id: `story-${i}` as any })], 'test_key');
        jest.advanceTimersByTime(100);
      }

      // Count backups
      let backupCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('test_key_backup_')) {
          backupCount++;
        }
      }

      expect(backupCount).toBeLessThanOrEqual(10);
    });
  });
});
