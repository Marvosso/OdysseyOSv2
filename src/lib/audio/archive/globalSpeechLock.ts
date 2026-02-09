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

    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.isSpeaking = true;
          this.processing = true;
          
          
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.isSpeaking = false;
          this.processNext();
        }
      };

      if (!this.isSpeaking && !this.processing) {
        // Execute immediately
        task();
      } else {
        // Queue for later
        console.log(`[GlobalSpeechLock] Queueing operation (${this.queue.length} in queue)`);
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
        this.processing = true;
        nextTask();
      }
    } else {
      this.processing = false;
    }
  }

  /**
   * Force reset the lock (emergency use only)
   * Cancels all speech and clears the queue
   */
  static forceReset() {
    console.warn('[GlobalSpeechLock] Force reset called');
    
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
