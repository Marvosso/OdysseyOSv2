'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Sparkles, 
  ChevronRight, 
  RefreshCw,
  Brain,
  Lightbulb
} from 'lucide-react';
import { guidanceQuestions } from '@/lib/data/guidanceQuestions';
import type { GuidanceQuestion, QuestionCategory } from '@/types/guidance';

interface GuidanceEngineProps {
  _currentSceneId?: string;
  currentEmotion?: string;
  onApplySuggestion?: (suggestion: string) => void;
}

export default function GuidanceEngine({ 
  _currentSceneId, 
  currentEmotion,
  onApplySuggestion 
}: GuidanceEngineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<GuidanceQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [generatedSuggestions, setGeneratedSuggestions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>('character');

  const getFilteredQuestions = useCallback(() => {
    let filtered = guidanceQuestions[selectedCategory];
    
    if (currentEmotion) {
      filtered = filtered.filter(q => 
        q.relevantEmotions?.includes(currentEmotion) || 
        q.relevantEmotions?.length === 0
      );
    }
    
    return filtered;
  }, [selectedCategory, currentEmotion]);

  const handleGetQuestion = useCallback(() => {
    const questions = getFilteredQuestions();
    if (questions.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestion(questions[randomIndex]);
    setUserAnswer('');
    setGeneratedSuggestions([]);
  }, [getFilteredQuestions]);

  const handleGenerateSuggestions = () => {
    if (!currentQuestion || !userAnswer.trim()) return;
    
    const suggestions = generateSuggestions(currentQuestion, userAnswer);
    setGeneratedSuggestions(suggestions);
  };

  const generateSuggestions = (question: GuidanceQuestion, answer: string): string[] => {
    const suggestionTemplates = [
      `What if you explored "${answer}" from a different character's perspective?`,
      `Consider adding a twist: while "${answer}", something unexpected happens...`,
      `How would this change if "${answer}" was actually a misunderstanding?`,
      `Try revealing "${answer}" through action instead of dialogue.`,
      `What emotional impact does "${answer}" have on other characters?`
    ];
    
    return [...suggestionTemplates]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  };

  const handleToggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState && !currentQuestion) {
      handleGetQuestion();
    }
  };

  return (
    <>
      <button
        onClick={handleToggleOpen}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 
                 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 
                 text-white rounded-full shadow-lg hover:shadow-xl 
                 hover:scale-105 transition-all duration-300"
      >
        <HelpCircle size={20} />
        <span className="font-medium">Writing Help</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center 
                     bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden 
                       rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 
                       border border-gray-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="text-purple-400" size={24} />
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Writing Guidance Engine
                      </h2>
                      <p className="text-sm text-gray-400">
                        Beat writer's block with targeted questions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-gray-800">
                <div className="flex flex-wrap gap-2">
                  {(['character', 'plot', 'setting', 'dialogue', 'theme'] as QuestionCategory[]).map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setCurrentQuestion(null);
                        setGeneratedSuggestions([]);
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                                ${selectedCategory === category
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <AnimatePresence mode="wait">
                  {!currentQuestion ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8"
                    >
                      <Sparkles className="mx-auto mb-4 text-gray-500" size={48} />
                      <p className="text-gray-400">
                        Click "Get Question" to start receiving guidance
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="question"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="text-yellow-500" size={18} />
                          <span className="text-sm font-medium text-yellow-500">
                            Question for you:
                          </span>
                        </div>
                        <p className="text-lg text-white">
                          {currentQuestion.question}
                        </p>
                        {currentQuestion.tips && (
                          <p className="mt-2 text-sm text-gray-400">
                            💡 {currentQuestion.tips}
                          </p>
                        )}
                      </div>

                      <div className="mb-6">
                        <textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type your thoughts here... (Don't overthink it!)"
                          className="w-full h-32 p-4 bg-gray-800/50 rounded-lg 
                                   border border-gray-700 text-white 
                                   placeholder-gray-500 resize-none
                                   focus:border-purple-500 outline-none"
                        />
                      </div>

                      {generatedSuggestions.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="text-purple-400" size={18} />
                            <span className="text-sm font-medium text-purple-400">
                              Suggestions based on your answer:
                            </span>
                          </div>
                          <div className="space-y-3">
                            {generatedSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="p-4 bg-gray-800/30 rounded-lg border 
                                         border-gray-700 hover:border-purple-500/50 
                                         transition-colors cursor-pointer group"
                                onClick={() => onApplySuggestion?.(suggestion)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-1 bg-purple-500/20 rounded">
                                    <ChevronRight className="text-purple-400" size={16} />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-gray-300 group-hover:text-white">
                                      {suggestion}
                                    </p>
                                    <button className="mt-2 text-sm text-purple-400 
                                                     hover:text-purple-300 opacity-0 
                                                     group-hover:opacity-100 transition-opacity">
                                      Apply to story →
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 border-t border-gray-800 bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleGetQuestion}
                    className="flex items-center gap-2 px-4 py-2 
                             bg-gray-800 hover:bg-gray-700 text-white 
                             rounded-lg transition-colors"
                  >
                    <RefreshCw size={16} />
                    New Question
                  </button>
                  
                  <div className="flex items-center gap-3">
                    {userAnswer.trim() && !generatedSuggestions.length && (
                      <button
                        onClick={handleGenerateSuggestions}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 
                                 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Generate Suggestions
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
