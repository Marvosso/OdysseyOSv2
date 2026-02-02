/**
 * Background Sync Manager
 * 
 * Manages background sync for story data when offline
 */

import { StoryStorage } from '@/lib/storage/storyStorage';
import { PWAManager } from './pwaManager';

interface SyncItem {
  id: string;
  type: 'story' | 'character' | 'scene' | 'outline';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export class BackgroundSyncManager {
  private static readonly SYNC_QUEUE_KEY = 'odysseyos-sync-queue';

  /**
   * Add item to sync queue
   */
  static async queueSync(item: Omit<SyncItem, 'id' | 'timestamp'>): Promise<void> {
    const syncItem: SyncItem = {
      ...item,
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
    };

    const queue = this.getQueue();
    queue.push(syncItem);
    this.saveQueue(queue);

    // Request background sync
    await PWAManager.requestBackgroundSync('sync-story-data');
  }

  /**
   * Get sync queue
   */
  static getQueue(): SyncItem[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(this.SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[BackgroundSync] Error loading queue:', error);
      return [];
    }
  }

  /**
   * Save sync queue
   */
  private static saveQueue(queue: SyncItem[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('[BackgroundSync] Error saving queue:', error);
    }
  }

  /**
   * Process sync queue (called by service worker)
   */
  static async processQueue(): Promise<void> {
    const queue = this.getQueue();
    const processed: string[] = [];

    for (const item of queue) {
      try {
        await this.processSyncItem(item);
        processed.push(item.id);
      } catch (error) {
        console.error('[BackgroundSync] Error processing item:', error);
        // Keep item in queue for retry
      }
    }

    // Remove processed items
    const remaining = queue.filter((item) => !processed.includes(item.id));
    this.saveQueue(remaining);
  }

  /**
   * Process a single sync item
   */
  private static async processSyncItem(item: SyncItem): Promise<void> {
    // In a real app, this would sync to a backend API
    // For now, we'll just log it
    
    console.log('[BackgroundSync] Processing:', item.type, item.action);

    // Simulate API call
    // await fetch('/api/sync', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(item),
    // });

    // For demo, we'll just mark as synced
    // In production, this would actually sync to your backend
  }

  /**
   * Queue story save
   */
  static async queueStorySave(story: any): Promise<void> {
    await this.queueSync({
      type: 'story',
      action: 'update',
      data: story,
    });
  }

  /**
   * Queue character save
   */
  static async queueCharacterSave(characters: any[]): Promise<void> {
    await this.queueSync({
      type: 'character',
      action: 'update',
      data: characters,
    });
  }

  /**
   * Queue scene save
   */
  static async queueSceneSave(scenes: any[]): Promise<void> {
    await this.queueSync({
      type: 'scene',
      action: 'update',
      data: scenes,
    });
  }
}
