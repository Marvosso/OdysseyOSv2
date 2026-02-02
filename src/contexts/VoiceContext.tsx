'use client';

/**
 * Voice Context
 * 
 * Global context for managing all voice narration instances
 * Provides centralized control to stop all voices
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ResponsiveVoiceService } from '@/lib/audio/responsiveVoiceService';

interface VoiceContextType {
  isPlaying: boolean;
  registerVoice: (id: string) => void;
  unregisterVoice: (id: string) => void;
  setPlaying: (id: string, playing: boolean) => void;
  stopAllVoices: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [playingVoices, setPlayingVoices] = useState<Set<string>>(new Set());
  const voiceService = ResponsiveVoiceService.getInstance();

  const registerVoice = useCallback((id: string) => {
    setPlayingVoices((prev) => new Set(prev).add(id));
  }, []);

  const unregisterVoice = useCallback((id: string) => {
    setPlayingVoices((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const setPlaying = useCallback((id: string, playing: boolean) => {
    setPlayingVoices((prev) => {
      const next = new Set(prev);
      if (playing) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const stopAllVoices = useCallback(() => {
    // Cancel ResponsiveVoice
    voiceService.cancel();
    
    // Clear all playing voices
    setPlayingVoices(new Set());
  }, [voiceService]);

  const isPlaying = playingVoices.size > 0 || voiceService.isSpeaking();

  return (
    <VoiceContext.Provider
      value={{
        isPlaying,
        registerVoice,
        unregisterVoice,
        setPlaying,
        stopAllVoices,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
