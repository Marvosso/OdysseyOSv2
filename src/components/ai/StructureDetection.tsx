'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Check, 
  X, 
  AlertTriangle, 
  BookOpen, 
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { AIStructureDetector } from '@/lib/ai/structureDetector';
import type { DetectedChapter, DetectedScene, StructureDetection } from '@/types/ai';
import type { StoryOutline } from '@/types/outline';

interface StructureDetectionProps {
  onConfirm: (structure: StructureDetection) => void;
  onCancel: () => void;
  initialText: string;
}

export default function StructureDetection({
  onConfirm,
  onCancel,
  initialText
}: StructureDetectionProps) {
  const [structure, setStructure] = useState<StructureDetection | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editedStructure, setEditedStructure] = useState<StructureDetection | null>(null);

  const handleAnalyze = () => {
    if (!initialText.trim()) return;
    const result = AIStructureDetector.detectStructure(initialText);
    setStructure(result);
    setEditedStructure(result);
  };

  const handleChapterEdit = (chapterId: string, field: string, value: string) => {
    if (!editedStructure) return;
    const updated = {
      ...editedStructure,
      chapters: editedStructure.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, [field]: value } : ch
      ),
    };
    setEditedStructure(updated);
  };

  const handleSceneEdit = (sceneId: string, field: string, value: string) => {
    if (!editedStructure) return;
    const updated = {
      ...editedStructure,
      scenes: editedStructure.scenes.map(sc =>
        sc.id === sceneId ? { ...sc, [field]: value } : sc
      ),
    };
    setEditedStructure(updated);
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleScene = (sceneId: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  const getActColor = (act: string) => {
    switch (act) {
      case 'Act I': return 'bg-blue-900/30 border-blue-500/50 text-blue-400';
      case 'Act II': return 'bg-purple-900/30 border-purple-500/50 text-purple-400';
      case 'Act III': return 'bg-pink-900/30 border-pink-500/50 text-pink-400';
      default: return 'bg-gray-700/30 border-gray-500/50 text-gray-400';
    }
  };

  if (!structure) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">AI Structure Detection</h2>
        </div>

        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p className="text-gray-300 mb-4">
            AI will analyze your text and suggest chapters, acts, and scenes.
            You'll be able to review and confirm each suggestion.
          </p>

          <button
            onClick={handleAnalyze}
            disabled={!initialText.trim()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Analyze Structure
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Review Detected Structure</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={() => editedStructure && onConfirm(editedStructure)}
            disabled={!editedStructure}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm & Import
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-white">Detection Summary</h3>
        </div>
        <p className="text-blue-300">{structure.summary}</p>
      </div>

      {/* Suggestions */}
      {structure.suggestions.length > 0 && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h3 className="font-semibold text-white">AI Suggestions</h3>
          </div>
          <ul className="space-y-2">
            {structure.suggestions.map((suggestion, index) => (
              <li key={index} className="text-yellow-300 text-sm">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chapters & Scenes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Chapters ({editedStructure?.chapters.length || 0})
        </h3>

        {(editedStructure || structure).chapters.map((chapter, chIndex) => (
          <div key={chapter.id} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/30">
            {/* Chapter Header */}
            <div className="p-4 flex items-center justify-between hover:bg-gray-800/50">
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {expandedChapters.has(chapter.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <h4 className="text-white font-medium">{chapter.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`px-2 py-0.5 rounded-full border ${getActColor(chapter.act)}`}>
                      {chapter.act}
                    </span>
                    <span>Lines {chapter.startLine} - {chapter.endLine}</span>
                  </div>
                </div>
              </button>
              <span className="text-xs text-gray-500">
                {(
                  editedStructure?.scenes.filter(s => s.chapterId === chapter.id) ||
                  structure.scenes.filter(s => s.chapterId === chapter.id)
                ).length} scenes
              </span>
            </div>

            {/* Chapter Details */}
            <AnimatePresence>
              {expandedChapters.has(chapter.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="mt-3 space-y-3">
                    {/* Editable Chapter Fields */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Chapter Title</label>
                        <input
                          type="text"
                          value={editedStructure?.chapters.find(ch => ch.id === chapter.id)?.title || chapter.title}
                          onChange={(e) => handleChapterEdit(chapter.id, 'title', e.target.value)}
                          className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Act Assignment</label>
                        <select
                          value={editedStructure?.chapters.find(ch => ch.id === chapter.id)?.act || chapter.act}
                          onChange={(e) => handleChapterEdit(chapter.id, 'act', e.target.value)}
                          className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Act I">Act I</option>
                          <option value="Act II">Act II</option>
                          <option value="Act III">Act III</option>
                          <option value="None">None</option>
                        </select>
                      </div>
                    </div>

                    {/* Scenes */}
                    <div className="pl-4 border-l-2 border-purple-500/30">
                      <h5 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Scenes
                      </h5>

                      {(
                        editedStructure?.scenes.filter(s => s.chapterId === chapter.id) ||
                        structure.scenes.filter(s => s.chapterId === chapter.id)
                      ).map((scene, scIndex) => (
                        <div key={scene.id} className="mt-2 border border-gray-600 rounded p-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Scene {scIndex + 1}</span>
                              <span className="text-xs text-gray-500">Lines {scene.startLine} - {scene.endLine}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Scene Title</label>
                              <input
                                type="text"
                                value={scene.title}
                                onChange={(e) => handleSceneEdit(scene.id, 'title', e.target.value)}
                                className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Emotion</label>
                              <select
                                value={scene.emotion}
                                onChange={(e) => handleSceneEdit(scene.id, 'emotion', e.target.value)}
                                className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="neutral">Neutral</option>
                                <option value="joy">Joy</option>
                                <option value="sadness">Sadness</option>
                                <option value="anger">Anger</option>
                                <option value="fear">Fear</option>
                                <option value="surprise">Surprise</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
