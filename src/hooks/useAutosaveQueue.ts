/**
 * Autosave Queue Hook
 * 
 * React hook that uses the centralized autosave queue
 * Prevents race conditions across components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { autosaveQueue, createDebouncedAutosave } from '@/utils/autosaveQueue';

/**
 * Configuration for autosave queue hook
 */
export interface AutosaveQueueConfig {
  /** Unique key for this autosave operation */
  key: string;
  /** Debounce delay in milliseconds (default: 1000) */
  delay?: number;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
  /** Priority for this save (higher = more important, default: 0) */
  priority?: number;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save completes */
  onSaveComplete?: (success: boolean) => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

/**
 * Autosave queue hook result
 */
export interface AutosaveQueueResult {
  /** Whether a save is currently in progress */
  isSaving: boolean;
  /** Number of saves queued */
  queued: number;
  /** Whether last save was successful */
  lastSaveSuccess: boolean | null;
  /** Last save error */
  lastError: Error | null;
  /** Force immediate save (bypasses debounce) */
  saveNow: () => Promise<void>;
  /** Cancel pending saves */
  cancelPending: () => void;
}

/**
 * React hook for autosave using centralized queue
 * 
 * Prevents race conditions by using a global queue that ensures
 * newest content always wins
 * 
 * Usage:
 * ```typescript
 * const { isSaving } = useAutosaveQueue(data, {
 *   key: 'outline',
 *   saveFn: async (data) => await storage.saveOutline(data),
 *   delay: 1000,
 * });
 * ```
 */
export function useAutosaveQueue<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  config: AutosaveQueueConfig
): AutosaveQueueResult {
  const {
    key,
    delay = 1000,
    enabled = true,
    priority = 0,
    onSaveStart,
    onSaveComplete,
    onSaveError,
  } = config;

  const [status, setStatus] = useState({
    isSaving: false,
    queued: 0,
    lastSaveSuccess: null as boolean | null,
    lastError: null as Error | null,
  });

  const debouncedSaveRef = useRef<((data: T) => void) | null>(null);
  const saveFnRef = useRef(saveFn);

  // Update save function ref when it changes
  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  // Initialize debounced save function
  useEffect(() => {
    debouncedSaveRef.current = createDebouncedAutosave(
      key,
      async (d: T) => {
        onSaveStart?.();
        try {
          await saveFnRef.current(d);
          onSaveComplete?.(true);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          onSaveError?.(err);
          onSaveComplete?.(false);
          throw err;
        }
      },
      delay
    );
  }, [key, delay, onSaveStart, onSaveComplete, onSaveError]);

  // Queue save when data changes
  useEffect(() => {
    if (!enabled || !debouncedSaveRef.current) {
      return;
    }

    debouncedSaveRef.current(data);
  }, [data, enabled]);

  // Poll for status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const queueStatus = autosaveQueue.getStatus(key);
      setStatus({
        isSaving: queueStatus.isSaving,
        queued: queueStatus.queued,
        lastSaveSuccess: queueStatus.lastResult?.success ?? null,
        lastError: queueStatus.lastResult?.error ?? null,
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [key]);

  // Force immediate save
  const saveNow = useCallback(async () => {
    // Cancel any pending debounced saves
    autosaveQueue.cancelPending(key);
    
    // Save immediately with high priority (bypasses debounce)
    try {
      onSaveStart?.();
      await saveFnRef.current(data);
      onSaveComplete?.(true);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onSaveError?.(err);
      onSaveComplete?.(false);
      throw err;
    }
  }, [data, key, onSaveStart, onSaveComplete, onSaveError]);

  // Cancel pending
  const cancelPending = useCallback(() => {
    autosaveQueue.cancelPending(key);
  }, [key]);

  return {
    isSaving: status.isSaving,
    queued: status.queued,
    lastSaveSuccess: status.lastSaveSuccess,
    lastError: status.lastError,
    saveNow,
    cancelPending,
  };
}
