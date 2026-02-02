/**
 * Speech Controller
 * 
 * @deprecated This file uses browser SpeechSynthesis API which has been replaced with ResponsiveVoice.
 * Use ResponsiveVoiceService and SimpleVoicePlayer components instead.
 * This file is kept for reference but should not be used in new code.
 * 
 * Manages Web Speech API (speechSynthesis) for text-to-speech narration
 */

// This file is deprecated - all functionality moved to ResponsiveVoice
// Keeping for reference only

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
  /**
   * @deprecated Use ResponsiveVoiceService instead
   */
  static isSupported(): boolean {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
    return false;
  }

  /**
   * @deprecated Use ResponsiveVoiceService instead
   */
  static getVoices(): SpeechSynthesisVoice[] {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
    return [];
  }

  /**
   * @deprecated Use ResponsiveVoiceService instead
   */
  static async loadVoices(): Promise<SpeechSynthesisVoice[]> {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
    return [];
  }

  /**
   * @deprecated Use ResponsiveVoiceService instead
   */
  static getDefaultVoice(): SpeechSynthesisVoice | null {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
    return null;
  }

  constructor(options: SpeechControllerOptions = {}, callbacks: SpeechControllerCallbacks = {}) {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
  }

  speak(text: string): void {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
  }

  pause(): void {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
  }

  resume(): void {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
  }

  stop(): void {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
  }

  isSpeaking(): boolean {
    return false;
  }

  isPausedState(): boolean {
    return false;
  }

  updateOptions(options: Partial<SpeechControllerOptions>): void {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
  }

  updateCallbacks(callbacks: Partial<SpeechControllerCallbacks>): void {
    console.warn('[SpeechController] This class is deprecated. Use ResponsiveVoiceService instead.');
  }
}
