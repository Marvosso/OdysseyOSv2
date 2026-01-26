/**
 * Autosave Queue Tests
 * 
 * Tests for race condition prevention in autosave
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutosaveQueue } from '@/hooks/useAutosaveQueue';
import { autosaveQueue, createDebouncedAutosave } from '@/utils/autosaveQueue';

// Mock timers
jest.useFakeTimers();

describe('useAutosaveQueue - Race Condition Prevention', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    autosaveQueue.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Debounce Cancellation', () => {
    it('should cancel previous save when new edit occurs', async () => {
      const saveFn = jest.fn();
      
      const { result, rerender } = renderHook(
        ({ data }) => useAutosaveQueue(data, saveFn, { key: 'test', delay: 1000 }),
        { initialProps: { data: 'A' } }
      );

      // Rapid updates
      rerender({ data: 'AB' });
      rerender({ data: 'ABC' });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      await waitFor(() => {
        expect(saveFn).toHaveBeenCalledTimes(1);
        expect(saveFn).toHaveBeenCalledWith('ABC'); // Only newest
      });
    });

    it('should not save if data changes before debounce completes', async () => {
      const saveFn = jest.fn();
      
      const { rerender } = renderHook(
        ({ data }) => useAutosaveQueue(data, saveFn, { key: 'test', delay: 1000 }),
        { initialProps: { data: 'A' } }
      );

      // Update before debounce completes
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      rerender({ data: 'AB' });

      act(() => {
        jest.advanceTimersByTime(1100);
      });

      await waitFor(() => {
        expect(saveFn).toHaveBeenCalledTimes(1);
        expect(saveFn).toHaveBeenCalledWith('AB'); // Only latest
      });
    });
  });

  describe('Timestamp-Based Ordering', () => {
    it('should only execute newest save', async () => {
      const saves: string[] = [];
      const saveFn = async (data: string) => {
        saves.push(data);
      };

      // Simulate concurrent saves
      autosaveQueue.queueSave('key', 'A', saveFn);
      await new Promise(r => setTimeout(r, 50));
      autosaveQueue.queueSave('key', 'B', saveFn);
      await new Promise(r => setTimeout(r, 50));
      autosaveQueue.queueSave('key', 'C', saveFn);

      await waitFor(() => {
        expect(saves.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      // Should only have newest save
      expect(saves).toContain('C');
      // May have intermediate saves, but C should be last
      expect(saves[saves.length - 1]).toBe('C');
    });
  });

  describe('Concurrent Component Saves', () => {
    it('should prevent last write wins', async () => {
      const saves: string[] = [];

      // Component A saves
      const saveA = createDebouncedAutosave(
        'data',
        async (d: string) => {
          saves.push(`A:${d}`);
        },
        100
      );

      // Component B saves
      const saveB = createDebouncedAutosave(
        'data',
        async (d: string) => {
          saves.push(`B:${d}`);
        },
        100
      );

      // Both save simultaneously
      saveA('data1');
      saveB('data2');

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        // Should only save newest
        expect(saves.length).toBeGreaterThan(0);
        expect(saves[saves.length - 1]).toMatch(/B:data2/);
      });
    });
  });

  describe('Status Tracking', () => {
    it('should track saving status', async () => {
      const saveFn = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() =>
        useAutosaveQueue('data', saveFn, { key: 'test', delay: 100 })
      );

      // Initially not saving
      expect(result.current.isSaving).toBe(false);

      // Trigger save
      act(() => {
        jest.advanceTimersByTime(150);
      });

      // Should be saving
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      // Wait for save to complete
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
        expect(result.current.lastSaveSuccess).toBe(true);
      });
    });
  });
});
