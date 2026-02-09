'use client';

/**
 * Stories Page - Default Dashboard View
 *
 * Shows story selector (Continue / Import / New) until user has chosen a project,
 * then shows the story canvas. All tabs reference this single current project.
 */

import { useState, useEffect } from 'react';
import StoryCanvas from '@/components/stories/StoryCanvas';
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
      <div className="max-w-7xl mx-auto">
        <StorySelector
          currentStoryTitle={storyTitle}
          onContinue={handleContinue}
          onNewStory={handleNewStory}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <StoryCanvas />
    </div>
  );
}
