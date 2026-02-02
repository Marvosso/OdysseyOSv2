'use client';

/**
 * Narration Controls Component
 * 
 * Provides UI for controlling text-to-speech narration using ResponsiveVoice
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, Gauge } from 'lucide-react';
import { ResponsiveVoiceService, ResponsiveVoiceOptions } from '@/lib/audio/responsiveVoiceService';
import { findWordIndexFromCharPosition, createHighlightedHTML } from '@/lib/narration/textHighlighter';

export interface NarrationControlsProps {
  text: string;
  onHighlightChange?: (highlightedHTML: string) => void;
  className?: string;
}

// ResponsiveVoice voice names (common ones)
const RESPONSIVE_VOICE_OPTIONS = [
  { name: 'UK English Female', value: 'UK English Female' },
  { name: 'US English Female', value: 'US English Female' },
  { name: 'UK English Male', value: 'UK English Male' },
  { name: 'US English Male', value: 'US English Male' },
  { name: 'Australian Female', value: 'Australian Female' },
  { name: 'Australian Male', value: 'Australian Male' },
];

export default function NarrationControls({
  text,
  onHighlightChange,
  className = '',
}: NarrationControlsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('UK English Female');
  const [rate, setRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  
  const voiceServiceRef = useRef(ResponsiveVoiceService.getInstance());
  const textRef = useRef(text);
  const wordHighlightIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update text ref when text changes
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Check if ResponsiveVoice is available
  useEffect(() => {
    const checkSupport = async () => {
      await voiceServiceRef.current.waitForResponsiveVoice();
      const available = voiceServiceRef.current.isAvailable();
      setIsSupported(available);
    };

    checkSupport();
  }, []);

  // Simulate word-by-word highlighting (ResponsiveVoice doesn't provide boundary events)
  const startWordHighlighting = useCallback(() => {
    if (wordHighlightIntervalRef.current) {
      clearInterval(wordHighlightIntervalRef.current);
    }

    const words = textRef.current.split(/\s+/);
    let currentIndex = 0;
    
    // Estimate time per word (rough calculation: ~150 words per minute at 1x speed)
    const wordsPerMinute = 150 * rate;
    const msPerWord = (60 / wordsPerMinute) * 1000;

    wordHighlightIntervalRef.current = setInterval(() => {
      if (currentIndex < words.length && isPlaying && !isPaused) {
        setCurrentWordIndex(currentIndex);
        
        if (onHighlightChange) {
          const highlighted = createHighlightedHTML(textRef.current, currentIndex);
          onHighlightChange(highlighted);
        }
        
        currentIndex++;
      } else {
        if (wordHighlightIntervalRef.current) {
          clearInterval(wordHighlightIntervalRef.current);
          wordHighlightIntervalRef.current = null;
        }
      }
    }, msPerWord);
  }, [rate, isPlaying, isPaused, onHighlightChange]);

  // Cleanup interval on unmount or when stopping
  useEffect(() => {
    return () => {
      if (wordHighlightIntervalRef.current) {
        clearInterval(wordHighlightIntervalRef.current);
      }
    };
  }, []);

  const handlePlay = useCallback(async () => {
    if (!text.trim() || !isSupported) return;

    try {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentWordIndex(0);

      // Start word highlighting
      startWordHighlighting();

      const options: ResponsiveVoiceOptions = {
        rate: rate, // ResponsiveVoice rate is 0.1 to 1.0, so we map 0.5-2.0 to 0.1-1.0
        pitch: 1,
        volume: 1,
        onstart: () => {
          setIsPlaying(true);
          setIsPaused(false);
          setCurrentWordIndex(0);
        },
        onend: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentWordIndex(-1);
          
          if (wordHighlightIntervalRef.current) {
            clearInterval(wordHighlightIntervalRef.current);
            wordHighlightIntervalRef.current = null;
          }
          
          // Clear highlight when narration ends
          if (onHighlightChange) {
            onHighlightChange(textRef.current);
          }
        },
        onerror: (error) => {
          console.error('[NarrationControls] ResponsiveVoice error:', error);
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentWordIndex(-1);
          
          if (wordHighlightIntervalRef.current) {
            clearInterval(wordHighlightIntervalRef.current);
            wordHighlightIntervalRef.current = null;
          }
        },
      };

      // Map rate from 0.5-2.0 to 0.1-1.0 for ResponsiveVoice
      const rvRate = Math.max(0.1, Math.min(1.0, rate / 2.0));
      options.rate = rvRate;

      await voiceServiceRef.current.speak(text, selectedVoice, options);
    } catch (error) {
      console.error('[NarrationControls] Error speaking:', error);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    }
  }, [text, selectedVoice, rate, isSupported, onHighlightChange, startWordHighlighting]);

  const handlePause = useCallback(() => {
    // ResponsiveVoice doesn't have pause, so we cancel
    voiceServiceRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(true);
    
    if (wordHighlightIntervalRef.current) {
      clearInterval(wordHighlightIntervalRef.current);
      wordHighlightIntervalRef.current = null;
    }
  }, []);

  const handleStop = useCallback(() => {
    voiceServiceRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    
    if (wordHighlightIntervalRef.current) {
      clearInterval(wordHighlightIntervalRef.current);
      wordHighlightIntervalRef.current = null;
    }
    
    if (onHighlightChange) {
      onHighlightChange(textRef.current);
    }
  }, [onHighlightChange]);

  const handleVoiceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(e.target.value);
  }, []);

  const handleRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(e.target.value);
    setRate(newRate);
  }, []);

  // Update highlight when word index changes
  useEffect(() => {
    if (currentWordIndex >= 0 && onHighlightChange && isPlaying) {
      const highlighted = createHighlightedHTML(textRef.current, currentWordIndex);
      onHighlightChange(highlighted);
    } else if (currentWordIndex < 0 && onHighlightChange && !isPlaying) {
      // Clear highlight when not playing
      onHighlightChange(textRef.current);
    }
  }, [currentWordIndex, onHighlightChange, isPlaying]);

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg ${className}`}>
        <p className="text-yellow-200 text-sm">
          Text-to-speech is not available. Please ensure ResponsiveVoice is loaded.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Controls Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-purple-400" />
          Narration
        </h3>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlay}
          disabled={!text.trim() || (isPlaying && !isPaused)}
          className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
          title={isPaused ? 'Resume' : 'Play'}
        >
          <Play className="w-4 h-4" />
        </button>
        
        {isPlaying && !isPaused && (
          <button
            onClick={handlePause}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Pause"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={handleStop}
          disabled={!isPlaying && !isPaused}
          className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
          title="Stop"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <label className="text-gray-300 text-sm font-medium">Voice</label>
        <select
          value={selectedVoice}
          onChange={handleVoiceChange}
          disabled={isPlaying}
          className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {RESPONSIVE_VOICE_OPTIONS.map((voice) => (
            <option key={voice.value} value={voice.value}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>

      {/* Speed Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Speed
          </label>
          <span className="text-gray-400 text-sm">{rate.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={handleRateChange}
          disabled={isPlaying}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>
    </div>
  );
}
