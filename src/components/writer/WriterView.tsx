'use client';

/**
 * Writer View – Full-width editor with collapsible side panels, nav, autosave.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Users,
  Globe,
  Lightbulb,
  PanelRightOpen,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { useWritingSession } from '@/contexts/WritingSessionContext';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { scheduleProjectSave } from '@/lib/storage/projectSave';
import { computeWordCount } from '@/utils/wordCount';
import type { Scene } from '@/types/story';
import SimpleVoicePlayer from '@/components/SimpleVoicePlayer';

const AUTOSAVE_DEBOUNCE_MS = 800;

export default function WriterView() {
  const router = useRouter();
  const {
    story,
    scenes,
    activeScene,
    activeSceneIndex,
    selectChapter,
    refresh,
  } = useWritingSession();

  const [title, setTitle] = useState(activeScene?.title ?? '');
  const [content, setContent] = useState(activeScene?.content ?? '');
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'characters' | 'world' | 'notes' | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activeScene) {
      setTitle(activeScene.title ?? '');
      setContent(activeScene.content ?? '');
    }
  }, [activeScene?.id]);

  const persistScene = useCallback(
    (updates: { title?: string; content?: string }) => {
      if (!activeScene || !story) return;
      const nextScenes = scenes.map((s) =>
        s.id === activeScene.id
          ? {
              ...s,
              title: updates.title ?? s.title,
              content: updates.content ?? s.content,
              wordCount: updates.content !== undefined ? computeWordCount(updates.content) : s.wordCount,
              updatedAt: new Date(),
            }
          : s
      );
      const nextStory = { ...story, scenes: nextScenes, updatedAt: new Date() };
      StoryStorage.saveStory(nextStory);
      StoryStorage.saveScenes(nextScenes);
      scheduleProjectSave();
      refresh();
    },
    [activeScene, story, scenes, refresh]
  );

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      if (!activeScene) return;
      const t = title.trim() || activeScene.title;
      if (t !== activeScene.title || content !== activeScene.content) {
        persistScene({ title: t || 'Untitled chapter', content });
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, activeScene?.id]);

  const goBack = () => router.push('/dashboard');
  const goPrev = () => {
    if (activeSceneIndex <= 0) return;
    persistScene({ title: title.trim() || 'Untitled chapter', content });
    selectChapter(scenes[activeSceneIndex - 1].id);
  };
  const goNext = () => {
    if (activeSceneIndex >= scenes.length - 1) return;
    persistScene({ title: title.trim() || 'Untitled chapter', content });
    selectChapter(scenes[activeSceneIndex + 1].id);
  };

  const wordCount = computeWordCount(content);
  const totalChapters = scenes.length;
  const currentChapterNum = activeSceneIndex >= 0 ? activeSceneIndex + 1 : 0;

  const characters = story?.characters ?? [];
  const worldElements = (story as { worldElements?: { name: string }[] })?.worldElements ?? [];

  return (
    <div className="flex flex-col h-screen bg-[rgb(var(--editor-bg))] overflow-hidden">
      {/* Top bar: Back, title, progress, word count, nav, panels toggle */}
      <header className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 border-b border-gray-300 dark:border-gray-600 bg-[rgb(var(--card-bg))]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Stories</span>
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-0 max-w-md px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white font-semibold text-sm sm:text-base placeholder:text-gray-500"
            placeholder="Chapter title"
          />
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 tabular-nums">
            <FileText className="w-3.5 h-3.5" />
            {wordCount.toLocaleString()} words
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            Chapter {currentChapterNum} of {totalChapters}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:ml-auto">
          <button
            type="button"
            onClick={goPrev}
            disabled={activeSceneIndex <= 0}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous chapter"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={activeSceneIndex >= scenes.length - 1}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next chapter"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {content.trim() && (
            <div className="hidden sm:block pl-2 border-l border-gray-300 dark:border-gray-600">
              <SimpleVoicePlayer text={content} className="text-gray-600 dark:text-gray-400" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setRightPanelOpen((o) => !o)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors md:hidden"
            aria-label="Open reference panels"
          >
            <PanelRightOpen className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Main editor – full width when panel closed */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="relative flex-1 p-4 overflow-auto">
            <div className="absolute inset-4 odyssey-editor-texture rounded-lg pointer-events-none" aria-hidden />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="odyssey-editor relative w-full h-full min-h-[300px] rounded-lg p-4 border border-gray-300 dark:border-gray-600 focus:border-purple-500 outline-none resize-none text-base"
              placeholder="Write your chapter here…"
              spellCheck
            />
          </div>
        </main>

        {/* Right side panels – desktop: always visible; mobile: slide-in overlay */}
        <aside className="hidden md:flex flex-col flex-shrink-0 w-[280px] border-l border-gray-300 dark:border-gray-600 bg-[rgb(var(--card-bg))] overflow-hidden">
              <div className="p-2 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reference</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <PanelSection
                  icon={Users}
                  label="Characters"
                  open={activePanel === 'characters'}
                  onToggle={() => setActivePanel(activePanel === 'characters' ? null : 'characters')}
                >
                  {characters.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No characters yet.</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {characters.slice(0, 20).map((c) => (
                        <li key={c.id} className="truncate">{c.name}</li>
                      ))}
                      {characters.length > 20 && (
                        <li className="text-xs text-gray-500">+{characters.length - 20} more</li>
                      )}
                    </ul>
                  )}
                </PanelSection>
                <PanelSection
                  icon={Globe}
                  label="World"
                  open={activePanel === 'world'}
                  onToggle={() => setActivePanel(activePanel === 'world' ? null : 'world')}
                >
                  {worldElements.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No world elements yet.</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {(Array.isArray(worldElements) ? worldElements : []).slice(0, 15).map((el: { name?: string; id?: string }, i: number) => (
                        <li key={el.id ?? i} className="truncate">{el.name ?? '—'}</li>
                      ))}
                    </ul>
                  )}
                </PanelSection>
                <PanelSection
                  icon={Lightbulb}
                  label="Notes / AI"
                  open={activePanel === 'notes'}
                  onToggle={() => setActivePanel(activePanel === 'notes' ? null : 'notes')}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">Suggestions and notes can go here.</p>
                </PanelSection>
              </div>
            </aside>
      </div>

      {/* Mobile: slide-in panel overlay when rightPanelOpen */}
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setRightPanelOpen(false)} />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[280px] bg-[rgb(var(--card-bg))] border-l border-gray-300 dark:border-gray-600 shadow-xl flex flex-col"
            >
              <div className="p-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Reference</span>
                <button type="button" onClick={() => setRightPanelOpen(false)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <PanelSection
                  icon={Users}
                  label="Characters"
                  open={activePanel === 'characters'}
                  onToggle={() => setActivePanel(activePanel === 'characters' ? null : 'characters')}
                >
                  {characters.length === 0 ? (
                    <p className="text-xs text-gray-500">No characters yet.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {characters.slice(0, 20).map((c) => (
                        <li key={c.id} className="truncate">{c.name}</li>
                      ))}
                    </ul>
                  )}
                </PanelSection>
                <PanelSection
                  icon={Globe}
                  label="World"
                  open={activePanel === 'world'}
                  onToggle={() => setActivePanel(activePanel === 'world' ? null : 'world')}
                >
                  {worldElements.length === 0 ? (
                    <p className="text-xs text-gray-500">No world elements yet.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {(Array.isArray(worldElements) ? worldElements : []).slice(0, 15).map((el: { name?: string; id?: string }, i: number) => (
                        <li key={el.id ?? i} className="truncate">{el.name ?? '—'}</li>
                      ))}
                    </ul>
                  )}
                </PanelSection>
                <PanelSection
                  icon={Lightbulb}
                  label="Notes / AI"
                  open={activePanel === 'notes'}
                  onToggle={() => setActivePanel(activePanel === 'notes' ? null : 'notes')}
                >
                  <p className="text-xs text-gray-500">Suggestions and notes can go here.</p>
                </PanelSection>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: show panels button when panel is closed */}
      {!rightPanelOpen && (
        <div className="md:hidden fixed bottom-4 right-4 z-40">
          <button
            type="button"
            onClick={() => setRightPanelOpen(true)}
            className="p-3 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
            aria-label="Open panels"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function PanelSection({
  icon: Icon,
  label,
  open,
  onToggle,
  children,
}: {
  icon: typeof Users;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {label}
        <span className="ml-auto">{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
