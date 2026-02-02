/**
 * Branch Storage
 * 
 * Manages story branches, version trees, and merging
 */

import type { Story, Scene } from '@/types/story';
import type { StoryBranch, BranchScene } from '@/types/branch';

const STORAGE_KEYS = {
  BRANCHES: 'odysseyos_branches',
  BRANCH_HISTORY: 'odysseyos_branch_history',
  MERGE_HISTORY: 'odysseyos_merge_history',
};

export interface BranchNode {
  id: string;
  branchId: string;
  parentBranchId: string | null;
  storyId: string;
  forkPoint: {
    sceneId: string;
    sceneIndex: number;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MergeResult {
  success: boolean;
  mergedScenes: Scene[];
  conflicts: MergeConflict[];
  mergedAt: Date;
}

export interface MergeConflict {
  sceneId: string;
  type: 'content' | 'order' | 'deletion' | 'addition';
  description: string;
  branch1Value?: any;
  branch2Value?: any;
  resolution?: 'branch1' | 'branch2' | 'manual' | 'both';
}

export class BranchStorage {
  /**
   * Save a branch
   */
  static saveBranch(branch: StoryBranch): void {
    try {
      const branches = this.loadAllBranches();
      const existingIndex = branches.findIndex((b) => b.id === branch.id);
      
      if (existingIndex >= 0) {
        branches[existingIndex] = branch;
      } else {
        branches.push(branch);
      }
      
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
    } catch (error) {
      console.error('Error saving branch:', error);
    }
  }

  /**
   * Load all branches for a story
   */
  static loadBranchesForStory(storyId: string): StoryBranch[] {
    const branches = this.loadAllBranches();
    return branches.filter((b) => {
      // Check if branch belongs to this story (via scenes or metadata)
      return b.scenes.some((s) => s.storyId === storyId) || 
             (b as any).storyId === storyId;
    });
  }

  /**
   * Load all branches
   */
  static loadAllBranches(): StoryBranch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANCHES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading branches:', error);
      return [];
    }
  }

  /**
   * Load a specific branch
   */
  static loadBranch(branchId: string): StoryBranch | null {
    const branches = this.loadAllBranches();
    return branches.find((b) => b.id === branchId) || null;
  }

  /**
   * Delete a branch
   */
  static deleteBranch(branchId: string): void {
    try {
      const branches = this.loadAllBranches();
      const filtered = branches.filter((b) => b.id !== branchId);
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting branch:', error);
    }
  }

