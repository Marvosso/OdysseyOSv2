export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'mentor' | 'love-interest' | 'comic-relief' | 'other';
  age: number;
  appearance: string;
  personality: string;
  background: string;
  motivation: string;
  flaw: string;
  arcStatus: 'unstarted' | 'beginning' | 'middle' | 'complete';
}

export interface CharacterRelationship {
  id: string;
  characterId: string;
  relatedCharacterId: string;
  relationshipType: string;
  intensity: number; // 1-10
  notes: string;
}

export interface CharacterArc {
  id: string;
  characterId: string;
  chapterId?: string;
  state: 'starting' | 'developing' | 'crisis' | 'resolution';
  notes: string;
  timestamp: Date;
}
