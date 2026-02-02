'use client';

/**
 * Goals Panel
 * 
 * Manage and track writing goals
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import {
  getGoals,
  saveGoal,
  deleteGoal,
  getDailyGoalProgress,
  type WritingGoal,
} from '@/lib/analytics/goals';
import { getCurrentStoryStats } from '@/lib/analytics/writingMetrics';

export default function GoalsPanel() {
  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'daily' as WritingGoal['type'],
    target: 1000,
    deadline: '',
  });

  useEffect(() => {
    setGoals(getGoals());
  }, []);

  const handleAddGoal = () => {
    const goal: WritingGoal = {
      id: Date.now().toString(),
      type: newGoal.type,
      target: newGoal.target,
      current: 0,
      deadline: newGoal.deadline || undefined,
      createdAt: new Date().toISOString(),
    };

    saveGoal(goal);
    setGoals(getGoals());
    setShowAddGoal(false);
    setNewGoal({ type: 'daily', target: 1000, deadline: '' });
  };

  const handleDeleteGoal = (goalId: string) => {
    deleteGoal(goalId);
    setGoals(getGoals());
  };

  const dailyProgress = getDailyGoalProgress();
  const stats = getCurrentStoryStats();

  // Update goal progress
  useEffect(() => {
    const updateGoalProgress = (goalId: string, current: number) => {
      const goal = goals.find((g) => g.id === goalId);
      if (goal && goal.current !== current) {
        goal.current = current;
        saveGoal(goal);
        setGoals(getGoals());
      }
    };

    goals.forEach((goal) => {
      if (goal.type === 'total') {
        updateGoalProgress(goal.id, stats.totalWords);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.totalWords]);


  return (
    <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Writing Goals
        </h2>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {showAddGoal && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Goal Type</label>
              <select
                value={newGoal.type}
                onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as WritingGoal['type'] })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="total">Total Words</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Target Words</label>
              <input
                type="number"
                value={newGoal.target}
                onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Deadline (optional)</label>
              <input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddGoal}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
              >
                Save Goal
              </button>
              <button
                onClick={() => setShowAddGoal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Daily Goal Progress */}
      {dailyProgress.goal && (
        <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Today's Goal</span>
            <span className="text-sm text-gray-400">
              {dailyProgress.today} / {dailyProgress.goal.target} words
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-3 mb-2">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, dailyProgress.progress)}%` }}
            />
          </div>
          <div className="text-xs text-gray-400">
            {dailyProgress.remaining} words remaining
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal) => {
          const progress = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
          const isComplete = goal.current >= goal.target;

          return (
            <div
              key={goal.id}
              className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-white font-medium capitalize">{goal.type} Goal</span>
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    {goal.current.toLocaleString()} / {goal.target.toLocaleString()} words
                  </span>
                  <span className="text-gray-400">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isComplete ? 'bg-green-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>
              {goal.deadline && (
                <div className="text-xs text-gray-500">
                  Deadline: {new Date(goal.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No goals set. Create one to track your progress!
          </div>
        )}
      </div>
    </div>
  );
}
