'use client';

/**
 * Speech Debugger Component
 * 
 * Logs all speech synthesis activity for debugging
 * Only active in development or when explicitly enabled
 */

import { useEffect } from 'react';

export default function SpeechDebugger() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    
    // Only enable in development or when explicitly enabled
    if (process.env.NODE_ENV !== 'development' && !(window as any).__ENABLE_SPEECH_DEBUG__) {
      return;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechDebugger.tsx:18',message:'Starting speech debugger',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Q'})}).catch(()=>{});
    // #endregion
    
    console.log('[SpeechDebugger] Starting speech debugger');
    
    // Log all speech synthesis activity
    const originalSpeak = window.speechSynthesis.speak;
    const originalCancel = window.speechSynthesis.cancel;
    const originalPause = window.speechSynthesis.pause;
    const originalResume = window.speechSynthesis.resume;
    
    let speakCallCount = 0;
    
    window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
      speakCallCount++;
      const stack = new Error().stack?.split('\n').slice(1, 6).join(' | ') || 'unknown';
      
      const debugInfo = {
        callNumber: speakCallCount,
        text: utterance?.text?.substring(0, 100) || 'no text',
        textLength: utterance?.text?.length || 0,
        voice: utterance?.voice?.name || 'default',
        rate: utterance?.rate || 1,
        pitch: utterance?.pitch || 1,
        volume: utterance?.volume || 1,
        speaking: this.speaking,
        pending: this.pending,
        paused: this.paused,
        stack: stack
      };
      
      console.log('[SpeechDebugger] speak() called', debugInfo);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechDebugger.tsx:45',message:'speak intercepted',data:debugInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Q'})}).catch(()=>{});
      // #endregion
      
      return originalSpeak.call(this, utterance);
    };
    
    window.speechSynthesis.cancel = function() {
      console.log('[SpeechDebugger] cancel() called', {
        wasSpeaking: this.speaking,
        wasPaused: this.paused,
        pending: this.pending
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechDebugger.tsx:56',message:'cancel intercepted',data:{wasSpeaking:this.speaking,wasPaused:this.paused,pending:this.pending},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Q'})}).catch(()=>{});
      // #endregion
      return originalCancel.call(this);
    };
    
    window.speechSynthesis.pause = function() {
      console.log('[SpeechDebugger] pause() called', {
        wasSpeaking: this.speaking,
        wasPaused: this.paused
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechDebugger.tsx:66',message:'pause intercepted',data:{wasSpeaking:this.speaking,wasPaused:this.paused},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Q'})}).catch(()=>{});
      // #endregion
      return originalPause.call(this);
    };
    
    window.speechSynthesis.resume = function() {
      console.log('[SpeechDebugger] resume() called', {
        wasPaused: this.paused,
        wasSpeaking: this.speaking
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechDebugger.tsx:76',message:'resume intercepted',data:{wasPaused:this.paused,wasSpeaking:this.speaking},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Q'})}).catch(()=>{});
      // #endregion
      return originalResume.call(this);
    };
    
    // Cleanup on unmount
    return () => {
      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.cancel = originalCancel;
      window.speechSynthesis.pause = originalPause;
      window.speechSynthesis.resume = originalResume;
      console.log('[SpeechDebugger] Speech debugger removed');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechDebugger.tsx:86',message:'Speech debugger cleanup',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Q'})}).catch(()=>{});
      // #endregion
    };
  }, []);
  
  return null; // No UI
}
