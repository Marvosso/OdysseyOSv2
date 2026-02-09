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
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        
        const result = await operation();
        
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        
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
    
    
    // Try speaking again with retry
    return this.withRetry(
      () => speechManager.speak(text, voice, rate),
      (attempt) => {
        console.log(`[SpeechErrorRecovery] Recovery retry attempt ${attempt}`);
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
