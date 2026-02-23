'use client';

/**
 * Beats Page
 * Loads scenes from storage and lets you pick a scene to edit its beats.
 * Includes interactive beat timeline per story.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BeatEditor from '@/components/beat-editor/BeatEditor';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { Scene } from '@/types/story';
import { FileText, BarChart3 } from 'lucide-react';

const FALLBACK_SCENE_ID = 'beats-no-scene';

export default function BeatsPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(FALLBACK_SCENE_ID);

  useEffect(() => {
    const load = () => {
      const fromScenesKey = StoryStorage.loadScenes();
      const story = StoryStorage.loadStory();
      const fromStory = story?.scenes ?? [];
      const combined = fromScenesKey?.length ? fromScenesKey : fromStory;
      const list = Array.isArray(combined) ? combined : [];
      setScenes(list);
      setSelectedSceneId((prev) => {
        if (list.length === 0) return FALLBACK_SCENE_ID;
        const stillValid = list.some((s) => s.id === prev);
        return stillValid ? prev : list[0].id;
      });
    };
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('storage', load);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', load);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId) ?? null;
  const sceneId = selectedScene?.id ?? FALLBACK_SCENE_ID;
  const sceneTitle = selectedScene?.title?.trim() || 'Untitled scene';
  const sceneContent = selectedScene?.content ?? '';

  const totalDuration = selectedScene
    ? (() => {
        try {
          const saved = localStorage.getItem(`beats-${selectedScene.id}`);
          const list = saved ? JSON.parse(saved) : [];
          return list.reduce((s: number, b: { duration?: number }) => s + (b.duration ?? 0), 0);
        } catch {
          return 0;
        }
      })()
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {scenes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-white/5 rounded-xl">
          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <label className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Scene:</label>
          <select
            value={selectedSceneId}
            onChange={(e) => setSelectedSceneId(e.target.value)}
            className="bg-white dark:bg-[#1a1a24] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm min-w-[200px]"
          >
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title?.trim() || 'Untitled'} {s.position != null ? `(#${s.position + 1})` : ''}
              </option>
            ))}
          </select>
          {selectedScene && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
              <BarChart3 className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Beat timeline</span>
              <div className="flex-1 min-w-[80px] max-w-[200px] h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                {totalDuration > 0 && (
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (totalDuration / 100) * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  />
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{totalDuration}%</span>
            </div>
          )}
        </div>
      )}
      {scenes.length === 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create or import a story with scenes in the Stories tab, then pick a scene here to edit its beats.
        </p>
      )}
      <BeatEditor
        key={sceneId}
        sceneId={sceneId}
        sceneTitle={sceneTitle}
        sceneContent={sceneContent}
        onBeatChange={() => {}}
      />
    </div>
  );
}
