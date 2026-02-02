'use client';

import SimpleVoicePlayer from '@/components/voice/SimpleVoicePlayer';

export default function TestVoicePage() {
  const sampleText = "This is a test of the voice narration system. The quick brown fox jumps over the lazy dog.";
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Voice Narration Test</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Sample Text:</h2>
          <p className="p-4 bg-gray-50 rounded">{sampleText}</p>
        </div>
        
        <SimpleVoicePlayer text={sampleText} />
        
        <div className="mt-8 p-4 border border-blue-200 bg-blue-50 rounded">
          <h3 className="font-semibold text-blue-800">How it works:</h3>
          <ul className="mt-2 text-blue-700 list-disc pl-5 space-y-1">
            <li>Select a voice (British/American, Male/Female)</li>
            <li>Click Play to hear the text</li>
            <li>Use Pause/Resume/Stop as needed</li>
            <li>Voices work across all scenes and stories</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
