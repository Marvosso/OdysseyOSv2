/**
 * Speech Service (stub)
 *
 * Browser SpeechSynthesis has been removed. Use server-side TTS instead.
 * This stub exists for any code that still imports SpeechService; all methods are no-ops or throw.
 */

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

export class SpeechService {
  private static instance: SpeechService;

  static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  async speak(_text: string, _options: SpeakOptions = {}): Promise<void> {
    throw new Error('Browser speech is disabled. Use server-side TTS.');
  }

  cancel(): void {
    // no-op
  }

  pause(): void {
    // no-op
  }

  resume(): void {
    // no-op
  }

  isSpeaking(): boolean {
    return false;
  }
}
