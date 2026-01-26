export interface Scene {
  id: string;
  title: string;
  content: string;
  position: number;
  emotion: EmotionType;
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
