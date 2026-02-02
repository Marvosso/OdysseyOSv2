'use client';

/**
 * World Building Page
 */

import { useState, useEffect } from 'react';
import WorldBuilder from '@/components/world-builder/WorldBuilder';
import WorldMap from '@/components/world/WorldMap';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { WorldElement } from '@/types/world';
import type { Story } from '@/types/story';

export default function WorldPage() {
  const [worldElements, setWorldElements] = useState<WorldElement[]>([]);
  const [story, setStory] = useState<Story | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'map'>('builder');

  useEffect(() => {
    const loadedStory = StoryStorage.loadStory();
    const elements = (loadedStory as any)?.worldElements || [];
    setWorldElements(elements);
    setStory(loadedStory);
  }, []);

  const handleUpdate = (elements: WorldElement[]) => {
    setWorldElements(elements);
    const loadedStory = StoryStorage.loadStory();
    if (loadedStory) {
      StoryStorage.saveStory({
        ...loadedStory,
        worldElements: elements,
      } as any);
    }
  };

  if (!story) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'builder'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          World Builder
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'map'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          World Map
        </button>
      </div>

      {/* Content */}
      {activeTab === 'builder' && (
        <WorldBuilder
          story={{ worldElements } as any}
          onUpdate={handleUpdate}
        />
      )}

      {activeTab === 'map' && (
        <WorldMap
          story={story}
          onLocationClick={(locationId) => {
            console.log('Location clicked:', locationId);
          }}
          onSceneClick={(sceneId) => {
            console.log('Scene clicked:', sceneId);
          }}
        />
      )}
    </div>
  );
}
