/**
 * Audio Generator
 * 
 * Generates audiobook audio using browser SpeechSynthesis API
 * Records audio using Web Audio API and exports as downloadable file
 */

import type { Scene, Character } from '@/types/story';
import { StoryStorage } from '@/lib/storage/storyStorage';

export interface VoiceSettings {
  voiceName: string;
  pitch: number; // 0-2, default 1
  rate: number; // 0.1-10, default 1
  volume: number; // 0-1, default 1
}

export interface CharacterVoice {
  characterId: string;
  characterName: string;
  voiceSettings: VoiceSettings;
}

export interface AudioGenerationOptions {
  voices: CharacterVoice[];
  narratorVoice: VoiceSettings;
  speed: number; // Overall speed multiplier
  addChapterMarkers: boolean;
  backgroundMusic: boolean;
  musicVolume: number; // 0-1
}

export interface GenerationProgress {
  currentScene: number;
  totalScenes: number;
  currentSceneTitle: string;
  percentage: number;
  isPaused: boolean;
  isCancelled: boolean;
}

export class AudioGenerator {
  private audioContext: AudioContext | null = null;
  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private progressCallback: ((progress: GenerationProgress) => void) | null = null;

  /**
   * Get available browser voices
   */
  static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return [];
    }
    return window.speechSynthesis.getVoices();
  }

  /**
   * Wait for voices to load
   */
  static async waitForVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve([]);
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    });
  }

  /**
   * Generate audio from a single scene
   */
  async generateAudioFromScene(
    scene: Scene,
    voiceSettings: VoiceSettings,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (typeof window === 'undefined') {
      throw new Error('Audio generation requires browser environment');
    }

    // Initialize audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();
    this.recordedChunks = [];

    // Create MediaRecorder
    const stream = this.mediaStreamDestination.stream;
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        // Convert to WAV for better compatibility
        this.convertToWAV(blob).then(resolve).catch(reject);
      };

      this.mediaRecorder.onerror = (error) => {
        reject(error);
      };

      // Start recording
      this.mediaRecorder.start();

      // Generate speech
      this.speakText(scene.content, voiceSettings, () => {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          setTimeout(() => {
            if (this.mediaRecorder) {
              this.mediaRecorder.stop();
            }
          }, 500); // Small delay to ensure all audio is captured
        }
      });
    });
  }

  /**
   * Generate full audiobook
   * 
   * NOTE: SpeechSynthesis API doesn't output to Web Audio API, so direct recording isn't possible.
   * This implementation plays the audio sequentially. Users can use system audio recording
   * software to capture it, or we generate a text file for use with external TTS services.
   */
  async generateFullAudiobook(
    storyId: string,
    options: AudioGenerationOptions,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<Blob> {
    const story = StoryStorage.loadStory();
    const scenes = StoryStorage.loadScenes();

    if (!story || scenes.length === 0) {
      throw new Error('No story or scenes found');
    }

    this.progressCallback = onProgress || null;
    this.isPaused = false;
    this.isCancelled = false;

    // Play audio sequentially and generate text file
    // Since we can't record SpeechSynthesis directly, we'll play it and provide text
    try {
      // Play the audio (user can record with external software)
      await this.playAudiobookSequentially(story, scenes, options);
      
      // Also generate a text file for use with external TTS services
      return this.generateTextInstructions(story, scenes, options);
    } catch (error) {
      // If playback fails, still generate text file
      console.error('Audio playback error:', error);
      return this.generateTextInstructions(story, scenes, options);
    }
  }

  /**
   * Play audiobook sequentially (for user to record externally)
   */
  private async playAudiobookSequentially(
    story: any,
    scenes: any[],
    options: AudioGenerationOptions
  ): Promise<void> {
    // Speak story title
    if (options.addChapterMarkers) {
      await this.speakTextAsync(`Chapter: ${story.title}`, options.narratorVoice);
    }

    // Process each scene
    for (let i = 0; i < scenes.length; i++) {
      if (this.isCancelled) {
        return;
      }

      // Wait if paused
      while (this.isPaused && !this.isCancelled) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (this.isCancelled) {
        return;
      }

      const scene = scenes[i];
      
      // Update progress
      if (this.progressCallback) {
        this.progressCallback({
          currentScene: i + 1,
          totalScenes: scenes.length,
          currentSceneTitle: scene.title,
          percentage: ((i + 1) / scenes.length) * 100,
          isPaused: this.isPaused,
          isCancelled: this.isCancelled,
        });
      }

      // Determine voice for this scene
      let voiceSettings = options.narratorVoice;
      if (scene.povCharacter) {
        const characterVoice = options.voices.find(
          (v) => v.characterId === scene.povCharacter || v.characterName === scene.povCharacter
        );
        if (characterVoice) {
          voiceSettings = characterVoice.voiceSettings;
        }
      }

      // Add scene marker
      if (options.addChapterMarkers && scene.title) {
        await this.speakTextAsync(`Scene: ${scene.title}`, options.narratorVoice);
        await this.delay(300);
      }

      // Speak scene content
      const sceneText = this.prepareSceneText(scene.content, options.voices);
      await this.speakTextAsync(sceneText, voiceSettings);

      // Add pause between scenes
      if (i < scenes.length - 1) {
        await this.delay(500);
      }
    }
  }

  /**
   * Generate a text file with instructions and story content
   */
  private generateTextInstructions(
    story: any,
    scenes: any[],
    options: AudioGenerationOptions
  ): Promise<Blob> {
    let content = `AUDIOBOOK TEXT FOR: ${story.title}\n\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    content += `=== INSTRUCTIONS ===\n`;
    content += `This text file contains your story formatted for use with:\n`;
    content += `- External TTS services (Google Cloud TTS, Amazon Polly, etc.)\n`;
    content += `- Text-to-speech software\n`;
    content += `- Online TTS tools\n\n`;
    content += `The audio is currently playing through your speakers.\n`;
    content += `You can use system audio recording software to capture it.\n\n`;
    content += `=== STORY TITLE ===\n${story.title}\n\n`;

    scenes.forEach((scene, index) => {
      content += `=== SCENE ${index + 1}: ${scene.title || 'Untitled'} ===\n`;
      content += `${scene.content}\n\n`;
    });

    return Promise.resolve(new Blob([content], { type: 'text/plain' }));
  }

  /**
   * Prepare scene text with character voice markers
   */
  private prepareSceneText(text: string, characterVoices: CharacterVoice[]): string {
    // For now, return text as-is
    // In a full implementation, you could parse dialogue and assign voices
    return text;
  }

  /**
   * Speak text synchronously
   */
  private speakTextAsync(text: string, voiceSettings: VoiceSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('SpeechSynthesis not available'));
        return;
      }

      // Cancel any ongoing speech before starting new one
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find((v) => v.name === voiceSettings.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Set properties
      utterance.pitch = voiceSettings.pitch;
      utterance.rate = voiceSettings.rate * (this.isPaused ? 0 : 1);
      utterance.volume = voiceSettings.volume;

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (error) => {
        this.currentUtterance = null;
        // Handle "interrupted" errors gracefully - they're not real errors
        if (error.error === 'interrupted' || error.error === 'canceled') {
          // Interruption is expected when canceling or pausing
          resolve();
        } else {
          // Log other errors but don't fail the generation
          console.warn('Speech synthesis error:', error);
          resolve();
        }
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Speak text (callback version)
   */
  private speakText(text: string, voiceSettings: VoiceSettings, onComplete: () => void): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onComplete();
      return;
    }

    // Cancel any ongoing speech before starting new one
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find((v) => v.name === voiceSettings.voiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Set properties
    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.rate;
    utterance.volume = voiceSettings.volume;

    utterance.onend = () => {
      this.currentUtterance = null;
      onComplete();
    };
    
    utterance.onerror = (error) => {
      this.currentUtterance = null;
      // Handle interruptions gracefully
      if (error.error === 'interrupted' || error.error === 'canceled') {
        // Interruption is expected, just complete
        onComplete();
      } else {
        // Log other errors but still complete
        console.warn('Speech synthesis error:', error);
        onComplete();
      }
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Convert WebM blob to WAV
   */
  private async convertToWAV(webmBlob: Blob): Promise<Blob> {
    // For now, return the WebM blob
    // In a full implementation, you would decode the WebM and re-encode as WAV
    // This requires additional libraries or Web Audio API processing
    return webmBlob;
  }

  /**
   * Pause generation
   */
  pause(): void {
    this.isPaused = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
    }
  }

  /**
   * Resume generation
   */
  resume(): void {
    this.isPaused = false;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  }

  /**
   * Cancel generation
   */
  cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel all speech synthesis
      window.speechSynthesis.cancel();
      // Clear current utterance reference
      this.currentUtterance = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStreamDestination) {
      this.mediaStreamDestination.disconnect();
      this.mediaStreamDestination = null;
    }
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.currentUtterance = null;
  }
}
