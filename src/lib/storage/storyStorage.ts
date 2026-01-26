'use client';

import { Story, Scene, Character } from '@/types/story';
import { StoryOutline as StoryOutline } from '@/types/outline';

const STORAGE_KEYS = {
  STORY: 'odysseyos_story',
  OUTLINE: 'odysseyos_outline',
  CHARACTERS: 'odysseyos_characters',
  SCENES: 'odysseyos_scenes',
  SETTINGS: 'odysseyos_settings',
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
}
