'use client';

/**
 * Scene Insights Component
 * 
 * AI-powered scene analysis with visualizations and improvement suggestions
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Eye,
  Lightbulb,
  Sparkles,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Zap,
  MessageSquare,
  FileText,
} from 'lucide-react';
import {
  analyzeScene,
  analyzeEmotion,
  calculatePacing,
  detectShowVsTell,
  suggestImprovements,
  type EmotionAnalysis,
  type PacingAnalysis,
  type ShowVsTellAnalysis,
  type ImprovementSuggestion,
} from '@/lib/analysis/sceneAnalyzer';
import type { Scene } from '@/types/story';

interface SceneInsightsProps {
  scene: Scene;
  onClose?: () => void;
  onApplySuggestion?: (suggestion: ImprovementSuggestion, rewrittenText: string) => void;
}

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FCD34D', // Yellow
  sadness: '#60A5FA', // Blue
  anger: '#F87171', // Red
  fear: '#A78BFA', // Purple
  surprise: '#34D399', // Green
  neutral: '#9CA3AF', // Gray
};

export default function SceneInsights({ scene, onClose, onApplySuggestion }: SceneInsightsProps) {
  const [analysis, setAnalysis] = useState<{
    emotion: EmotionAnalysis;
    pacing: PacingAnalysis;
    showVsTell: ShowVsTellAnalysis;
    suggestions: ImprovementSuggestion[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'emotion' | 'pacing' | 'show-tell' | 'suggestions'>('emotion');
  const [selectedParagraph, setSelectedParagraph] = useState<number | null>(null);
  const [rewriteText, setRewriteText] = useState<Record<number, string>>({});

  // Analyze scene
  useEffect(() => {
    if (scene.content.trim()) {
      setIsAnalyzing(true);
      // Simulate analysis delay for better UX
      setTimeout(() => {
        const result = analyzeScene(scene);
        setAnalysis(result);
        setIsAnalyzing(false);
      }, 500);
    } else {
      setAnalysis(null);
    }
  }, [scene]);

  // Generate rewrite suggestion
  const handleGenerateRewrite = (paragraphIndex: number, suggestion: ImprovementSuggestion) => {
    const paragraph = analysis?.showVsTell.paragraphs[paragraphIndex];
    if (!paragraph) return;

    // Simplified rewrite - in production, use AI API
    let rewritten = paragraph.text;

    // Apply common improvements
    if (suggestion.type === 'show-tell') {
      // Replace telling phrases with showing
      rewritten = rewritten
        .replace(/\bfelt\s+(sad|happy|angry|afraid)\b/gi, (match, emotion) => {
          const showing = {
            sad: 'shoulders slumped, eyes downcast',
            happy: 'face lit up, a wide smile spreading',
            angry: 'fists clenched, jaw tight',
            afraid: 'hands trembled, breath quickened',
          };
          return showing[emotion.toLowerCase() as keyof typeof showing] || match;
        })
        .replace(/\bwas\s+(sad|happy|angry|afraid)\b/gi, (match, emotion) => {
          const showing = {
            sad: 'tears welled in their eyes',
            happy: 'beamed with joy',
            angry: 'face flushed with rage',
            afraid: 'heart pounded in their chest',
          };
          return showing[emotion.toLowerCase() as keyof typeof showing] || match;
        });
    }

    setRewriteText({ ...rewriteText, [paragraphIndex]: rewritten });
  };

  if (!scene.content.trim()) {
    return (
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
        <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Add content to the scene to see insights</p>
      </div>
    );
  }

  if (isAnalyzing || !analysis) {
    return (
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-purple-400 animate-spin mr-2" />
          <span className="text-gray-400">Analyzing scene...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" />
          Scene Insights
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-700">
        <button
          onClick={() => setSelectedTab('emotion')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            selectedTab === 'emotion'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Emotion
        </button>
        <button
          onClick={() => setSelectedTab('pacing')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            selectedTab === 'pacing'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Pacing
        </button>
        <button
          onClick={() => setSelectedTab('show-tell')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            selectedTab === 'show-tell'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Show vs Tell
        </button>
        <button
          onClick={() => setSelectedTab('suggestions')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            selectedTab === 'suggestions'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Lightbulb className="w-4 h-4 inline mr-2" />
          Suggestions ({analysis.suggestions.length})
        </button>
      </div>

      {/* Emotion Tab */}
      {selectedTab === 'emotion' && (
        <div className="space-y-4">
          {/* Primary Emotion */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Primary Emotion</span>
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold capitalize"
                style={{
                  backgroundColor: `${EMOTION_COLORS[analysis.emotion.primary]}20`,
                  color: EMOTION_COLORS[analysis.emotion.primary],
                }}
              >
                {analysis.emotion.primary}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Intensity:</span>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.emotion.intensity * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {Math.round(analysis.emotion.intensity * 100)}%
              </span>
            </div>
          </div>

          {/* Emotion Distribution */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-white font-semibold mb-3">Emotion Distribution</h4>
            <div className="space-y-2">
              {Object.entries(analysis.emotion.distribution).map(([emotion, score]) => (
                <div key={emotion} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                  />
                  <span className="text-sm text-gray-300 capitalize flex-1">{emotion}</span>
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">
                    {Math.round(score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Emotion Heatmap */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-white font-semibold mb-3">Emotion Heatmap</h4>
            <div className="flex items-center gap-1 h-8 bg-gray-700 rounded overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => {
                const position = i / 20;
                // Find dominant emotion at this position
                const sentences = scene.content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
                const sentenceIndex = Math.floor(position * sentences.length);
                const sentence = sentences[sentenceIndex] || '';
                const sentenceLower = sentence.toLowerCase();

                let dominantEmotion = 'neutral';
                let maxScore = 0;

                Object.entries(EMOTION_COLORS).forEach(([emotion]) => {
                  const keywords: Record<string, string[]> = {
                    joy: ['happy', 'joy', 'excited', 'smile', 'laugh'],
                    sadness: ['sad', 'depressed', 'cry', 'tears'],
                    anger: ['angry', 'rage', 'furious', 'mad'],
                    fear: ['afraid', 'scared', 'fear', 'terrified'],
                    surprise: ['surprised', 'shocked', 'amazed'],
                    neutral: [],
                  };
                  const score = keywords[emotion]?.filter((k) => sentenceLower.includes(k)).length || 0;
                  if (score > maxScore) {
                    maxScore = score;
                    dominantEmotion = emotion;
                  }
                });

                return (
                  <div
                    key={i}
                    className="flex-1 h-full"
                    style={{ backgroundColor: EMOTION_COLORS[dominantEmotion] }}
                    title={`Position ${Math.round(position * 100)}%: ${dominantEmotion}`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Start</span>
              <span>End</span>
            </div>
          </div>
        </div>
      )}

      {/* Pacing Tab */}
      {selectedTab === 'pacing' && (
        <div className="space-y-4">
          {/* Pacing Score */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Pacing Score</span>
              <span className="text-2xl font-bold text-purple-400">
                {Math.round(analysis.pacing.pacingScore * 100)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.pacing.pacingScore * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Content Ratios */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-white font-semibold mb-3">Content Breakdown</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Action
                  </span>
                  <span className="text-sm text-gray-400">
                    {Math.round(analysis.pacing.actionRatio * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-yellow-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.pacing.actionRatio * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    Dialogue
                  </span>
                  <span className="text-sm text-gray-400">
                    {Math.round(analysis.pacing.dialogueRatio * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.pacing.dialogueRatio * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-400" />
                    Description
                  </span>
                  <span className="text-sm text-gray-400">
                    {Math.round(analysis.pacing.descriptionRatio * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.pacing.descriptionRatio * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pacing Visualization */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-white font-semibold mb-3">Pacing Flow</h4>
            <div className="relative h-32 bg-gray-700 rounded overflow-hidden">
              {analysis.pacing.peaks.map((peak, index) => (
                <motion.div
                  key={index}
                  className="absolute bottom-0"
                  style={{
                    left: `${peak.position * 100}%`,
                    width: '5%',
                    height: `${peak.intensity * 100}%`,
                    backgroundColor:
                      peak.type === 'action'
                        ? '#FCD34D'
                        : peak.type === 'dialogue'
                        ? '#60A5FA'
                        : '#9CA3AF',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${peak.intensity * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  title={`${peak.type} peak at ${Math.round(peak.position * 100)}%`}
                />
              ))}
              {analysis.pacing.quietMoments.map((moment, index) => (
                <div
                  key={`quiet-${index}`}
                  className="absolute bottom-0 border-t-2 border-dashed border-purple-400 opacity-50"
                  style={{
                    left: `${moment.start * 100}%`,
                    width: `${(moment.end - moment.start) * 100}%`,
                  }}
                  title={`Quiet ${moment.type} moment`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Start</span>
              <span>End</span>
            </div>
          </div>
        </div>
      )}

      {/* Show vs Tell Tab */}
      {selectedTab === 'show-tell' && (
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Show vs Tell Score</span>
              <div className="flex items-center gap-2">
                {analysis.showVsTell.overallScore >= 0.7 ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
                <span className="text-2xl font-bold text-purple-400">
                  {Math.round(analysis.showVsTell.overallScore * 100)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Telling</span>
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.showVsTell.overallScore * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-gray-500">Showing</span>
            </div>
          </div>

          {/* Paragraph Analysis */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold">Paragraph Analysis</h4>
            {analysis.showVsTell.paragraphs.map((paragraph, index) => (
              <div
                key={index}
                className={`p-4 bg-gray-800/50 border rounded-lg cursor-pointer transition-colors ${
                  selectedParagraph === index
                    ? 'border-purple-500 bg-gray-800'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedParagraph(selectedParagraph === index ? null : index)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Paragraph {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          paragraph.score >= 0.7 ? 'bg-green-500' : paragraph.score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${paragraph.score * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {Math.round(paragraph.score * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-2 line-clamp-2">{paragraph.text}</p>
                {paragraph.issues.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {paragraph.issues.map((issue, i) => (
                      <div key={i} className="text-xs text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
                {selectedParagraph === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-gray-700 space-y-2"
                  >
                    {paragraph.suggestions.map((suggestion, i) => (
                      <div key={i} className="text-xs text-gray-400 flex items-start gap-2">
                        <Lightbulb className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                    {rewriteText[index] && (
                      <div className="mt-3 p-3 bg-gray-900 rounded border border-purple-500/30">
                        <div className="text-xs text-purple-400 mb-2 font-semibold">Suggested Rewrite:</div>
                        <p className="text-sm text-gray-300">{rewriteText[index]}</p>
                        {onApplySuggestion && (
                          <button
                            onClick={() => {
                              const suggestion: ImprovementSuggestion = {
                                type: 'show-tell',
                                priority: 'medium',
                                title: 'Rewrite Paragraph',
                                description: 'Apply suggested rewrite',
                              };
                              onApplySuggestion(suggestion, rewriteText[index]);
                            }}
                            className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                          >
                            Apply Rewrite
                          </button>
                        )}
                      </div>
                    )}
                    {!rewriteText[index] && (
                      <button
                        onClick={() => handleGenerateRewrite(index, {
                          type: 'show-tell',
                          priority: 'medium',
                          title: 'Rewrite',
                          description: '',
                        })}
                        className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generate Rewrite
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Tab */}
      {selectedTab === 'suggestions' && (
        <div className="space-y-3">
          {analysis.suggestions.length === 0 ? (
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-300 font-medium">Great work!</p>
              <p className="text-sm text-gray-500 mt-1">No major improvements needed.</p>
            </div>
          ) : (
            analysis.suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 border rounded-lg ${
                  suggestion.priority === 'high'
                    ? 'bg-red-900/20 border-red-500/30'
                    : suggestion.priority === 'medium'
                    ? 'bg-yellow-900/20 border-yellow-500/30'
                    : 'bg-blue-900/20 border-blue-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb
                        className={`w-5 h-5 ${
                          suggestion.priority === 'high'
                            ? 'text-red-400'
                            : suggestion.priority === 'medium'
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                        }`}
                      />
                      <h4 className="font-semibold text-white">{suggestion.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          suggestion.priority === 'high'
                            ? 'bg-red-500/20 text-red-300'
                            : suggestion.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{suggestion.description}</p>
                    {suggestion.example && (
                      <div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-700">
                        <div className="text-xs text-gray-500 mb-1">Example:</div>
                        <p className="text-xs text-gray-300">{suggestion.example}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
