/**
 * Transaction Interface
 * 
 * Lightweight transaction system for atomic story persistence
 * Provides rollback, versioning, and atomic operations
 */

import type { Story, StoryId } from '@/types/models';

/**
 * Transaction ID
 */
export type TransactionId = string & { readonly __brand: 'TransactionId' };

/**
 * Transaction status
 */
export type TransactionStatus = 'pending' | 'committed' | 'rolled-back' | 'failed';

/**
 * Transaction operation
 */
export interface TransactionOperation {
  /** Operation type */
  readonly type: 'create' | 'update' | 'delete';
  /** Story ID (if applicable) */
  readonly storyId?: StoryId;
  /** Story data (for create/update) */
  readonly story?: Story;
  /** Updates (for update operations) */
  readonly updates?: Partial<Omit<Story, 'id' | 'version'>>;
}

/**
 * Transaction snapshot (for rollback)
 */
export interface TransactionSnapshot {
  /** Story ID */
  readonly storyId: StoryId;
  /** Story data before transaction */
  readonly story: Story | null; // null if story didn't exist
  /** Timestamp */
  readonly timestamp: Date;
}

/**
 * Transaction metadata
 */
export interface TransactionMetadata {
  /** Transaction ID */
  readonly id: TransactionId;
  /** Status */
  readonly status: TransactionStatus;
  /** Operations in this transaction */
  readonly operations: readonly TransactionOperation[];
  /** Snapshots for rollback */
  readonly snapshots: readonly TransactionSnapshot[];
  /** Version tag */
  readonly version: string;
  /** Created timestamp */
  readonly createdAt: Date;
  /** Committed timestamp (if committed) */
  readonly committedAt?: Date;
  /** Error (if failed) */
  readonly error?: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  /** Whether transaction succeeded */
  readonly success: boolean;
  /** Transaction metadata */
  readonly transaction: TransactionMetadata;
  /** Resulting stories (if successful) */
  readonly stories?: readonly Story[];
  /** Error (if failed) */
  readonly error?: string;
}

/**
 * Transaction interface
 */
export interface ITransaction {
  /**
   * Add operation to transaction
   */
  addOperation(operation: TransactionOperation): void;

  /**
   * Commit transaction (atomic)
   * All operations succeed or all fail
   */
  commit(): Promise<TransactionResult>;

  /**
   * Rollback transaction
   * Reverts all operations
   */
  rollback(): Promise<void>;

  /**
   * Get transaction metadata
   */
  getMetadata(): TransactionMetadata;

  /**
   * Check if transaction is active
   */
  isActive(): boolean;
}
