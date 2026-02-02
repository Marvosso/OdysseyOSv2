'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface SimpleVoicePlayerProps {
  text: string;
  className?: string;
  showTitle?: boolean;
}

type VoiceOption = {
  id: string;
  name: string;
  description: string;
  emoji: string;
};

export default function SimpleVoicePlayer({ 
  text, 
  className = '',
  showTitle = true 
}: SimpleVoicePlayerProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>('UK English Female');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const voiceOptions: VoiceOption[] = [
    { id: 'UK English Female', name: 'British Female', description: 'Sophisticated British accent', emoji: '👩‍🦰' },
    { id: 'US English Female', name: 'American Female', description: 'Clear American accent', emoji: '👩' },
    { id: 'UK English Male', name: 'British Male', description: 'Classic British accent', emoji: '👨‍🦰' },
    { id: 'US English Male', name: 'American Male', description: 'Standard American accent', emoji: '👨' },
  ];

  // Check if ResponsiveVoice is loaded
  useEffect(() => {
    const checkVoiceReady = () => {
      if (typeof window !== 'undefined' && (window as any).responsiveVoice) {
        setIsReady(true);
      } else {
        // Retry after a bit
        setTimeout(checkVoiceReady, 500);
      }
    };
    
    checkVoiceReady();
  }, []);

  const speak = () => {
    if (!isReady || !text.trim()) return;
    
    const responsiveVoice = (window as any).responsiveVoice;
    
    responsiveVoice.speak(text, selectedVoice, {
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
  };

  const pause = () => {
    if (!isReady) return;
    (window as any).responsiveVoice.pause();
    setIsPlaying(false);
  };

  const resume = () => {
    if (!isReady) return;
    (window as any).responsiveVoice.resume();
    setIsPlaying(true);
  };

  const stop = () => {
    if (!isReady) return;
    (window as any).responsiveVoice.cancel();
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
          <div className="grid grid-cols-2 gap-2">
            {voiceOptions.map((voice) => (
              <button
                key={voice.id}
                onClick={() => {
                  setSelectedVoice(voice.id);
                  stop(); // Stop current playback when switching voices
                }}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  selectedVoice === voice.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{voice.emoji}</span>
                  <div>
                    <div className="font-medium text-gray-900">{voice.name}</div>
                    <div className="text-xs text-gray-500">{voice.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
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
