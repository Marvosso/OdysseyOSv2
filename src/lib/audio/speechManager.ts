/**
 * Speech Manager - Singleton for managing speech synthesis
 * 
 * PROBLEM: Multiple utterances triggering simultaneously
 * SOLUTION: Singleton speech manager to coordinate all speech synthesis
 */

import { VoiceLoader } from './voiceLoader';
import { TextChunker } from './textChunker';
import GlobalSpeechLock from './globalSpeechLock';

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
   * Automatically chunks long text to prevent timeouts
   * Uses GlobalSpeechLock to prevent conflicts across the entire app
   */
  speak(text: string, voice?: string, rate = 1): Promise<void> {
    console.log('[SpeechManager] speak() called', { textLength: text.length, voice, rate });
    
    // For long text, use TextChunker to break it into manageable pieces
    if (text.length > 500) {
      console.log('[SpeechManager] Text is long, using TextChunker', { textLength: text.length });
      // Wrap TextChunker in the global lock
      return GlobalSpeechLock.acquire(() => TextChunker.speakText(text, voice, rate, 300));
    }
    
    // Use global lock to ensure only one speech operation at a time
    return GlobalSpeechLock.acquire(() => {
      return new Promise<void>((resolve, reject) => {
        // If already speaking, queue this request
        if (this.isSpeaking || this.processingQueue) {
          console.log('[SpeechManager] Already speaking, queuing request');
          this.queue.push({ text, voice, rate, resolve, reject });
          return;
        }

        // Start speaking immediately
        this.processingQueue = true;
        this.processUtterance(text, rate, resolve, reject, voice).catch((error) => {
          console.error('[SpeechManager] Error in processUtterance:', error);
          reject(error);
          this.processingQueue = false;
          this.processQueue();
        });
      });
    });
  }

  /**
   * Process a single utterance
   */
  private async processUtterance(
    text: string,
    rate: number,
    resolve: () => void,
    reject: (error: Error) => void,
    voice?: string
  ): Promise<void> {
    console.log('[SpeechManager] Processing utterance', { textLength: text.length, voice, rate });
    
    // Cancel any current speech
    if (this.synthesis.speaking) {
      console.log('[SpeechManager] Canceling existing speech');
      this.synthesis.cancel();
    }

    // Wait for voices to load before creating utterance
    await VoiceLoader.waitForVoices();
    const voices = this.synthesis.getVoices();
    console.log('[SpeechManager] Voices available', { count: voices.length });

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Set voice if specified
    if (voice) {
      const selectedVoice = voices.find(v => v.name === voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('[SpeechManager] Voice set:', selectedVoice.name);
      } else {
        console.warn('[SpeechManager] Voice not found:', voice, 'Available voices:', voices.map(v => v.name).slice(0, 5));
      }
    } else {
      // Use default voice
      const defaultVoice = voices.find(v => v.localService && v.lang.startsWith('en')) || voices[0];
      if (defaultVoice) {
        utterance.voice = defaultVoice;
        console.log('[SpeechManager] Default voice set:', defaultVoice.name);
      } else {
        console.warn('[SpeechManager] No default voice found');
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

      utterance.onerror = async (event) => {
        const errorType = event.error;
        console.log('[SpeechManager] Utterance error', { errorType, errorName: event.name });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechManager.ts:134',message:'Utterance error',data:{errorType:errorType,errorName:event.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.processingQueue = false;
        
        // Don't treat "interrupted" or "canceled" as errors
        if (errorType === 'interrupted' || errorType === 'canceled') {
          console.log('[SpeechManager] Ignoring interrupted/canceled error');
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechManager.ts:145',message:'Ignoring interrupted/canceled',data:{errorType:errorType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          resolve(); // Resolve instead of reject
          this.processQueue();
        } else {
          const error = new Error(`Speech synthesis error: ${errorType}`);
          console.error('[SpeechManager] Speech error:', error);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechManager.ts:151',message:'Speech error occurred',data:{errorType:errorType,errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
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
      this.processUtterance(next.text, next.rate, next.resolve, next.reject, next.voice).catch((error) => {
        console.error('[SpeechManager] Error in processUtterance (queued):', error);
        next.reject(error);
        this.processingQueue = false;
        this.processQueue();
      });
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
