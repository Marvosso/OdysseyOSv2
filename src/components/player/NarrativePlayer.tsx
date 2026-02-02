'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Clock,
  ChevronRight
} from 'lucide-react';
import type { Scene } from '@/types/story';
import { ResponsiveVoiceService } from '@/lib/audio/responsiveVoiceService';

interface NarrativePlayerProps {
  scenes: Scene[];
  onSceneSelect: (sceneId: string) => void;
}

const VOICE_OPTIONS = [
  { label: 'UK English Female', value: 'UK English Female' },
  { label: 'US English Female', value: 'US English Female' },
  { label: 'UK English Male', value: 'UK English Male' },
  { label: 'US English Male', value: 'US English Male' },
];

const SPEED_OPTIONS = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1x', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
];

export default function NarrativePlayer({ scenes, onSceneSelect }: NarrativePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [speed, setSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState('UK English Female');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const voiceServiceRef = useRef(ResponsiveVoiceService.getInstance());
  const currentScene = scenes[currentSceneIndex];

  // Check if ResponsiveVoice is ready
  useEffect(() => {
    const checkReady = async () => {
      await voiceServiceRef.current.waitForResponsiveVoice();
      setIsReady(voiceServiceRef.current.isAvailable());
    };
    checkReady();
  }, []);

  const handleNext = useCallback(() => {
    const newIndex = Math.min(scenes.length - 1, currentSceneIndex + 1);
    setCurrentSceneIndex(newIndex);
    onSceneSelect(scenes[newIndex].id);
  }, [currentSceneIndex, scenes, onSceneSelect]);

  const handlePrevious = useCallback(() => {
    const newIndex = Math.max(0, currentSceneIndex - 1);
    setCurrentSceneIndex(newIndex);
    onSceneSelect(scenes[newIndex].id);
  }, [currentSceneIndex, scenes, onSceneSelect]);

  useEffect(() => {
    if (!isPlaying || !currentScene || !isReady) return;
    
    const speakScene = async () => {
      try {
        // Map rate from 0.5-2.0 to 0.1-1.0 for ResponsiveVoice
        const rvRate = Math.max(0.1, Math.min(1.0, speed / 2.0));
        const rvVolume = isMuted ? 0 : volume;
        
        setIsSpeaking(true);
        await voiceServiceRef.current.speak(currentScene.content, selectedVoice, {
          rate: rvRate,
          pitch: 1,
          volume: rvVolume,
          onstart: () => {
            setIsSpeaking(true);
          },
          onend: () => {
            setIsSpeaking(false);
            
            // Move to next scene if still playing
            if (isPlaying && currentSceneIndex < scenes.length - 1) {
              handleNext();
            } else {
              setIsPlaying(false);
            }
          },
          onerror: (error) => {
            console.error('[NarrativePlayer] Speech error:', error);
            setIsSpeaking(false);
            setIsPlaying(false);
          },
        });
      } catch (error) {
        console.error('[NarrativePlayer] Speech error:', error);
        setIsSpeaking(false);
        setIsPlaying(false);
      }
    };
    
    speakScene();

    return () => {
      voiceServiceRef.current.cancel();
    };
  }, [isPlaying, currentScene, speed, volume, isMuted, selectedVoice, currentSceneIndex, scenes.length, handleNext, isReady]);

  const handleTogglePlay = () => {
    if (!isPlaying && scenes.length === 0) return;
    
    if (isSpeaking) {
      voiceServiceRef.current.cancel();
      setIsSpeaking(false);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSceneClick = (index: number) => {
    setCurrentSceneIndex(index);
    onSceneSelect(scenes[index].id);
    // If playing, restart speech for the new scene
    if (isPlaying) {
      voiceServiceRef.current.cancel();
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 50);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const totalTime = scenes.reduce((acc, scene) => {
    const words = scene.content.split(' ').length;
    return acc + Math.ceil(words / 150);
  }, 0);

  if (scenes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ChevronRight size={32} className="mx-auto mb-3 opacity-50" />
        <p>No scenes to play</p>
        <p className="text-sm mt-2">Add scenes to your story first</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Current Scene Card */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
            Scene {currentSceneIndex + 1}
          </span>
          <h3 className="font-semibold text-white truncate">
            {currentScene?.title || 'Untitled Scene'}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={14} />
          <span>~{Math.ceil((currentScene?.content.split(' ').length || 0) / 150)} min</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="space-y-3">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-12">
            {currentSceneIndex + 1}/{scenes.length}
          </span>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentSceneIndex + 1) / scenes.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentSceneIndex === 0}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack size={20} />
          </button>
          
          <button
            onClick={handleTogglePlay}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={scenes.length === 0 || !isReady}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentSceneIndex === scenes.length - 1}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full p-2 text-sm text-gray-500 hover:text-white text-center transition-colors"
      >
        {showSettings ? 'Hide' : 'Show'} Settings
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3 p-3 bg-gray-800/30 rounded-lg"
        >
          <div>
            <label className="text-xs text-gray-400 block mb-2">Speed</label>
            <div className="flex gap-1">
              {SPEED_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSpeed(option.value)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    speed === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">Voice</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 text-sm focus:outline-none focus:border-blue-500"
            >
              {VOICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      )}

      {/* Scene List */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">Scenes</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              onClick={() => handleSceneClick(index)}
              className={`w-full p-3 text-left rounded-lg transition-colors ${
                index === currentSceneIndex
                  ? 'bg-blue-500/20 border border-blue-500/50'
                  : 'bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">
                    {scene.title || 'Untitled Scene'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    ~{Math.ceil(scene.content.split(' ').length / 150)} min
                  </div>
                </div>
                {index === currentSceneIndex && isSpeaking && (
                  <div className="flex gap-0.5 ml-2">
                    <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" />
                    <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse delay-75" />
                    <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 bg-gray-800/30 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Duration</span>
          <span className="text-white">~{totalTime} min</span>
        </div>
      </div>
    </motion.div>
  );
}
