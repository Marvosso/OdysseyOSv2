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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:20',message:'SpeechService constructor',data:{isAvailable:this.isAvailable},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    
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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:35',message:'Initializing SpeechService',data:{voicesCount:this.synthesis.getVoices().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    
    // Preload voices
    if (this.synthesis.getVoices().length === 0) {
      this.synthesis.onvoiceschanged = () => {
        console.log('[SpeechService] Voices loaded:', this.synthesis.getVoices().length);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:42',message:'Voices loaded',data:{voicesCount:this.synthesis.getVoices().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        this.synthesis.onvoiceschanged = null;
      };
    }
    
    this.isInitialized = true;
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('Speech synthesis not available');
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:55',message:'speak called',data:{textLength:text.length,rate:options.rate,pitch:options.pitch,volume:options.volume,voice:options.voice,wasSpeaking:this.synthesis.speaking},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion

    // Cancel any current speech
    this.cancel();

    return new Promise((resolve, reject) => {
      // Create abort controller for this utterance
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      // Check if aborted before starting
      if (signal.aborted) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:68',message:'Speech aborted before start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:84',message:'Voice set',data:{voiceName:voice.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
          // #endregion
        }
      }

      // Set up event handlers
      const onEnd = () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:92',message:'Utterance ended',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        cleanup();
        resolve();
      };

      const onError = (event: SpeechSynthesisErrorEvent) => {
        const errorType = event.error;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:99',message:'Utterance error',data:{errorType:errorType,errorName:event.name,charIndex:event.charIndex,elapsedTime:event.elapsedTime,isInterrupted:errorType === 'interrupted'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:111',message:'Speech aborted',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:135',message:'Calling synthesis.speak',data:{textLength:text.length,wasAborted:signal.aborted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
          // #endregion
          this.synthesis.speak(this.currentUtterance!);
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:139',message:'Skipping speak - already aborted',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
          // #endregion
        }
      }, 50);
    });
  }

  cancel(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:145',message:'cancel called',data:{hasAbortController:!!this.abortController,wasAborted:this.abortController?.signal.aborted,wasSpeaking:this.synthesis?.speaking},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:160',message:'pause called',data:{wasSpeaking:this.synthesis?.speaking,wasPaused:this.synthesis?.paused},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechService.ts:168',message:'resume called',data:{wasPaused:this.synthesis?.paused},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    
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
