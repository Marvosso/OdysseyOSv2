'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Layers, BookOpen } from 'lucide-react';
import { computeWordCount } from '@/utils/wordCount';
import type { Scene } from '@/types/story';

const MILESTONES = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
const MAX_WORDS_DISPLAY = 50000;

interface WritingProgressBarsProps {
  scenes: Scene[];
  wordGoal?: number;
  chapterCount?: number;
}

export default function WritingProgressBars({
  scenes,
  wordGoal = 50000,
  chapterCount = 0,
}: WritingProgressBarsProps) {
  const totalWords = useMemo(
    () => scenes.reduce((sum, s) => sum + (s.wordCount ?? computeWordCount(s.content || '')), 0),
    [scenes]
  );
  const sceneCount = scenes.length;
  const nextMilestone = MILESTONES.find((m) => m > totalWords) ?? MILESTONES[MILESTONES.length - 1];
  const wordProgress = Math.min(100, (totalWords / wordGoal) * 100);
  const sceneProgress = sceneCount > 0 ? Math.min(100, (sceneCount / 20) * 100) : 0;
  const chapterProgress =
    chapterCount > 0 ? Math.min(100, (chapterCount / 12) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg bg-black/10 dark:bg-white/5 border border-gray-700/50 p-3"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <FileText className="w-3.5 h-3.5" />
            Words
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
            {totalWords.toLocaleString()}
            {wordGoal ? ` / ${wordGoal.toLocaleString()}` : ''}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${wordProgress}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>
        {totalWords > 0 && nextMilestone > totalWords && (
          <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
            {nextMilestone - totalWords} to next milestone ({nextMilestone.toLocaleString()})
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-lg bg-black/10 dark:bg-white/5 border border-gray-700/50 p-3"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Layers className="w-3.5 h-3.5" />
            Scenes
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
            {sceneCount}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${sceneProgress}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>
      </motion.div>

      {chapterCount >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-black/10 dark:bg-white/5 border border-gray-700/50 p-3"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <BookOpen className="w-3.5 h-3.5" />
              Chapters
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
              {chapterCount}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${chapterProgress}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
