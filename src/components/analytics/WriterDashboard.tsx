'use client';

/**
 * Writer Analytics Dashboard
 * 
 * Comprehensive analytics for writing activity
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  Download,
  BookOpen,
  Zap,
  Award,
} from 'lucide-react';
import {
  getWritingSessions,
  calculateDailyStats,
  calculateWeeklyStats,
  calculateMonthlyStats,
  calculateTimeOfDayStats,
  analyzeCommonWords,
  calculateWritingSpeed,
  getCurrentStoryStats,
  trackWritingSession,
} from '@/lib/analytics/writingMetrics';
import {
  getGoals,
  saveGoal,
  deleteGoal,
  calculateFinishDateProjection,
  getGenreBenchmarks,
  compareToGenreBenchmark,
  getDailyGoalProgress,
} from '@/lib/analytics/goals';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { Story } from '@/types/story';
import WordsPerDayChart from './WordsPerDayChart';
import TimeOfDayChart from './TimeOfDayChart';
import WordFrequencyChart from './WordFrequencyChart';
import WritingSpeedChart from './WritingSpeedChart';
import GoalsPanel from './GoalsPanel';
import ProjectionsPanel from './ProjectionsPanel';

export default function WriterDashboard() {
  const [story, setStory] = useState<Story | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'analytics'>('overview');
  const [selectedGenre, setSelectedGenre] = useState<string>('Novel');

  useEffect(() => {
    const loadedStory = StoryStorage.loadStory();
    setStory(loadedStory);

    // Track current session if story exists
    if (loadedStory) {
      const stats = getCurrentStoryStats();
      // Only track if there's actual content
      if (stats.totalWords > 0) {
        trackWritingSession(stats.totalWords, stats.totalScenes, 0);
      }
    }
  }, []);

  const sessions = getWritingSessions();
  const dailyStats = calculateDailyStats(sessions);
  const weeklyStats = calculateWeeklyStats(sessions);
  const monthlyStats = calculateMonthlyStats(sessions);
  const timeOfDayStats = calculateTimeOfDayStats(sessions);
  const currentStats = getCurrentStoryStats();
  const dailyGoalProgress = getDailyGoalProgress();
  const genreComparison = compareToGenreBenchmark(selectedGenre);

  const commonWords = story ? analyzeCommonWords(story, 20) : [];
  const writingSpeed = calculateWritingSpeed(sessions);

  // Calculate projections
  const targetWords = genreComparison.benchmark?.averageLength || 80000;
  const projection = calculateFinishDateProjection(
    targetWords,
    currentStats.totalWords
  );

  const handleExportReport = () => {
    const report = generateAnalyticsReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `writing-analytics-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateAnalyticsReport = (): string => {
    let report = 'WRITING ANALYTICS REPORT\n';
    report += '='.repeat(50) + '\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    report += 'CURRENT STATISTICS\n';
    report += '-'.repeat(30) + '\n';
    report += `Total Words: ${currentStats.totalWords.toLocaleString()}\n`;
    report += `Total Scenes: ${currentStats.totalScenes}\n`;
    report += `Average Words per Scene: ${currentStats.averageWordsPerScene}\n`;
    report += `Longest Scene: ${currentStats.longestScene} words\n`;
    report += `Shortest Scene: ${currentStats.shortestScene} words\n\n`;

    report += 'DAILY STATISTICS (Last 30 Days)\n';
    report += '-'.repeat(30) + '\n';
    const recentDaily = dailyStats.slice(-30);
    recentDaily.forEach((day) => {
      report += `${day.date}: ${day.words} words, ${day.sessions} sessions\n`;
    });
    report += '\n';

    report += 'WEEKLY STATISTICS\n';
    report += '-'.repeat(30) + '\n';
    weeklyStats.slice(-12).forEach((week) => {
      report += `${week.week}: ${week.words} words, ${week.daysActive} active days\n`;
    });
    report += '\n';

    report += 'MONTHLY STATISTICS\n';
    report += '-'.repeat(30) + '\n';
    monthlyStats.forEach((month) => {
      report += `${month.month}: ${month.words} words, ${month.daysActive} active days\n`;
    });
    report += '\n';

    report += 'TIME OF DAY ANALYSIS\n';
    report += '-'.repeat(30) + '\n';
    timeOfDayStats.forEach((stat) => {
      report += `${stat.period}: ${stat.totalWords} words, ${stat.sessionCount} sessions, avg ${stat.averageWords} words/session\n`;
    });
    report += '\n';

    report += 'TOP WORDS\n';
    report += '-'.repeat(30) + '\n';
    commonWords.slice(0, 20).forEach((word) => {
      report += `${word.word}: ${word.count} (${word.percentage.toFixed(2)}%)\n`;
    });
    report += '\n';

    report += 'PROJECTIONS\n';
    report += '-'.repeat(30) + '\n';
    report += `Target Words: ${targetWords.toLocaleString()}\n`;
    report += `Current Words: ${currentStats.totalWords.toLocaleString()}\n`;
    report += `Projected Finish Date: ${projection.finishDate}\n`;
    report += `Days Remaining: ${projection.daysRemaining}\n`;
    report += `Daily Words Needed: ${projection.dailyWordsNeeded}\n`;
    report += `Confidence: ${projection.confidence}\n\n`;

    report += 'GENRE COMPARISON\n';
    report += '-'.repeat(30) + '\n';
    report += `Genre: ${selectedGenre}\n`;
    if (genreComparison.benchmark) {
      report += `Benchmark: ${genreComparison.benchmark.averageLength.toLocaleString()} words\n`;
      report += `Progress: ${genreComparison.progress.words}% (words), ${genreComparison.progress.scenes}% (scenes)\n`;
      report += `Status: ${genreComparison.status}\n`;
    }

    return report;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Writer Dashboard</h1>
          <p className="text-gray-400">Track your writing progress and analytics</p>
        </div>
        <button
          onClick={handleExportReport}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'goals'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Goals & Projections
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'analytics'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Total Words</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {currentStats.totalWords.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Today's Goal</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {dailyGoalProgress.today} / {dailyGoalProgress.goal?.target || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {dailyGoalProgress.progress.toFixed(0)}% complete
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">Avg Daily</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {dailyStats.length > 0
                  ? Math.round(
                      dailyStats.slice(-30).reduce((sum, day) => sum + day.words, 0) /
                        Math.max(1, dailyStats.slice(-30).filter((d) => d.words > 0).length)
                    )
                  : 0}
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-gray-400">Finish Date</span>
              </div>
              <div className="text-lg font-bold text-white">
                {new Date(projection.finishDate).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {projection.daysRemaining} days remaining
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Words per Day</h3>
              <WordsPerDayChart data={dailyStats.slice(-30)} />
            </div>

            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Most Productive Times</h3>
              <TimeOfDayChart data={timeOfDayStats} />
            </div>
          </div>

          {/* Word Frequency */}
          {commonWords.length > 0 && (
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Most Common Words</h3>
              <WordFrequencyChart data={commonWords.slice(0, 15)} />
            </div>
          )}

          {/* Writing Speed */}
          {writingSpeed.length > 0 && (
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Writing Speed Over Time</h3>
              <WritingSpeedChart data={writingSpeed} />
            </div>
          )}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <GoalsPanel />
          <ProjectionsPanel
            targetWords={targetWords}
            currentWords={currentStats.totalWords}
            projection={projection}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            genreComparison={genreComparison}
          />
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Weekly Progress</h3>
              <WordsPerDayChart
                data={weeklyStats.slice(-12).map((w) => ({
                  date: w.week,
                  words: w.words,
                  scenes: w.scenes,
                  sessions: w.daysActive,
                  averageSpeed: 0,
                }))}
              />
            </div>

            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Monthly Progress</h3>
              <WordsPerDayChart
                data={monthlyStats.map((m) => ({
                  date: m.month,
                  words: m.words,
                  scenes: m.scenes,
                  sessions: m.daysActive,
                  averageSpeed: 0,
                }))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
