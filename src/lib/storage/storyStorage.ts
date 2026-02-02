'use client';

import { Story, Scene, Character } from '@/types/story';
import { StoryOutline as StoryOutline } from '@/types/outline';

const STORAGE_KEYS = {
  STORY: 'odysseyos_story',
  OUTLINE: 'odysseyos_outline',
  CHARACTERS: 'odysseyos_characters',
  SCENES: 'odysseyos_scenes',
  SETTINGS: 'odysseyos_settings',
  GUEST_ID: 'odysseyos_guest_id',
};

export interface SavedData {
  story: Story | null;
  outline: StoryOutline | null;
  characters: Character[];
  scenes: Scene[];
  lastSaved: Date;
}

export class StoryStorage {
  // Save story data
  static saveStory(story: Story): void {
    try {
      const data = this.loadAll();
      data.story = story;
      data.lastSaved = new Date();
      localStorage.setItem(STORAGE_KEYS.STORY, JSON.stringify(story));
      this.saveAll(data);
      
      // Queue for background sync if offline
      if (typeof window !== 'undefined' && !navigator.onLine) {
        import('@/lib/pwa/backgroundSync').then(({ BackgroundSyncManager }) => {
          BackgroundSyncManager.queueStorySave(story);
        });
      }
    } catch (error) {
      console.error('Error saving story:', error);
    }
  }

  // Save outline
  static saveOutline(outline: StoryOutline): void {
    try {
      const data = this.loadAll();
      data.outline = outline;
      data.lastSaved = new Date();
      localStorage.setItem(STORAGE_KEYS.OUTLINE, JSON.stringify(outline));
      this.saveAll(data);
    } catch (error) {
      console.error('Error saving outline:', error);
    }
  }

  // Save characters
  static saveCharacters(characters: Character[]): void {
    try {
      const data = this.loadAll();
      data.characters = characters;
      data.lastSaved = new Date();
      localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
      this.saveAll(data);
    } catch (error) {
      console.error('Error saving characters:', error);
    }
  }

  // Save scenes
  static saveScenes(scenes: Scene[]): void {
    try {
      const data = this.loadAll();
      data.scenes = scenes;
      data.lastSaved = new Date();
      localStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(scenes));
      this.saveAll(data);
    } catch (error) {
      console.error('Error saving scenes:', error);
    }
  }

  // Load all data
  static loadAll(): SavedData {
    try {
      const story = localStorage.getItem(STORAGE_KEYS.STORY);
      const outline = localStorage.getItem(STORAGE_KEYS.OUTLINE);
      const characters = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
      const scenes = localStorage.getItem(STORAGE_KEYS.SCENES);

      return {
        story: story ? JSON.parse(story) : null,
        outline: outline ? JSON.parse(outline) : null,
        characters: characters ? JSON.parse(characters) : [],
        scenes: scenes ? JSON.parse(scenes) : [],
        lastSaved: new Date(),
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return {
        story: null,
        outline: null,
        characters: [],
        scenes: [],
        lastSaved: new Date(),
      };
    }
  }

  // Load individual items
  static loadStory(): Story | null {
    try {
      const story = localStorage.getItem(STORAGE_KEYS.STORY);
      return story ? JSON.parse(story) : null;
    } catch {
      return null;
    }
  }

  static loadOutline(): StoryOutline | null {
    try {
      const outline = localStorage.getItem(STORAGE_KEYS.OUTLINE);
      return outline ? JSON.parse(outline) : null;
    } catch {
      return null;
    }
  }

  static loadCharacters(): Character[] {
    try {
      const characters = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
      return characters ? JSON.parse(characters) : [];
    } catch {
      return [];
    }
  }

  static loadScenes(): Scene[] {
    try {
      const scenes = localStorage.getItem(STORAGE_KEYS.SCENES);
      return scenes ? JSON.parse(scenes) : [];
    } catch {
      return [];
    }
  }

  // Clear all data
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Export data as JSON
  static exportAsJSON(): string {
    const data = this.loadAll();
    return JSON.stringify(data, null, 2);
  }

  // Import data from JSON
  static importFromJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.story) this.saveStory(data.story);
      if (data.outline) this.saveOutline(data.outline);
      if (data.characters) this.saveCharacters(data.characters);
      if (data.scenes) this.saveScenes(data.scenes);
      return true;
    } catch {
      return false;
    }
  }

  private static saveAll(data: SavedData): void {
    localStorage.setItem('odysseyos_all', JSON.stringify({
      lastSaved: data.lastSaved,
    }));
  }

  // Check if there's saved data
  static hasSavedData(): boolean {
    const story = localStorage.getItem(STORAGE_KEYS.STORY);
    const outline = localStorage.getItem(STORAGE_KEYS.OUTLINE);
    const characters = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
    const scenes = localStorage.getItem(STORAGE_KEYS.SCENES);
    return !!(story || outline || characters || scenes);
  }

  // Get last saved time
  static getLastSaved(): Date | null {
    try {
      const all = localStorage.getItem('odysseyos_all');
      return all ? new Date(JSON.parse(all).lastSaved) : null;
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Guest Session Management
  // ============================================================================

  /**
   * Generate a random 8-character guest ID
   */
  static generateGuestId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get existing guest session ID or create a new one
   */
  static getOrCreateGuestSession(): string {
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.GUEST_ID);
      if (existing) {
        return existing;
      }

      const newId = this.generateGuestId();
      localStorage.setItem(STORAGE_KEYS.GUEST_ID, newId);
      return newId;
    } catch (error) {
      console.error('Error managing guest session:', error);
      // Fallback: generate ID without storing (for privacy mode)
      return this.generateGuestId();
    }
  }

  /**
   * Get current guest session ID (returns null if not set)
   */
  static getGuestSessionId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.GUEST_ID);
    } catch {
      return null;
    }
  }

  /**
   * Export all guest session data as JSON for backup
   */
  static exportGuestData(): string {
    const data = this.loadAll();
    const guestId = this.getGuestSessionId();
    
    const exportData = {
      guestId: guestId || 'unknown',
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        story: data.story,
        outline: data.outline,
        characters: data.characters,
        scenes: data.scenes,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import guest session data from JSON backup
   * @param guestId - Guest ID to restore (optional, will use from data if not provided)
   * @param jsonString - JSON string containing the backup data
   */
  static importGuestData(guestId: string | null, jsonString: string): { success: boolean; error?: string } {
    try {
      const importData = JSON.parse(jsonString);
      
      // Validate structure
      if (!importData.data) {
        return { success: false, error: 'Invalid backup format: missing data field' };
      }

      const data = importData.data;

      // Restore guest ID if provided
      const restoreId = guestId || importData.guestId;
      if (restoreId) {
        localStorage.setItem(STORAGE_KEYS.GUEST_ID, restoreId);
      }

      // Restore all data
      if (data.story) {
        this.saveStory(data.story);
      }
      if (data.outline) {
        this.saveOutline(data.outline);
      }
      if (data.characters) {
        this.saveCharacters(data.characters);
      }
      if (data.scenes) {
        this.saveScenes(data.scenes);
      }

      // Trigger storage event to notify other components
      window.dispatchEvent(new Event('storage'));

      return { success: true };
    } catch (error) {
      console.error('Error importing guest data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import backup data',
      };
    }
  }

  /**
   * Clear guest session (removes guest ID and all data)
   */
  static clearGuestSession(): void {
    localStorage.removeItem(STORAGE_KEYS.GUEST_ID);
    this.clearAll();
  }
}
