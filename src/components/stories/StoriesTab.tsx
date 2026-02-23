'use client';

/**
 * Stories Tab – Project management and chapter navigation.
 * Read-only chapter list with add/delete/reorder. Click chapter → Writer.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  GripVertical,
  FileText,
  ChevronRight,
} from 'lucide-react';
import type { Scene, Story } from '@/types/story';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { computeWordCount } from '@/utils/wordCount';
import { useWritingSession } from '@/contexts/WritingSessionContext';
import { scheduleProjectSave } from '@/lib/storage/projectSave';

const PREVIEW_LENGTH = 120;
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  revised: 'Revised',
  final: 'Final',
};

function previewText(content: string, maxLen: number): string {
  const t = (content || '').trim().replace(/\s+/g, ' ');
  if (!t) return '—';
  return t.length <= maxLen ? t : t.slice(0, maxLen) + '…';
}

export default function StoriesTab() {
  const router = useRouter();
  const { story, scenes, selectChapter, refresh } = useWritingSession();
  const [localStory, setLocalStory] = useState<Story | null>(null);
  const [localScenes, setLocalScenes] = useState<Scene[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const load = useCallback(() => {
    const s = StoryStorage.loadStory();
    const sc = StoryStorage.loadScenes();
    const fromStory = s?.scenes ?? [];
    setLocalStory(s ?? null);
    setLocalScenes(sc.length > 0 ? sc : fromStory);
    refresh();
  }, [refresh]);

  useEffect(() => {
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [load]);

  const handleTitleBlur = (value: string) => {
    if (!localStory) return;
    const updated = { ...localStory, title: value.trim() || localStory.title, updatedAt: new Date() };
    setLocalStory(updated);
    StoryStorage.saveStory(updated);
    scheduleProjectSave();
  };

  const addChapter = () => {
    const base = localStory ?? {
      id: 'story-1',
      title: 'Untitled Story',
      scenes: [],
      characters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: 'New Chapter',
      content: '',
      position: localScenes.length,
      emotion: 'neutral',
      status: 'draft',
      wordCount: 0,
      createdAt: new Date(),
    };
    const nextScenes = [...localScenes, newScene].map((s, i) => ({ ...s, position: i }));
    const updated = { ...base, scenes: nextScenes, updatedAt: new Date() };
    setLocalStory(updated);
    setLocalScenes(nextScenes);
    StoryStorage.saveStory(updated);
    StoryStorage.saveScenes(nextScenes);
    scheduleProjectSave();
    selectChapter(newScene.id);
    router.push('/dashboard/writer');
  };

  const deleteChapter = (sceneId: string) => {
    const next = localScenes.filter((s) => s.id !== sceneId).map((s, i) => ({ ...s, position: i }));
    const updated = localStory
      ? { ...localStory, scenes: next, updatedAt: new Date() }
      : null;
    if (updated) {
      setLocalStory(updated);
      setLocalScenes(next);
      StoryStorage.saveStory(updated);
      StoryStorage.saveScenes(next);
      scheduleProjectSave();
    }
    refresh();
  };

  const reorder = (fromId: string, toId: string) => {
    const fromIdx = localScenes.findIndex((s) => s.id === fromId);
    const toIdx = localScenes.findIndex((s) => s.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const next = [...localScenes];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    const withPos = next.map((s, i) => ({ ...s, position: i }));
    const updated = localStory
      ? { ...localStory, scenes: withPos, updatedAt: new Date() }
      : null;
    if (updated) {
      setLocalStory(updated);
      setLocalScenes(withPos);
      StoryStorage.saveStory(updated);
      StoryStorage.saveScenes(withPos);
      scheduleProjectSave();
    }
    setDraggedId(null);
    setDragOverId(null);
    refresh();
  };

  const goToWriter = (sceneId: string) => {
    selectChapter(sceneId);
    router.push('/dashboard/writer');
  };

  if (!localStory && localScenes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center text-gray-500 dark:text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No story loaded. Create or import a story from the dashboard.</p>
      </div>
    );
  }

  const storyTitle = localStory?.title?.trim() || 'Untitled Story';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Story title – read-only display, editable on blur via hidden input or we show an editable heading */}
      <div className="odyssey-header-gradient rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 truncate tracking-wide">
          {storyTitle}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
          {localScenes.length} chapter{localScenes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Chapter list – read-only preview, no inline textboxes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-gray-800 dark:text-gray-200 tracking-wide leading-relaxed">Chapters</h2>
          <button
            type="button"
            onClick={addChapter}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors duration-200 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add chapter
          </button>
        </div>

        <ul className="space-y-2">
          <AnimatePresence>
            {localScenes.map((scene) => {
              const words = scene.wordCount ?? computeWordCount(scene.content || '');
              const statusLabel = STATUS_LABELS[scene.status] ?? scene.status;
              return (
                <motion.li
                  key={scene.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`odyssey-card-gradient bg-white dark:bg-[#1a1a24] rounded-xl border overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(124,58,237,0.2)] hover:-translate-y-1 transition-all duration-300 ${
                    dragOverId === scene.id ? 'ring-2 ring-purple-500' : ''
                  } ${draggedId === scene.id ? 'opacity-60' : ''} border-gray-100 dark:border-white/5 dark:hover:border-purple-600/30 dark:shadow-none`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedId && draggedId !== scene.id) setDragOverId(scene.id);
                  }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={() => draggedId && reorder(draggedId, scene.id)}
                >
                  {/* Purple gradient accent line (light) / subtle top edge (dark) */}
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-300 dark:from-purple-600/50 dark:to-purple-500/30 rounded-t-xl" aria-hidden />
                  <div
                    className="flex items-stretch gap-2 sm:gap-4 p-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors duration-150"
                    onClick={() => goToWriter(scene.id)}
                  >
                    <div
                      draggable
                      onDragStart={() => setDraggedId(scene.id)}
                      onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                      className="flex items-center justify-center w-8 flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {scene.title?.trim() || 'Untitled chapter'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 capitalize">
                          {statusLabel}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                          {words.toLocaleString()} words
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {previewText(scene.content || '', PREVIEW_LENGTH)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this chapter? This cannot be undone.')) deleteChapter(scene.id);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete chapter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="text-gray-400">
                        <ChevronRight className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {localScenes.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 p-8 text-center bg-white/50 dark:bg-[#1a1a24]/50">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No chapters yet.</p>
            <button
              type="button"
              onClick={addChapter}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add first chapter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
