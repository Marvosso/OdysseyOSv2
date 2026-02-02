'use client';

/**
 * Streak Visualization Component
 * 
 * Displays writing streaks and statistics with visual progress
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, TrendingUp, Award, Target } from 'lucide-react';
import { getStreakStats, type StreakStats } from '@/lib/gamification/streaks';
import { getEarnedAchievements } from '@/lib/gamification/achievements';

export default function StreakVisualization() {
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState(getEarnedAchievements());

  useEffect(() => {
    const loadStats = () => {
      setStats(getStreakStats());
      setEarnedAchievements(getEarnedAchievements());
    };

    loadStats();
    const interval = setInterval(loadStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <p className="text-gray-400 text-sm">Loading stats...</p>
      </div>
    );
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 100) return 'text-orange-500';
    if (streak >= 30) return 'text-red-500';
    if (streak >= 7) return 'text-yellow-500';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-4">
      {/* Current Streak */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Flame className={`w-5 h-5 ${getStreakColor(stats.currentStreak)}`} />
            Current Streak
          </h3>
          <span className={`text-2xl font-bold ${getStreakColor(stats.currentStreak)}`}>
            {stats.currentStreak} days
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Longest: {stats.longestStreak} days</span>
          <span>•</span>
          <span>Total: {stats.totalDays} days</span>
        </div>
      </div>

      {/* Weekly Stats */}
      {stats.weeklyStats.length > 0 && (
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Weekly Progress
          </h3>
          <div className="space-y-2">
            {stats.weeklyStats.slice(0, 4).map((week) => (
              <div key={week.week} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{week.week}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">{week.wordCount.toLocaleString()} words</span>
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (week.days / 7) * 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Stats */}
      {stats.monthlyStats.length > 0 && (
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Monthly Progress
          </h3>
          <div className="space-y-2">
            {stats.monthlyStats.slice(0, 3).map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{month.month}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">{month.wordCount.toLocaleString()} words</span>
                  <span className="text-xs text-gray-500">{month.days} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-500">Total Words</span>
          </div>
          <div className="text-xl font-bold text-white">
            {stats.totalWords.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-500">Achievements</span>
          </div>
          <div className="text-xl font-bold text-white">
            {earnedAchievements.length}
          </div>
        </div>
      </div>
    </div>
  );
}
