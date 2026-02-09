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
    
  }

  static getInstance(): SafeSpeechService {
    if (!SafeSpeechService.instance) {
      SafeSpeechService.instance = new SafeSpeechService();
    }
    return SafeSpeechService.instance;
  }

  async speak(text: string, options?: SpeechOptions): Promise<void> {

    return new Promise((resolve, reject) => {
      // If too many errors, skip speech entirely
      if (this.errorCount > 5 && Date.now() - this.lastErrorTime < 60000) {
        console.warn('[SafeSpeech] Too many errors, skipping speech');
        resolve();
        return;
      }

      this.queue.push({ text, options, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || !this.queue.length || !this.synthesis) {
      return;
    }
    
    this.processingQueue = true;
    
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      
      try {
        await this._speakItem(item.text, item.options);
        item.resolve();
      } catch (error) {
        console.error('[SafeSpeech] Error in speech:', error);
        this.errorCount++;
        this.lastErrorTime = Date.now();
        item.reject(error);
        
        // Reset speech synthesis on error
        if (this.synthesis) {
          this.synthesis.cancel();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Small delay between utterances
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.processingQueue = false;
  }

  private async _speakItem(text: string, options?: SpeechOptions): Promise<void> {
    if (!this.synthesis) throw new Error('Speech synthesis not available');
    
    
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
            }
          }
        }

        // Set timeout
        const timeoutId = setTimeout(() => {
          this.synthesis!.cancel();
          reject(new Error('Speech timeout'));
        }, 30000);

        // Event handlers
        utterance.onstart = () => {
          this.isSpeaking = true;
        };

        utterance.onend = () => {
          clearTimeout(timeoutId);
          this.isSpeaking = false;
          resolve();
        };

        utterance.onerror = (event) => {
          clearTimeout(timeoutId);
          this.isSpeaking = false;
          
          const errorType = event.error;
          
          // Don't treat 'interrupted' as an error if we're cancelling
          if (errorType === 'interrupted') {
            console.log('[SafeSpeech] Speech interrupted (expected)');
            resolve();
          } else {
            reject(new Error(`Speech error: ${errorType}`));
          }
        };

        // Actually speak with delay
        setTimeout(() => {
          this.synthesis!.speak(utterance);
        }, 50);
        
      }, 100);
    });
  }

  cancel(): void {
    
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.queue = [];
    }
  }

  reset(): void {
    
    this.cancel();
    this.errorCount = 0;
  }
}
