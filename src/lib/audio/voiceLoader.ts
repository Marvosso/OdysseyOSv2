/**
 * Voice Loader
 * 
 * PROBLEM: Voices not loaded when trying to speak
 * SOLUTION: Wait for voices to load before using them
 */

export class VoiceLoader {
  private static voicesLoaded = false;
  private static loadPromise: Promise<SpeechSynthesisVoice[]>;

  /**
   * Get voices, waiting for them to load if necessary
   */
  static async getVoices(): Promise<SpeechSynthesisVoice[]> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }

    const synthesis = window.speechSynthesis;
    
    if (this.voicesLoaded) {
      return synthesis.getVoices();
    }

    if (!this.loadPromise) {
      this.loadPromise = new Promise((resolve) => {
        // Some browsers load voices async
        const voices = synthesis.getVoices();
        if (voices.length > 0) {
          console.log('[VoiceLoader] Voices already available', { count: voices.length });
          this.voicesLoaded = true;
          resolve(voices);
        } else {
          console.log('[VoiceLoader] Waiting for voices to load...');
          // Set up listener for when voices are loaded
          const onVoicesChanged = () => {
            const loadedVoices = synthesis.getVoices();
            console.log('[VoiceLoader] Voices loaded', { count: loadedVoices.length });
            this.voicesLoaded = true;
            synthesis.onvoiceschanged = null; // Clean up
            resolve(loadedVoices);
          };
          
          synthesis.onvoiceschanged = onVoicesChanged;
          
          // Fallback: check again after a short delay
          setTimeout(() => {
            const voices = synthesis.getVoices();
            if (voices.length > 0 && !this.voicesLoaded) {
              console.log('[VoiceLoader] Voices loaded via timeout', { count: voices.length });
              this.voicesLoaded = true;
              synthesis.onvoiceschanged = null; // Clean up
              resolve(voices);
            }
          }, 1000);
        }
      });
    }

    return this.loadPromise;
  }

  /**
   * Wait for voices to be loaded
   */
  static async waitForVoices(): Promise<void> {
    await this.getVoices();
  }

  /**
   * Reset the loaded state (useful for testing or if voices change)
   */
  static reset(): void {
    this.voicesLoaded = false;
    this.loadPromise = undefined as any;
  }
}
