'use client';

/**
 * Writer Page – Focused full-screen editing of one chapter.
 * Requires WritingSessionProvider and active chapter; redirects to Stories if none.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WriterView from '@/components/writer/WriterView';
import { useWritingSessionOptional } from '@/contexts/WritingSessionContext';
import { hasEnteredProject } from '@/components/session/StorySelector';

export default function WriterPage() {
  const router = useRouter();
  const session = useWritingSessionOptional();

  useEffect(() => {
    if (!session) return;
    if (!hasEnteredProject()) {
      router.replace('/dashboard');
      return;
    }
    if (!session.story || session.scenes.length === 0) {
      router.replace('/dashboard');
      return;
    }
    if (!session.activeSceneId || !session.activeScene) {
      session.selectChapter(session.scenes[0].id);
    }
  }, [session, router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-400">
        Loading…
      </div>
    );
  }

  if (!session.story || session.scenes.length === 0) {
    return null;
  }

  if (!session.activeScene) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-400">
        Loading chapter…
      </div>
    );
  }

  return <WriterView />;
}
