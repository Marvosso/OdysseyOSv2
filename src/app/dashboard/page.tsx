'use client';

/**
 * Stories Page - Project management and chapter navigation.
 *
 * Shows story selector (Continue / Import / New) until user has chosen a project,
 * then shows the Stories tab: chapter list (read-only preview), add/delete/reorder.
 * Clicking a chapter navigates to the Writer tab.
 */

import { useState, useEffect } from 'react';
import StoriesTab from '@/components/stories/StoriesTab';
import StorySelector, { hasEnteredProject } from '@/components/session/StorySelector';
import { StoryStorage } from '@/lib/storage/storyStorage';

export default function StoriesPage() {
  const [showSelector, setShowSelector] = useState(true);
  const [storyTitle, setStoryTitle] = useState<string | null>(null);

  useEffect(() => {
    const story = StoryStorage.loadStory();
    setStoryTitle(story?.title?.trim() || null);
    setShowSelector(!hasEnteredProject());
  }, []);

  useEffect(() => {
    const onStorage = () => {
      const story = StoryStorage.loadStory();
      setStoryTitle(story?.title?.trim() || null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleContinue = () => setShowSelector(false);
  const handleNewStory = () => {
    const story = StoryStorage.loadStory();
    setStoryTitle(story?.title?.trim() || null);
    setShowSelector(false);
  };

  if (showSelector) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 overflow-x-hidden">
        <StorySelector
          currentStoryTitle={storyTitle}
          onContinue={handleContinue}
          onNewStory={handleNewStory}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 overflow-x-hidden">
      <StoriesTab />
    </div>
  );
}
