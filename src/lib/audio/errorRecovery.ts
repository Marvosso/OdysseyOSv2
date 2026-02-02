/**
 * Speech Error Recovery
 * 
 * Handles retries and recovery from speech synthesis errors
 */

import { SpeechManager } from './speechManager';

export class SpeechErrorRecovery {
  private static maxRetries = 2;
  private static retryDelay = 1000;

  /**
   * Execute an operation with automatic retry on failure
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number) => void
  ): Promise<T> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorRecovery.ts:20',message:'withRetry called',data:{maxRetries:this.maxRetries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorRecovery.ts:28',message:'Retry attempt',data:{attempt:attempt,maxRetries:this.maxRetries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        const result = await operation();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorRecovery.ts:33',message:'Operation succeeded',data:{attempt:attempt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorRecovery.ts:42',message:'Operation failed',data:{attempt:attempt,errorMessage:lastError.message,willRetry:attempt < this.maxRetries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        if (attempt < this.maxRetries) {
          if (onRetry) {
            onRetry(attempt);
          }
          const delayMs = this.retryDelay * attempt;
          console.log(`[SpeechErrorRecovery] Retrying after ${delayMs}ms (attempt ${attempt}/${this.maxRetries})`);
          await this.delay(delayMs);
        }
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorRecovery.ts:54',message:'All retries exhausted',data:{maxRetries:this.maxRetries,errorMessage:lastError!.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    throw lastError!;
  }

  /**
   * Recover from an interruption error by resetting and retrying
   */
  static async recoverFromInterrupt(
    text: string,
    voice?: string,
    rate = 1
  ): Promise<void> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorRecovery.ts:64',message:'recoverFromInterrupt called',data:{textLength:text.length,voice:voice,rate:rate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    const speechManager = SpeechManager.getInstance();
    
    // Stop any current speech
    console.log('[SpeechErrorRecovery] Stopping current speech');
    speechManager.stop();
    
    // Wait for system to reset
    await this.delay(500);
    
    // Clear speech queue at the browser level
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      console.log('[SpeechErrorRecovery] Canceling browser speech synthesis');
      window.speechSynthesis.cancel();
      await this.delay(200);
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorRecovery.ts:81',message:'Attempting recovery retry',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // Try speaking again with retry
    return this.withRetry(
      () => speechManager.speak(text, voice, rate),
      (attempt) => {
        console.log(`[SpeechErrorRecovery] Recovery retry attempt ${attempt}`);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorRecovery.ts:90',message:'Recovery retry attempt',data:{attempt:attempt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      }
    );
  }

  /**
   * Delay helper
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
