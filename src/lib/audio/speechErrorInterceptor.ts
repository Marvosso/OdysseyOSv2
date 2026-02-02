/**
 * Speech Error Interceptor
 * 
 * Intercepts and suppresses speech synthesis errors at multiple levels:
 * - Console.error interception
 * - Global window.onerror handler
 * - speechSynthesis.speak monkey-patch
 */

export function installSpeechErrorInterceptor() {
  if (typeof window === 'undefined') {
    return;
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:14',message:'Installing speech error interceptor',data:{hasSpeechSynthesis:!!window.speechSynthesis},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
  // #endregion
  
  console.log('[SpeechInterceptor] Installing...');
  
  // 1. Intercept console.error for speech errors
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const message = args[0]?.toString() || '';
    if (message.includes('speech synthesis') || message.includes('interrupted')) {
      console.warn('[SpeechInterceptor] Suppressed speech error:', args);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:25',message:'Suppressed console.error for speech',data:{message:message.substring(0, 100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
      // #endregion
      return; // Don't log to console
    }
    originalConsoleError.apply(console, args);
  };
  
  // 2. Wrap window.onerror
  const originalWindowError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const messageStr = typeof message === 'string' ? message : String(message);
    
    if (messageStr.includes('speech synthesis') || 
        messageStr.includes('interrupted')) {
      console.warn('[SpeechInterceptor] Global error suppressed:', message);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:37',message:'Suppressed window.onerror for speech',data:{message:messageStr.substring(0, 100),source:source,lineno:lineno,colno:colno},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
      // #endregion
      return true; // Prevent default handler
    }
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // 3. Monkey-patch speechSynthesis.speak
  if (window.speechSynthesis) {
    const originalSpeak = window.speechSynthesis.speak;
    let isInSpeak = false;
    
    window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:50',message:'speak intercepted',data:{textLength:utterance.text.length,isInSpeak:isInSpeak,wasSpeaking:this.speaking},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
      // #endregion
      
      if (isInSpeak) {
        console.warn('[SpeechInterceptor] Speak called while already speaking, cancelling first');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:54',message:'Speak called while already in speak, cancelling',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
        // #endregion
        window.speechSynthesis.cancel();
        setTimeout(() => originalSpeak.call(this, utterance), 100);
        return;
      }
      
      isInSpeak = true;
      
      // Wrap event handlers
      const originalOnEnd = utterance.onend;
      const originalOnError = utterance.onerror;
      
      utterance.onend = function(event) {
        isInSpeak = false;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:68',message:'Utterance onend',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
        // #endregion
        if (originalOnEnd) originalOnEnd.call(this, event);
      };
      
      utterance.onerror = function(event) {
        isInSpeak = false;
        const errorType = event.error;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:76',message:'Utterance onerror',data:{errorType:errorType,errorName:event.name,isInterrupted:errorType === 'interrupted'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
        // #endregion
        
        // Don't call original error for 'interrupted'
        if (errorType !== 'interrupted' && originalOnError) {
          originalOnError.call(this, event);
        } else if (originalOnEnd) {
          // Call onend instead for interrupted
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:83',message:'Calling onend instead of onerror for interrupted',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
          // #endregion
          originalOnEnd.call(this, new Event('end') as any);
        }
      };
      
      // Ensure we're not speaking already
      if (window.speechSynthesis.speaking) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:90',message:'Already speaking, cancelling first',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
        // #endregion
        window.speechSynthesis.cancel();
        setTimeout(() => {
          originalSpeak.call(this, utterance);
        }, 100);
      } else {
        originalSpeak.call(this, utterance);
      }
    };
  }
  
  console.log('[SpeechInterceptor] Installation complete');
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'speechErrorInterceptor.ts:100',message:'Interceptor installation complete',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
  // #endregion
}
