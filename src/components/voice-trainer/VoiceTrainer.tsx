'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic,
  Play,
  Save,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import type { CharacterVoice, VoiceAnalysisResult } from '@/types/voice';

interface VoiceTrainerProps {
  characterId: string;
  characterName: string;
  onVoiceChange?: (voice: CharacterVoice) => void;
}

export default function VoiceTrainer({
  characterId,
  characterName,
  onVoiceChange
}: VoiceTrainerProps) {
  const [voice, setVoice] = useState<CharacterVoice | null>(null);
  const [sampleText, setSampleText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`voice-${characterId}`);
    if (saved) {
      setTimeout(() => {
        setVoice(JSON.parse(saved));
      }, 0);
    }
  }, [characterId]);

  useEffect(() => {
    if (voice) {
      localStorage.setItem(`voice-${characterId}`, JSON.stringify(voice));
      onVoiceChange?.(voice);
    }
  }, [voice, characterId, onVoiceChange]);

  const analyzeText = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const words = text.split(/\s+/).filter(w => w.trim());

    const averageWordsPerSentence = sentences.length > 0
      ? Math.round(words.length / sentences.length)
      : 10;

    const complexWords = words.filter(w => w.length > 8);
    const vocabularyComplexity = Math.min(Math.round((complexWords.length / words.length) * 100), 10);

    const questions = sentences.filter(s => s.trim().includes('?'));
    const questionFrequency = questions.length / sentences.length;

    const formalWords = ['however', 'therefore', 'consequently', 'furthermore', 'nevertheless'];
    const formalCount = sentences.filter(s =>
      formalWords.some(w => s.toLowerCase().includes(w))
    ).length;
    const formalityLevel = Math.round((formalCount / sentences.length) * 10);

    return {
      averageWordsPerSentence,
      vocabularyComplexity,
      formalityLevel,
      questionFrequency,
    };
  };

  const addSample = (text: string) => {
    const analysis = analyzeText(text);

    const newExample = {
      text,
      emotion: 'neutral',
      context: 'User-provided sample',
      analysis: {
        matchesPattern: true,
        deviations: [],
        confidence: 85,
      },
    };

    const newVoice: CharacterVoice = voice ? {
      ...voice,
      speechPattern: {
        ...voice.speechPattern,
        ...analysis,
      },
      examples: [...voice.examples, newExample],
    } : {
      characterId,
      speechPattern: analysis,
      commonPhrases: [],
      sentenceStructures: [],
      emotionalMarkers: [],
      examples: [newExample],
    };

    setVoice(newVoice);
    setSampleText('');
    setAnalysisResult(null);
  };

  const analyzeAgainstVoice = (text: string) => {
    if (!voice) return;

    setIsAnalyzing(true);

    const currentAnalysis = analyzeText(text);
    const pattern = voice.speechPattern;

    const sentenceStructureMatch = 100 - Math.abs(currentAnalysis.averageWordsPerSentence - pattern.averageWordsPerSentence) * 5;
    const vocabularyMatch = 100 - Math.abs(currentAnalysis.vocabularyComplexity - pattern.vocabularyComplexity) * 10;
    const toneMatch = 100 - Math.abs(currentAnalysis.formalityLevel - pattern.formalityLevel) * 10;
    const contentMatch = 100 - Math.abs(currentAnalysis.questionFrequency - pattern.questionFrequency) * 50;

    const overallMatch = Math.round((sentenceStructureMatch + vocabularyMatch + toneMatch + contentMatch) / 4);

    const suggestions: string[] = [];
    if (sentenceStructureMatch < 70) {
      suggestions.push('Adjust sentence length to match character\'s typical speaking pattern');
    }
    if (vocabularyMatch < 70) {
      suggestions.push('Use more complex vocabulary or simplify based on character\'s education level');
    }
    if (toneMatch < 70) {
      suggestions.push('Adjust formality to match character\'s speaking style');
    }

    setTimeout(() => {
      setAnalysisResult({
        overallMatch,
        breakdown: {
          sentenceStructure: Math.round(sentenceStructureMatch),
          vocabulary: Math.round(vocabularyMatch),
          tone: Math.round(toneMatch),
          content: Math.round(contentMatch),
        },
        suggestions,
      });
      setIsAnalyzing(false);
    }, 500);
  };

  const speakText = async (text: string) => {
    try {
      const { SpeechManager } = await import('@/lib/audio/speechManager');
      const { VoiceLoader } = await import('@/lib/audio/voiceLoader');
      
      await VoiceLoader.waitForVoices();
      const speechManager = SpeechManager.getInstance();
      await speechManager.speak(text);
    } catch (error) {
      console.error('[VoiceTrainer] Speech error:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Trainer
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {characterName}
        </p>
      </div>

      {voice && (
        <div className="p-4 border-b border-gray-800">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Avg. Words/Sentence</p>
              <p className="text-lg font-bold text-white">{voice.speechPattern.averageWordsPerSentence}</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Vocabulary</p>
              <p className="text-lg font-bold text-white">{voice.speechPattern.vocabularyComplexity}/10</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Formality</p>
              <p className="text-lg font-bold text-white">{voice.speechPattern.formalityLevel}/10</p>
            </div>
          </div>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="mt-3 w-full text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            {showExamples ? 'Hide' : 'Show'} Examples ({voice.examples.length})
          </button>
          <AnimatePresence>
            {showExamples && voice.examples.map((example, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-2 bg-gray-700/50 rounded-lg text-xs text-gray-300 italic"
              >
                "{example.text}"
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!voice && (
          <div className="text-center py-8 text-gray-500">
            <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No voice profile yet</p>
            <p className="text-xs mt-2">Add dialogue samples to establish this character's voice</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            {voice ? 'Add Dialogue Sample' : 'Create Voice Profile'}
          </label>
          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder={`Write a sample of dialogue for ${characterName}...`}
            className="w-full bg-gray-800 text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={4}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => speakText(sampleText)}
              disabled={!sampleText.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Listen
            </button>
            <button
              onClick={() => addSample(sampleText)}
              disabled={!sampleText.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Sample
            </button>
          </div>
        </div>

        {voice && (
          <div className="border-t border-gray-800 pt-4">
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Test New Dialogue
            </label>
            <textarea
              placeholder="Write dialogue to check if it matches the voice..."
              className="w-full bg-gray-800 text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
            />
            <button
              onClick={() => analyzeAgainstVoice(sampleText)}
              disabled={!sampleText.trim() || isAnalyzing}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Analyze Match
                </>
              )}
            </button>

            <AnimatePresence>
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-gray-800/50 rounded-lg p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Overall Match</span>
                    <span className={`text-lg font-bold ${
                      analysisResult.overallMatch >= 80 ? 'text-green-400' :
                      analysisResult.overallMatch >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {analysisResult.overallMatch}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-28">Structure</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${analysisResult.breakdown.sentenceStructure}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-8">
                        {analysisResult.breakdown.sentenceStructure}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-28">Vocabulary</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${analysisResult.breakdown.vocabulary}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-8">
                        {analysisResult.breakdown.vocabulary}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-28">Tone</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${analysisResult.breakdown.tone}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-8">
                        {analysisResult.breakdown.tone}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-28">Content</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 transition-all duration-300"
                          style={{ width: `${analysisResult.breakdown.content}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-8">
                        {analysisResult.breakdown.content}%
                      </span>
                    </div>
                  </div>

                  {analysisResult.suggestions.length > 0 && (
                    <div className="border-t border-gray-700 pt-3">
                      <div className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          {analysisResult.suggestions.map((s, i) => (
                            <p key={i} className="text-gray-400"> {s}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
