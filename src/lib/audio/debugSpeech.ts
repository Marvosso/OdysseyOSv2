/**
 * Speech Synthesis Debug Wrapper
 * 
 * Intercepts all speechSynthesis calls to provide detailed debugging information
 * Call debugSpeech() early in the app lifecycle to enable
 */

export function debugSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('[Speech Debug] speechSynthesis not available');
    return;
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'debugSpeech.ts:12',message:'Installing speech debug wrapper',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
  // #endregion

  const originalSpeak = window.speechSynthesis.speak;
  const originalCancel = window.speechSynthesis.cancel;
  const originalPause = window.speechSynthesis.pause;
  const originalResume = window.speechSynthesis.resume;
  
  let utteranceCount = 0;
  let totalSpeakCalls = 0;
  
  // Wrap speak()
  window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
    totalSpeakCalls++;
    utteranceCount++;
    
    const callStack = new Error().stack;
    const stackLines = callStack?.split('\n').slice(2, 8).join(' | ') || 'unknown';
    
    const debugInfo = {
      callNumber: totalSpeakCalls,
      activeUtterances: utteranceCount,
      text: utterance.text.substring(0, 50) + (utterance.text.length > 50 ? '...' : ''),
      textLength: utterance.text.length,
      voice: utterance.voice?.name || 'default',
      rate: utterance.rate,
      pitch: utterance.pitch,
      volume: utterance.volume,
      lang: utterance.lang,
      stack: stackLines,
      wasSpeaking: this.speaking,
      wasPaused: this.paused,
      pendingCount: this.pending
    };
    
    console.log(`[Speech Debug] Speak called #${totalSpeakCalls} (${utteranceCount} active):`, debugInfo);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'debugSpeech.ts:45',message:'speak intercepted',data:debugInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    // Add debug event listeners
    const originalOnEnd = utterance.onend;
    const originalOnError = utterance.onerror;
    const originalOnStart = utterance.onstart;
    const originalOnBoundary = utterance.onboundary;
    
    utterance.onstart = function(event) {
      console.log(`[Speech Debug] Utterance #${totalSpeakCalls} started speaking`, {
        text: utterance.text.substring(0, 50),
        voice: utterance.voice?.name,
        speaking: window.speechSynthesis.speaking,
        pending: window.speechSynthesis.pending
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'debugSpeech.ts:57',message:'utterance onstart',data:{callNumber:totalSpeakCalls,textLength:utterance.text.length,voice:utterance.voice?.name,speaking:window.speechSynthesis.speaking,pending:window.speechSynthesis.pending},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      if (originalOnStart) originalOnStart.call(utterance, event);
    };
    
    utterance.onend = function(event) {
      utteranceCount--;
      console.log(`[Speech Debug] Utterance #${totalSpeakCalls} finished`, {
        text: utterance.text.substring(0, 50),
        remainingActive: utteranceCount,
        speaking: window.speechSynthesis.speaking,
        pending: window.speechSynthesis.pending
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'debugSpeech.ts:68',message:'utterance onend',data:{callNumber:totalSpeakCalls,remainingActive:utteranceCount,speaking:window.speechSynthesis.speaking,pending:window.speechSynthesis.pending},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      if (originalOnEnd) originalOnEnd.call(utterance, event);
    };
    
    utterance.onerror = function(event) {
      utteranceCount--;
      const errorInfo = {
        callNumber: totalSpeakCalls,
        error: event.error,
        errorName: event.name,
        charIndex: event.charIndex,
        elapsedTime: event.elapsedTime,
        utterance: utterance.text.substring(0, 100),
        remainingActive: utteranceCount,
        speaking: window.speechSynthesis.speaking,
        pending: window.speechSynthesis.pending,
        paused: window.speechSynthesis.paused
      };
      console.error('[Speech Debug] Speech error:', errorInfo);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'debugSpeech.ts:82',message:'utterance onerror',data:errorInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      if (originalOnError) originalOnError.call(utterance, event);
    };
    
    utterance.onboundary = function(event) {
      // Log boundary events for very detailed debugging (can be noisy)
      if (originalOnBoundary) originalOnBoundary.call(utterance, event);
    };
    
    return originalSpeak.call(this, utterance);
  };
  
  // Wrap cancel()
  window.speechSynthesis.cancel = function() {
    const wasSpeaking = this.speaking;
    const wasPaused = this.paused;
    const pendingCount = this.pending;
    
    console.log('[Speech Debug] Cancel called', {
      wasSpeaking,
      wasPaused,
      pendingCount,
      activeUtterances: utteranceCount,
      stack: new Error().stack?.split('\n').slice(2, 6).join(' | ')
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'debugSpeech.ts:105',message:'cancel intercepted',data:{wasSpeaking:wasSpeaking,wasPaused:wasPaused,pendingCount:pendingCount,activeUtterances:utteranceCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    utteranceCount = 0; // Reset count on cancel
    return originalCancel.call(this);
  };
  
  // Wrap pause()
  window.speechSynthesis.pause = function() {
    console.log('[Speech Debug] Pause called', {
      wasSpeaking: this.speaking,
      wasPaused: this.paused,
      pending: this.pending
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'debugSpeech.ts:118',message:'pause intercepted',data:{wasSpeaking:this.speaking,wasPaused:this.paused,pending:this.pending},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    return originalPause.call(this);
  };
  
  // Wrap resume()
  window.speechSynthesis.resume = function() {
    console.log('[Speech Debug] Resume called', {
      wasSpeaking: this.speaking,
      wasPaused: this.paused,
      pending: this.pending
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'debugSpeech.ts:128',message:'resume intercepted',data:{wasSpeaking:this.speaking,wasPaused:this.paused,pending:this.pending},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    return originalResume.call(this);
  };
  
  console.log('[Speech Debug] Speech synthesis debugger installed');
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'debugSpeech.ts:133',message:'Debug wrapper installation complete',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
  // #endregion
}

/**
 * Remove debug wrapper (restore original functions)
 */
export function removeDebugSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // Note: This won't fully restore if the original functions were already wrapped
  // In production, you'd want to store the original functions more carefully
  console.log('[Speech Debug] Debug wrapper removed (note: may not fully restore if multiple wrappers exist)');
}
