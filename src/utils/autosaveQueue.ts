/**
 * Autosave Queue Manager
 * 
 * Centralized queue for autosave operations
 * Prevents race conditions across multiple components
 * Ensures newest content always wins
 */

/**
 * Queued save operation
 */
interface QueuedSave<T> {
  id: string;
  data: T;
  timestamp: number;
  saveFn: (data: T) => Promise<void>;
  priority: number; // Higher = more important
}

/**
 * Save operation result
 */
interface SaveResult {
  success: boolean;
  error?: Error;
  timestamp: number;
}

/**
 * Global autosave queue manager
 * Coordinates saves across all components to prevent race conditions
 */
class AutosaveQueue {
  private queues: Map<string, QueuedSave<unknown>[]> = new Map();
  private activeSaves: Map<string, Promise<SaveResult>> = new Map();
  private saveResults: Map<string, SaveResult> = new Map();

  /**
   * Queue a save operation
   * 
   * @param key Unique key for this save operation (e.g., 'outline', 'characters')
   * @param data Data to save
   * @param saveFn Function to perform the save
   * @param priority Priority (higher = more important, default: 0)
   */
  async queueSave<T>(
    key: string,
    data: T,
    saveFn: (data: T) => Promise<void>,
    priority: number = 0
  ): Promise<void> {
    const timestamp = Date.now();
    const saveId = `${key}_${timestamp}`;

    // Get or create queue for this key
    if (!this.queues.has(key)) {
      this.queues.set(key, []);
    }

    const queue = this.queues.get(key)!;

    // Add to queue
    const queuedSave: QueuedSave<unknown> = {
      id: saveId,
      data,
      timestamp,
      saveFn: saveFn as (data: unknown) => Promise<void>,
      priority,
    };

    queue.push(queuedSave);

    // Sort by priority (higher first), then by timestamp (newer first)
    queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return b.timestamp - a.timestamp; // Newer first
    });

    // If no active save for this key, start processing
    if (!this.activeSaves.has(key)) {
      this.processQueue(key);
    }
  }

  /**
   * Process the queue for a key
   * Only processes the newest/highest priority save
   */
  private async processQueue(key: string): Promise<void> {
    const queue = this.queues.get(key);
    if (!queue || queue.length === 0) {
      this.activeSaves.delete(key);
      return;
    }

    // Get the highest priority/newest save
    const save = queue.shift()!;

    // Clear any older saves from queue (they're stale)
    // Keep only saves that are newer than this one
    const remainingSaves = queue.filter(s => s.timestamp > save.timestamp);
    this.queues.set(key, remainingSaves);

    // Execute save
    const savePromise = this.executeSave(save);
    this.activeSaves.set(key, savePromise);

    try {
      const result = await savePromise;
      this.saveResults.set(save.id, result);

      // Process next item in queue if any
      const queue = this.queues.get(key);
      if (queue && queue.length > 0) {
        // Small delay to prevent overwhelming the system
        setTimeout(() => {
          this.processQueue(key);
        }, 50);
      } else {
        this.activeSaves.delete(key);
      }
    } catch (error) {
      this.activeSaves.delete(key);
      // Continue processing queue even on error
      const queue = this.queues.get(key);
      if (queue && queue.length > 0) {
        this.processQueue(key);
      }
    }
  }

  /**
   * Execute a save operation
   */
  private async executeSave(save: QueuedSave<unknown>): Promise<SaveResult> {
    try {
      await save.saveFn(save.data);
      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Cancel pending saves for a key
   */
  cancelPending(key: string): void {
    this.queues.delete(key);
    // Note: Active saves continue, but queued saves are cancelled
  }

  /**
   * Get save status for a key
   */
  getStatus(key: string): {
    isSaving: boolean;
    queued: number;
    lastResult: SaveResult | null;
  } {
    return {
      isSaving: this.activeSaves.has(key),
      queued: this.queues.get(key)?.length ?? 0,
      lastResult: this.getLastResult(key),
    };
  }

  /**
   * Get last save result for a key
   */
  private getLastResult(key: string): SaveResult | null {
    // Find most recent result for this key
    let latest: SaveResult | null = null;
    let latestTimestamp = 0;

    for (const [saveId, result] of this.saveResults.entries()) {
      if (saveId.startsWith(key + '_') && result.timestamp > latestTimestamp) {
        latest = result;
        latestTimestamp = result.timestamp;
      }
    }

    return latest;
  }

  /**
   * Clear all queues (for testing/cleanup)
   */
  clear(): void {
    this.queues.clear();
    this.activeSaves.clear();
    this.saveResults.clear();
  }
}

// Global queue instance
export const autosaveQueue = new AutosaveQueue();

/**
 * Debounced autosave with queue integration
 */
export function createDebouncedAutosave<T>(
  key: string,
  saveFn: (data: T) => Promise<void>,
  delay: number = 1000
): (data: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestData: T | null = null;

  return (data: T) => {
    latestData = data;

    // Cancel previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      if (latestData !== null) {
        autosaveQueue.queueSave(key, latestData, saveFn);
        latestData = null;
      }
      timeoutId = null;
    }, delay);
  };
}
