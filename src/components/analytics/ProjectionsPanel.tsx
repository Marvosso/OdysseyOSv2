'use client';

/**
 * Projections Panel
 * 
 * Shows finish date estimates and genre comparisons
 */

import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Award, AlertCircle } from 'lucide-react';
import type { Projection } from '@/lib/analytics/goals';
import { getGenreBenchmarks } from '@/lib/analytics/goals';

interface ProjectionsPanelProps {
  targetWords: number;
  currentWords: number;
  projection: Projection;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  genreComparison: {
    genre: string;
    benchmark: { averageLength: number; averageChapters: number; averageWordsPerChapter: number } | null;
    current: { words: number; scenes: number };
    progress: { words: number; scenes: number };
    status: 'ahead' | 'on-track' | 'behind';
  };
}

export default function ProjectionsPanel({
  targetWords,
  currentWords,
  projection,
  selectedGenre,
  onGenreChange,
  genreComparison,
}: ProjectionsPanelProps) {
  const benchmarks = getGenreBenchmarks();
  const wordsRemaining = Math.max(0, targetWords - currentWords);
  const progressPercentage = targetWords > 0 ? (currentWords / targetWords) * 100 : 0;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-orange-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead':
        return 'text-green-400';
      case 'on-track':
        return 'text-blue-400';
      default:
        return 'text-orange-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Finish Date Projection */}
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-400" />
          Finish Date Projection
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Projected Finish</div>
            <div className="text-2xl font-bold text-white">
              {new Date(projection.finishDate).toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {projection.daysRemaining} days remaining
            </div>
          </div>

          <div className="p-4 bg-gray-700/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Daily Words Needed</div>
            <div className="text-2xl font-bold text-white">
              {projection.dailyWordsNeeded.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Confidence: <span className={getConfidenceColor(projection.confidence)}>
                {projection.confidence}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-gray-400">
              {currentWords.toLocaleString()} / {targetWords.toLocaleString()} words
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-3">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {wordsRemaining.toLocaleString()} words remaining ({progressPercentage.toFixed(1)}% complete)
          </div>
        </div>
      </div>

      {/* Genre Comparison */}
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-purple-400" />
          Genre Comparison
        </h2>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Select Genre</label>
          <select
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {benchmarks.map((benchmark) => (
              <option key={benchmark.genre} value={benchmark.genre}>
                {benchmark.genre}
              </option>
            ))}
          </select>
        </div>

        {genreComparison.benchmark && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Status</span>
                <span className={`font-semibold ${getStatusColor(genreComparison.status)}`}>
                  {genreComparison.status.toUpperCase().replace('-', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Word Progress</div>
                <div className="text-2xl font-bold text-white">
                  {genreComparison.progress.words}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentWords.toLocaleString()} / {genreComparison.benchmark.averageLength.toLocaleString()}
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, genreComparison.progress.words)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Scene Progress</div>
                <div className="text-2xl font-bold text-white">
                  {genreComparison.progress.scenes}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {genreComparison.current.scenes} / {genreComparison.benchmark.averageChapters}
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, genreComparison.progress.scenes)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Benchmark Information</div>
              <div className="space-y-1 text-sm text-gray-300">
                <div>Average Length: {genreComparison.benchmark.averageLength.toLocaleString()} words</div>
                <div>Average Chapters: {genreComparison.benchmark.averageChapters}</div>
                <div>Avg Words/Chapter: {genreComparison.benchmark.averageWordsPerChapter.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {!genreComparison.benchmark && (
          <div className="text-center py-8 text-gray-400">
            Select a genre to compare your progress
          </div>
        )}
      </div>
    </div>
  );
}
