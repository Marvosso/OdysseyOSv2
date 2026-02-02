/**
 * Speech Controller
 * 
 * Manages Web Speech API (speechSynthesis) for text-to-speech narration
 * Now uses SpeechManager singleton to prevent conflicts
 */

import { SpeechManager } from '@/lib/audio/speechManager';

export interface SpeechControllerOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
}

export interface SpeechControllerCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onPause?: () => void;
  onResume?: () => void;
  onBoundary?: (event: SpeechSynthesisEvent) => void;
}

export class SpeechController {
  private speechManager!: SpeechManager; // Initialized in constructor
  private utterance: SpeechSynthesisUtterance | null = null;
  private isPaused = false;
  private callbacks: SpeechControllerCallbacks = {};
  private options: SpeechControllerOptions = {};

  /**
   * Check if speech synthesis is supported
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Get available voices
   */
  static getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) {
      return [];
    }
    return speechSynthesis.getVoices();
  }

  /**
   * Load voices (async, as they may not be immediately available)
   */
  static async loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.isSupported()) {
        resolve([]);
        return;
      }

      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      // Voices may load asynchronously
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
    });
  }

  /**
   * Get default voice (prefer local/en-US voices)
   */
  static getDefaultVoice(): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    // Prefer local voices (not remote)
    const localVoices = voices.filter(v => v.localService);
    if (localVoices.length > 0) {
      // Prefer English voices
      const englishVoices = localVoices.filter(v => 
        v.lang.startsWith('en')
      );
      return englishVoices.length > 0 ? englishVoices[0] : localVoices[0];
    }

    return voices[0];
  }

  constructor(options: SpeechControllerOptions = {}, callbacks: SpeechControllerCallbacks = {}) {
    this.options = {
      rate: 1,
      pitch: 1,
      volume: 1,
      ...options,
    };
    this.callbacks = callbacks;
    
    // Get singleton speech manager
    try {
      this.speechManager = SpeechManager.getInstance();
    } catch (error) {
      console.error('[SpeechController] Failed to get SpeechManager:', error);
      // Fallback - will be handled in speak()
    }
  }

  /**
   * Speak text
   */
  speak(text: string): void {
    console.log('[SpeechController] speak() called', { textLength: text.length });
    
    if (!SpeechController.isSupported()) {
      this.callbacks.onError?.(new Error('Speech synthesis is not supported in this browser'));
      return;
    }

    if (!this.speechManager) {
      try {
        this.speechManager = SpeechManager.getInstance();
      } catch (error) {
        this.callbacks.onError?.(error instanceof Error ? error : new Error('Failed to initialize speech manager'));
        return;
      }
    }

    // Use speech manager to speak
    const voiceName = this.options.voice?.name;
    const rate = this.options.rate ?? 1;
    
    this.speechManager.speak(text, voiceName, rate)
      .then(() => {
        console.log('[SpeechController] Speech completed successfully');
        this.callbacks.onStart?.();
        this.callbacks.onEnd?.();
      })
      .catch((error) => {
        console.error('[SpeechController] Speech error:', error);
        // Don't call onError for interrupted/canceled
        if (!error.message.includes('interrupted') && !error.message.includes('canceled')) {
          this.callbacks.onError?.(error);
        } else {
          this.callbacks.onEnd?.();
        }
      });
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (!SpeechController.isSupported()) return;

    if (speechSynthesis.speaking && !this.isPaused) {
      speechSynthesis.pause();
      this.isPaused = true;
      this.callbacks.onPause?.();
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (!SpeechController.isSupported()) return;

    if (speechSynthesis.speaking && this.isPaused) {
      speechSynthesis.resume();
      this.isPaused = false;
      this.callbacks.onResume?.();
    }
  }

  /**
   * Stop speech
   */
  stop(): void {
    if (!SpeechController.isSupported()) return;

    speechSynthesis.cancel();
    this.utterance = null;
    this.isPaused = false;
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    if (!this.speechManager) return false;
    return this.speechManager.isCurrentlySpeaking() && !this.isPaused;
  }

  /**
   * Check if paused
   */
  isPausedState(): boolean {
    if (!this.speechManager) return false;
    return this.speechManager.isPaused() || this.isPaused;
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<SpeechControllerOptions>): void {
    this.options = { ...this.options, ...options };

    // If currently speaking, update the utterance
    if (this.utterance && speechSynthesis.speaking) {
      if (options.voice !== undefined) {
        this.utterance.voice = options.voice;
      }
      if (options.rate !== undefined) {
        this.utterance.rate = options.rate;
      }
      if (options.pitch !== undefined) {
        this.utterance.pitch = options.pitch;
      }
      if (options.volume !== undefined) {
        this.utterance.volume = options.volume;
      }
    }
  }

  /**
   * Update callbacks
   */
  updateCallbacks(callbacks: Partial<SpeechControllerCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}
