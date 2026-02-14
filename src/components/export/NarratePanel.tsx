'use client';

/**
 * Narrate Panel
 *
 * Premium feature: narrate your story with OpenAI TTS. Shows presence for all users;
 * free users see an upgrade CTA, Pro/Studio users get full narration.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, Play, Square, Sparkles, Loader2 } from 'lucide-react';
import type { Story } from '@/types/story';
import { useUserTier } from '@/hooks/useUserTier';
import { supabase } from '@/lib/supabaseClient';
import UpgradeModal from '@/components/session/UpgradeModal';

const VOICES = [
  { id: 'us-male' as const, label: 'US Male' },
  { id: 'us-female' as const, label: 'US Female' },
  { id: 'uk-male' as const, label: 'UK Male' },
  { id: 'uk-female' as const, label: 'UK Female' },
] as const;

type VoiceId = (typeof VOICES)[number]['id'];

const TTS_MAX_LENGTH = 4096;

interface NarratePanelProps {
  story: Story;
}

export default function NarratePanel({ story }: NarratePanelProps) {
  const { tier, isPro, isStudio, loading: tierLoading } = useUserTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('uk-female');
  const [playingSceneIndex, setPlayingSceneIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stopCurrent = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPlayingSceneIndex(null);
  }, []);

  const playText = useCallback(
    async (text: string, sceneIndex: number) => {
      const trimmed = text?.trim() ?? '';
      if (!trimmed) {
        setError('No text to narrate.');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Sign in to narrate.');
        return;
      }

      setError(null);
      stopCurrent();
      setPlayingSceneIndex(sceneIndex);

      // Chunk if needed (TTS limit 4096 chars)
      const chunks: string[] = [];
      let rest = trimmed;
      while (rest.length > TTS_MAX_LENGTH) {
        const chunk = rest.slice(0, TTS_MAX_LENGTH);
        const lastSpace = chunk.lastIndexOf(' ');
        chunks.push(lastSpace > 0 ? chunk.slice(0, lastSpace) : chunk);
        rest = rest.slice(lastSpace > 0 ? lastSpace + 1 : TTS_MAX_LENGTH);
      }
      if (rest) chunks.push(rest);

      try {
        for (let i = 0; i < chunks.length; i++) {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ text: chunks[i], voice: selectedVoice }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const msg = (data?.error as string) || res.statusText || 'Narration failed.';
            setError(msg);
            setPlayingSceneIndex(null);
            return;
          }

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;

          await new Promise<void>((resolve, reject) => {
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
              URL.revokeObjectURL(url);
              objectUrlRef.current = null;
              audioRef.current = null;
              resolve();
            };
            audio.onerror = () => reject(new Error('Playback failed'));
            audio.play().catch(reject);
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Narration failed.');
      } finally {
        setPlayingSceneIndex(null);
      }
    },
    [selectedVoice, stopCurrent]
  );

  useEffect(() => {
    return () => stopCurrent();
  }, [stopCurrent]);

  // Loading or free users: teaser with upgrade CTA
  if (tierLoading || (!isPro && !isStudio)) {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-lg border border-gray-700 bg-gray-800/50 text-center">
          <Volume2 className="w-12 h-12 mx-auto mb-3 text-purple-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Voice narration</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
            Hear your story come to life with AI-powered narration. Choose from multiple voices
            and listen scene by scene or play the full story. Powered by OpenAI TTS.
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro or Studio
          </button>
        </div>
        <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      </div>
    );
  }

  // Pro/Studio: full narration UI
  if (story.scenes.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-gray-700 bg-gray-800/50 text-center">
        <Volume2 className="w-10 h-10 mx-auto mb-2 text-purple-400" />
        <p className="text-gray-400">Add scenes to your story to narrate them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Voice</label>
        <div className="flex flex-wrap gap-2">
          {VOICES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedVoice(id)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                selectedVoice === id
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Scenes</label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {story.scenes.map((scene, index) => {
            const isPlaying = playingSceneIndex === index;
            return (
              <div
                key={scene.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 bg-gray-800/50"
              >
                <span className="text-xs text-gray-500 w-8">#{index + 1}</span>
                <span className="flex-1 truncate text-sm text-white" title={scene.title || `Scene ${index + 1}`}>
                  {scene.title || `Scene ${index + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => (isPlaying ? stopCurrent() : playText(scene.content, index))}
                  disabled={tierLoading || (!isPro && !isStudio)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      Stop
                    </>
                  ) : (
                    <>
                      {playingSceneIndex !== null && !isPlaying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Narrate
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-amber-400" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-500">
        Powered by OpenAI TTS. Narration is a Pro/Studio feature.
      </p>
    </div>
  );
}
