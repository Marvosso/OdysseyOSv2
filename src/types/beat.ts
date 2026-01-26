export type BeatType = 
  | 'setup'
  | 'inciting-incident'
  | 'rising-action'
  | 'midpoint'
  | 'twist'
  | 'climax'
  | 'resolution'
  | 'character-moment'
  | 'theme'
  | 'world-building';

export interface StoryBeat {
  id: string;
  sceneId: string;
  beatType: BeatType;
  title: string;
  description: string;
  position: number;
  duration: number; // percentage of scene
  emotionalImpact: number; // 1-10
  importance: number; // 1-10
  conflicts: string[];
  resolutions: string[];
}

export interface BeatTemplate {
  name: string;
  description: string;
  structure: {
    acts: {
      name: string;
      beats: {
        type: BeatType;
        description: string;
        duration: number;
      }[];
    }[];
  };
}

export interface BeatAnalysis {
  balanceScore: number; // 0-100
  pacing: 'too-fast' | 'balanced' | 'too-slow';
  arcType: 'linear' | 'circular' | 'episodic' | 'spiral';
  recommendations: string[];
}
