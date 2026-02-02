'use client';

/**
 * SimpleVoicePlayer Component
 * 
 * Clean, simple voice narration component using ResponsiveVoice
 * Replaces browser SpeechSynthesis
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { ResponsiveVoiceService, ResponsiveVoiceOptions } from '@/lib/audio/responsiveVoiceService';

export interface SimpleVoicePlayerProps {
  text: string;
  voice?: string;
  rate?: number; // 0.1 to 1.0
  pitch?: number; // 0.5 to 2.0
  volume?: number; // 0.0 to 1.0
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function SimpleVoicePlayer({
  text,
  voice = 'UK English Female',
  rate = 1,
  pitch = 1,
  volume = 1,
  autoPlay = false,
  onStart,
  onEnd,
  onError,
  className = '',
}: SimpleVoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const voiceServiceRef = useRef(ResponsiveVoiceService.getInstance());

  useEffect(() => {
    // Auto-play if enabled
    if (autoPlay && text && !isPlaying) {
      handlePlay();
    }
  }, [autoPlay, text]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      voiceServiceRef.current.cancel();
    };
  }, []);

  const handlePlay = useCallback(async () => {
    if (!text.trim()) return;

    try {
      setIsPlaying(true);
      setIsPaused(false);

      const options: ResponsiveVoiceOptions = {
        rate: isMuted ? 0 : rate,
        pitch,
        volume: isMuted ? 0 : currentVolume,
        onstart: () => {
          setIsPlaying(true);
          onStart?.();
        },
        onend: () => {
          setIsPlaying(false);
          setIsPaused(false);
          onEnd?.();
        },
        onerror: (error) => {
          setIsPlaying(false);
          setIsPaused(false);
          onError?.(error instanceof Error ? error : new Error(String(error)));
        },
      };

      await voiceServiceRef.current.speak(text, voice, options);
    } catch (error) {
      setIsPlaying(false);
      setIsPaused(false);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [text, voice, rate, pitch, currentVolume, isMuted, onStart, onEnd, onError]);

  const handlePause = useCallback(() => {
    // ResponsiveVoice doesn't have pause, so we cancel
    voiceServiceRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const handleStop = useCallback(() => {
    voiceServiceRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    // If currently playing, restart with new volume
    if (isPlaying) {
      handleStop();
      setTimeout(() => handlePlay(), 100);
    }
  }, [isMuted, isPlaying, handlePlay, handleStop]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setCurrentVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    // If currently playing, restart with new volume
    if (isPlaying) {
      handleStop();
      setTimeout(() => handlePlay(), 100);
    }
  }, [isMuted, isPlaying, handlePlay, handleStop]);

  if (!text.trim()) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Play/Pause Button */}
      {!isPlaying ? (
        <button
          onClick={handlePlay}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
          title="Play"
        >
          <Play className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handlePause}
          className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full transition-colors"
          title="Pause"
        >
          <Pause className="w-4 h-4" />
        </button>
      )}

      {/* Stop Button */}
      {(isPlaying || isPaused) && (
        <button
          onClick={handleStop}
          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
          title="Stop"
        >
          <Square className="w-4 h-4" />
        </button>
      )}

      {/* Volume Control */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleToggleMute}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : currentVolume}
          onChange={handleVolumeChange}
          className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    </div>
  );
}
