/**
 * World Linker
 * 
 * Utilities for linking world elements to scenes and characters
 */

import type { WorldElement } from '@/types/world';
import type { Scene, Character } from '@/types/story';
import { StoryStorage } from '@/lib/storage/storyStorage';

export interface LinkableItem {
  id: string;
  name: string;
  type: 'scene' | 'character';
}

/**
 * Get all linkable scenes and characters
 */
export function getLinkableItems(): {
  scenes: LinkableItem[];
  characters: LinkableItem[];
} {
  const data = StoryStorage.loadAll();
  
  const scenes: LinkableItem[] = (data.scenes || []).map(scene => ({
    id: scene.id,
    name: scene.title || 'Untitled Scene',
    type: 'scene' as const,
  }));

  const characters: LinkableItem[] = (data.characters || []).map(character => ({
    id: character.id,
    name: character.name,
    type: 'character' as const,
  }));

  return { scenes, characters };
}

/**
 * Link a world element to scenes or characters
 */
export function linkWorldElement(
  element: WorldElement,
  itemIds: string[],
  itemType: 'scene' | 'character'
): WorldElement {
  if (itemType === 'scene') {
    return {
      ...element,
      relatedScenes: [...new Set([...element.relatedScenes, ...itemIds])],
    };
  } else {
    return {
      ...element,
      relatedCharacters: [...new Set([...element.relatedCharacters, ...itemIds])],
    };
  }
}

/**
 * Unlink a world element from scenes or characters
 */
export function unlinkWorldElement(
  element: WorldElement,
  itemId: string,
  itemType: 'scene' | 'character'
): WorldElement {
  if (itemType === 'scene') {
    return {
      ...element,
      relatedScenes: element.relatedScenes.filter(id => id !== itemId),
    };
  } else {
    return {
      ...element,
      relatedCharacters: element.relatedCharacters.filter(id => id !== itemId),
    };
  }
}

/**
 * Get linked scenes for a world element
 */
export function getLinkedScenes(element: WorldElement): Scene[] {
  const data = StoryStorage.loadAll();
  const scenes = data.scenes || [];
  return scenes.filter(scene => element.relatedScenes.includes(scene.id));
}

/**
 * Get linked characters for a world element
 */
export function getLinkedCharacters(element: WorldElement): Character[] {
  const characters = StoryStorage.loadCharacters();
  return characters.filter(character => element.relatedCharacters.includes(character.id));
}

/**
 * Check if a world element is linked to a scene or character
 */
export function isLinked(
  element: WorldElement,
  itemId: string,
  itemType: 'scene' | 'character'
): boolean {
  if (itemType === 'scene') {
    return element.relatedScenes.includes(itemId);
  } else {
    return element.relatedCharacters.includes(itemId);
  }
}
