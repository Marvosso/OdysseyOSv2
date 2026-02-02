/**
 * Safe Speech Service
 * 
 * Comprehensive fix for speech synthesis errors with:
 * - Error counting and throttling
 * - Queue management
 * - Automatic reset on errors
 * - Graceful handling of "interrupted" errors
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

export class SafeSpeechService {
  private static instance: SafeSpeechService;
  private synthesis: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private queue: Array<{text: string, options?: SpeechOptions, resolve: Function, reject: Function}> = [];
  private processingQueue = false;
  private errorCount = 0;
  private lastErrorTime = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:25',message:'SafeSpeechService constructor',data:{hasSynthesis:!!this.synthesis},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion
  }

  static getInstance(): SafeSpeechService {
    if (!SafeSpeechService.instance) {
      SafeSpeechService.instance = new SafeSpeechService();
    }
    return SafeSpeechService.instance;
  }

  async speak(text: string, options?: SpeechOptions): Promise<void> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:38',message:'speak called',data:{textLength:text.length,errorCount:this.errorCount,timeSinceLastError:Date.now() - this.lastErrorTime,queueLength:this.queue.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion

    return new Promise((resolve, reject) => {
      // If too many errors, skip speech entirely
      if (this.errorCount > 5 && Date.now() - this.lastErrorTime < 60000) {
        console.warn('[SafeSpeech] Too many errors, skipping speech');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:45',message:'Skipping speech due to too many errors',data:{errorCount:this.errorCount,timeSinceLastError:Date.now() - this.lastErrorTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
        resolve();
        return;
      }

      this.queue.push({ text, options, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || !this.queue.length || !this.synthesis) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:56',message:'processQueue early return',data:{processingQueue:this.processingQueue,queueLength:this.queue.length,hasSynthesis:!!this.synthesis},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    this.processingQueue = true;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:64',message:'Processing queue',data:{queueLength:this.queue.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      
      try {
        await this._speakItem(item.text, item.options);
        item.resolve();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:73',message:'Queue item completed successfully',data:{remainingQueue:this.queue.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        console.error('[SafeSpeech] Error in speech:', error);
        this.errorCount++;
        this.lastErrorTime = Date.now();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:79',message:'Queue item failed',data:{error:error instanceof Error ? error.message : 'Unknown error',errorCount:this.errorCount,remainingQueue:this.queue.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
        item.reject(error);
        
        // Reset speech synthesis on error
        if (this.synthesis) {
          this.synthesis.cancel();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:86',message:'Resetting speech synthesis after error',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
          // #endregion
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Small delay between utterances
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.processingQueue = false;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:97',message:'Queue processing complete',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion
  }

  private async _speakItem(text: string, options?: SpeechOptions): Promise<void> {
    if (!this.synthesis) throw new Error('Speech synthesis not available');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:103',message:'_speakItem called',data:{textLength:text.length,wasSpeaking:this.synthesis.speaking,options:options},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion
    
    return new Promise((resolve, reject) => {
      // Cancel any current speech
      this.synthesis!.cancel();
      
      // Wait for cancel to complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply options
        if (options) {
          if (options.rate) utterance.rate = options.rate;
          if (options.pitch) utterance.pitch = options.pitch;
          if (options.volume) utterance.volume = options.volume;
          if (options.voice) {
            const voices = this.synthesis!.getVoices();
            const voice = voices.find(v => v.name === options!.voice);
            if (voice) {
              utterance.voice = voice;
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:120',message:'Voice set',data:{voiceName:voice.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
              // #endregion
            }
          }
        }

        // Set timeout
        const timeoutId = setTimeout(() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:127',message:'Speech timeout',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
          // #endregion
          this.synthesis!.cancel();
          reject(new Error('Speech timeout'));
        }, 30000);

        // Event handlers
        utterance.onstart = () => {
          this.isSpeaking = true;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:135',message:'Utterance started',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
          // #endregion
        };

        utterance.onend = () => {
          clearTimeout(timeoutId);
          this.isSpeaking = false;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:142',message:'Utterance ended',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
          // #endregion
          resolve();
        };

        utterance.onerror = (event) => {
          clearTimeout(timeoutId);
          this.isSpeaking = false;
          
          const errorType = event.error;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:152',message:'Utterance error',data:{errorType:errorType,errorName:event.name,charIndex:event.charIndex,elapsedTime:event.elapsedTime,isInterrupted:errorType === 'interrupted'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
          // #endregion
          
          // Don't treat 'interrupted' as an error if we're cancelling
          if (errorType === 'interrupted') {
            console.log('[SafeSpeech] Speech interrupted (expected)');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:158',message:'Interrupted error treated as success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
            // #endregion
            resolve();
          } else {
            reject(new Error(`Speech error: ${errorType}`));
          }
        };

        // Actually speak with delay
        setTimeout(() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:167',message:'Calling synthesis.speak',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
          // #endregion
          this.synthesis!.speak(utterance);
        }, 50);
        
      }, 100);
    });
  }

  cancel(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:175',message:'cancel called',data:{queueLength:this.queue.length,isSpeaking:this.isSpeaking},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion
    
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.queue = [];
    }
  }

  reset(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeSpeechService.ts:185',message:'reset called',data:{errorCount:this.errorCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion
    
    this.cancel();
    this.errorCount = 0;
  }
}
