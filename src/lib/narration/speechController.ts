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
    console.log('[NARRATION] speak() called', { textLength: text.length, isSupported: SpeechController.isSupported() });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:102',message:'speak called',data:{textLength:text.length,textPreview:text.substring(0,50),isSupported:SpeechController.isSupported(),hasVoice:!!this.options.voice,rate:this.options.rate,pitch:this.options.pitch,volume:this.options.volume},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!SpeechController.isSupported()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:105',message:'speech not supported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      this.callbacks.onError?.(new Error('Speech synthesis is not supported in this browser'));
      return;
    }

    // Don't cancel existing speech - let it finish naturally
    // Only cancel if we have our own utterance that's still active
    const wasSpeaking = speechSynthesis.speaking;
    const hasOurUtterance = this.utterance !== null;
    console.log('[NARRATION] before creating utterance', { wasSpeaking, hasOurUtterance });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:115',message:'before speak - checking existing speech',data:{wasSpeaking:wasSpeaking,hasOurUtterance:hasOurUtterance},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Only cancel if we have our own utterance that's still active
    // This prevents canceling other components' speech
    if (hasOurUtterance && wasSpeaking) {
      console.log('[NARRATION] canceling our own utterance');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:123',message:'canceling our own utterance',data:{wasSpeaking:wasSpeaking,hasOurUtterance:hasOurUtterance},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      speechSynthesis.cancel();
      this.utterance = null;
    }

    // Create new utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    console.log('[NARRATION] utterance created', { textLength: text.length, utterance: this.utterance });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:130',message:'utterance created',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Set voice
    if (this.options.voice) {
      this.utterance.voice = this.options.voice;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:120',message:'voice set from options',data:{voiceName:this.options.voice.name,voiceLang:this.options.voice.lang},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } else {
      const defaultVoice = SpeechController.getDefaultVoice();
      if (defaultVoice) {
        this.utterance.voice = defaultVoice;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:126',message:'default voice set',data:{voiceName:defaultVoice.name,voiceLang:defaultVoice.lang},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:130',message:'no default voice found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }
    }

    // Set options
    this.utterance.rate = this.options.rate ?? 1;
    this.utterance.pitch = this.options.pitch ?? 1;
    this.utterance.volume = this.options.volume ?? 1;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:136',message:'utterance options set',data:{rate:this.utterance.rate,pitch:this.utterance.pitch,volume:this.utterance.volume},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Set up event handlers
    this.utterance.onstart = () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:141',message:'utterance onstart',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      this.isPaused = false;
      this.callbacks.onStart?.();
    };

    this.utterance.onend = () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:148',message:'utterance onend',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      this.utterance = null;
      this.isPaused = false;
      this.callbacks.onEnd?.();
    };

    this.utterance.onerror = (event) => {
      const errorType = event.error;
      console.log('[NARRATION] utterance onerror', { errorType, errorName: event.name, charIndex: event.charIndex });
      // #region agent log
      const logData = {errorType:event.error,errorName:event.name,errorCharIndex:event.charIndex,errorElapsedTime:event.elapsedTime,errorStringified:JSON.stringify(event)};
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:175',message:'utterance onerror',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      this.utterance = null;
      this.isPaused = false;
      // Don't treat "interrupted" or "canceled" as errors
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:185',message:'error type check',data:{errorType:errorType,isInterrupted:errorType === 'interrupted',isCanceled:errorType === 'canceled',willCallOnEnd:errorType === 'interrupted' || errorType === 'canceled'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (errorType === 'interrupted' || errorType === 'canceled') {
        console.log('[NARRATION] ignoring interrupted/canceled error, calling onEnd');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:191',message:'ignoring interrupted/canceled error, calling onEnd',data:{errorType:errorType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Call onEnd instead of onError for interruptions - DO NOT call onError
        this.callbacks.onEnd?.();
      } else {
        console.log('[NARRATION] calling onError for non-interrupted error:', errorType);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:197',message:'calling onError for non-interrupted error',data:{errorType:errorType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        this.callbacks.onError?.(new Error(`Speech synthesis error: ${event.error}`));
      }
    };

    this.utterance.onboundary = (event) => {
      this.callbacks.onBoundary?.(event);
    };

    // Speak - use requestAnimationFrame to ensure utterance is fully set up
    // Some browsers need a small delay between cancel and speak
    const utterance = this.utterance; // Capture reference
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:215',message:'about to call speechSynthesis.speak',data:{textLength:text.length,wasSpeaking:speechSynthesis.speaking,utteranceText:utterance ? utterance.text.substring(0,50) : '',hasVoice:utterance ? !!utterance.voice : false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{console.log('[DEBUG] about to call speechSynthesis.speak:', {textLength: text.length, wasSpeaking: speechSynthesis.speaking, hasVoice: utterance ? !!utterance.voice : false});});
    // #endregion
    
    // Call speak immediately - must be in user interaction context
    // Browsers require speechSynthesis.speak() to be called directly from user interaction
    console.log('[NARRATION] about to call speechSynthesis.speak', { 
      textLength: text.length, 
      wasSpeaking: speechSynthesis.speaking,
      utterance: this.utterance,
      hasVoice: this.utterance ? !!this.utterance.voice : false,
      pending: speechSynthesis.pending,
      speaking: speechSynthesis.speaking
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechController.ts:215',message:'about to call speechSynthesis.speak',data:{textLength:text.length,wasSpeaking:speechSynthesis.speaking,utteranceText:utterance ? utterance.text.substring(0,50) : '',hasVoice:utterance ? !!utterance.voice : false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (!this.utterance) {
      console.error('[NARRATION] ERROR: utterance is null when trying to speak!');
      return;
    }

    // Ensure we're not already speaking something else
    if (speechSynthesis.speaking && !this.utterance) {
      console.log('[NARRATION] Already speaking, canceling first');
      speechSynthesis.cancel();
      // Small delay to let cancel complete
      setTimeout(() => {
        console.log('[NARRATION] calling speechSynthesis.speak after cancel delay');
        speechSynthesis.speak(this.utterance!);
      }, 50);
      return;
    }

    console.log('[NARRATION] calling speechSynthesis.speak NOW', {
      textLength: this.utterance.text.length,
      hasVoice: !!this.utterance.voice,
      rate: this.utterance.rate,
      volume: this.utterance.volume,
      pending: speechSynthesis.pending,
      speaking: speechSynthesis.speaking
    });
    
    try {
      speechSynthesis.speak(this.utterance);
      console.log('[NARRATION] speechSynthesis.speak() called successfully, speaking:', speechSynthesis.speaking, 'pending:', speechSynthesis.pending);
    } catch (error) {
      console.error('[NARRATION] ERROR calling speechSynthesis.speak:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
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
