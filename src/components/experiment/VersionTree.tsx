'use client';

/**
 * Version Tree Visualization
 * 
 * Visualizes the branching structure of story versions
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, GitMerge, Circle } from 'lucide-react';
import type { StoryBranch } from '@/types/branch';
import type { BranchNode } from '@/lib/storage/branchStorage';

interface VersionTreeProps {
  branches: StoryBranch[];
  storyId: string;
  onBranchSelect?: (branchId: string) => void;
}

export default function VersionTree({
  branches,
  storyId,
  onBranchSelect,
}: VersionTreeProps) {
  // Build tree structure
  const tree = useMemo(() => {
    const nodes: Array<BranchNode & { branch: StoryBranch; children: string[] }> = [];
    const nodeMap = new Map<string, typeof nodes[0]>();

    // Create nodes
    branches.forEach((branch) => {
      const node: typeof nodes[0] = {
        id: branch.id,
        branchId: branch.id,
        parentBranchId: branch.parentId,
        storyId,
        forkPoint: {
          sceneId: branch.divergencePoint.sceneId,
          sceneIndex: 0,
          timestamp: branch.createdAt,
        },
        createdAt: branch.createdAt,
        updatedAt: (branch.updatedAt || branch.createdAt) as Date,
        branch,
        children: [],
      };
      nodes.push(node);
      nodeMap.set(branch.id, node);
    });

    // Build parent-child relationships
    nodes.forEach((node) => {
      if (node.parentBranchId) {
        const parent = nodeMap.get(node.parentBranchId);
        if (parent) {
          parent.children.push(node.id);
        }
      }
    });

    // Find root nodes (no parent)
    const roots = nodes.filter((node) => !node.parentBranchId);

    return { nodes, roots, nodeMap };
  }, [branches, storyId]);

  const renderNode = (nodeId: string, depth: number = 0): JSX.Element | null => {
    const node = tree.nodeMap.get(nodeId);
    if (!node) return null;

    const hasChildren = node.children.length > 0;
    const isMain = node.branch.isMain;

    return (
      <div key={nodeId} className="relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-4"
          style={{ marginLeft: `${depth * 40}px` }}
        >
          {/* Connection Line */}
          {depth > 0 && (
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-600" style={{ marginLeft: `${(depth - 1) * 40 + 20}px` }} />
          )}

          {/* Node */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              isMain
                ? 'bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30'
                : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
            }`}
            onClick={() => onBranchSelect?.(nodeId)}
          >
            {isMain ? (
              <GitBranch className="w-4 h-4 text-purple-400" />
            ) : (
              <Circle className="w-3 h-3 text-gray-400" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm truncate">
                {node.branch.name}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {new Date(node.createdAt).toLocaleDateString()}
              </div>
            </div>
            {hasChildren && (
              <div className="text-xs text-gray-500">
                {node.children.length} branch{node.children.length !== 1 ? 'es' : ''}
              </div>
            )}
          </div>
        </motion.div>

        {/* Children */}
        {hasChildren && (
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-px bg-gray-600"
              style={{ marginLeft: `${depth * 40 + 20}px` }}
            />
            <div className="pl-8">
              {node.children.map((childId) => renderNode(childId, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (tree.roots.length === 0) {
    return (
      <div className="p-8 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
        <GitBranch className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No branches to visualize</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-purple-400" />
        Version Tree
      </h4>
      <div className="space-y-2">
        {tree.roots.map((root) => renderNode(root.id, 0))}
      </div>
    </div>
  );
}
