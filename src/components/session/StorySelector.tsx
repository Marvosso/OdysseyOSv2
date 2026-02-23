'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Upload, PlusCircle, FileText, Users, Globe, PenLine } from 'lucide-react';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { supabase } from '@/lib/supabaseClient';
import UpgradeModal from './UpgradeModal';
import ProjectLimitModal from './ProjectLimitModal';
import { useProjectsContext } from '@/contexts/ProjectsContext';

const ENTERED_PROJECT_KEY = 'odysseyos_entered_project';

export function setEnteredProject() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ENTERED_PROJECT_KEY, '1');
  }
}

export function clearEnteredProject() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ENTERED_PROJECT_KEY);
  }
}

export function hasEnteredProject(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(ENTERED_PROJECT_KEY) === '1';
}

interface StorySelectorProps {
  currentStoryTitle: string | null;
  onContinue: () => void;
  onNewStory: () => void;
}

export default function StorySelector({ currentStoryTitle, onContinue, onNewStory }: StorySelectorProps) {
  const router = useRouter();
  const hasStory = !!currentStoryTitle;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProjectLimitModal, setShowProjectLimitModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const projectsContext = useProjectsContext();

  const handleContinue = () => {
    setEnteredProject();
    onContinue();
  };

  const handleImport = () => {
    router.push('/dashboard/import');
  };

  const handleNewStory = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      StoryStorage.initNewStory();
      setEnteredProject();
      window.dispatchEvent(new Event('storage'));
      onNewStory();
      return;
    }

    // Signed in: use projects API (new project row, no overwrite); tier limit enforced server-side
    if (projectsContext) {
      setCreating(true);
      try {
        const result = await projectsContext.createNewProject('Untitled Story');
        if (!result.success) {
          if (result.error.code === 'PROJECT_LIMIT_REACHED') {
            setShowProjectLimitModal(true);
          } else {
            setShowUpgradeModal(true);
          }
          return;
        }
        setEnteredProject();
        window.dispatchEvent(new Event('storage'));
        onNewStory();
      } finally {
        setCreating(false);
      }
      return;
    }

    // Fallback: legacy stories/create (e.g. before projects context mounts)
    setCreating(true);
    try {
      const res = await fetch('/api/stories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: 'Untitled Story' }),
      });

      if (res.status === 403) {
        setShowUpgradeModal(true);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[StorySelector] Create failed:', err);
        return;
      }

      const json = await res.json();
      const id = json?.data?.id ?? `story-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const title = json?.data?.title ?? 'Untitled Story';

      StoryStorage.initNewStoryFromApi(id, title);
      setEnteredProject();
      window.dispatchEvent(new Event('storage'));
      onNewStory();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2 break-words">Choose your project</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base break-words">
          Work on a saved story, import one, or start fresh. All tabs use this project.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {hasStory && (
          <motion.button
            type="button"
            onClick={handleContinue}
            className="odyssey-card-gradient w-full flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-xl text-left min-w-0 overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(99, 102, 241, 0.9) 100%)', border: '1px solid rgba(167, 139, 250, 0.4)' }}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -12px rgba(124, 58, 237, 0.35)' }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="p-3 bg-white/20 rounded-lg w-fit sm:w-auto">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-semibold text-white break-words overflow-hidden text-ellipsis line-clamp-2">{currentStoryTitle}</div>
              <div className="text-sm text-purple-100 break-words mt-0.5">Continue writing — all tabs use this story</div>
            </div>
          </motion.button>
        )}

        <motion.button
          type="button"
          onClick={handleImport}
          className="odyssey-card-gradient w-full flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-2xl text-left group min-w-0 border border-gray-200/80 dark:border-gray-600 shadow-card dark:shadow-none hover:shadow-card-md dark:hover:shadow-none transition-shadow duration-200"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="p-3 bg-ivory-200/80 dark:bg-gray-600/50 rounded-xl w-fit sm:w-auto">
            <Upload className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="font-semibold text-gray-800 dark:text-white break-words">Import story</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 break-words overflow-hidden text-ellipsis line-clamp-2 mt-0.5">Bring in a .txt, .md, or pasted text as your current project</div>
          </div>
        </motion.button>

        <motion.button
          type="button"
          onClick={handleNewStory}
          disabled={creating}
          className="odyssey-card-gradient w-full flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-2xl text-left min-w-0 border border-gray-200/80 dark:border-gray-600 shadow-card dark:shadow-none hover:shadow-card-md dark:hover:shadow-none transition-shadow duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          whileHover={!creating ? { scale: 1.01 } : undefined}
          whileTap={!creating ? { scale: 0.99 } : undefined}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="p-3 bg-ivory-200/80 dark:bg-gray-600/50 rounded-xl w-fit sm:w-auto">
            <PlusCircle className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="font-semibold text-gray-800 dark:text-white break-words">{creating ? 'Creating…' : 'Start new story'}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 break-words overflow-hidden text-ellipsis line-clamp-2 mt-0.5">Create a blank project and build outline, characters, and world first</div>
          </div>
        </motion.button>
      </motion.div>

      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      <ProjectLimitModal
        open={showProjectLimitModal}
        onClose={() => setShowProjectLimitModal(false)}
        projects={projectsContext?.projects ?? []}
        onUpgrade={() => {
          setShowProjectLimitModal(false);
          setShowUpgradeModal(true);
        }}
        onRetry={async () => {
          if (!projectsContext) return;
          setCreating(true);
          try {
            const r = await projectsContext.createNewProject('Untitled Story');
            if (r.success) {
              setEnteredProject();
              window.dispatchEvent(new Event('storage'));
              onNewStory();
              setShowProjectLimitModal(false);
            }
          } finally {
            setCreating(false);
          }
        }}
        onCancel={() => setShowProjectLimitModal(false)}
        onProjectsChanged={() => projectsContext?.refreshProjects()}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-5 bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700 rounded-2xl shadow-card dark:shadow-none"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Efficient flow:</p>
        <ul className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
            Outline
          </li>
          <li className="text-gray-500">→</li>
          <li className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
            Characters
          </li>
          <li className="text-gray-500">→</li>
          <li className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
            World
          </li>
          <li className="text-gray-500">→</li>
          <li className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
            Write
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
