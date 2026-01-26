export interface StoryBranch {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  isMain: boolean;
  createdAt: Date;
  divergencePoint: {
    sceneId: string;
    beatId?: string;
    changeDescription: string;
  };
  scenes: BranchScene[];
}

export interface BranchScene {
  id: string;
  originalSceneId?: string; // if this diverges from main
  content: string;
  beats: string[];
  metadata: {
    wordCount: number;
    emotion: string;
    conflictLevel: number;
  };
}

export interface BranchComparison {
  branchA: StoryBranch;
  branchB: StoryBranch;
  differences: {
    addedScenes: number;
    changedScenes: number;
    deletedScenes: number;
    thematicDifferences: string[];
    toneShift: number; // -10 to +10
  };
}

export interface MergeConflict {
  sceneId: string;
  conflictType: 'content' | 'order' | 'deletion';
  branchAVersion: string;
  branchBVersion: string;
  resolution?: 'A' | 'B' | 'merged';
}
