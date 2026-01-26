/**
 * Storage Module Exports
 * 
 * Public API for storage functionality
 */

// Storage interface and types
export type {
  IStoryStorage,
  StorageResult,
  StoryMetadata,
  StorageConfig,
} from './storage.interface';

// Storage adapters
export { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
export { InMemoryAdapter } from './adapters/InMemoryAdapter';
export { CloudAdapter } from './adapters/CloudAdapter';

// Storage manager
export { StoryStorageManager, getStoryStorage } from './StoryStorageManager';

// Transaction system
export type {
  ITransaction,
  TransactionId,
  TransactionOperation,
  TransactionResult,
  TransactionMetadata,
  TransactionSnapshot,
  TransactionStatus,
} from './transaction.interface';

export { Transaction, TransactionManager } from './TransactionManager';
export { TransactionStorageAdapter } from './TransactionStorageAdapter';
export { VersionTracker, versionTracker } from './versionTracker';
export type {
  StoryVersion,
  StoryVersionHistory,
} from './versionTracker';

// Backup and validation
export { BackupManager } from './backupManager';
export { DataValidator } from './dataValidator';
export type { ValidationResult } from './dataValidator';
