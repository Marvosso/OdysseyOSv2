'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Upload, PlusCircle, FileText, Users, Globe, PenLine } from 'lucide-react';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { supabase } from '@/lib/supabaseClient';
import UpgradeModal from './UpgradeModal';

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
  const [creating, setCreating] = useState(false);

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
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Choose your project</h1>
        <p className="text-gray-400">
          Work on a saved story, import one, or start fresh. All tabs use this project.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {hasStory && (
          <button
            onClick={handleContinue}
            className="w-full flex items-center gap-4 p-5 bg-purple-600 hover:bg-purple-700 border border-purple-500/50 rounded-xl text-left transition-colors group"
          >
            <div className="p-3 bg-purple-500/30 rounded-lg group-hover:bg-purple-500/50">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">{currentStoryTitle}</div>
              <div className="text-sm text-purple-200">Continue writing — all tabs use this story</div>
            </div>
          </button>
        )}

        <button
          onClick={handleImport}
          className="w-full flex items-center gap-4 p-5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-left transition-colors group"
        >
          <div className="p-3 bg-gray-700/50 rounded-lg group-hover:bg-gray-600/50">
            <Upload className="w-6 h-6 text-gray-300" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">Import story</div>
            <div className="text-sm text-gray-400">Bring in a .txt, .md, or pasted text as your current project</div>
          </div>
        </button>

        <button
          onClick={handleNewStory}
          disabled={creating}
          className="w-full flex items-center gap-4 p-5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-left transition-colors group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="p-3 bg-gray-700/50 rounded-lg group-hover:bg-gray-600/50">
            <PlusCircle className="w-6 h-6 text-gray-300" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">{creating ? 'Creating…' : 'Start new story'}</div>
            <div className="text-sm text-gray-400">Create a blank project and build outline, characters, and world first</div>
          </div>
        </button>
      </motion.div>

      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
      >
        <p className="text-sm text-gray-400 mb-3">Efficient flow:</p>
        <ul className="flex flex-wrap gap-3 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Outline
          </li>
          <li className="text-gray-500">→</li>
          <li className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Characters
          </li>
          <li className="text-gray-500">→</li>
          <li className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            World
          </li>
          <li className="text-gray-500">→</li>
          <li className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-purple-400" />
            Write
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
