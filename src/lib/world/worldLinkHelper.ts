/**
 * World Link Helper
 * 
 * Utilities for finding and displaying world element links in scenes and characters
 */

import { StoryStorage } from '@/lib/storage/storyStorage';
import type { WorldElement } from '@/types/world';
import type { Scene, Character } from '@/types/story';

/**
 * Get world elements linked to a scene
 */
export function getWorldElementsForScene(scene: Scene): WorldElement[] {
  const story = StoryStorage.loadStory();
  const worldElements = (story as any)?.worldElements || [];
  
  return worldElements.filter((element: WorldElement) => 
    element.relatedScenes?.includes(scene.id)
  );
}

/**
 * Get world elements linked to a character
 */
export function getWorldElementsForCharacter(character: Character): WorldElement[] {
  const story = StoryStorage.loadStory();
  const worldElements = (story as any)?.worldElements || [];
  
  return worldElements.filter((element: WorldElement) => 
    element.relatedCharacters?.includes(character.id)
  );
}

/**
 * Find world element by name (for location/POV matching)
 */
export function findWorldElementByName(name: string, type?: WorldElement['type']): WorldElement | null {
  const story = StoryStorage.loadStory();
  const worldElements = (story as any)?.worldElements || [];
  
  const matching = worldElements.filter((element: WorldElement) => {
    const nameMatch = element.name.toLowerCase() === name.toLowerCase();
    return type ? nameMatch && element.type === type : nameMatch;
  });
  
  return matching.length > 0 ? matching[0] : null;
}

/**
 * Get all world elements
 */
export function getAllWorldElements(): WorldElement[] {
  const story = StoryStorage.loadStory();
  return (story as any)?.worldElements || [];
}
