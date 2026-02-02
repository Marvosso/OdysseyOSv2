'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Edit3,
  FileText,
  Layout,
  Lightbulb,
  SkipForward,
  Network,
  List,
} from 'lucide-react';
import type { StoryOutline, Chapter, OutlinePoint } from '@/types/outline';
import { outlineTemplates, generateOutlineFromTemplate, getOutlineSuggestions } from '@/lib/data/outlineTemplates';
import { StoryStorage } from '@/lib/storage/storyStorage';
import PlotMap from './PlotMap';

interface OutlineBuilderProps {
  story: any;
  onOutlineComplete: (outline: StoryOutline) => void;
  onSkip: () => void;
}

export default function OutlineBuilder({ story, onOutlineComplete, onSkip }: OutlineBuilderProps) {
  const [outline, setOutline] = useState<StoryOutline | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  // Load saved outline on mount
  useEffect(() => {
    const savedOutline = StoryStorage.loadOutline();
    if (savedOutline) {
      setOutline(savedOutline);
      setShowTemplates(false);
      if (savedOutline.chapters.length > 0) {
        setExpandedChapters(new Set([savedOutline.chapters[0].id]));
      }
    }
  }, []);

  // Auto-save outline when it changes
  useEffect(() => {
    if (outline) {
      StoryStorage.saveOutline(outline);
    }
  }, [outline]);

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = outlineTemplates.find(t => t.id === templateId);
    if (template) {
      const newOutline = generateOutlineFromTemplate(template, story.id);
      setOutline(newOutline);
      setShowTemplates(false);
      StoryStorage.saveOutline(newOutline);
      if (newOutline.chapters.length > 0) {
        setExpandedChapters(new Set([newOutline.chapters[0].id]));
      }
    }
  };

  const handleAddChapter = () => {
    if (!outline) return;
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: 'New Chapter',
      description: '',
      points: [],
      position: outline.chapters.length + 1,
    };
    setOutline({
      ...outline,
      chapters: [...outline.chapters, newChapter],
    });
    setExpandedChapters(new Set([...expandedChapters, newChapter.id]));
  };

  const handleAddPoint = (chapterId: string) => {
    if (!outline) return;
    const updatedChapters = outline.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        const newPoint: OutlinePoint = {
          id: `point-${Date.now()}`,
          title: 'New Plot Point',
          description: '',
          position: chapter.points.length + 1,
          estimatedScenes: 3,
          emotionalTone: 'neutral',
        };
        return {
          ...chapter,
          points: [...chapter.points, newPoint],
        };
      }
      return chapter;
    });
    setOutline({
      ...outline,
      chapters: updatedChapters,
    });
  };

  const handleDeletePoint = (chapterId: string, pointId: string) => {
    if (!outline) return;
    const updatedChapters = outline.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          points: chapter.points.filter(p => p.id !== pointId),
        };
      }
      return chapter;
    });
    setOutline({
      ...outline,
      chapters: updatedChapters,
    });
  };

  const handleUpdatePoint = (chapterId: string, pointId: string, updates: Partial<OutlinePoint>) => {
    if (!outline) return;
    const updatedChapters = outline.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          points: chapter.points.map(point =>
            point.id === pointId ? { ...point, ...updates } : point
          ),
        };
      }
      return chapter;
    });
    setOutline({
      ...outline,
      chapters: updatedChapters,
      updatedAt: new Date(),
    });
  };

  const handleClearOutline = () => {
    if (confirm('Are you sure you want to clear your outline? This cannot be undone.')) {
      StoryStorage.clearAll();
      setOutline(null);
      setShowTemplates(true);
      setExpandedChapters(new Set());
    }
  };

  const suggestions = outline ? getOutlineSuggestions(outline) : [];

  const handleNodeClick = (nodeId: string, type: 'chapter' | 'point' | 'scene') => {
    if (type === 'chapter' && outline) {
      const chapter = outline.chapters.find((c) => c.id === nodeId);
      if (chapter) {
        setExpandedChapters(new Set([chapter.id]));
        setViewMode('list');
        // Scroll to chapter
        setTimeout(() => {
          const element = document.getElementById(`chapter-${chapter.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } else if (type === 'point' && outline) {
      // Find the chapter containing this point
      for (const chapter of outline.chapters) {
        const point = chapter.points.find((p) => p.id === nodeId);
        if (point) {
          setExpandedChapters(new Set([chapter.id]));
          setEditingPoint(nodeId);
          setViewMode('list');
          setTimeout(() => {
            const element = document.getElementById(`point-${nodeId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          break;
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-400" />
          Story Outline
        </h2>
        <div className="flex items-center gap-2">
          {outline && (
            <>
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    viewMode === 'graph'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Network className="w-4 h-4" />
                  Graph
                </button>
              </div>
              <button
                onClick={handleClearOutline}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-lg text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </>
          )}
          <button
            onClick={onSkip}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip to Scenes
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <p className="text-white mb-3">Choose a structure to get started:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {outlineTemplates.map((template) => (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectTemplate(template.id)}
                    className="p-4 bg-gray-800 hover:bg-purple-900/40 border border-gray-700 hover:border-purple-500/50 rounded-lg text-left transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Layout className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-white">{template.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400">{template.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {outline && viewMode === 'graph' && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <PlotMap
              outline={outline}
              onNodeClick={handleNodeClick}
            />
          </motion.div>
        )}

        {outline && viewMode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Story Premise</label>
                <input
                  type="text"
                  value={outline.storyPremise}
                  onChange={(e) => setOutline({ ...outline, storyPremise: e.target.value })}
                  placeholder="What is your story about?"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Theme</label>
                  <input
                    type="text"
                    value={outline.theme}
                    onChange={(e) => setOutline({ ...outline, theme: e.target.value })}
                    placeholder="e.g., redemption, love, justice"
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Genre</label>
                  <input
                    type="text"
                    value={outline.genre}
                    onChange={(e) => setOutline({ ...outline, genre: e.target.value })}
                    placeholder="e.g., fantasy, thriller, romance"
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-400 text-sm font-medium">Suggestions:</p>
                  <ul className="text-sm text-yellow-300/80 mt-1 space-y-1">
                    {suggestions.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Chapters</h3>
                <button
                  onClick={handleAddChapter}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Chapter
                </button>
              </div>

              {outline.chapters.map((chapter, chapterIndex) => (
                <motion.div
                  key={chapter.id}
                  id={`chapter-${chapter.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/30"
                >
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {expandedChapters.has(chapter.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <div className="text-left flex-1">
                        <h4 className="text-white font-medium">{chapter.title}</h4>
                        <p className="text-sm text-gray-400">{chapter.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {chapter.points.length} points
                    </span>
                  </button>

                  <AnimatePresence>
                    {expandedChapters.has(chapter.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        <div className="space-y-2 mt-3">
                          {chapter.points.map((point, pointIndex) => (
                            <div
                              key={point.id}
                              id={`point-${point.id}`}
                              className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg"
                            >
                              {editingPoint === point.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={point.title}
                                    onChange={(e) =>
                                      handleUpdatePoint(chapter.id, point.id, {
                                        title: e.target.value,
                                      })
                                    }
                                    className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm focus:outline-none"
                                  />
                                  <textarea
                                    value={point.description}
                                    onChange={(e) =>
                                      handleUpdatePoint(chapter.id, point.id, {
                                        description: e.target.value,
                                      })
                                    }
                                    placeholder="Describe this plot point..."
                                    className="w-full bg-gray-600 text-white rounded px-2 py-2 text-sm focus:outline-none resize-none h-20"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setEditingPoint(null)}
                                      className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingPoint(null)}
                                      className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <FileText className="w-4 h-4 text-purple-400" />
                                      <h5 className="text-white font-medium text-sm">{point.title}</h5>
                                    </div>
                                    <p className="text-xs text-gray-400">{point.description}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                      <span>~{point.estimatedScenes} scenes</span>
                                      <span className="px-2 py-0.5 bg-gray-700 rounded-full">
                                        {point.emotionalTone}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setEditingPoint(point.id)}
                                      className="p-1 hover:bg-gray-600 rounded"
                                    >
                                      <Edit3 className="w-3 h-3 text-gray-400" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePoint(chapter.id, point.id)}
                                      className="p-1 hover:bg-red-500/20 rounded"
                                    >
                                      <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          <button
                            onClick={() => handleAddPoint(chapter.id)}
                            className="w-full p-2 border-2 border-dashed border-gray-700 hover:border-purple-500/50 rounded-lg text-gray-400 hover:text-purple-400 text-sm flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Plot Point
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={() => outline && onOutlineComplete(outline)}
                disabled={!outline || outline.chapters.length === 0}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Continue to Scenes
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                Your outline will guide scene creation
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
