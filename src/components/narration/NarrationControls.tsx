'use client';

/**
 * Narration Controls Component
 * 
 * Provides UI for controlling text-to-speech narration
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, Gauge } from 'lucide-react';
import { SpeechController, type SpeechControllerOptions } from '@/lib/narration/speechController';
import { findWordIndexFromCharPosition, createHighlightedHTML } from '@/lib/narration/textHighlighter';

export interface NarrationControlsProps {
  text: string;
  onHighlightChange?: (highlightedHTML: string) => void;
  className?: string;
}

export default function NarrationControls({
  text,
  onHighlightChange,
  className = '',
}: NarrationControlsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  
  const speechControllerRef = useRef<SpeechController | null>(null);
  const textRef = useRef(text);

  // Update text ref when text changes
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Check support and load voices
  useEffect(() => {
    const checkSupport = async () => {
      const supported = SpeechController.isSupported();
      setIsSupported(supported);

      if (supported) {
        const loadedVoices = await SpeechController.loadVoices();
        setVoices(loadedVoices);
        
        // Set default voice
        const defaultVoice = SpeechController.getDefaultVoice();
        if (defaultVoice) {
          setSelectedVoice(defaultVoice);
        }
      }
    };

    checkSupport();
  }, []);

  // Initialize speech controller
  useEffect(() => {
    if (!isSupported) return;

    const options: SpeechControllerOptions = {
      voice: selectedVoice || undefined,
      rate,
      pitch: 1,
      volume: 1,
    };

    const callbacks = {
      onStart: () => {
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentWordIndex(0);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        // Clear highlight when narration ends
        if (onHighlightChange) {
          onHighlightChange(textRef.current);
        }
      },
      onError: (error: Error) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NarrationControls.tsx:88',message:'onError callback called',data:{errorMessage:error.message,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{console.log('[DEBUG] onError callback:', error.message);});
        // #endregion
        // Only log non-interrupted errors
        if (!error.message.includes('interrupted') && !error.message.includes('canceled')) {
          console.error('Speech synthesis error:', error);
        }
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
      },
      onPause: () => {
        setIsPaused(true);
      },
      onResume: () => {
        setIsPaused(false);
      },
      onBoundary: (event: SpeechSynthesisEvent) => {
        if (event.type === 'boundary' && event.charIndex !== undefined && event.charLength !== undefined) {
          // Find the word that contains this character position
          const wordIndex = findWordIndexFromCharPosition(textRef.current, event.charIndex);
          setCurrentWordIndex(wordIndex);
          
          // Update highlighted HTML
          if (onHighlightChange) {
            const highlighted = createHighlightedHTML(textRef.current, wordIndex);
            onHighlightChange(highlighted);
          }
        }
      },
    };

    speechControllerRef.current = new SpeechController(options, callbacks);

    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NarrationControls.tsx:123',message:'useEffect cleanup',data:{hasController:!!speechControllerRef.current,isPlaying:isPlaying},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{console.log('[DEBUG] useEffect cleanup');});
      // #endregion
      if (speechControllerRef.current) {
        // Only stop if actually playing to avoid interrupting speech
        if (isPlaying) {
          speechControllerRef.current.stop();
        }
      }
    };
  }, [isSupported, selectedVoice, rate, onHighlightChange, isPlaying]);

  // Update speech controller when options change
  useEffect(() => {
    if (speechControllerRef.current) {
      speechControllerRef.current.updateOptions({
        voice: selectedVoice || undefined,
        rate,
      });
    }
  }, [selectedVoice, rate]);

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

  const handlePlay = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NarrationControls.tsx:145',message:'handlePlay called',data:{hasController:!!speechControllerRef.current,textLength:text.length,textTrimmed:text.trim().length,isPaused:isPaused,isPlaying:isPlaying},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!speechControllerRef.current || !text.trim()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NarrationControls.tsx:149',message:'handlePlay early return',data:{hasController:!!speechControllerRef.current,textTrimmed:text.trim().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return;
    }

    if (isPaused) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NarrationControls.tsx:153',message:'resuming speech',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      speechControllerRef.current.resume();
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NarrationControls.tsx:156',message:'calling speak',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      speechControllerRef.current.speak(text);
    }
  }, [text, isPaused, isPlaying]);

  const handlePause = useCallback(() => {
    if (speechControllerRef.current) {
      speechControllerRef.current.pause();
    }
  }, []);

  const handleStop = useCallback(() => {
    if (speechControllerRef.current) {
      speechControllerRef.current.stop();
      setCurrentWordIndex(-1);
      if (onHighlightChange) {
        onHighlightChange(textRef.current);
      }
    }
  }, [onHighlightChange]);

  const handleVoiceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceName = e.target.value;
    const voice = voices.find(v => v.name === voiceName);
    setSelectedVoice(voice || null);
  }, [voices]);

  const handleRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(e.target.value);
    setRate(newRate);
  }, []);

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg ${className}`}>
        <p className="text-yellow-200 text-sm">
          Text-to-speech is not supported in this browser.
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
          value={selectedVoice?.name || ''}
          onChange={handleVoiceChange}
          disabled={isPlaying}
          className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {voices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} {voice.lang} {voice.localService ? '(Local)' : '(Remote)'}
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
