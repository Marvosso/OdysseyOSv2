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

    const originalSpeak = window.speechSynthesis.speak;
    const originalCancel = window.speechSynthesis.cancel;
    
    let activeUtterances = new WeakSet();
    let lastErrorTime = 0;
    let utteranceIdCounter = 0;
    
    window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
      utteranceIdCounter++;
      const utteranceId = utteranceIdCounter;
      
      
      // Prevent rapid re-speak
      if (activeUtterances.has(utterance)) {
        console.warn('[Speech Fix] Preventing duplicate utterance');
        return;
      }
      
      // If we just had an error, wait a bit
      const timeSinceError = Date.now() - lastErrorTime;
      if (timeSinceError < 1000) {
        console.warn('[Speech Fix] Too soon after error, delaying', { timeSinceError });
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
        if (originalHandlers.start) {
          originalHandlers.start.call(utterance, event);
        }
      };
      
      safeUtterance.onend = function(event) {
        console.log('[Speech Fix] Utterance ended', { utteranceId });
        activeUtterances.delete(utterance);
        if (originalHandlers.end) {
          originalHandlers.end.call(utterance, event);
        }
      };
      
      safeUtterance.onerror = function(event: SpeechSynthesisErrorEvent) {
        const errorType = event.error;
        console.error('[Speech Fix] Utterance error:', { utteranceId, errorType });
        
        lastErrorTime = Date.now();
        activeUtterances.delete(utterance);
        
        // Don't cancel on "interrupted" or "canceled" - those are expected
        if (errorType !== 'interrupted' && errorType !== 'canceled') {
          console.warn('[Speech Fix] Non-interruption error, canceling all speech to reset');
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
      
      
      return originalSpeak.call(this, safeUtterance);
    };
    
    window.speechSynthesis.cancel = function() {
      console.log('[Speech Fix] Cancel called, resetting state');
      activeUtterances = new WeakSet();
      lastErrorTime = Date.now();
      return originalCancel.call(this);
    };
    
    console.log('[Speech Fix] Global interceptor installed');
  }, []);

  return null; // This component doesn't render anything
}
