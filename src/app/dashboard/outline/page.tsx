'use client';

/**
 * Outline Page
 */

import { useState, useEffect } from 'react';
import OutlineBuilder from '@/components/outline/OutlineBuilder';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { Story } from '@/types/story';

export default function OutlinePage() {
  const [story, setStory] = useState<Story | null>(null);

  useEffect(() => {
    setStory(StoryStorage.loadStory());
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <OutlineBuilder
        story={story}
        onOutlineComplete={() => {}}
        onSkip={() => {}}
      />
    </div>
  );
}
