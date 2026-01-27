'use client';

/**
 * World Building Page
 */

import { useState, useEffect } from 'react';
import WorldBuilder from '@/components/world-builder/WorldBuilder';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { WorldElement } from '@/types/world';

export default function WorldPage() {
  const [worldElements, setWorldElements] = useState<WorldElement[]>([]);

  useEffect(() => {
    const story = StoryStorage.loadStory();
    const elements = (story as any)?.worldElements || [];
    setWorldElements(elements);
  }, []);

  const handleUpdate = (elements: WorldElement[]) => {
    setWorldElements(elements);
    const story = StoryStorage.loadStory();
    if (story) {
      StoryStorage.saveStory({
        ...story,
        worldElements: elements,
      } as any);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <WorldBuilder
        story={{ worldElements } as any}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
