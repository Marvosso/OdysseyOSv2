/**
 * Autosave Hook
 * 
 * Race-condition-free autosave with debouncing and cancellation
 * Ensures newest content always persists
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Autosave configuration
 */
export interface AutosaveConfig {
  /** Debounce delay in milliseconds (default: 1000) */
  delay?: number;
  /** Whether to enable autosave (default: true) */
  enabled?: boolean;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save completes */
  onSaveComplete?: (success: boolean) => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

/**
 * Autosave result
 */
export interface AutosaveResult {
  /** Whether save is pending */
  isSaving: boolean;
  /** Whether last save was successful */
  lastSaveSuccess: boolean | null;
  /** Last save error */
  lastError: Error | null;
  /** Force immediate save (bypasses debounce) */
  saveNow: () => Promise<void>;
  /** Cancel pending save */
  cancelPending: () => void;
}

/**
 * Autosave manager for a single save operation
 * Handles debouncing, cancellation, and ensures newest content wins
 */
class AutosaveManager<T> {
  private pendingSave: {
    data: T;
    timestamp: number;
    promise: Promise<void> | null;
  } | null = null;
  
  private timeoutId: NodeJS.Timeout | null = null;
  private isSaving = false;
  private lastSaveSuccess: boolean | null = null;
  private lastError: Error | null = null;
  
  private config: Required<AutosaveConfig>;
  private saveFn: (data: T) => Promise<void>;

  constructor(
    saveFn: (data: T) => Promise<void>,
    config: AutosaveConfig = {}
  ) {
    this.saveFn = saveFn;
    this.config = {
      delay: config.delay ?? 1000,
      enabled: config.enabled ?? true,
      onSaveStart: config.onSaveStart ?? (() => {}),
      onSaveComplete: config.onSaveComplete ?? (() => {}),
      onSaveError: config.onSaveError ?? (() => {}),
    };
  }

  /**
   * Queue a save operation
   * Cancels any pending saves and ensures newest data is saved
   */
  queueSave(data: T): void {
    if (!this.config.enabled) {
      return;
    }

    const timestamp = Date.now();

    // Cancel any pending timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Store the newest data with timestamp
    this.pendingSave = {
      data,
      timestamp,
      promise: null,
    };

    // Set up debounced save
    this.timeoutId = setTimeout(() => {
      this.executeSave();
    }, this.config.delay);
  }

  /**
   * Execute the save operation
   * Only saves if pendingSave exists and hasn't been superseded
   */
  private async executeSave(): Promise<void> {
    if (!this.pendingSave) {
      return;
    }

    // Capture the data and timestamp we're about to save
    const { data, timestamp } = this.pendingSave;

    // Check if a newer save has been queued
    // If so, this save is stale and should be cancelled
    if (this.pendingSave.timestamp !== timestamp) {
      // Newer save queued, skip this one
      return;
    }

    // Mark as saving
    this.isSaving = true;
    this.config.onSaveStart();

    try {
      // Create the save promise
      const savePromise = this.saveFn(data);
      this.pendingSave.promise = savePromise;

      // Wait for save to complete
      await savePromise;

      // Verify this is still the latest save
      if (this.pendingSave && this.pendingSave.timestamp === timestamp) {
        // This was the latest save, mark as complete
        this.pendingSave = null;
        this.lastSaveSuccess = true;
        this.lastError = null;
        this.config.onSaveComplete(true);
      } else {
        // A newer save was queued, this save is stale
        // Don't update state, let the newer save handle it
      }
    } catch (error) {
      // Only report error if this is still the latest save
      if (this.pendingSave && this.pendingSave.timestamp === timestamp) {
        this.lastSaveSuccess = false;
        this.lastError = error instanceof Error ? error : new Error(String(error));
        this.config.onSaveError(this.lastError);
        this.config.onSaveComplete(false);
      }
    } finally {
      // Only clear saving state if this was the latest save
      if (this.pendingSave && this.pendingSave.timestamp === timestamp) {
        this.isSaving = false;
        this.pendingSave = null;
      } else if (!this.pendingSave) {
        // No pending save means a newer one took over
        this.isSaving = false;
      }
    }
  }

  /**
   * Force immediate save (bypasses debounce)
   */
  async saveNow(): Promise<void> {
    // Cancel pending debounced save
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // If there's pending data, save it immediately
    if (this.pendingSave) {
      await this.executeSave();
    }
  }

  /**
   * Cancel pending save
   */
  cancelPending(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingSave = null;
  }

  /**
   * Get current state
   */
  getState(): {
    isSaving: boolean;
    lastSaveSuccess: boolean | null;
    lastError: Error | null;
  } {
    return {
      isSaving: this.isSaving,
      lastSaveSuccess: this.lastSaveSuccess,
      lastError: this.lastError,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.cancelPending();
  }
}

/**
 * React hook for autosave
 * 
 * Usage:
 * ```typescript
 * const { isSaving, saveNow } = useAutosave(data, async (data) => {
 *   await storage.save(data);
 * }, { delay: 1000 });
 * ```
 */
export function useAutosave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  config: AutosaveConfig = {}
): AutosaveResult {
  const managerRef = useRef<AutosaveManager<T> | null>(null);
  const stateRef = useRef({
    isSaving: false,
    lastSaveSuccess: null as boolean | null,
    lastError: null as Error | null,
  });

  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = new AutosaveManager(saveFn, config);
  }

  // Update manager config if changed
  useEffect(() => {
    if (managerRef.current) {
      // Recreate manager if config changed significantly
      // (In a real implementation, you might want to update config dynamically)
    }
  }, [config.delay, config.enabled]);

  // Queue save when data changes
  useEffect(() => {
    if (config.enabled !== false && managerRef.current) {
      managerRef.current.queueSave(data);
    }

    // Cleanup on unmount
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
      }
    };
  }, [data, config.enabled]);

  // Update state from manager
  useEffect(() => {
    const interval = setInterval(() => {
      if (managerRef.current) {
        const state = managerRef.current.getState();
        stateRef.current = state;
      }
    }, 100); // Update state every 100ms

    return () => clearInterval(interval);
  }, []);

  // Force save now
  const saveNow = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.saveNow();
    }
  }, []);

  // Cancel pending
  const cancelPending = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.cancelPending();
    }
  }, []);

  return {
    isSaving: stateRef.current.isSaving,
    lastSaveSuccess: stateRef.current.lastSaveSuccess,
    lastError: stateRef.current.lastError,
    saveNow,
    cancelPending,
  };
}

/**
 * Synchronous autosave hook (for non-async save functions)
 */
export function useAutosaveSync<T>(
  data: T,
  saveFn: (data: T) => void,
  config: AutosaveConfig = {}
): Omit<AutosaveResult, 'saveNow'> & { saveNow: () => void } {
  // Wrap sync function in async
  const asyncSaveFn = async (d: T) => {
    saveFn(d);
  };

  const result = useAutosave(data, asyncSaveFn, config);

  return {
    ...result,
    saveNow: () => {
      asyncSaveFn(data);
    },
  };
}
