'use client';

import { VolumeX } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';

export default function GlobalVoiceStop() {
  const { isPlaying, stopAllVoices } = useVoice();
  
  if (!isPlaying) return null;
  
  return (
    <button
      onClick={stopAllVoices}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
      title="Stop all narration"
    >
      <VolumeX className="w-5 h-5" />
      Stop Voice
    </button>
  );
}
