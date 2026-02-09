'use client';

/**
 * Beats Page
 * Loads scenes from storage and lets you pick a scene to edit its beats.
 */

import { useState, useEffect } from 'react';
import BeatEditor from '@/components/beat-editor/BeatEditor';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { Scene } from '@/types/story';
import { FileText } from 'lucide-react';

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

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {scenes.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <label className="text-sm text-gray-400 flex-shrink-0">Scene:</label>
          <select
            value={selectedSceneId}
            onChange={(e) => setSelectedSceneId(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm min-w-[200px]"
          >
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title?.trim() || 'Untitled'} {s.position != null ? `(#${s.position + 1})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      {scenes.length === 0 && (
        <p className="text-sm text-gray-400">
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
