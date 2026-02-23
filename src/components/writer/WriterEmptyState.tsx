'use client';

/**
 * Writer empty state – shown when user has no story or no chapters.
 * Keeps user on Writer tab with clear CTAs; no redirect to Stories.
 */

import { useRouter } from 'next/navigation';
import { FileText, Plus } from 'lucide-react';

type Variant = 'no-story' | 'no-chapters';

interface WriterEmptyStateProps {
  variant: Variant;
  storyTitle?: string | null;
}

export default function WriterEmptyState({ variant, storyTitle }: WriterEmptyStateProps) {
  const router = useRouter();

  const goToStories = () => router.push('/dashboard');
  const goToImport = () => router.push('/dashboard/import');

  if (variant === 'no-story') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="rounded-2xl bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/5 shadow-lg dark:shadow-none p-8 max-w-md">
          <FileText className="w-14 h-14 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Create your first story
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Start a new story or import one to begin writing here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={goToStories}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New or open story
            </button>
            <button
              type="button"
              onClick={goToImport}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
            >
              Import story
            </button>
          </div>
        </div>
      </div>
    );
  }

  // no-chapters
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="rounded-2xl bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/5 shadow-lg dark:shadow-none p-8 max-w-md">
        <FileText className="w-14 h-14 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Add your first chapter
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          {storyTitle ? (
            <>“{storyTitle}” has no chapters yet. Add one from the Stories tab.</>
          ) : (
            <>Add a chapter to start writing.</>
          )}
        </p>
        <button
          type="button"
          onClick={goToStories}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Go to Stories & add chapter
        </button>
      </div>
    </div>
  );
}
