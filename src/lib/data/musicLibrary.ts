import type { MusicTrack, MoodProfile } from '@/types/music';

export const musicLibrary: MusicTrack[] = [
  {
    id: '1',
    title: 'Epic Adventure',
    artist: 'Cinematic Orchestra',
    duration: 240,
    mood: ['triumph', 'determination', 'excitement'],
    energy: 8,
    tempo: 120,
    genre: 'Cinematic',
  },
  {
    id: '2',
    title: 'Mysterious Winds',
    artist: 'Ambient Dreams',
    duration: 300,
    mood: ['mystery', 'suspense', 'wonder'],
    energy: 4,
    tempo: 80,
    genre: 'Ambient',
  },
  {
    id: '3',
    title: 'Romantic Sunset',
    artist: 'Strings Ensemble',
    duration: 180,
    mood: ['love', 'romance', 'tenderness'],
    energy: 3,
    tempo: 70,
    genre: 'Classical',
  },
  {
    id: '4',
    title: 'Dark Tension',
    artist: 'Horror Score',
    duration: 210,
    mood: ['fear', 'suspense', 'tension'],
    energy: 6,
    tempo: 90,
    genre: 'Horror',
  },
  {
    id: '5',
    title: 'Joyful Morning',
    artist: 'Uplifting Tunes',
    duration: 200,
    mood: ['joy', 'happiness', 'hope'],
    energy: 7,
    tempo: 110,
    genre: 'Pop',
  },
  {
    id: '6',
    title: 'Melancholic Rain',
    artist: 'Sad Piano',
    duration: 250,
    mood: ['sadness', 'melancholy', 'nostalgia'],
    energy: 2,
    tempo: 60,
    genre: 'Ambient',
  },
  {
    id: '7',
    title: 'Battle Cry',
    artist: 'Epic Percussion',
    duration: 190,
    mood: ['anger', 'determination', 'power'],
    energy: 9,
    tempo: 130,
    genre: 'Action',
  },
  {
    id: '8',
    title: 'Peaceful Forest',
    artist: 'Nature Sounds',
    duration: 320,
    mood: ['peace', 'serenity', 'calm'],
    energy: 2,
    tempo: 70,
    genre: 'Ambient',
  },
];

export const moodProfiles: MoodProfile[] = [
  {
    mood: 'triumph',
    characteristics: 'Victorious, overcoming obstacles, heroic',
    suggestedTracks: ['1', '7'],
  },
  {
    mood: 'mystery',
    characteristics: 'Unknown, suspenseful, curious',
    suggestedTracks: ['2', '4'],
  },
  {
    mood: 'love',
    characteristics: 'Romantic, tender, intimate',
    suggestedTracks: ['3'],
  },
  {
    mood: 'fear',
    characteristics: 'Scary, tense, anxious',
    suggestedTracks: ['4'],
  },
  {
    mood: 'joy',
    characteristics: 'Happy, uplifting, optimistic',
    suggestedTracks: ['5', '8'],
  },
  {
    mood: 'sadness',
    characteristics: 'Sad, melancholic, reflective',
    suggestedTracks: ['6'],
  },
  {
    mood: 'anger',
    characteristics: 'Furious, intense, aggressive',
    suggestedTracks: ['7'],
  },
  {
    mood: 'peace',
    characteristics: 'Calm, serene, tranquil',
    suggestedTracks: ['8'],
  },
];

export const getMusicForEmotion = (emotion: string): MusicTrack[] => {
  const mood = emotion.toLowerCase();
  const profile = moodProfiles.find(p => p.mood === mood || mood.includes(p.mood));
  
  if (!profile) {
    return musicLibrary.slice(0, 3);
  }

  return musicLibrary.filter(track => profile.suggestedTracks.includes(track.id));
};

export const getMusicForEnergyLevel = (energy: number): MusicTrack[] => {
  return musicLibrary.filter(track => 
    Math.abs(track.energy - energy) <= 2
  ).slice(0, 5);
};
