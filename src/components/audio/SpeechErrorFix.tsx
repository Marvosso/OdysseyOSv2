'use client';

/**
 * Speech Error Fix - Emergency Handler
 * 
 * Catches speech synthesis errors at the global error handler level
 * and provides a last-resort fix for "interrupted" errors
 */

import { useEffect } from 'react';

export default function SpeechErrorFix() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechErrorFix.tsx:18',message:'Installing emergency speech error handler',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    
    console.log('[Emergency Fix] Installing speech error handler');
    
    // Global error handler for speech
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      const errorString = errorMessage.toLowerCase();
      
      if (errorString.includes('speech synthesis') || 
          errorString.includes('interrupted') ||
          errorString.includes('speechsynthesis')) {
        console.log('[Emergency Fix] Caught speech error, resetting', { message: errorMessage });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechErrorFix.tsx:30',message:'Caught speech error in global handler',data:{errorMessage:errorMessage,filename:event.filename,lineno:event.lineno,colno:event.colno},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
        
        event.preventDefault();
        
        // Cancel all speech
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechErrorFix.tsx:38',message:'Cancelled speech after error',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
          // #endregion
        }
        
        return true;
      }
    };
    
    window.addEventListener('error', handleError, true);
    
    // Monkey-patch speak method as emergency fallback
    const originalSpeak = window.speechSynthesis.speak;
    window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechErrorFix.tsx:50',message:'Emergency speak() called',data:{textLength:utterance.text.length,wasSpeaking:this.speaking,wasPaused:this.paused},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      
      console.log('[Emergency Fix] speak() called', { 
        textLength: utterance.text.length,
        wasSpeaking: this.speaking 
      });
      
      // Cancel any existing speech FIRST
      if (this.speaking) {
        console.log('[Emergency Fix] Cancelling existing speech');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechErrorFix.tsx:60',message:'Cancelling existing speech before new speak',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
        
        this.cancel();
        
        // Wait for cancel to complete
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechErrorFix.tsx:68',message:'Calling original speak after cancel delay',data:{textLength:utterance.text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
            // #endregion
            originalSpeak.call(this, utterance);
            resolve();
          }, 100);
        });
      }
      
      return originalSpeak.call(this, utterance);
    };
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError, true);
      window.speechSynthesis.speak = originalSpeak;
      console.log('[Emergency Fix] Emergency handler removed');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechErrorFix.tsx:81',message:'Emergency handler cleanup',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
    };
  }, []);
  
  return null; // This component doesn't render anything
}
