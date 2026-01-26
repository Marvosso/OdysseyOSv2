export interface CharacterVoice {
  characterId: string;
  speechPattern: {
    averageWordsPerSentence: number;
    vocabularyComplexity: number;
    formalityLevel: number;
    questionFrequency: number;
  };
  commonPhrases: string[];
  sentenceStructures: string[];
  emotionalMarkers: {
    emotion: string;
    indicatorWords: string[];
  }[];
  examples: VoiceExample[];
}

export interface VoiceExample {
  text: string;
  emotion: string;
  context: string;
  analysis: {
    matchesPattern: boolean;
    deviations: string[];
    confidence: number;
  };
}

export interface VoiceAnalysisResult {
  overallMatch: number;
  breakdown: {
    sentenceStructure: number;
    vocabulary: number;
    tone: number;
    content: number;
  };
  suggestions: string[];
}
