/**
 * Development Speech Disabler
 * 
 * Only use in development to debug speech-related code without actual audio
 * Replaces speechSynthesis with a mock implementation
 */

export function disableSpeechForDebugging() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }
  
  
  console.log('[SpeechDisabler] Disabling speech for debugging');
  
  // Store original for potential restoration
  const originalSpeechSynthesis = window.speechSynthesis;
  
  // Replace with mock
  (window as any).speechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => {
      return [];
    },
    speak: (utterance: SpeechSynthesisUtterance) => {
      const textPreview = utterance.text?.substring(0, 50) || '';
      console.log('[SpeechDisabler] Mock speak:', textPreview);
      
      // Simulate speech completion
      if (utterance.onstart) {
        setTimeout(() => {
          utterance.onstart!(new Event('start') as any);
        }, 10);
      }
      
      if (utterance.onend) {
        setTimeout(() => {
          utterance.onend!(new Event('end') as any);
        }, 100);
      }
    },
    cancel: () => {
      console.log('[SpeechDisabler] Mock cancel');
    },
    pause: () => {
      console.log('[SpeechDisabler] Mock pause');
    },
    resume: () => {
      console.log('[SpeechDisabler] Mock resume');
    },
    onvoiceschanged: null
  };
  
  // Store original for restoration function
  (window as any).__originalSpeechSynthesis = originalSpeechSynthesis;
  
  // Provide restore function
  (window as any).restoreSpeechSynthesis = () => {
    if ((window as any).__originalSpeechSynthesis) {
      (window as any).speechSynthesis = (window as any).__originalSpeechSynthesis;
      console.log('[SpeechDisabler] Speech synthesis restored');
    }
  };
  
  console.log('[SpeechDisabler] Speech disabled. Call window.restoreSpeechSynthesis() to restore.');
}
