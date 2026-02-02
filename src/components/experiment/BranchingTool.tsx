'use client';

/**
 * Branching Tool Component
 * 
 * Allows users to:
 * - Fork story at any scene
 * - Track multiple story branches
 * - Compare branches side-by-side
 * - Merge changes back to main
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  GitMerge,
  GitCompare,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Users,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Eye,
} from 'lucide-react';
import type { Story, Scene } from '@/types/story';
import type { StoryBranch } from '@/types/branch';
import { BranchStorage } from '@/lib/storage/branchStorage';
import {
  CharacterSwapGenerator,
  GenreShiftTransformer,
  PlotTwistSuggester,
} from '@/lib/experiment/storyTransformers';
import { StoryStorage } from '@/lib/storage/storyStorage';
import VersionTree from './VersionTree';

interface BranchingToolProps {
  story: Story;
  onStoryUpdate?: (story: Story) => void;
  onClose?: () => void;
}

export default function BranchingTool({
  story,
  onStoryUpdate,
  onClose,
}: BranchingToolProps) {
  const [branches, setBranches] = useState<StoryBranch[]>(() =>
    BranchStorage.loadBranchesForStory(story.id)
  );
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonBranch, setComparisonBranch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'branches' | 'experiments'>('branches');
  const [forkPointScene, setForkPointScene] = useState<string | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchDescription, setBranchDescription] = useState('');

  // Load branches when story changes
  const refreshBranches = () => {
    setBranches(BranchStorage.loadBranchesForStory(story.id));
  };

  // Create new branch
  const handleCreateBranch = () => {
    if (!forkPointScene || !branchName.trim()) {
      return;
    }

    try {
      const branch = BranchStorage.createBranch(
        story,
        forkPointScene,
        branchName,
        branchDescription || 'No description'
      );
      
      setBranches([...branches, branch]);
      setShowCreateBranch(false);
      setForkPointScene(null);
      setBranchName('');
      setBranchDescription('');
    } catch (error) {
      console.error('Error creating branch:', error);
    }
  };

  // Merge branch back to main
  const handleMergeBranch = async (branchId: string, strategy: 'theirs' | 'ours' | 'smart') => {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return;

    const mergeResult = BranchStorage.mergeBranches(story, branch, strategy);

    if (mergeResult.success || mergeResult.conflicts.length === 0) {
      // Update story with merged scenes
      const updatedStory: Story = {
        ...story,
        scenes: mergeResult.mergedScenes,
        updatedAt: new Date(),
      };

      StoryStorage.saveStory(updatedStory);
      StoryStorage.saveScenes(mergeResult.mergedScenes);
      onStoryUpdate?.(updatedStory);

      // Remove merged branch
      BranchStorage.deleteBranch(branchId);
      refreshBranches();
    } else {
      // Show conflicts
      alert(`Merge conflicts detected: ${mergeResult.conflicts.length} conflicts need resolution`);
    }
  };

  // Character swap suggestions
  const characterSwaps = useMemo(() => {
    return CharacterSwapGenerator.generateSwaps(story);
  }, [story]);

  // Plot twist suggestions
  const plotTwists = useMemo(() => {
    return PlotTwistSuggester.suggestTwists(story);
  }, [story]);

  const selectedBranchData = branches.find((b) => b.id === selectedBranch);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Story Branches</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'branches'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4 inline mr-2" />
          Branches ({branches.length})
        </button>
        <button
          onClick={() => setActiveTab('experiments')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'experiments'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Experiments
        </button>
      </div>

      {/* Version Tree */}
      {branches.length > 0 && (
        <VersionTree
          branches={branches}
          storyId={story.id}
          onBranchSelect={(branchId) => setSelectedBranch(branchId)}
        />
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          {/* Create Branch Button */}
          <button
            onClick={() => setShowCreateBranch(!showCreateBranch)}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Branch
          </button>

          {/* Create Branch Form */}
          <AnimatePresence>
            {showCreateBranch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3"
              >
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fork Point Scene</label>
                  <select
                    value={forkPointScene || ''}
                    onChange={(e) => setForkPointScene(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a scene...</option>
                    {story.scenes.map((scene) => (
                      <option key={scene.id} value={scene.id}>
                        {scene.title || `Scene ${scene.position + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g., Alternate Ending"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={branchDescription}
                    onChange={(e) => setBranchDescription(e.target.value)}
                    placeholder="Describe what changes in this branch..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateBranch}
                    disabled={!forkPointScene || !branchName.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                  >
                    Create Branch
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateBranch(false);
                      setForkPointScene(null);
                      setBranchName('');
                      setBranchDescription('');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Branches List */}
          {branches.length === 0 ? (
            <div className="p-8 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
              <GitBranch className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No branches yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Create a branch to experiment with alternate storylines
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{branch.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{branch.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{branch.scenes.length} scenes</span>
                        <span>
                          Forked at: {story.scenes.find((s) => s.id === branch.divergencePoint.sceneId)?.title || 'Unknown'}
                        </span>
                        <span>
                          {new Date(branch.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBranch(selectedBranch === branch.id ? null : branch.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="View branch"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          setComparisonBranch(branch.id);
                          setShowComparison(true);
                        }}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Compare with main"
                      >
                        <GitCompare className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleMergeBranch(branch.id, 'smart')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Merge to main"
                      >
                        <GitMerge className="w-4 h-4 text-purple-400" />
                      </button>
                    </div>
                  </div>

                  {/* Branch Details */}
                  <AnimatePresence>
                    {selectedBranch === branch.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-gray-700 space-y-2"
                      >
                        <div className="text-sm text-gray-300">
                          <strong>Divergence Point:</strong>{' '}
                          {branch.divergencePoint.changeDescription}
                        </div>
                        <div className="text-sm text-gray-300">
                          <strong>Scenes:</strong> {branch.scenes.length}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Experiments Tab */}
      {activeTab === 'experiments' && (
        <div className="space-y-4">
          {/* Character Swap */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Character Swap Generator
            </h4>
            {characterSwaps.length === 0 ? (
              <p className="text-sm text-gray-400">No character swap suggestions available</p>
            ) : (
              <div className="space-y-2">
                {characterSwaps.slice(0, 3).map((swap, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-700/50 rounded border border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">{swap.originalCharacter}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 inline mx-2" />
                        <span className="text-purple-300 font-medium">{swap.newCharacter}</span>
                      </div>
                      <button
                        onClick={() => {
                          const updatedStory = CharacterSwapGenerator.applySwap(
                            story,
                            swap.originalCharacter,
                            swap.newCharacter
                          );
                          onStoryUpdate?.(updatedStory);
                        }}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                      >
                        Apply Swap
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Affects {swap.scenes.length} scene(s)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Genre Shift */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Genre Shift Transformer
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {['fantasy', 'sciFi', 'mystery', 'romance', 'horror'].map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    try {
                      const shift = GenreShiftTransformer.transform(story, genre);
                      // Apply transformations to story
                      const updatedScenes = story.scenes.map((scene) => {
                        const transformation = shift.transformations.find(
                          (t) => t.sceneId === scene.id
                        );
                        if (transformation) {
                          return {
                            ...scene,
                            content: transformation.transformedText,
                            updatedAt: new Date(),
                          };
                        }
                        return scene;
                      });
                      const updatedStory: Story = {
                        ...story,
                        scenes: updatedScenes,
                        updatedAt: new Date(),
                      };
                      onStoryUpdate?.(updatedStory);
                    } catch (error) {
                      console.error('Error applying genre shift:', error);
                    }
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors capitalize"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Plot Twist Suggester */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
              Plot Twist Suggester
            </h4>
            <div className="space-y-2">
              {plotTwists.map((twist, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-700/50 rounded border border-gray-600"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 text-xs rounded capitalize">
                          {twist.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {Math.round(twist.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-white">{twist.description}</p>
                      <div className="mt-2 text-xs text-gray-400">
                        <strong>Impact:</strong> {twist.impact.join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const updatedStory = PlotTwistSuggester.applyTwist(story, twist);
                        onStoryUpdate?.(updatedStory);
                      }}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors whitespace-nowrap"
                    >
                      Apply Twist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      <AnimatePresence>
        {showComparison && comparisonBranch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowComparison(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gray-800 rounded-lg border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Branch Comparison</h3>
                <button
                  onClick={() => setShowComparison(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">Main Story</h4>
                  <div className="space-y-2">
                    {story.scenes.map((scene) => (
                      <div
                        key={scene.id}
                        className="p-2 bg-gray-700/50 rounded text-sm text-gray-300"
                      >
                        {scene.title || `Scene ${scene.position + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">
                    {branches.find((b) => b.id === comparisonBranch)?.name || 'Branch'}
                  </h4>
                  <div className="space-y-2">
                    {branches
                      .find((b) => b.id === comparisonBranch)
                      ?.scenes.map((scene) => (
                        <div
                          key={scene.id}
                          className="p-2 bg-purple-700/50 rounded text-sm text-gray-300"
                        >
                          {scene.title || `Scene ${scene.position}`}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
