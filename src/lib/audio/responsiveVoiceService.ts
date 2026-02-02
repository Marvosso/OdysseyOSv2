/**
 * ResponsiveVoice Service
 * 
 * Wrapper around ResponsiveVoice API for text-to-speech
 * Replaces browser SpeechSynthesis API
 */

declare global {
  interface Window {
    responsiveVoice?: {
      speak: (text: string, voice?: string, options?: ResponsiveVoiceOptions) => void;
      cancel: () => void;
      isPlaying: () => boolean;
      getVoices: () => string[];
      setDefaultVoice: (voice: string) => void;
      enableWakeLock: () => void;
      OnVoiceReady: (callback: () => void) => void;
    };
  }
}

export interface ResponsiveVoiceOptions {
  pitch?: number; // 0.5 to 2.0
  rate?: number; // 0.1 to 1.0 (speed)
  volume?: number; // 0.0 to 1.0
  onstart?: () => void;
  onend?: () => void;
  onerror?: (error: any) => void;
}

export class ResponsiveVoiceService {
  private static instance: ResponsiveVoiceService;
  private isReady = false;
  private readyPromise: Promise<void>;
  private currentCallbacks: {
    onstart?: () => void;
    onend?: () => void;
    onerror?: (error: any) => void;
  } = {};

  private constructor() {
    this.readyPromise = this.waitForResponsiveVoice();
  }

  static getInstance(): ResponsiveVoiceService {
    if (!ResponsiveVoiceService.instance) {
      ResponsiveVoiceService.instance = new ResponsiveVoiceService();
    }
    return ResponsiveVoiceService.instance;
  }

  /**
   * Wait for ResponsiveVoice to be loaded (public method)
   */
  async waitForResponsiveVoice(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      // Check if already loaded
      if (window.responsiveVoice) {
        this.isReady = true;
        resolve();
        return;
      }

      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.responsiveVoice) {
          clearInterval(checkInterval);
          this.isReady = true;
          
          // Set up ready callback
          if (window.responsiveVoice.OnVoiceReady) {
            window.responsiveVoice.OnVoiceReady(() => {
              console.log('[ResponsiveVoice] Voice ready');
            });
          }
          
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!this.isReady) {
          console.warn('[ResponsiveVoice] Timeout waiting for ResponsiveVoice to load');
          resolve(); // Resolve anyway to not block
        }
      }, 10000);
    });
  }

  /**
   * Check if ResponsiveVoice is available
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.responsiveVoice;
  }

  /**
   * Speak text with options
   */
  async speak(text: string, voice?: string, options?: ResponsiveVoiceOptions): Promise<void> {
    await this.readyPromise;

    if (!this.isAvailable()) {
      throw new Error('ResponsiveVoice is not available');
    }

    return new Promise((resolve, reject) => {
      // Store callbacks
      this.currentCallbacks = {
        onstart: options?.onstart,
        onend: () => {
          if (options?.onend) options.onend();
          resolve();
        },
        onerror: (error) => {
          if (options?.onerror) options.onerror(error);
          reject(error);
        },
      };

      // Call onstart immediately
      if (this.currentCallbacks.onstart) {
        this.currentCallbacks.onstart();
      }

      // Build options object for ResponsiveVoice
      const rvOptions: any = {
        pitch: options?.pitch ?? 1,
        rate: options?.rate ?? 1,
        volume: options?.volume ?? 1,
        onstart: this.currentCallbacks.onstart,
        onend: this.currentCallbacks.onend,
        onerror: this.currentCallbacks.onerror,
      };

      // Speak
      try {
        window.responsiveVoice!.speak(text, voice || 'UK English Female', rvOptions);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Cancel current speech
   */
  cancel(): void {
    if (this.isAvailable()) {
      window.responsiveVoice!.cancel();
    }
    this.currentCallbacks = {};
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    if (!this.isAvailable()) {
      return false;
    }
    return window.responsiveVoice!.isPlaying();
  }

  /**
   * Get available voices
   * Note: ResponsiveVoice doesn't expose getVoices() in the free API
   * We return a list of known ResponsiveVoice voices
   */
  getVoices(): string[] {
    // ResponsiveVoice free API doesn't expose getVoices()
    // Return known available voices
    return [
      'UK English Female',
      'US English Female',
      'UK English Male',
      'US English Male',
      'Australian Female',
      'Australian Male',
      'Irish Female',
      'Irish Male',
      'South African English Female',
      'South African English Male',
      'Indian English Female',
      'Indian English Male',
    ];
  }

  /**
   * Set default voice
   */
  setDefaultVoice(voice: string): void {
    if (this.isAvailable() && 'setDefaultVoice' in window.responsiveVoice!) {
      window.responsiveVoice!.setDefaultVoice(voice);
    }
  }
}
