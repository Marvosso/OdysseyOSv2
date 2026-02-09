// @ts-nocheck
/**
 * Speech Error Interceptor
 * 
 * @deprecated This file is archived. SpeechSynthesis has been replaced with ResponsiveVoice.
 * This file is kept for reference only.
 * 
 * Intercepts and suppresses speech synthesis errors at multiple levels:
 * - Console.error interception
 * - Global window.onerror handler
 * - speechSynthesis.speak monkey-patch
 */
let isInstalled = false;
let originalConsoleError: any = null;
let originalWindowError: any = null;
let originalSpeak: any = null;

export function installSpeechErrorInterceptor() {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Prevent multiple installations
  if (isInstalled) {
    console.log('[SpeechInterceptor] Already installed, skipping');
    return;
  }

  console.log('[SpeechInterceptor] Installing...');
  isInstalled = true;
  
  // 1. Intercept console.error for speech errors
  originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const message = args[0]?.toString() || '';
    if (message.includes('speech synthesis') || message.includes('interrupted')) {
      console.warn('[SpeechInterceptor] Suppressed speech error:', args);
      return; // Don't log to console
    }
    originalConsoleError.apply(console, args);
  };
  
  // 2. Wrap window.onerror
  originalWindowError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const messageStr = typeof message === 'string' ? message : String(message);
    
    if (messageStr.includes('speech synthesis') || 
        messageStr.includes('interrupted')) {
      console.warn('[SpeechInterceptor] Global error suppressed:', message);
      return true; // Prevent default handler
    }
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // 3. Monkey-patch speechSynthesis.speak
  if (window.speechSynthesis && !originalSpeak) {
    originalSpeak = window.speechSynthesis.speak;
    let isInSpeak = false;
    
    window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
      if (isInSpeak) {
        console.warn('[SpeechInterceptor] Speak called while already speaking, cancelling first');
        window.speechSynthesis.cancel();
        setTimeout(() => originalSpeak!.call(this, utterance), 100);
        return;
      }
      
      isInSpeak = true;
      
      // Wrap event handlers
      const originalOnEnd = utterance.onend;
      const originalOnError = utterance.onerror;
      
      utterance.onend = function(event) {
        isInSpeak = false;
        if (originalOnEnd) originalOnEnd.call(this, event);
      };
      
      utterance.onerror = function(event) {
        isInSpeak = false;
        const errorType = event.error;

        // Don't call original error for 'interrupted'
        if (errorType !== 'interrupted' && originalOnError) {
          originalOnError.call(this, event);
        } else if (originalOnEnd) {
          originalOnEnd.call(this, new Event('end') as any);
        }
      };
      
      // Ensure we're not speaking already
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          originalSpeak.call(this, utterance);
        }, 100);
      } else {
        originalSpeak!.call(this, utterance);
      }
    };
  }
  
  console.log('[SpeechInterceptor] Installation complete');
}
