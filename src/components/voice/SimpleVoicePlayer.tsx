'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { ResponsiveVoiceService } from '@/lib/audio/responsiveVoiceService';

interface SimpleVoicePlayerProps {
  text: string;
  className?: string;
  showTitle?: boolean;
}

export default function SimpleVoicePlayer({ 
  text, 
  className = '', 
  showTitle = true 
}: SimpleVoicePlayerProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>('UK English Female');
  const [availableVoices, setAvailableVoices] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const voiceServiceRef = useState(() => ResponsiveVoiceService.getInstance())[0];

  // Check if ResponsiveVoice is loaded and get voices
  useEffect(() => {
    const checkVoiceReady = async () => {
      await voiceServiceRef.waitForResponsiveVoice();
      const available = voiceServiceRef.isAvailable();
      setIsReady(available);
      
      if (available) {
        const voices = voiceServiceRef.getVoices();
        setAvailableVoices(voices);
        // Set default voice if available
        if (voices.length > 0 && !voices.includes(selectedVoice)) {
          setSelectedVoice(voices[0]);
        }
      }
    };
    
    checkVoiceReady();
  }, []);

  const speak = async () => {
    if (!isReady || !text.trim()) return;
    
    try {
      await voiceServiceRef.speak(text, selectedVoice, {
        rate: 0.9, // Slightly slower for clarity
        pitch: 1,
        volume: 1,
        onstart: () => {
          setIsPlaying(true);
          console.log('[Voice] Started playing');
        },
        onend: () => {
          setIsPlaying(false);
          console.log('[Voice] Finished playing');
        },
        onerror: (error: any) => {
          setIsPlaying(false);
          console.error('[Voice] Error:', error);
        }
      });
    } catch (error) {
      console.error('[Voice] Speak error:', error);
      setIsPlaying(false);
    }
  };

  const pause = () => {
    if (!isReady) return;
    // ResponsiveVoice doesn't have pause, so we cancel
    voiceServiceRef.cancel();
    setIsPlaying(false);
  };

  const resume = () => {
    // ResponsiveVoice doesn't have resume, so we restart
    if (!isReady) return;
    speak();
  };

  const stop = () => {
    if (!isReady) return;
    voiceServiceRef.cancel();
    setIsPlaying(false);
  };

  if (!text.trim()) {
    return (
      <div className={`p-4 border border-dashed border-gray-300 rounded-lg text-gray-500 ${className}`}>
        No text available to read aloud.
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg bg-white shadow-sm ${className}`}>
      {showTitle && (
        <div className="border-b px-4 py-3 bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Voice Narration
          </h3>
        </div>
      )}
      
      <div className="p-4">
        {/* Voice Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Voice
          </label>
          {availableVoices.length === 0 ? (
            <div className="p-3 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm text-center">
              Loading voices...
            </div>
          ) : (
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                stop(); // Stop current playback when switching voices
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableVoices.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button
                onClick={speak}
                disabled={!isReady}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Play
              </button>
            ) : (
              <button
                onClick={pause}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            
            {isPlaying && (
              <button
                onClick={resume}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Resume
              </button>
            )}
            
            <button
              onClick={stop}
              disabled={!isPlaying}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {isReady ? 'Ready' : 'Loading voices...'}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Characters: {text.length}</span>
            <span>Words: {text.split(/\s+/).filter(Boolean).length}</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Powered by ResponsiveVoice • Free for non-commercial use
          </div>
        </div>
      </div>
    </div>
  );
}
