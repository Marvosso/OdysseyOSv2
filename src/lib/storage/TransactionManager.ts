/**
 * Transaction Manager
 * 
 * Manages transactions for story persistence
 * Provides atomic operations, rollback, and versioning
 */

import type {
  ITransaction,
  TransactionId,
  TransactionOperation,
  TransactionResult,
  TransactionSnapshot,
  TransactionMetadata,
  TransactionStatus,
} from './transaction.interface';
import type { Story, StoryId } from '@/types/models';
import type { IStoryStorage } from './storage.interface';
import { createStoryId } from '@/types/models';

/**
 * Create transaction ID
 */
function createTransactionId(): TransactionId {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(7)}` as TransactionId;
}

/**
 * Generate version tag
 */
function generateVersionTag(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `v${timestamp}_${random}`;
}

/**
 * Transaction implementation
 * 
 * @public
 */
export class Transaction implements ITransaction {
  private id: TransactionId;
  private operations: TransactionOperation[] = [];
  private snapshots: TransactionSnapshot[] = [];
  private status: TransactionStatus = 'pending';
  private version: string;
  private createdAt: Date;
  private committedAt?: Date;
  private error?: string;

  constructor(
    private storage: IStoryStorage,
    private onCommit?: (transaction: TransactionMetadata) => void,
    private onRollback?: (transaction: TransactionMetadata) => void
  ) {
    this.id = createTransactionId();
    this.version = generateVersionTag();
    this.createdAt = new Date();
  }

  /**
   * Add operation to transaction
   */
  addOperation(operation: TransactionOperation): void {
    if (this.status !== 'pending') {
      throw new Error(`Cannot add operation to ${this.status} transaction`);
    }

    this.operations.push(operation);
  }

  /**
   * Create snapshot for rollback
   */
  private async createSnapshot(storyId: StoryId): Promise<TransactionSnapshot> {
    const result = await this.storage.getStory(storyId);
    return {
      storyId,
      story: result.success && result.data ? result.data : null,
      timestamp: new Date(),
    };
  }

  /**
   * Create snapshots for all affected stories
   */
  private async createSnapshots(): Promise<void> {
    const storyIds = new Set<StoryId>();
    
    for (const op of this.operations) {
      if (op.storyId) {
        storyIds.add(op.storyId);
      }
      if (op.story) {
        storyIds.add(op.story.id);
      }
    }

    for (const storyId of storyIds) {
      const snapshot = await this.createSnapshot(storyId);
      this.snapshots.push(snapshot);
    }
  }

  /**
   * Commit transaction (atomic)
   */
  async commit(): Promise<TransactionResult> {
    if (this.status !== 'pending') {
      return {
        success: false,
        transaction: this.getMetadata(),
        error: `Cannot commit ${this.status} transaction`,
      };
    }

    try {
      // Create snapshots for rollback
      await this.createSnapshots();

      // Execute all operations
      const results: Story[] = [];
      const executedOperations: TransactionOperation[] = [];

      for (const operation of this.operations) {
        let result;

        switch (operation.type) {
          case 'create':
            if (!operation.story) {
              throw new Error('Create operation requires story data');
            }
            result = await this.storage.createStory(operation.story);
            if (!result.success) {
              throw new Error(result.error || 'Create failed');
            }
            if (result.data) {
              results.push(result.data);
            }
            executedOperations.push(operation);
            break;

          case 'update':
            if (!operation.storyId || !operation.updates) {
              throw new Error('Update operation requires storyId and updates');
            }
            result = await this.storage.updateStory(operation.storyId, operation.updates);
            if (!result.success) {
              throw new Error(result.error || 'Update failed');
            }
            if (result.data) {
              results.push(result.data);
            }
            executedOperations.push(operation);
            break;

          case 'delete':
            if (!operation.storyId) {
              throw new Error('Delete operation requires storyId');
            }
            result = await this.storage.deleteStory(operation.storyId);
            if (!result.success) {
              throw new Error(result.error || 'Delete failed');
            }
            executedOperations.push(operation);
            break;
        }
      }

      // All operations succeeded - mark as committed
      this.status = 'committed';
      this.committedAt = new Date();
      this.onCommit?.(this.getMetadata());

      return {
        success: true,
        transaction: this.getMetadata(),
        stories: results,
      };
    } catch (error) {
      // Transaction failed - rollback
      this.status = 'failed';
      this.error = error instanceof Error ? error.message : String(error);

      try {
        await this.rollback();
      } catch (rollbackError) {
        // Rollback also failed - critical error
        console.error('Rollback failed:', rollbackError);
        this.error += ` (Rollback also failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)})`;
      }

      return {
        success: false,
        transaction: this.getMetadata(),
        error: this.error,
      };
    }
  }

  /**
   * Rollback transaction
   */
  async rollback(): Promise<void> {
    if (this.status === 'rolled-back') {
      return; // Already rolled back
    }

    try {
      // Restore from snapshots
      for (const snapshot of this.snapshots) {
        if (snapshot.story === null) {
          // Story didn't exist before - delete it if it exists now
          const current = await this.storage.getStory(snapshot.storyId);
          if (current.success && current.data) {
            await this.storage.deleteStory(snapshot.storyId);
          }
        } else {
          // Restore original story
          const current = await this.storage.getStory(snapshot.storyId);
          if (current.success) {
            if (current.data) {
              // Story exists - restore to original
              await this.storage.updateStory(snapshot.storyId, snapshot.story);
            } else {
              // Story was deleted - recreate it
              await this.storage.createStory(snapshot.story);
            }
          }
        }
      }

      this.status = 'rolled-back';
      this.onRollback?.(this.getMetadata());
    } catch (error) {
      console.error('Rollback error:', error);
      throw new Error(
        `Rollback failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get transaction metadata
   */
  getMetadata(): TransactionMetadata {
    return {
      id: this.id,
      status: this.status,
      operations: this.operations as readonly TransactionOperation[],
      snapshots: this.snapshots as readonly TransactionSnapshot[],
      version: this.version,
      createdAt: this.createdAt,
      committedAt: this.committedAt,
      error: this.error,
    };
  }

  /**
   * Check if transaction is active
   */
  isActive(): boolean {
    return this.status === 'pending';
  }
}

