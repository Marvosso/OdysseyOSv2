export interface WorldElement {
  id: string;
  type: 'location' | 'culture' | 'magic-system' | 'technology' | 'politics' | 'economy' | 'religion';
  name: string;
  description: string;
  rules: string[];
  connections: WorldConnection[];
  relatedScenes: string[];
  relatedCharacters: string[];
  consistencyNotes: string[];
  imageUrl?: string;
}

export interface WorldConnection {
  targetId: string;
  relationship: string;
  strength: number;
}

export interface WorldMapNode {
  id: string;
  elementId: string;
  position: { x: number; y: number };
  connections: string[];
}

export interface ConsistencyCheck {
  elementId: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  sceneId?: string;
  suggestion: string;
}
