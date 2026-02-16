'use client';

/**
 * Narrate Panel
 *
 * Premium feature: narrate your story with TTSOpenAI (tts.ainnate.com). Shows presence for all users;
 * free users see an upgrade CTA, Pro/Studio users get full narration.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, Play, Square, Sparkles, Loader2 } from 'lucide-react';
import type { Story } from '@/types/story';
import { useUserTier } from '@/hooks/useUserTier';
import { supabase } from '@/lib/supabaseClient';
import UpgradeModal from '@/components/session/UpgradeModal';

const VOICES = [
  { id: 'onyx' as const, label: 'Onyx (Male)' },
  { id: 'nova' as const, label: 'Nova (Female)' },
] as const;

type VoiceId = (typeof VOICES)[number]['id'];

const TTS_MAX_LENGTH = 4096;

interface NarratePanelProps {
  story: Story;
}

export default function NarratePanel({ story }: NarratePanelProps) {
  const { tier, isPro, isStudio, loading: tierLoading } = useUserTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('nova');
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
          const createRes = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ text: chunks[i], voice: selectedVoice }),
          });

          if (!createRes.ok) {
            const rawText = await createRes.text();
            let msg = createRes.statusText || 'Narration failed.';
            try {
              const data = JSON.parse(rawText) as { error?: string };
              if (typeof data?.error === 'string') msg = data.error;
            } catch {
              if (rawText.trim().length > 0 && rawText.length < 200) msg = rawText;
            }
            setError(msg);
            setPlayingSceneIndex(null);
            return;
          }

          const { job_id } = (await createRes.json()) as { job_id?: string };
          if (!job_id) {
            setError('No job_id returned.');
            setPlayingSceneIndex(null);
            return;
          }

          const maxPolls = 60;
          const pollMs = 2000;
          let statusData: { status: string; audio_url?: string } = { status: 'processing' };
          for (let p = 0; p < maxPolls; p++) {
            await new Promise((r) => setTimeout(r, pollMs));
            const statusRes = await fetch(`/api/tts/status?job_id=${encodeURIComponent(job_id)}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            statusData = (await statusRes.json()) as { status: string; audio_url?: string };
            if (statusData.status === 'completed' || statusData.status === 'failed') break;
          }

          if (statusData.status === 'failed') {
            setError('Narration failed.');
            setPlayingSceneIndex(null);
            return;
          }
          if (statusData.status !== 'completed' || !statusData.audio_url) {
            setError('Narration timed out. Please try again.');
            setPlayingSceneIndex(null);
            return;
          }

          const audio = new Audio(statusData.audio_url);
          audioRef.current = audio;
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => {
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
  }, [selectedVoice, stopCurrent]);

  // Loading or free users: teaser with upgrade CTA
  if (tierLoading || (!isPro && !isStudio)) {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-lg border border-gray-700 bg-gray-800/50 text-center">
          <Volume2 className="w-12 h-12 mx-auto mb-3 text-purple-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Voice narration</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
            Hear your story come to life with AI-powered narration. Choose from multiple voices
            and listen scene by scene or play the full story. Powered by TTSOpenAI.
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

  const voiceControls = (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">Voice</label>
      <div className="flex flex-wrap gap-2">
        {VOICES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelectedVoice(id)}
            className={`min-h-[44px] px-4 py-2.5 rounded-lg border text-sm transition-colors ${
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
  );

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      {/* Voice: desktop top, mobile in sticky bottom bar */}
      <div className="hidden md:block">
        {voiceControls}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Scenes</label>
        <div className="space-y-2 max-h-[50vh] md:max-h-64 min-h-0 overflow-y-auto">
          {story.scenes.map((scene, index) => {
            const isPlaying = playingSceneIndex === index;
            return (
              <div
                key={scene.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border border-gray-700 bg-gray-800/50"
              >
                <span className="text-xs text-gray-500 sm:w-8">#{index + 1}</span>
                <span className="flex-1 truncate text-sm text-white min-w-0" title={scene.title || `Scene ${index + 1}`}>
                  {scene.title || `Scene ${index + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => (isPlaying ? stopCurrent() : playText(scene.content, index))}
                  disabled={tierLoading || (!isPro && !isStudio)}
                  className="flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors flex-shrink-0"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      {playingSceneIndex !== null && !isPlaying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
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
        <p className="text-sm text-amber-400 max-w-prose mx-auto" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-500 max-w-prose mx-auto">
        Powered by TTSOpenAI. Narration is a Pro/Studio feature.
      </p>

      {/* Mobile: sticky voice bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-700 p-4 md:hidden">
        {voiceControls}
      </div>
    </div>
  );
}
