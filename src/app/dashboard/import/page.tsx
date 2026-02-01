'use client';

/**
 * Import Story Page
 * 
 * Allows users to import stories from .txt/.md files or paste text
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, Save, X, Clipboard } from 'lucide-react';
import { ImportPipeline } from '@/lib/import/importPipeline';
import { convertToStory } from '@/lib/import/storyConverter';
import type { ImportResult } from '@/lib/import/importPipeline';
import type { Story } from '@/types/story';
import { useRouter } from 'next/navigation';
import { StoryStorage } from '@/lib/storage/storyStorage';

export default function ImportPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [showPasteInput, setShowPasteInput] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const result = await ImportPipeline.execute(file);
      setImportResult(result);
    } catch (err) {
      setError(`Failed to import file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Import error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handlePaste = useCallback(async () => {
    if (!pastedText.trim()) {
      setError('Please paste some text');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // Create a File object from pasted text
      const blob = new Blob([pastedText], { type: 'text/plain' });
      const file = new File([blob], 'pasted-text.txt', { type: 'text/plain' });
      
      const result = await ImportPipeline.execute(file);
      setImportResult(result);
      setPastedText('');
      setShowPasteInput(false);
    } catch (err) {
      setError(`Failed to import text: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Import error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [pastedText]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.pdf') || file.name.endsWith('.docx'))) {
      handleFile(file);
    } else {
      setError('Please upload a .txt, .md, .pdf, or .docx file');
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleSave = useCallback(async () => {
    if (!importResult) return;

    try {
      // Convert to Story object
      const story = convertToStory(importResult);
      
      // Save using StoryStorage
      StoryStorage.saveStory(story);
      StoryStorage.saveScenes(story.scenes);
      StoryStorage.saveCharacters(story.characters);
      
      // Redirect to stories page
      router.push('/dashboard');
    } catch (err) {
      setError(`Failed to save story: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Save error:', err);
    }
  }, [importResult, router]);

  const handleCancel = () => {
    setImportResult(null);
    setError(null);
    setPastedText('');
    setShowPasteInput(false);
  };

  if (importResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            Import Preview
          </h2>
        </div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-200 font-medium">Story imported successfully!</p>
              <p className="text-green-300/60 text-sm mt-1">
                {importResult.preview.totalWords.toLocaleString()} words •{' '}
                {importResult.preview.sceneCount} scenes •{' '}
                {importResult.preview.chapterCount} chapters •{' '}
                {importResult.preview.characterCount} characters
              </p>
            </div>
          </div>
        </motion.div>

        {/* Preview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Title</p>
            <p className="text-white font-semibold mt-1">{importResult.title}</p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Word Count</p>
            <p className="text-white font-semibold mt-1">
              {importResult.preview.totalWords.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Chapters</p>
            <p className="text-white font-semibold mt-1">
              {importResult.preview.chapterCount}
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Scenes</p>
            <p className="text-white font-semibold mt-1">
              {importResult.preview.sceneCount}
            </p>
          </div>
        </div>

        {/* Detected Chapters */}
        {importResult.detectedChapters.length > 0 && (
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-white font-semibold mb-3">Detected Chapters</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {importResult.detectedChapters.map((chapter, index) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'import/page.tsx:178',message:'Rendering detected chapter in UI',data:{chapterIndex:index,title:chapter.title,titleLength:chapter.title.length,hasNonAscii:chapter.title.split('').some(ch=>ch.charCodeAt(0)>126),confidence:chapter.confidence},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
                
                return (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                  <span className="text-gray-300">{chapter.title}</span>
                  <span className="text-gray-500 text-sm">
                    {(chapter.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detected Characters */}
        {importResult.detectedCharacters.length > 0 && (
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-white font-semibold mb-3">Detected Characters</h3>
            <div className="flex flex-wrap gap-2">
              {importResult.detectedCharacters.slice(0, 20).map((character, index) => (
                <div
                  key={index}
                  className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-purple-300 text-sm"
                >
                  {character.name} ({character.occurrences})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {importResult.validation.warnings.length > 0 && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <h3 className="text-yellow-300 font-semibold mb-2">Warnings</h3>
            <ul className="space-y-1">
              {importResult.validation.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-200 text-sm">• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Story
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload className="w-6 h-6 text-purple-400" />
          Import Story
        </h2>
      </div>

      <div className="space-y-4">
        {/* Upload Area */}
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
              Supports .txt, .md, .pdf, and .docx files
            </p>
          </label>
        </div>

        {/* Paste Text Option */}
        <div className="text-center">
          <button
            onClick={() => setShowPasteInput(!showPasteInput)}
            className="text-gray-400 hover:text-purple-400 text-sm flex items-center gap-2 mx-auto transition-colors"
          >
            <Clipboard className="w-4 h-4" />
            {showPasteInput ? 'Hide' : 'Or paste text instead'}
          </button>
        </div>

        {showPasteInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your story text here..."
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder:text-gray-500 min-h-[200px]"
            />
            <button
              onClick={handlePaste}
              disabled={!pastedText.trim() || isProcessing}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              Import Pasted Text
            </button>
          </motion.div>
        )}

        {/* Error Display */}
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

        {/* Processing Indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center p-8 bg-gray-800/50 rounded-lg"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-3" />
              <p className="text-gray-300 text-sm">Processing your story...</p>
              <p className="text-gray-500 text-xs mt-1">
                Detecting chapters, scenes, and characters
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
