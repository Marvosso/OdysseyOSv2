export interface StoryDNA {
  id: string;
  emotionalPattern: {
    dominantEmotion: string;
    emotionalRange: number;
    arcShape: 'rising' | 'falling' | 'mountain' | 'valley' | 'wave';
  };
  structuralPattern: {
    pacing: 'fast' | 'medium' | 'slow';
    complexity: number;
    actBalance: {
      act1: number;
      act2: number;
      act3: number;
    };
  };
  characterDynamics: {
    protagonistFocus: number; // percentage
    ensembleBalance: number; // 0-100
    relationshipComplexity: number;
  };
  thematicElements: {
    primaryThemes: string[];
    themeConsistency: number;
    subtextDepth: number;
  };
  genreMatch: {
    genre: string;
    confidence: number;
    similarWorks: string[];
  };
}

export interface Archetype {
  name: string;
  description: string;
  dnaSignature: Partial<StoryDNA>;
  famousExamples: string[];
}
