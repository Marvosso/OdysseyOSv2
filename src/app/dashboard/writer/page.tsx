'use client';

/**
 * Writer Page – Dedicated writing workspace.
 * No redirects: always stays on Writer. Shows empty state or editor with story/chapter dropdowns.
 */

import { useEffect } from 'react';
import WriterView from '@/components/writer/WriterView';
import WriterEmptyState from '@/components/writer/WriterEmptyState';
import { useWritingSessionOptional } from '@/contexts/WritingSessionContext';
const ENTERED_PROJECT_KEY = 'odysseyos_entered_project';

export default function WriterPage() {
  const session = useWritingSessionOptional();

  // When we have a story and scenes but no chapter selected, open last-opened or first chapter.
  useEffect(() => {
    if (!session?.story || session.scenes.length === 0 || session.activeScene) return;
    session.selectChapter(session.scenes[0].id);
  }, [session?.story, session?.scenes.length, session?.activeScene?.id, session?.scenes[0]?.id, session?.selectChapter]);

  // Mark that user has “entered” a project when viewing Writer with a story (so Stories tab shows list).
  useEffect(() => {
    if (session?.story && typeof window !== 'undefined') {
      sessionStorage.setItem(ENTERED_PROJECT_KEY, '1');
    }
  }, [session?.story]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background-rgb))]">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    );
  }

  // No story at all → CTA to create first story
  if (!session.story) {
    return <WriterEmptyState variant="no-story" />;
  }

  // Story but no chapters → CTA to add first chapter
  if (session.scenes.length === 0) {
    return (
      <WriterEmptyState
        variant="no-chapters"
        storyTitle={session.story.title?.trim() || undefined}
      />
    );
  }

  // Story + chapters → workspace (with or without activeScene; WriterView handles chapter selector)
  return <WriterView />;
}
