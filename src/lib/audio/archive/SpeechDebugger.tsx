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
      
      return originalSpeak.call(this, utterance);
    };
    
    window.speechSynthesis.cancel = function() {
      console.log('[SpeechDebugger] cancel() called', {
        wasSpeaking: this.speaking,
        wasPaused: this.paused,
        pending: this.pending
      });
      return originalCancel.call(this);
    };
    
    window.speechSynthesis.pause = function() {
      console.log('[SpeechDebugger] pause() called', {
        wasSpeaking: this.speaking,
        wasPaused: this.paused
      });
      return originalPause.call(this);
    };
    
    window.speechSynthesis.resume = function() {
      console.log('[SpeechDebugger] resume() called', {
        wasPaused: this.paused,
        wasSpeaking: this.speaking
      });
      return originalResume.call(this);
    };
    
    // Cleanup on unmount
    return () => {
      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.cancel = originalCancel;
      window.speechSynthesis.pause = originalPause;
      window.speechSynthesis.resume = originalResume;
      console.log('[SpeechDebugger] Speech debugger removed');
    };
  }, []);
  
  return null; // No UI
}
