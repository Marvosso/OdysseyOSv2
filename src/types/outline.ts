export interface OutlinePoint {
  id: string;
  title: string;
  description: string;
  position: number;
  chapterId?: string;
  estimatedScenes?: number;
  emotionalTone?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  points: OutlinePoint[]; scenes?: string[];
  position: number;
}

export interface StoryOutline {
  id: string;
  storyId: string;
  chapters: Chapter[];
  storyPremise: string;
  theme: string;
  targetAudience: string;
  genre: string;
  estimatedWordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutlineTemplate {
  id: string;
  name: string;
  description: string;
  chapters: Omit<Chapter, 'id'>[];
}
