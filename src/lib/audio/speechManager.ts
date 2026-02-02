/**
 * Speech Manager - Singleton for managing speech synthesis
 * 
 * PROBLEM: Multiple utterances triggering simultaneously
 * SOLUTION: Singleton speech manager to coordinate all speech synthesis
 */

export class SpeechManager {
  private static instance: SpeechManager;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private queue: Array<{ text: string; voice?: string; rate: number; resolve: () => void; reject: (error: Error) => void }> = [];
  private processingQueue = false;

  private constructor() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('Speech synthesis is not supported in this browser');
    }
    this.synthesis = window.speechSynthesis;
  }

  static getInstance(): SpeechManager {
    if (!SpeechManager.instance) {
      SpeechManager.instance = new SpeechManager();
    }
    return SpeechManager.instance;
  }

  /**
   * Speak text with optional voice and rate
   * Returns a promise that resolves when speech completes
   */
  speak(text: string, voice?: string, rate = 1): Promise<void> {
    console.log('[SpeechManager] speak() called', { textLength: text.length, voice, rate });
    
    return new Promise((resolve, reject) => {
      // If already speaking, queue this request
      if (this.isSpeaking || this.processingQueue) {
        console.log('[SpeechManager] Already speaking, queuing request');
        this.queue.push({ text, voice, rate, resolve, reject });
        return;
      }

      // Start speaking immediately
      this.processingQueue = true;
      this.processUtterance(text, rate, resolve, reject, voice);
    });
  }

  /**
   * Process a single utterance
   */
  private processUtterance(
    text: string,
    rate: number,
    resolve: () => void,
    reject: (error: Error) => void,
    voice?: string
  ): void {
    console.log('[SpeechManager] Processing utterance', { textLength: text.length, voice, rate });
    
    // Cancel any current speech
    if (this.synthesis.speaking) {
      console.log('[SpeechManager] Canceling existing speech');
      this.synthesis.cancel();
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Set voice if specified
    if (voice) {
      const voices = this.synthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('[SpeechManager] Voice set:', selectedVoice.name);
      }
    } else {
      // Use default voice
      const voices = this.synthesis.getVoices();
      const defaultVoice = voices.find(v => v.localService && v.lang.startsWith('en')) || voices[0];
      if (defaultVoice) {
        utterance.voice = defaultVoice;
        console.log('[SpeechManager] Default voice set:', defaultVoice.name);
      }
    }

      // Event handlers
      utterance.onstart = () => {
        console.log('[SpeechManager] Utterance started');
        this.isSpeaking = true;
        this.currentUtterance = utterance;
        this.processingQueue = false; // Allow queue processing
      };

      utterance.onend = () => {
        console.log('[SpeechManager] Utterance ended');
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.processingQueue = false;
        resolve();
        
        // Process next in queue
        this.processQueue();
      };

      utterance.onerror = (event) => {
        const errorType = event.error;
        console.log('[SpeechManager] Utterance error', { errorType, errorName: event.name });
        
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.processingQueue = false;
        
        // Don't treat "interrupted" or "canceled" as errors
        if (errorType === 'interrupted' || errorType === 'canceled') {
          console.log('[SpeechManager] Ignoring interrupted/canceled error');
          resolve(); // Resolve instead of reject
          this.processQueue();
        } else {
          const error = new Error(`Speech synthesis error: ${errorType}`);
          console.error('[SpeechManager] Speech error:', error);
          reject(error);
          this.processQueue();
        }
      };

    // Start speaking
    try {
      console.log('[SpeechManager] Calling speechSynthesis.speak()');
      this.synthesis.speak(utterance);
      console.log('[SpeechManager] speak() called, speaking:', this.synthesis.speaking, 'pending:', this.synthesis.pending);
    } catch (error) {
      console.error('[SpeechManager] Error calling speak():', error);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Process the next item in the queue
   */
  private processQueue(): void {
    if (this.processingQueue || this.isSpeaking || this.queue.length === 0) {
      return;
    }

    const next = this.queue.shift();
    
    if (next) {
      console.log('[SpeechManager] Processing queued utterance');
      this.processingQueue = true;
      this.processUtterance(next.text, next.rate, next.resolve, next.reject, next.voice);
    }
  }

  /**
   * Stop all speech
   */
  stop(): void {
    console.log('[SpeechManager] stop() called');
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    // Clear queue
    this.queue.forEach(item => item.reject(new Error('Speech canceled')));
    this.queue = [];
  }

  /**
   * Pause current speech
   */
  pause(): void {
    console.log('[SpeechManager] pause() called');
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    console.log('[SpeechManager] resume() called');
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isCurrentlySpeaking(): boolean {
    return this.isSpeaking || this.synthesis.speaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synthesis.paused;
  }
}
