'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, BookOpen, Trash2, Sparkles } from 'lucide-react';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { StoryParser, ParsedStory } from '@/lib/storage/storyParser';
import type { Scene, Chapter } from '@/types/story';
import StructureDetection from '@/components/ai/StructureDetection';
import type { StructureDetection as StructureDetectionType } from '@/types/ai';

interface StoryImportProps {
  onImport: (parsed: ParsedStory) => void;
}

export default function StoryImport({ onImport }: StoryImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedStory | null>(null);
  const [showAIDetection, setShowAIDetection] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Extract text from file (supports PDF, DOCX, TXT, MD)
      const { extractTextFromFile } = await import('@/lib/import/fileExtractor');
      const extracted = await extractTextFromFile(file);
      
      // Final sanitization pass to ensure no null bytes (defensive)
      // Remove any null bytes that might have slipped through
      let cleanText = extracted.text;
      if (cleanText.includes('\0') || cleanText.includes('\u0000') || cleanText.includes('\x00')) {
        // Remove all null bytes using multiple methods
        cleanText = cleanText.replace(/\0/g, '').replace(/\u0000/g, '').replace(/\x00/g, '');
        // Also filter by character code as ultimate fallback
        cleanText = cleanText.split('').filter(char => char.charCodeAt(0) !== 0).join('');
      }
      
      const title = file.name.replace(/\.[^/.]+$/, '');
      
      // Parse the cleaned text
      const parsed = StoryParser.parseTextFile(cleanText, title);
      
      // Final defensive sanitization: ensure all chapter titles are ASCII-only
      const sanitizedParsed = {
        ...parsed,
        chapters: parsed.chapters.map(chapter => {
          // Remove ALL non-ASCII characters from chapter title as final safety check
          const sanitizedTitle = chapter.title.split('').filter((char: string) => {
            const code = char.charCodeAt(0);
            return code >= 32 && code <= 126;
          }).join('').trim();
          
          // If title is empty or corrupted after sanitization, use default
          if (!sanitizedTitle || sanitizedTitle.length === 0) {
            return {
              ...chapter,
              title: `Chapter ${parsed.chapters.indexOf(chapter) + 1}`
            };
          }
          
          return {
            ...chapter,
            title: sanitizedTitle
          };
        })
      };
      
      setParsedData(sanitizedParsed);
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Parse error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleConfirmImport = () => {
    if (parsedData) {
      // Save to storage
      StoryStorage.saveScenes(parsedData.scenes);
      StoryStorage.saveStory({
        id: `story-${Date.now()}`,
        title: parsedData.title,
        scenes: parsedData.scenes,
        characters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      onImport(parsedData);
      setSuccess(false);
      setParsedData(null);
    }
  };

  const handleCancel = () => {
    setSuccess(false);
    setParsedData(null);
    setError(null);
  };

  const handleAIDetection = () => {
    setShowAIDetection(true);
  };

  const handleAIConfirm = (structure: StructureDetectionType) => {
    if (!parsedData) return;
    
    // Convert AI structure to import format
    const scenes: Scene[] = structure.scenes.map(scene => ({
      id: scene.id,
      title: scene.title,
      content: scene.content,
      position: parseInt(scene.id.split('-')[1]) || 0,
      emotion: scene.emotion as any,
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Group scenes by chapter and create chapters with their scenes
    const chapters: Chapter[] = structure.chapters.map(chapter => {
      // Find all scenes that belong to this chapter
      const chapterScenes = scenes.filter(scene => {
        // Check if scene's chapterId matches this chapter's id
        const detectedScene = structure.scenes.find(s => s.id === scene.id);
        return detectedScene?.chapterId === chapter.id;
      });
      
      return {
        id: chapter.id,
        title: chapter.title,
        scenes: chapterScenes,
      };
    });

    const finalParsed: ParsedStory = {
      title: parsedData.title,
      scenes,
      chapters,
    };

    setParsedData(finalParsed);
    setShowAIDetection(false);
  };

  const wordCount = parsedData?.scenes.reduce((sum, scene) => {
    return sum + scene.content.split(/\s+/).filter(w => w.length > 0).length;
  }, 0) || 0;

  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload className="w-6 h-6 text-purple-400" />
          Import Story
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {!success && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-gray-800'
              }`}
            >
              <input
                type="file"
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                <p className="text-white text-lg font-medium mb-2">
                  Drop your story file here
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  or click to browse
                </p>
                <p className="text-gray-500 text-xs">
                  Supports .txt, .md, .pdf, .docx files
                </p>
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center p-8 bg-gray-800/50 rounded-lg"
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Parsing your story...</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {success && parsedData && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-500/30 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-200 font-medium">Story parsed successfully!</p>
                <p className="text-green-300/60 text-sm">
                  {wordCount.toLocaleString()} words • {readingTime} min read • {parsedData.scenes.length} scenes
                </p>
              </div>
            </motion.div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  {parsedData.title}
                </h3>
              </div>

              {parsedData.chapters.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    {parsedData.chapters.length} Chapter{parsedData.chapters.length > 1 ? 's' : ''} Detected
                  </h4>
                  <div className="space-y-2">
                    {parsedData.chapters.slice(0, 5).map((chapter) => (
                      <div
                        key={chapter.id}
                        className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-white font-medium">{chapter.title}</h5>
                            <p className="text-gray-400 text-xs mt-1">
                              {chapter.scenes?.length || 0} scene{chapter.scenes?.length || 0 > 1 ? 's' : ''}
                            </p>
                          </div>
                          <BookOpen className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    ))}
                    {parsedData.chapters.length > 5 && (
                      <p className="text-gray-500 text-sm text-center">
                        +{parsedData.chapters.length - 5} more chapters
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAIDetection}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  AI Structure Analysis
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Import Directly
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showAIDetection && parsedData && (
          <motion.div
            key="ai-detection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <StructureDetection
              initialText={parsedData.scenes.map(s => s.content).join('\n\n')}
              onConfirm={handleAIConfirm}
              onCancel={() => setShowAIDetection(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