/**
 * Transaction Manager
 * 
 * Factory and manager for transactions
 */
export class TransactionManager {
  /**
   * Create a new transaction
   */
  static create(
    storage: IStoryStorage,
    callbacks?: {
      onCommit?: (transaction: TransactionMetadata) => void;
      onRollback?: (transaction: TransactionMetadata) => void;
    }
  ): Transaction {
    return new Transaction(storage, callbacks?.onCommit, callbacks?.onRollback);
  }

  /**
   * Execute a transaction with automatic commit/rollback
   * 
   * Usage:
   * ```typescript
   * const result = await TransactionManager.execute(storage, (txn) => {
   *   txn.addOperation({ type: 'update', storyId, updates });
   *   txn.addOperation({ type: 'create', story: newStory });
   * });
   * ```
   */
  static async execute(
    storage: IStoryStorage,
    operations: (txn: Transaction) => void | Promise<void>,
    callbacks?: {
      onCommit?: (transaction: TransactionMetadata) => void;
      onRollback?: (transaction: TransactionMetadata) => void;
    }
  ): Promise<TransactionResult> {
    const txn = new Transaction(storage, callbacks?.onCommit, callbacks?.onRollback);

    try {
      // Add operations
      await operations(txn);

      // Commit transaction
      return await txn.commit();
    } catch (error) {
      // Operations setup failed - rollback if needed
      if (txn.isActive()) {
        try {
          await txn.rollback();
        } catch (rollbackError) {
          console.error('Rollback error:', rollbackError);
        }
      }

      return {
        success: false,
        transaction: txn.getMetadata(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
