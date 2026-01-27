/**
 * Speech Controller
 * 
 * Manages Web Speech API (speechSynthesis) for text-to-speech narration
 */

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
  }

  /**
   * Speak text
   */
  speak(text: string): void {
    if (!SpeechController.isSupported()) {
      this.callbacks.onError?.(new Error('Speech synthesis is not supported in this browser'));
      return;
    }

    // Cancel any existing speech
    this.stop();

    // Create new utterance
    this.utterance = new SpeechSynthesisUtterance(text);

    // Set voice
    if (this.options.voice) {
      this.utterance.voice = this.options.voice;
    } else {
      const defaultVoice = SpeechController.getDefaultVoice();
      if (defaultVoice) {
        this.utterance.voice = defaultVoice;
      }
    }

    // Set options
    this.utterance.rate = this.options.rate ?? 1;
    this.utterance.pitch = this.options.pitch ?? 1;
    this.utterance.volume = this.options.volume ?? 1;

    // Set up event handlers
    this.utterance.onstart = () => {
      this.isPaused = false;
      this.callbacks.onStart?.();
    };

    this.utterance.onend = () => {
      this.utterance = null;
      this.isPaused = false;
      this.callbacks.onEnd?.();
    };

    this.utterance.onerror = (event) => {
      this.utterance = null;
      this.isPaused = false;
      this.callbacks.onError?.(new Error(`Speech synthesis error: ${event.error}`));
    };

    this.utterance.onboundary = (event) => {
      this.callbacks.onBoundary?.(event);
    };

    // Speak
    speechSynthesis.speak(this.utterance);
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
    if (!SpeechController.isSupported()) return false;
    return speechSynthesis.speaking && !this.isPaused;
  }

  /**
   * Check if paused
   */
  isPausedState(): boolean {
    return this.isPaused;
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
