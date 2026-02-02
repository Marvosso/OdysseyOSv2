'use client';

/**
 * AI Enhancement Panel
 * 
 * Shows AI analysis results and allows side-by-side comparison
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Tag,
  FileText,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { ImportResult } from '@/lib/import/importPipeline';

interface AIEnhancementPanelProps {
  importResult: ImportResult;
  onApplyEnhancement?: (enhanced: ImportResult) => void;
  onClose?: () => void;
}

export default function AIEnhancementPanel({
  importResult,
  onApplyEnhancement,
  onClose,
}: AIEnhancementPanelProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'chapters' | 'relationships' | 'themes' | 'summary'>('overview');
  const [showComparison, setShowComparison] = useState(false);

  if (!importResult.aiEnhancement) {
    return null;
  }

  const { aiEnhancement } = importResult;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">AI Analysis</h3>
          {aiEnhancement.cached && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
              Cached
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            {showComparison ? 'Hide' : 'Show'} Comparison
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Comparison View */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-2 gap-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
        >
          <div>
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Original Detection
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Chapters:</span>{' '}
                <span className="text-white">{importResult.detectedChapters.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Characters:</span>{' '}
                <span className="text-white">{importResult.detectedCharacters.length}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Enhanced
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Chapters:</span>{' '}
                <span className="text-purple-300">
                  {aiEnhancement.chapters?.length || importResult.detectedChapters.length}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Relationships:</span>{' '}
                <span className="text-purple-300">
                  {aiEnhancement.relationships?.length || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Themes:</span>{' '}
                <span className="text-purple-300">
                  {aiEnhancement.themes?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-700 overflow-x-auto">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
            viewMode === 'overview'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Overview
        </button>
        {aiEnhancement.chapters && (
          <button
            onClick={() => setViewMode('chapters')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
              viewMode === 'chapters'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Chapters ({aiEnhancement.chapters.length})
          </button>
        )}
        {aiEnhancement.relationships && (
          <button
            onClick={() => setViewMode('relationships')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
              viewMode === 'relationships'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Relationships ({aiEnhancement.relationships.length})
          </button>
        )}
        {aiEnhancement.themes && (
          <button
            onClick={() => setViewMode('themes')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
              viewMode === 'themes'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            Themes ({aiEnhancement.themes.length})
          </button>
        )}
        {aiEnhancement.summary && (
          <button
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
              viewMode === 'summary'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Summary
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {aiEnhancement.chapters && (
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="text-gray-400 text-sm">AI Chapters</div>
                  <div className="text-2xl font-bold text-purple-400 mt-1">
                    {aiEnhancement.chapters.length}
                  </div>
                </div>
              )}
              {aiEnhancement.relationships && (
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="text-gray-400 text-sm">Relationships</div>
                  <div className="text-2xl font-bold text-purple-400 mt-1">
                    {aiEnhancement.relationships.length}
                  </div>
                </div>
              )}
              {aiEnhancement.themes && (
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="text-gray-400 text-sm">Themes</div>
                  <div className="text-2xl font-bold text-purple-400 mt-1">
                    {aiEnhancement.themes.length}
                  </div>
                </div>
              )}
              {aiEnhancement.summary && (
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="text-gray-400 text-sm">Genre</div>
                  <div className="text-lg font-bold text-purple-400 mt-1">
                    {aiEnhancement.summary.genre}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {viewMode === 'chapters' && aiEnhancement.chapters && (
          <motion.div
            key="chapters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {aiEnhancement.chapters.map((chapter, index) => (
              <div
                key={index}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold">{chapter.title}</h4>
                  <span className="text-xs text-gray-400">
                    {Math.round(chapter.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Lines {chapter.startLine} - {chapter.endLine}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {viewMode === 'relationships' && aiEnhancement.relationships && (
          <motion.div
            key="relationships"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {aiEnhancement.relationships.map((rel, index) => (
              <div
                key={index}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{rel.character1}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-white font-semibold">{rel.character2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-300 capitalize">{rel.relationship}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < rel.intensity ? 'bg-purple-500' : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {viewMode === 'themes' && aiEnhancement.themes && (
          <motion.div
            key="themes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {aiEnhancement.themes
              .sort((a, b) => b.confidence - a.confidence)
              .map((theme, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">{theme.theme}</h4>
                    <span className="text-xs text-gray-400">
                      {Math.round(theme.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${theme.confidence * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </motion.div>
        )}

        {viewMode === 'summary' && aiEnhancement.summary && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Summary</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {aiEnhancement.summary.summary}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Genre</div>
                <div className="text-white font-semibold">{aiEnhancement.summary.genre}</div>
              </div>
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Tone</div>
                <div className="text-white font-semibold">{aiEnhancement.summary.tone}</div>
              </div>
            </div>
            {aiEnhancement.summary.themes.length > 0 && (
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Themes</div>
                <div className="flex flex-wrap gap-2">
                  {aiEnhancement.summary.themes.map((theme, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-purple-300 text-sm"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply Button */}
      {onApplyEnhancement && (
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={() => onApplyEnhancement(importResult)}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Apply AI Enhancements
          </button>
        </div>
      )}
    </div>
  );
}