  /**
   * Create a new branch from a story at a specific scene
   */
  static createBranch(
    story: Story,
    forkPointSceneId: string,
    branchName: string,
    description: string
  ): StoryBranch {
    const forkPointIndex = story.scenes.findIndex((s) => s.id === forkPointSceneId);
    
    if (forkPointIndex === -1) {
      throw new Error(`Scene ${forkPointSceneId} not found in story`);
    }

    // Get scenes up to and including the fork point
    const scenesUpToFork = story.scenes.slice(0, forkPointIndex + 1);
    
    // Create branch scenes
    const branchScenes: BranchScene[] = scenesUpToFork.map((scene) => ({
      id: `branch-${Date.now()}-${scene.id}`,
      originalSceneId: scene.id,
      title: scene.title,
      content: scene.content,
      position: scene.position,
      emotion: scene.emotion,
      status: scene.status,
      wordCount: scene.wordCount,
      povCharacter: scene.povCharacter,
      location: scene.location,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const branch: StoryBranch = {
      id: `branch-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: branchName,
      description,
      parentId: null, // Main branch has no parent
      isMain: false,
      createdAt: new Date(),
      divergencePoint: {
        sceneId: forkPointSceneId,
        changeDescription: description,
      },
      scenes: branchScenes,
    };

    this.saveBranch(branch);
    return branch;
  }

  /**
   * Get branch tree structure
   */
  static getBranchTree(storyId: string): BranchNode[] {
    const branches = this.loadBranchesForStory(storyId);
    const nodes: BranchNode[] = [];

    branches.forEach((branch) => {
      // Find the original scene to get its index
      const firstScene = branch.scenes[0];
      if (firstScene?.originalSceneId) {
        nodes.push({
          id: branch.id,
          branchId: branch.id,
          parentBranchId: branch.parentId,
          storyId,
          forkPoint: {
            sceneId: branch.divergencePoint.sceneId,
            sceneIndex: 0, // Will be calculated from story
            timestamp: branch.createdAt,
          },
          createdAt: branch.createdAt,
          updatedAt: branch.updatedAt || branch.createdAt,
        });
      }
    });

    return nodes;
  }

  /**
   * Smart merge algorithm
   */
  static mergeBranches(
    mainStory: Story,
    branch: StoryBranch,
    mergeStrategy: 'theirs' | 'ours' | 'smart' = 'smart'
  ): MergeResult {
    const conflicts: MergeConflict[] = [];
    const mergedScenes: Scene[] = [];

    // Find fork point in main story
    const forkPointIndex = mainStory.scenes.findIndex(
      (s) => s.id === branch.divergencePoint.sceneId
    );

    if (forkPointIndex === -1) {
      return {
        success: false,
        mergedScenes: [],
        conflicts: [{
          sceneId: branch.divergencePoint.sceneId,
          type: 'addition',
          description: 'Fork point scene not found in main story',
        }],
        mergedAt: new Date(),
      };
    }

    // Keep scenes before fork point from main
    mergedScenes.push(...mainStory.scenes.slice(0, forkPointIndex + 1));

    // Handle branch scenes
    branch.scenes.forEach((branchScene, index) => {
      if (index <= forkPointIndex && branchScene.originalSceneId) {
        // Scene exists in both - check for conflicts
        const mainScene = mainStory.scenes.find(
          (s) => s.id === branchScene.originalSceneId
        );

        if (mainScene) {
          if (mainScene.content !== branchScene.content) {
            conflicts.push({
              sceneId: branchScene.originalSceneId,
              type: 'content',
              description: 'Content differs between branches',
              branch1Value: mainScene.content,
              branch2Value: branchScene.content,
            });

            // Resolve based on strategy
            if (mergeStrategy === 'theirs') {
              mergedScenes.push({
                ...mainScene,
                content: branchScene.content,
                updatedAt: new Date(),
              });
            } else if (mergeStrategy === 'ours') {
              mergedScenes.push(mainScene);
            } else {
              // Smart merge: keep longer/more detailed version
              const mergedContent = mainScene.content.length > branchScene.content.length
                ? mainScene.content
                : branchScene.content;
              mergedScenes.push({
                ...mainScene,
                content: mergedContent,
                updatedAt: new Date(),
              });
            }
          } else {
            mergedScenes.push(mainScene);
          }
        }
      } else {
        // New scene from branch
        mergedScenes.push({
          id: branchScene.originalSceneId || branchScene.id,
          title: branchScene.title,
          content: branchScene.content,
          position: mergedScenes.length,
          emotion: branchScene.emotion as any,
          status: branchScene.status,
          wordCount: branchScene.wordCount,
          povCharacter: branchScene.povCharacter,
          location: branchScene.location,
          createdAt: branchScene.createdAt,
          updatedAt: branchScene.updatedAt,
        });
      }
    });

    // Save merge history
    this.saveMergeHistory({
      branchId: branch.id,
      storyId: mainStory.id,
      mergeStrategy,
      conflicts,
      mergedAt: new Date(),
    });

    return {
      success: conflicts.length === 0 || mergeStrategy !== 'smart',
      mergedScenes,
      conflicts,
      mergedAt: new Date(),
    };
  }

  /**
   * Save merge history
   */
  private static saveMergeHistory(merge: {
    branchId: string;
    storyId: string;
    mergeStrategy: string;
    conflicts: MergeConflict[];
    mergedAt: Date;
  }): void {
    try {
      const history = this.loadMergeHistory();
      history.push(merge);
      localStorage.setItem(STORAGE_KEYS.MERGE_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving merge history:', error);
    }
  }

  /**
   * Load merge history
   */
  static loadMergeHistory(): Array<{
    branchId: string;
    storyId: string;
    mergeStrategy: string;
    conflicts: MergeConflict[];
    mergedAt: Date;
  }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MERGE_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading merge history:', error);
      return [];
    }
  }
}
