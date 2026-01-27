export type SceneStatus = 'draft' | 'revised' | 'final';

export interface Scene {
  id: string;
  title: string;
  content: string;
  position: number;
  emotion: EmotionType;
  status: SceneStatus;
  wordCount?: number; // Computed word count
  povCharacter?: string; // Point of view character
  location?: string; // Scene location
  createdAt: Date;
  updatedAt?: Date;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  goals: string[];
  flaws: string[];
  relationships: CharacterRelationship[];
}

export interface Story {
  id: string;
  title: string;
  scenes: Scene[];
  characters: Character[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  scenes: Scene[];
}

export type EmotionType =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'neutral';

export interface CharacterRelationship {
  characterId: string;
  relationship: string;
  intensity: number; // 1-10
}
