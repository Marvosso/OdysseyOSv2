'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const VOICES = [
  { id: 'us-male' as const, label: '🇺🇸 Male' },
  { id: 'us-female' as const, label: '🇺🇸 Female' },
  { id: 'uk-male' as const, label: '🇬🇧 Male' },
  { id: 'uk-female' as const, label: '🇬🇧 Female' },
] as const;

type VoiceId = (typeof VOICES)[number]['id'];

interface SimpleVoicePlayerProps {
  text: string;
  className?: string;
}

export default function SimpleVoicePlayer({ text, className = '' }: SimpleVoicePlayerProps) {
  const [loadingVoice, setLoadingVoice] = useState<VoiceId | null>(null);
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
  }, []);

  const playVoice = useCallback(
    async (voiceId: VoiceId) => {
      const trimmed = text?.trim() ?? '';
      if (!trimmed) {
        setError('No text to speak.');
        return;
      }

      setError(null);
      stopCurrent();

      setLoadingVoice(voiceId);
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, voice: voiceId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const message = (data?.error as string) || res.statusText || 'TTS request failed.';
          setError(message);
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          stopCurrent();
          setLoadingVoice(null);
        };
        audio.onerror = () => {
          setError('Playback failed.');
          stopCurrent();
          setLoadingVoice(null);
        };

        await audio.play();
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong.';
        setError(message);
        stopCurrent();
      } finally {
        setLoadingVoice(null);
      }
    },
    [text, stopCurrent]
  );

  useEffect(() => {
    return () => {
      stopCurrent();
    };
  }, [stopCurrent]);

  const handleClick = (voiceId: VoiceId) => {
    if (loadingVoice) return;
    playVoice(voiceId);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {VOICES.map(({ id, label }) => {
          const isLoading = loadingVoice === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleClick(id)}
              disabled={!!loadingVoice || !text?.trim()}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[7rem]"
            >
              {isLoading ? (
                <span className="inline-block animate-pulse">Generating…</span>
              ) : (
                label
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
