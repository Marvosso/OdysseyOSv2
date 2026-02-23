'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { Scene, Story } from '@/types/story';

export interface WritingSessionState {
  /** Current story (project) id; from active project or loaded story */
  activeStoryId: string | null;
  /** Current chapter (scene) id being edited in Writer tab */
  activeSceneId: string | null;
  /** Loaded story from storage; null if none */
  story: Story | null;
  /** All scenes (chapters) for current story */
  scenes: Scene[];
  /** Current scene being edited; null if none selected or not found */
  activeScene: Scene | null;
  /** Index of active scene in scenes (0-based); -1 if none */
  activeSceneIndex: number;
}

interface WritingSessionContextValue extends WritingSessionState {
  setActiveSceneId: (id: string | null) => void;
  /** Navigate to a chapter; updates activeSceneId and persists */
  selectChapter: (sceneId: string) => void;
  /** Refresh story and scenes from storage (e.g. after save or storage event) */
  refresh: () => void;
}

const WritingSessionContext = createContext<WritingSessionContextValue | null>(null);

function loadState(): WritingSessionState {
  const story = StoryStorage.loadStory();
  const scenes = StoryStorage.loadScenes();
  const fromStory = story?.scenes ?? [];
  const list = scenes.length > 0 ? scenes : fromStory;
  const activeSceneId = StoryStorage.getActiveSceneId();
  const activeScene = list.find((s) => s.id === activeSceneId) ?? null;
  const activeSceneIndex = activeScene ? list.findIndex((s) => s.id === activeScene.id) : -1;

  return {
    activeStoryId: story?.id ?? StoryStorage.getActiveProjectId() ?? null,
    activeSceneId,
    story: story ?? null,
    scenes: list,
    activeScene,
    activeSceneIndex: activeSceneIndex >= 0 ? activeSceneIndex : -1,
  };
}

export function WritingSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WritingSessionState>(loadState);

  const refresh = useCallback(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    const onStorage = () => setState(loadState());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setActiveSceneId = useCallback((id: string | null) => {
    StoryStorage.setActiveSceneId(id);
    setState(loadState());
  }, []);

  const selectChapter = useCallback((sceneId: string) => {
    StoryStorage.setActiveSceneId(sceneId);
    setState(loadState());
  }, []);

  const value: WritingSessionContextValue = {
    ...state,
    setActiveSceneId,
    selectChapter,
    refresh,
  };

  return (
    <WritingSessionContext.Provider value={value}>
      {children}
    </WritingSessionContext.Provider>
  );
}

export function useWritingSession(): WritingSessionContextValue {
  const ctx = useContext(WritingSessionContext);
  if (!ctx) throw new Error('useWritingSession must be used within WritingSessionProvider');
  return ctx;
}

export function useWritingSessionOptional(): WritingSessionContextValue | null {
  return useContext(WritingSessionContext);
}
