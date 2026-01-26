import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, Target, TrendingUp, Award } from 'lucide-react';

export default function StreakTracker(_story: any) {
  const [streaks] = useState({
    current: 7,
    best: 21,
    totalDays: 45,
  });
  const [stats] = useState({
    totalWords: 45000,
    totalScenes: 32,
    consistencyScore: 78,
  });
  const [dailyGoal, _setDailyGoal] = useState(500);

  const getStreakColor = (current: number) => {
    if (current >= 20) return 'text-orange-500';
    if (current >= 10) return 'text-red-500';
    if (current >= 5) return 'text-yellow-500';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Flame className={`w-5 h-5 ${getStreakColor(streaks.current)}`} />
          Writing Streaks
        </h3>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-400">Best:</span>
          <span className="text-white font-medium">{streaks.best}</span>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-lg p-4 border border-orange-500/20"
      >
        <div className="text-center">
          <div className={`text-4xl font-bold ${getStreakColor(streaks.current)} mb-1`}>
            {streaks.current}
          </div>
          <p className="text-sm text-gray-400">Day Streak</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <Award className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{streaks.totalDays}</div>
            <div className="text-xs text-gray-500">Total Days</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{stats.consistencyScore}%</div>
            <div className="text-xs text-gray-500">Consistency</div>
          </div>
        </div>
      </motion.div>

      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-400">Daily Goal</span>
          <span className="text-sm text-white ml-auto">{dailyGoal} words</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progress Today</span>
            <span>425 / 500 words</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-400">Last 7 Days</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <motion.div
              key={day}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                idx < 5
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-700/50 text-gray-600'
              }`}
            >
              {day}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
