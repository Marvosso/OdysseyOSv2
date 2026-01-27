'use client';

/**
 * Stories Page - Default Dashboard View
 * 
 * Main story canvas interface
 */

import StoryCanvas from '@/components/stories/StoryCanvas';

export default function StoriesPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <StoryCanvas />
    </div>
  );
}
