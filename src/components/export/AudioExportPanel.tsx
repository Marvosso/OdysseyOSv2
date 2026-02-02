'use client';

/**
 * Audio Export Panel
 * 
 * Interface for generating audiobook exports with voice assignment
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { SafeSpeechService } from '@/lib/audio/safeSpeechService';
import { VoiceLoader } from '@/lib/audio/voiceLoader';
import { TextChunker } from '@/lib/audio/textChunker';
import type { Story, Character } from '@/types/story';
import { StoryStorage } from '@/lib/storage/storyStorage';

interface AudioExportPanelProps {
  story: Story;
}

export default function AudioExportPanel({ story }: AudioExportPanelProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const currentChunkIndexRef = React.useRef(0);
  const chunksRef = React.useRef<string[]>([]);
  
  const speechServiceRef = React.useRef(SafeSpeechService.getInstance());

  // Load available voices
  useEffect(() => {
    const loadVoices = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioExportPanel.tsx:54',message:'Loading voices',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      const voices = await VoiceLoader.getVoices();
      setAvailableVoices(voices);
      
      // Set default voice (prefer natural-sounding English voices)
      const preferred = voices.find((v) => 
        v.lang.includes('en') && 
        !v.name.includes('Google') && 
        !v.name.includes('Microsoft')
      ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];
      
      if (preferred) {
        setSelectedVoice(preferred.name);
      }
    };

    loadVoices();
    
    // Cleanup on unmount
    return () => {
      speechServiceRef.current.cancel();
    };
  }, []);



  // Preview voice
  const previewVoice = async (text: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioExportPanel.tsx:90',message:'previewVoice called',data:{textLength:text.length,voiceName:selectedVoice},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    try {
      await VoiceLoader.waitForVoices();
      await speechServiceRef.current.speak(text, { 
        rate, 
        voice: selectedVoice 
      });
    } catch (err) {
      console.error('[AudioExportPanel] Preview error:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview voice');
    }
  };

  // Generate audiobook
  const handleGenerate = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioExportPanel.tsx:126',message:'handleGenerate called',data:{storyId:story.id,scenesCount:story.scenes.length,selectedVoice:selectedVoice,rate:rate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    if (!story || story.scenes.length === 0) {
      setError('No scenes to generate audio from');
      return;
    }

    setIsSpeaking(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      await VoiceLoader.waitForVoices();
      
      // Combine all scene content
      const storyText = story.scenes.map((scene, index) => {
        let text = '';
        if (index === 0 || scene.title) {
          text += `\n\n--- ${scene.title || `Scene ${index + 1}`} ---\n\n`;
        }
        text += scene.content;
        return text;
      }).join('\n\n');

      // Chunk the text
      const chunks = TextChunker.chunkText(storyText, 200);
      const totalChunks = chunks.length;
      chunksRef.current = chunks;
      currentChunkIndexRef.current = 0;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioExportPanel.tsx:150',message:'Starting to speak chunks',data:{totalChunks:totalChunks,storyTextLength:storyText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      // Speak each chunk starting from current index
      for (let i = currentChunkIndexRef.current; i < chunks.length; i++) {
        if (!isSpeaking && !isPaused) break; // Check if stopped
        
        currentChunkIndexRef.current = i;
        await speechServiceRef.current.speak(chunks[i], { 
          rate, 
          voice: selectedVoice 
        });
        setProgress(((i + 1) / totalChunks) * 100);
      }

      setIsSpeaking(false);
      setProgress(100);
      setSuccess('Audio playback completed! Use system recording software to capture the audio.');

      // Also download text file
      const textBlob = new Blob([storyText], { type: 'text/plain' });
      const url = URL.createObjectURL(textBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title.replace(/\s+/g, '_')}_audiobook_text_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AudioExportPanel.tsx:170',message:'Audio generation failed',data:{error:err instanceof Error ? err.message : 'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(0);
    }
  };

  // Pause generation
  const handlePause = () => {
    if (isSpeaking && !isPaused) {
      // SafeSpeechService doesn't have pause/resume, so we cancel and will resume by re-speaking
      speechServiceRef.current.cancel();
      setIsPaused(true);
    }
  };

  // Resume generation
  const handleResume = async () => {
    if (isPaused && chunksRef.current.length > 0) {
      setIsPaused(false);
      setIsSpeaking(true);
      
      // Continue from current chunk index
      const totalChunks = chunksRef.current.length;
      for (let i = currentChunkIndexRef.current; i < chunksRef.current.length; i++) {
        if (!isSpeaking && !isPaused) break;
        
        currentChunkIndexRef.current = i;
        await speechServiceRef.current.speak(chunksRef.current[i], { 
          rate, 
          voice: selectedVoice 
        });
        setProgress(((i + 1) / totalChunks) * 100);
      }
      
      if (currentChunkIndexRef.current >= chunksRef.current.length) {
        setIsSpeaking(false);
        setProgress(100);
        setSuccess('Audio playback completed! Use system recording software to capture the audio.');
      }
    }
  };

  // Stop generation
  const handleStop = () => {
    speechServiceRef.current.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
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

      {/* Voice Settings */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-4">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" />
          Voice Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Voice</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isSpeaking}
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
              onClick={() => previewVoice('This is a preview of the selected voice.')}
              disabled={isSpeaking}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Speed: {rate.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full"
            disabled={isSpeaking}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slower</span>
            <span>Normal</span>
            <span>Faster</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isSpeaking && (
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Generating audiobook...</span>
            <span className="text-sm text-gray-400">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {!isSpeaking ? (
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
              onClick={handleStop}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Square className="w-5 h-5" />
              Stop
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
