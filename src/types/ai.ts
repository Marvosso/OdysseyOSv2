export interface DetectedChapter {
  id: string;
  title: string;
  act: 'Act I' | 'Act II' | 'Act III' | 'None';
  startLine: number;
  endLine: number;
  content: string;
  confidence: number; // 0-1
}

export interface DetectedScene {
  id: string;
  chapterId: string;
  title: string;
  startLine: number;
  endLine: number;
  content: string;
  emotion: string;
  confidence: number;
}

export interface StructureDetection {
  chapters: DetectedChapter[];
  scenes: DetectedScene[];
  summary: string;
  suggestions: string[];
}
