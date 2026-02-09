/**
 * Speech Service
 * 
 * Modern singleton service for speech synthesis with AbortController support
 * Provides clean Promise-based API with proper error handling
 */

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

export class SpeechService {
  private static instance: SpeechService;
  private synthesis: SpeechSynthesis;
  private isAvailable: boolean;
  private isInitialized = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private abortController: AbortController | null = null;

  private constructor() {
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null as any;
    this.isAvailable = !!this.synthesis;

    if (this.isAvailable) {
      this.initialize();
    }
  }

  static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  private initialize() {
    if (this.isInitialized) return;

    // Preload voices
    if (this.synthesis.getVoices().length === 0) {
      this.synthesis.onvoiceschanged = () => {
        console.log('[SpeechService] Voices loaded:', this.synthesis.getVoices().length);
        this.synthesis.onvoiceschanged = null;
      };
    }
    
    this.isInitialized = true;
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('Speech synthesis not available');
    }

    // Cancel any current speech
    this.cancel();

    return new Promise((resolve, reject) => {
      // Create abort controller for this utterance
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      // Check if aborted before starting
      if (signal.aborted) {
        reject(new Error('Speech aborted before start'));
        return;
      }

      // Create utterance
      this.currentUtterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance.rate = options.rate || 1;
      this.currentUtterance.pitch = options.pitch || 1;
      this.currentUtterance.volume = Math.min(options.volume || 1, 1);
      
      // Set voice if specified
      if (options.voice) {
        const voices = this.synthesis.getVoices();
        const voice = voices.find(v => v.name === options.voice);
        if (voice) {
          this.currentUtterance.voice = voice;
        }
      }

      // Set up event handlers
      const onEnd = () => {
        cleanup();
        resolve();
      };

      const onError = (event: SpeechSynthesisErrorEvent) => {
        const errorType = event.error;
        cleanup();
        
        // Don't reject for 'interrupted' - it's usually expected
        if (errorType === 'interrupted') {
          console.log('[SpeechService] Speech interrupted (expected)');
          resolve();
        } else {
          reject(new Error(`Speech error: ${errorType}`));
        }
      };

      const onAbort = () => {
        cleanup();
        reject(new Error('Speech aborted'));
      };

      const cleanup = () => {
        if (this.currentUtterance) {
          this.currentUtterance.onend = null;
          this.currentUtterance.onerror = null;
          this.currentUtterance = null;
        }
        if (this.abortController) {
          signal.removeEventListener('abort', onAbort);
          this.abortController = null;
        }
      };

      // Set up abort listener
      signal.addEventListener('abort', onAbort);

      // Set utterance handlers
      this.currentUtterance.onend = onEnd;
      this.currentUtterance.onerror = onError;

      // Start speaking with a small delay to ensure clean state
      setTimeout(() => {
        if (!signal.aborted) {
          this.synthesis.speak(this.currentUtterance!);
        }
      }, 50);
    });
  }

  cancel(): void {
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort();
    }
    
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    this.currentUtterance = null;
    this.abortController = null;
  }

  pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synthesis?.speaking || false;
  }
}

// Usage example:
// const speech = SpeechService.getInstance();
// await speech.speak('Hello world', { rate: 1.2, voice: 'Google US English' });
// speech.cancel();
