export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  mood: string[];
  energy: number; // 0-10
  tempo: number;
  genre: string;
  url?: string;
  previewUrl?: string;
}

export interface SceneMusic {
  sceneId: string;
  tracks: MusicTrack[];
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}

export interface MoodProfile {
  mood: string;
  characteristics: string;
  suggestedTracks: string[];
}
