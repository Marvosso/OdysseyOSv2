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
    
    
    console.log('[Emergency Fix] Installing speech error handler');
    
    // Global error handler for speech
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      const errorString = errorMessage.toLowerCase();
      
      if (errorString.includes('speech synthesis') || 
          errorString.includes('interrupted') ||
          errorString.includes('speechsynthesis')) {
        console.log('[Emergency Fix] Caught speech error, resetting', { message: errorMessage });
        
        event.preventDefault();
        
        // Cancel all speech
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        
        return true;
      }
    };
    
    window.addEventListener('error', handleError, true);
    
    // Monkey-patch speak method as emergency fallback
    const originalSpeak = window.speechSynthesis.speak;
    window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
      
      console.log('[Emergency Fix] speak() called', { 
        textLength: utterance.text.length,
        wasSpeaking: this.speaking 
      });
      
      // Cancel any existing speech FIRST
      if (this.speaking) {
        console.log('[Emergency Fix] Cancelling existing speech');
        
        this.cancel();
        
        // Wait for cancel to complete
        return new Promise<void>((resolve) => {
          setTimeout(() => {
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
    };
  }, []);
  
  return null; // This component doesn't render anything
}
