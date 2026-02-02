'use client';

/**
 * Speech Fix Interceptor
 * 
 * Global interceptor to fix speech synthesis errors at the browser API level
 * Runs before any other speech code to catch and handle errors
 */

import { useEffect } from 'react';

export default function SpeechFixInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    console.log('[Speech Fix] Installing global interceptor');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:15',message:'Installing speech fix interceptor',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion

    const originalSpeak = window.speechSynthesis.speak;
    const originalCancel = window.speechSynthesis.cancel;
    
    let activeUtterances = new WeakSet();
    let lastErrorTime = 0;
    let utteranceIdCounter = 0;
    
    window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
      utteranceIdCounter++;
      const utteranceId = utteranceIdCounter;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:28',message:'speak intercepted',data:{utteranceId:utteranceId,textLength:utterance.text.length,hasActiveUtterance:activeUtterances.has(utterance),timeSinceLastError:Date.now() - lastErrorTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      
      // Prevent rapid re-speak
      if (activeUtterances.has(utterance)) {
        console.warn('[Speech Fix] Preventing duplicate utterance');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:35',message:'Duplicate utterance prevented',data:{utteranceId:utteranceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        return;
      }
      
      // If we just had an error, wait a bit
      const timeSinceError = Date.now() - lastErrorTime;
      if (timeSinceError < 1000) {
        console.warn('[Speech Fix] Too soon after error, delaying', { timeSinceError });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:43',message:'Delaying after error',data:{utteranceId:utteranceId,timeSinceError:timeSinceError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        setTimeout(() => {
          this.speak(utterance);
        }, 1000 - timeSinceError);
        return;
      }
      
      // Clone utterance to avoid mutation issues
      const safeUtterance = new SpeechSynthesisUtterance(utterance.text);
      safeUtterance.rate = utterance.rate || 1;
      safeUtterance.pitch = utterance.pitch || 1;
      safeUtterance.volume = utterance.volume || 1;
      safeUtterance.voice = utterance.voice || null;
      safeUtterance.lang = utterance.lang || 'en-US';
      
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
        console.log('[Speech Fix] Utterance started', { utteranceId });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:66',message:'utterance onstart',data:{utteranceId:utteranceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        if (originalHandlers.start) {
          originalHandlers.start.call(utterance, event);
        }
      };
      
      safeUtterance.onend = function(event) {
        console.log('[Speech Fix] Utterance ended', { utteranceId });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:74',message:'utterance onend',data:{utteranceId:utteranceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        activeUtterances.delete(utterance);
        if (originalHandlers.end) {
          originalHandlers.end.call(utterance, event);
        }
      };
      
      safeUtterance.onerror = function(event: SpeechSynthesisErrorEvent) {
        const errorType = event.error;
        console.error('[Speech Fix] Utterance error:', { utteranceId, errorType });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:83',message:'utterance onerror',data:{utteranceId:utteranceId,errorType:errorType,errorName:event.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        
        lastErrorTime = Date.now();
        activeUtterances.delete(utterance);
        
        // Don't cancel on "interrupted" or "canceled" - those are expected
        if (errorType !== 'interrupted' && errorType !== 'canceled') {
          console.warn('[Speech Fix] Non-interruption error, canceling all speech to reset');
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:91',message:'Canceling speech after error',data:{utteranceId:utteranceId,errorType:errorType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
          // #endregion
          window.speechSynthesis.cancel();
        }
        
        if (originalHandlers.error) {
          originalHandlers.error.call(utterance, event);
        }
      };
      
      safeUtterance.onpause = function(event) {
        if (originalHandlers.pause) {
          originalHandlers.pause.call(utterance, event);
        }
      };
      
      safeUtterance.onresume = function(event) {
        if (originalHandlers.resume) {
          originalHandlers.resume.call(utterance, event);
        }
      };
      
      safeUtterance.onboundary = function(event) {
        if (originalHandlers.boundary) {
          originalHandlers.boundary.call(utterance, event);
        }
      };
      
      safeUtterance.onmark = function(event) {
        if (originalHandlers.mark) {
          originalHandlers.mark.call(utterance, event);
        }
      };
      
      activeUtterances.add(utterance);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:123',message:'Calling original speak',data:{utteranceId:utteranceId,textLength:safeUtterance.text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      
      return originalSpeak.call(this, safeUtterance);
    };
    
    window.speechSynthesis.cancel = function() {
      console.log('[Speech Fix] Cancel called, resetting state');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:130',message:'cancel intercepted',data:{activeUtterancesCount:activeUtterances ? 'unknown' : 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      activeUtterances = new WeakSet();
      lastErrorTime = Date.now();
      return originalCancel.call(this);
    };
    
    console.log('[Speech Fix] Global interceptor installed');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechFixInterceptor.tsx:137',message:'Interceptor installation complete',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
  }, []);

  return null; // This component doesn't render anything
}
