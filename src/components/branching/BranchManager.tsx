import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Plus, Trash2, X } from 'lucide-react';
import type { StoryBranch } from '@/types/branch';

export default function BranchManager({ story, onBranch }: { story: any; onBranch: (branch: StoryBranch) => void }) {
  const [branches, setBranches] = useState<StoryBranch[]>(story?.branches || []);
  const [activeBranch, setActiveBranch] = useState<string | null>(story?.activeBranch || null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;

    const branch: StoryBranch = {
      id: `branch-${Date.now()}`,
      name: newBranchName,
      description: `Branch created on ${new Date().toLocaleDateString()}`,
      parentId: story?.id || null,
      isMain: false,
      createdAt: new Date(),
      divergencePoint: {
        sceneId: story?.activeSceneId || '',
        changeDescription: 'New branch created',
      },
      scenes: [],
    };

    const updated = [...branches, branch];
    setBranches(updated);
    setActiveBranch(branch.id);
    onBranch(branch);
    setIsCreating(false);
    setNewBranchName('');
  };

  const handleSwitchBranch = (branchId: string) => {
    setActiveBranch(branchId);
  };

  const handleDeleteBranch = (branchId: string) => {
    const updated = branches.filter(b => b.id !== branchId);
    setBranches(updated);
    if (activeBranch === branchId) {
      setActiveBranch(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          Branches
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          New Branch
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">Create New Branch</h4>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 hover:bg-black/20 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="Branch name..."
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleCreateBranch}
              disabled={!newBranchName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg py-2"
            >
              Create Branch
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <AnimatePresence>
          {branches.map((branch) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                activeBranch === branch.id
                  ? 'bg-purple-500/20 border border-purple-500/50'
                  : 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1" onClick={() => handleSwitchBranch(branch.id)}>
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="w-4 h-4 text-purple-400" />
                    <h4 className="font-medium text-white">{branch.name}</h4>
                    {activeBranch === branch.id && (
                      <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{branch.scenes?.length || 0} scenes</span>
                    <span>•</span>
                    <span>{branch.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBranch(branch.id);
                  }}
                  className="p-1 hover:bg-red-500/20 rounded"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {branches.length === 0 && (
        <div className="p-6 bg-gray-800/50 rounded-lg text-center">
          <GitBranch className="w-12 h-12 mx-auto text-gray-600 mb-2" />
          <p className="text-gray-400 text-sm">Create branches to explore different story directions</p>
        </div>
      )}
    </div>
  );
}
