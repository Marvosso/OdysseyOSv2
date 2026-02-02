/**
 * Development Speech Disabler
 * 
 * Only use in development to debug speech-related code without actual audio
 * Replaces speechSynthesis with a mock implementation
 */

export function disableSpeechForDebugging() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devSpeechDisabler.ts:11',message:'disableSpeechForDebugging skipped',data:{isWindow:typeof window !== 'undefined',isDev:process.env.NODE_ENV === 'development'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
    // #endregion
    return;
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devSpeechDisabler.ts:16',message:'Disabling speech for debugging',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
  // #endregion
  
  console.log('[SpeechDisabler] Disabling speech for debugging');
  
  // Store original for potential restoration
  const originalSpeechSynthesis = window.speechSynthesis;
  
  // Replace with mock
  (window as any).speechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devSpeechDisabler.ts:30',message:'Mock getVoices called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
      return [];
    },
    speak: (utterance: SpeechSynthesisUtterance) => {
      const textPreview = utterance.text?.substring(0, 50) || '';
      console.log('[SpeechDisabler] Mock speak:', textPreview);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devSpeechDisabler.ts:37',message:'Mock speak called',data:{textLength:utterance.text?.length || 0,textPreview:textPreview,rate:utterance.rate,pitch:utterance.pitch,volume:utterance.volume,voice:utterance.voice?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
      
      // Simulate speech completion
      if (utterance.onstart) {
        setTimeout(() => {
          utterance.onstart!(new Event('start') as any);
        }, 10);
      }
      
      if (utterance.onend) {
        setTimeout(() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devSpeechDisabler.ts:48',message:'Mock utterance onend',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
          // #endregion
          utterance.onend!(new Event('end') as any);
        }, 100);
      }
    },
    cancel: () => {
      console.log('[SpeechDisabler] Mock cancel');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devSpeechDisabler.ts:55',message:'Mock cancel called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
    },
    pause: () => {
      console.log('[SpeechDisabler] Mock pause');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devSpeechDisabler.ts:60',message:'Mock pause called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
    },
    resume: () => {
      console.log('[SpeechDisabler] Mock resume');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devSpeechDisabler.ts:65',message:'Mock resume called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devSpeechDisabler.ts:75',message:'Speech synthesis restored',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
    }
  };
  
  console.log('[SpeechDisabler] Speech disabled. Call window.restoreSpeechSynthesis() to restore.');
}
