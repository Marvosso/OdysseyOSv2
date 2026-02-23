'use client';

/**
 * Outline Page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OutlineBuilder from '@/components/outline/OutlineBuilder';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { Story } from '@/types/story';

export default function OutlinePage() {
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);

  useEffect(() => {
    setStory(StoryStorage.loadStory());
  }, []);

  const goToWriter = () => router.push('/dashboard/writer');

  return (
    <div className="max-w-7xl mx-auto">
      <OutlineBuilder
        story={story}
        onOutlineComplete={goToWriter}
        onSkip={goToWriter}
      />
    </div>
  );
}
