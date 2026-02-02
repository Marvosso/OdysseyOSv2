/**
 * Global Speech Lock
 * 
 * Ensures only one speech operation executes at a time across the entire application
 * Prevents conflicts when multiple components try to speak simultaneously
 */

class GlobalSpeechLock {
  private static isSpeaking = false;
  private static queue: Array<() => Promise<void>> = [];
  private static processing = false;

  /**
   * Acquire the lock and execute an operation
   * If another operation is in progress, queue this one
   */
  static async acquire<T>(operation: () => Promise<T>): Promise<T> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'globalSpeechLock.ts:18',message:'acquire called',data:{isSpeaking:this.isSpeaking,processing:this.processing,queueLength:this.queue.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.isSpeaking = true;
          this.processing = true;
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'globalSpeechLock.ts:28',message:'Executing operation',data:{queueLength:this.queue.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
          // #endregion
          
          const result = await operation();
          resolve(result);
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'globalSpeechLock.ts:35',message:'Operation failed',data:{error:error instanceof Error ? error.message : 'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
          // #endregion
          reject(error);
        } finally {
          this.isSpeaking = false;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'globalSpeechLock.ts:41',message:'Operation completed',data:{queueLength:this.queue.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
          // #endregion
          this.processNext();
        }
      };

      if (!this.isSpeaking && !this.processing) {
        // Execute immediately
        task();
      } else {
        // Queue for later
        console.log(`[GlobalSpeechLock] Queueing operation (${this.queue.length} in queue)`);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'globalSpeechLock.ts:52',message:'Queueing operation',data:{queueLength:this.queue.length,isSpeaking:this.isSpeaking,processing:this.processing},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        this.queue.push(task);
      }
    });
  }

  /**
   * Process the next item in the queue
   */
  private static processNext() {
    if (this.queue.length > 0) {
      const nextTask = this.queue.shift();
      if (nextTask) {
        console.log(`[GlobalSpeechLock] Processing next queued operation (${this.queue.length} remaining)`);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'globalSpeechLock.ts:65',message:'Processing next queued operation',data:{queueLength:this.queue.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        this.processing = true;
        nextTask();
      }
    } else {
      this.processing = false;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'globalSpeechLock.ts:72',message:'Queue empty, lock released',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
    }
  }

  /**
   * Force reset the lock (emergency use only)
   * Cancels all speech and clears the queue
   */
  static forceReset() {
    console.warn('[GlobalSpeechLock] Force reset called');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'globalSpeechLock.ts:81',message:'Force reset',data:{queueLength:this.queue.length,isSpeaking:this.isSpeaking,processing:this.processing},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.processing = false;
    this.queue = [];
  }

  /**
   * Get current lock status (for debugging)
   */
  static getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      processing: this.processing,
      queueLength: this.queue.length,
    };
  }
}

export default GlobalSpeechLock;
