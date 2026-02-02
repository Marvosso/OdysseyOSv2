'use client';

/**
 * Audio Export Panel
 * 
 * Interface for generating audiobook exports with voice assignment
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Play,
  Pause,
  Square,
  Download,
  Settings,
  User,
  Music,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AudioGenerator, type VoiceSettings, type CharacterVoice, type AudioGenerationOptions, type GenerationProgress } from '@/lib/export/audioGenerator';
import type { Story, Character } from '@/types/story';
import { StoryStorage } from '@/lib/storage/storyStorage';

interface AudioExportPanelProps {
  story: Story;
}

export default function AudioExportPanel({ story }: AudioExportPanelProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [narratorVoice, setNarratorVoice] = useState<VoiceSettings>({
    voiceName: '',
    pitch: 1,
    rate: 1,
    volume: 1,
  });
  const [characterVoices, setCharacterVoices] = useState<CharacterVoice[]>([]);
  const [speed, setSpeed] = useState(1);
  const [addChapterMarkers, setAddChapterMarkers] = useState(true);
  const [backgroundMusic, setBackgroundMusic] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioGenerator, setAudioGenerator] = useState<AudioGenerator | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = async () => {
      const voices = await AudioGenerator.waitForVoices();
      setAvailableVoices(voices);
      
      // Set default narrator voice (first English voice or first available)
      const englishVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
      if (englishVoice) {
        setNarratorVoice({
          voiceName: englishVoice.name,
          pitch: 1,
          rate: 1,
          volume: 1,
        });
      }
    };

    loadVoices();
  }, []);

  // Initialize character voices
  useEffect(() => {
    const characters = StoryStorage.loadCharacters();
    const initialCharacterVoices: CharacterVoice[] = characters.map((char) => ({
      characterId: char.id,
      characterName: char.name,
      voiceSettings: {
        voiceName: narratorVoice.voiceName || availableVoices[0]?.name || '',
        pitch: 1,
        rate: 1,
        volume: 1,
      },
    }));
    setCharacterVoices(initialCharacterVoices);
  }, [story.characters, availableVoices, narratorVoice.voiceName]);

  // Update character voice
  const updateCharacterVoice = (characterId: string, settings: Partial<VoiceSettings>) => {
    setCharacterVoices((prev) =>
      prev.map((cv) =>
        cv.characterId === characterId
          ? {
              ...cv,
              voiceSettings: { ...cv.voiceSettings, ...settings },
            }
          : cv
      )
    );
  };

  // Preview voice
  const previewVoice = (text: string, voiceSettings: VoiceSettings) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Speech synthesis not available in this browser');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = availableVoices.find((v) => v.name === voiceSettings.voiceName);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.rate;
    utterance.volume = voiceSettings.volume;

    window.speechSynthesis.speak(utterance);
  };

  // Generate audiobook
  const handleGenerate = async () => {
    if (!story || story.scenes.length === 0) {
      setError('No scenes to generate audio from');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(null);

    const generator = new AudioGenerator();
    setAudioGenerator(generator);

    const options: AudioGenerationOptions = {
      voices: characterVoices,
      narratorVoice: {
        ...narratorVoice,
        rate: narratorVoice.rate * speed,
      },
      speed,
      addChapterMarkers,
      backgroundMusic,
      musicVolume,
    };

    try {
      // Show info about audio playback
      const confirmed = window.confirm(
        'Audio Export Information:\n\n' +
        'Due to browser limitations, SpeechSynthesis cannot be directly recorded.\n\n' +
        'The audio will play through your speakers, and a text file will be downloaded.\n\n' +
        'To record the audio:\n' +
        '1. Use system audio recording software (OBS, Audacity, etc.)\n' +
        '2. Or use the text file with external TTS services\n\n' +
        'Click OK to start playback and download the text file.'
      );

      if (!confirmed) {
        setIsGenerating(false);
        return;
      }

      const textBlob = await generator.generateFullAudiobook(
        story.id,
        options,
        (progress) => {
          setProgress(progress);
        }
      );

      // Download the text file
      const url = URL.createObjectURL(textBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title.replace(/\s+/g, '_')}_audiobook_text_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      generator.cleanup();
      
      setError(null);
      setSuccess('Audio playback started! A text file has been downloaded. Use system recording software to capture the audio.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
      setIsGenerating(false);
      generator.cleanup();
    }
  };

  // Pause generation
  const handlePause = () => {
    if (audioGenerator) {
      audioGenerator.pause();
      setIsPaused(true);
    }
  };

  // Resume generation
  const handleResume = () => {
    if (audioGenerator) {
      audioGenerator.resume();
      setIsPaused(false);
    }
  };

  // Cancel generation
  const handleCancel = () => {
    if (audioGenerator) {
      audioGenerator.cancel();
      audioGenerator.cleanup();
      setAudioGenerator(null);
      setIsGenerating(false);
      setIsPaused(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-purple-400" />
          Audiobook Export
        </h3>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Narrator Voice Settings */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-4">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" />
          Narrator Voice
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Voice</label>
            <select
              value={narratorVoice.voiceName}
              onChange={(e) =>
                setNarratorVoice({ ...narratorVoice, voiceName: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => previewVoice('This is a preview of the narrator voice.', narratorVoice)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Pitch: {narratorVoice.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={narratorVoice.pitch}
              onChange={(e) =>
                setNarratorVoice({ ...narratorVoice, pitch: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Rate: {narratorVoice.rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={narratorVoice.rate}
              onChange={(e) =>
                setNarratorVoice({ ...narratorVoice, rate: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Volume: {Math.round(narratorVoice.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={narratorVoice.volume}
              onChange={(e) =>
                setNarratorVoice({ ...narratorVoice, volume: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Character Voices */}
      {characterVoices.length > 0 && (
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-4">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Character Voices
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {characterVoices.map((cv) => (
              <div key={cv.characterId} className="p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{cv.characterName}</span>
                  <button
                    onClick={() => previewVoice(`${cv.characterName} speaking.`, cv.voiceSettings)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Preview
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Voice</label>
                    <select
                      value={cv.voiceSettings.voiceName}
                      onChange={(e) =>
                        updateCharacterVoice(cv.characterId, { voiceName: e.target.value })
                      }
                      className="w-full px-2 py-1 bg-gray-700 text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {availableVoices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Pitch: {cv.voiceSettings.pitch.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={cv.voiceSettings.pitch}
                      onChange={(e) =>
                        updateCharacterVoice(cv.characterId, {
                          pitch: parseFloat(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Rate: {cv.voiceSettings.rate.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={cv.voiceSettings.rate}
                      onChange={(e) =>
                        updateCharacterVoice(cv.characterId, {
                          rate: parseFloat(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-4">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-green-400" />
          Export Options
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Overall Speed</label>
            <span className="text-sm text-gray-400">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={addChapterMarkers}
              onChange={(e) => setAddChapterMarkers(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Add Chapter/Scene Markers
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={backgroundMusic}
              onChange={(e) => setBackgroundMusic(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300 flex items-center gap-2">
              <Music className="w-4 h-4" />
              Background Music (Coming Soon)
            </span>
          </label>

          {backgroundMusic && (
            <div className="ml-7">
              <label className="block text-sm text-gray-400 mb-2">
                Music Volume: {Math.round(musicVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      {progress && (
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">
              {progress.currentSceneTitle || `Scene ${progress.currentScene}`}
            </span>
            <span className="text-sm text-gray-400">
              {progress.currentScene} / {progress.totalScenes} ({Math.round(progress.percentage)}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {!isGenerating ? (
          <button
            onClick={handleGenerate}
            disabled={story.scenes.length === 0}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            Generate Audiobook
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Square className="w-5 h-5" />
              Cancel
            </button>
          </>
        )}
      </div>

      {story.scenes.length === 0 && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            No scenes found. Create scenes before generating an audiobook.
          </p>
        </div>
      )}
    </div>
  );
}
