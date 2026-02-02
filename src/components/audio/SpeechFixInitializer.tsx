'use client';

/**
 * Speech Fix Initializer
 * 
 * Installs a global interceptor to fix speech synthesis errors
 * Runs early in the app lifecycle to catch all speech calls
 */

import { useEffect } from 'react';

export default function SpeechFixInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInitializer.tsx:15',message:'Installing global speech interceptor',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion

    console.log('[Speech Fix] Installing global interceptor');
    
    const originalSpeak = window.speechSynthesis.speak;
    const originalCancel = window.speechSynthesis.cancel;
    
    let activeUtterances = new WeakSet<SpeechSynthesisUtterance>();
    let lastErrorTime = 0;
    
    window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInitializer.tsx:28',message:'speak intercepted',data:{textLength:utterance.text.length,hasActiveUtterance:activeUtterances.has(utterance),timeSinceLastError:Date.now() - lastErrorTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion

      // Prevent rapid re-speak
      if (activeUtterances.has(utterance)) {
        console.warn('[Speech Fix] Preventing duplicate utterance');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInitializer.tsx:33',message:'Duplicate utterance prevented',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        return;
      }
      
      // If we just had an error, wait a bit
      if (Date.now() - lastErrorTime < 1000) {
        console.warn('[Speech Fix] Too soon after error, delaying');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInitializer.tsx:40',message:'Delaying after error',data:{timeSinceLastError:Date.now() - lastErrorTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 1000);
        return;
      }
      
      // Clone utterance to avoid mutation issues
      const safeUtterance = new SpeechSynthesisUtterance(utterance.text);
      safeUtterance.rate = utterance.rate || 1;
      safeUtterance.pitch = utterance.pitch || 1;
      safeUtterance.volume = utterance.volume || 1;
      safeUtterance.voice = utterance.voice;
      safeUtterance.lang = utterance.lang;
      
      // Wrap event handlers
      const originalHandlers = {
        start: utterance.onstart,
        end: utterance.onend,
        error: utterance.onerror,
        pause: utterance.onpause,
        resume: utterance.onresume,
        boundary: utterance.onboundary,
        mark: utterance.onmark
      };
      
      safeUtterance.onstart = function(event) {
        console.log('[Speech Fix] Utterance started');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInitializer.tsx:66',message:'Utterance started',data:{textLength:safeUtterance.text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        if (originalHandlers.start) originalHandlers.start.call(utterance, event);
      };
      
      safeUtterance.onend = function(event) {
        console.log('[Speech Fix] Utterance ended');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInitializer.tsx:72',message:'Utterance ended',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        activeUtterances.delete(utterance);
        if (originalHandlers.end) originalHandlers.end.call(utterance, event);
      };
      
      safeUtterance.onerror = function(event) {
        console.error('[Speech Fix] Utterance error:', event.error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInitializer.tsx:79',message:'Utterance error',data:{error:event.error,errorName:event.name,charIndex:event.charIndex,elapsedTime:event.elapsedTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        lastErrorTime = Date.now();
        activeUtterances.delete(utterance);
        
        // Cancel all speech to reset
        window.speechSynthesis.cancel();
        
        if (originalHandlers.error) {
          originalHandlers.error.call(utterance, event);
        }
      };
      
      safeUtterance.onpause = function(event) {
        if (originalHandlers.pause) originalHandlers.pause.call(utterance, event);
      };
      
      safeUtterance.onresume = function(event) {
        if (originalHandlers.resume) originalHandlers.resume.call(utterance, event);
      };
      
      safeUtterance.onboundary = function(event) {
        if (originalHandlers.boundary) originalHandlers.boundary.call(utterance, event);
      };
      
      safeUtterance.onmark = function(event) {
        if (originalHandlers.mark) originalHandlers.mark.call(utterance, event);
      };
      
      activeUtterances.add(utterance);
      return originalSpeak.call(this, safeUtterance);
    };
    
    window.speechSynthesis.cancel = function() {
      console.log('[Speech Fix] Cancel called, resetting state');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInitializer.tsx:111',message:'Cancel called',data:{wasSpeaking:this.speaking},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      activeUtterances = new WeakSet();
      lastErrorTime = Date.now();
      return originalCancel.call(this);
    };

    // Cleanup on unmount (restore original functions)
    return () => {
      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.cancel = originalCancel;
      console.log('[Speech Fix] Global interceptor removed');
    };
  }, []);

  return null; // This component doesn't render anything
}
