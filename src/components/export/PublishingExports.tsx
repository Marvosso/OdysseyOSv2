'use client';

/**
 * Publishing Exports Component
 * 
 * One-click exports for publishing platforms
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  FileCode,
  Download,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import type { Story } from '@/types/story';
import {
  generateKDPFormat,
  generateWattpadFormat,
  generateManuscriptFormat,
} from '@/lib/export/publishingExports';

interface PublishingExportsProps {
  story: Story;
}

export default function PublishingExports({ story }: PublishingExportsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('Your Name');

  const handleCopy = async (content: string, type: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (content: string, filename: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const kdpFormat = generateKDPFormat(story, authorName);
  const wattpadFormat = generateWattpadFormat(story);
  const manuscriptFormat = generateManuscriptFormat(story, authorName);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Publishing Formats</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Author:</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Your Name"
          />
        </div>
      </div>

      {/* Amazon KDP */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-400" />
            <h4 className="text-white font-semibold">Amazon KDP Format</h4>
            <span className="text-xs text-gray-400">
              {kdpFormat.metadata.pageCount} pages
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(kdpFormat.content, 'kdp')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied === 'kdp' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => handleDownload(kdpFormat.content, `${story.title}-KDP.txt`)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Word Count: {kdpFormat.metadata.wordCount.toLocaleString()}</div>
          <div>Estimated Pages: {kdpFormat.metadata.pageCount}</div>
          <div className="text-gray-500 mt-2">
            Ready for Amazon KDP upload. Convert to PDF using your preferred tool.
          </div>
        </div>
      </div>

      {/* Wattpad */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-green-400" />
            <h4 className="text-white font-semibold">Wattpad Format</h4>
            <span className="text-xs text-gray-400">
              {wattpadFormat.chapters.length} chapters
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(wattpadFormat.content, 'wattpad')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied === 'wattpad' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => handleDownload(wattpadFormat.content, `${story.title}-Wattpad.md`)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Formatted for Wattpad with chapter breaks. Copy and paste directly into Wattpad editor.
        </div>
      </div>

      {/* Standard Manuscript */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h4 className="text-white font-semibold">Standard Manuscript</h4>
            <span className="text-xs text-gray-400">
              {manuscriptFormat.pageCount} pages
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(manuscriptFormat.content, 'manuscript')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied === 'manuscript' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => handleDownload(manuscriptFormat.content, `${story.title}-Manuscript.txt`)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Word Count: {manuscriptFormat.wordCount.toLocaleString()}</div>
          <div>Estimated Pages: {manuscriptFormat.pageCount}</div>
          <div className="text-gray-500 mt-2">
            Standard manuscript format (12pt Courier, double-spaced). Ready for submission to agents/publishers.
          </div>
        </div>
      </div>
    </div>
  );
}
