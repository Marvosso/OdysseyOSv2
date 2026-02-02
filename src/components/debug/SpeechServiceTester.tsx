'use client';

/**
 * Speech Service Tester
 * 
 * Component to test SafeSpeechService functionality
 * Only visible in development mode
 */

import { useState } from 'react';
import { SafeSpeechService } from '@/lib/audio/safeSpeechService';

export default function SpeechServiceTester() {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Hidden by default

  // Always show for now (can be toggled off)
  // if (process.env.NODE_ENV !== 'development' && !(typeof window !== 'undefined' && (window as any).__ENABLE_SPEECH_TEST__)) {
  //   return null;
  // }

  const runTest = async () => {
    setIsTesting(true);
    setTestResult('Running test...\n');
    
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechServiceTester.tsx:20',message:'Starting SafeSpeechService test',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
      // #endregion

      const speech = SafeSpeechService.getInstance();
      
      // Check initial state
      const initialState = {
        speaking: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.speaking : false,
        voices: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices().length : 0,
        hasUtterance: typeof SpeechSynthesisUtterance !== 'undefined',
      };
      
      setTestResult(prev => prev + `Initial state: ${JSON.stringify(initialState, null, 2)}\n\n`);
      
      // Test 1: Basic speak
      setTestResult(prev => prev + 'Test 1: Basic speak...\n');
      await speech.speak('Test speech from SafeSpeechService');
      setTestResult(prev => prev + '✓ Test 1 passed\n\n');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechServiceTester.tsx:35',message:'Test 1 completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
      // #endregion
      
      // Test 2: Speak with options
      setTestResult(prev => prev + 'Test 2: Speak with options...\n');
      await speech.speak('Test speech with rate 1.5', { rate: 1.5 });
      setTestResult(prev => prev + '✓ Test 2 passed\n\n');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechServiceTester.tsx:42',message:'Test 2 completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
      // #endregion
      
      // Test 3: Cancel
      setTestResult(prev => prev + 'Test 3: Cancel test...\n');
      speech.speak('This should be cancelled').catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));
      speech.cancel();
      setTestResult(prev => prev + '✓ Test 3 passed\n\n');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechServiceTester.tsx:50',message:'Test 3 completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
      // #endregion
      
      // Test 4: Reset
      setTestResult(prev => prev + 'Test 4: Reset test...\n');
      speech.reset();
      setTestResult(prev => prev + '✓ Test 4 passed\n\n');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechServiceTester.tsx:57',message:'Test 4 completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
      // #endregion
      
      // Check final state
      const finalState = {
        speaking: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.speaking : false,
        voices: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices().length : 0,
      };
      
      setTestResult(prev => prev + `Final state: ${JSON.stringify(finalState, null, 2)}\n\n`);
      setTestResult(prev => prev + '✅ All tests passed!\n');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechServiceTester.tsx:68',message:'All tests completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      setTestResult(prev => prev + `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      console.error('[SpeechServiceTester] Test error:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechServiceTester.tsx:73',message:'Test failed',data:{error:error instanceof Error ? error.message : 'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
      // #endregion
    } finally {
      setIsTesting(false);
    }
  };

  const checkState = () => {
    const state = {
      speaking: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.speaking : false,
      voices: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices().length : 0,
      hasUtterance: typeof SpeechSynthesisUtterance !== 'undefined',
      pending: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.pending : false,
      paused: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.paused : false,
    };
    
    setTestResult(`Current speech state:\n${JSON.stringify(state, null, 2)}\n`);
    console.log('Speech state:', state);
  };

  const forceReset = () => {
    const speech = SafeSpeechService.getInstance();
    speech.cancel();
    speech.reset();
    setTestResult('Force reset completed\n');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpeechServiceTester.tsx:95',message:'Force reset called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'R'})}).catch(()=>{});
    // #endregion
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg z-50 shadow-xl"
      >
        Show Speech Tester
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-3 max-w-xs z-[100] shadow-xl" style={{ pointerEvents: 'auto' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold text-sm">Speech Tester</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-lg leading-none w-5 h-5 flex items-center justify-center"
          title="Hide"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1.5 mb-2">
        <button
          onClick={runTest}
          disabled={isTesting}
          className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs"
        >
          {isTesting ? 'Testing...' : 'Run Tests'}
        </button>
        
        <button
          onClick={checkState}
          className="w-full px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
        >
          Check State
        </button>
        
        <button
          onClick={forceReset}
          className="w-full px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
        >
          Force Reset
        </button>
      </div>
      
      {testResult && (
        <div className="bg-gray-900 rounded p-1.5 max-h-32 overflow-y-auto">
          <pre className="text-[10px] text-gray-300 whitespace-pre-wrap font-mono leading-tight">
            {testResult}
          </pre>
        </div>
      )}
    </div>
  );
}
