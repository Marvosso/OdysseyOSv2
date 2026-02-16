'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileText, 
  FileJson, 
  Globe, 
  Copy, 
  Check,
  BookOpen,
  FileCode,
  Loader2,
  Twitter,
  Book,
  BarChart3,
  Volume2
} from 'lucide-react';
import type { Story } from '@/types/story';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import NarratePanel from './NarratePanel';
import SocialMediaExports from './SocialMediaExports';
import PublishingExports from './PublishingExports';
import AnalysisExports from './AnalysisExports';
import { StoryStorage } from '@/lib/storage/storyStorage';
import UpgradeModal from '@/components/session/UpgradeModal';

interface ExportManagerProps {
  story: Story;
}

const EXPORT_FORMATS = [
  { id: 'txt', label: 'Plain Text', icon: FileText, description: 'Simple text file' },
  { id: 'md', label: 'Markdown', icon: FileCode, description: 'For documentation and notes' },
  { id: 'json', label: 'JSON', icon: FileJson, description: 'For developers and backups' },
  { id: 'html', label: 'HTML', icon: Globe, description: 'For web publishing' },
  { id: 'pdf', label: 'PDF', icon: Book, description: 'Pro / Studio' },
  { id: 'docx', label: 'DOCX', icon: BookOpen, description: 'Pro / Studio' },
];

interface ExportStats {
  totalWords: number;
  totalCharacters: number;
  totalScenes: number;
  estimatedReadTime: number;
}

const SERVER_EXPORT_FORMATS = ['pdf', 'docx'];

export default function ExportManager({ story }: ExportManagerProps) {
  const [selectedFormat, setSelectedFormat] = useState('txt');
  const [includeCharacters, setIncludeCharacters] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'narrate' | 'social' | 'publishing' | 'analysis'>('text');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Load actual story from storage when Export page uses default story
  const actualStory = story.id === 'default' ? (() => {
    const savedStory = StoryStorage.loadStory();
    const savedScenes = StoryStorage.loadScenes();
    if (savedStory) {
      return { ...savedStory, scenes: savedScenes.length > 0 ? savedScenes : savedStory.scenes };
    }
    return story;
  })() : story;

  const stats = calculateStats(actualStory);

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
  };

  const handleCopyToClipboard = () => {
    const content = generateExportContent(selectedFormat);
    navigator.clipboard.writeText(content).then(() => {
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    });
  };

  const handleDownload = async () => {
    setExportError(null);
    setIsExporting(true);

    if (SERVER_EXPORT_FORMATS.includes(selectedFormat)) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setExportError('Sign in to export PDF or DOCX.');
          setIsExporting(false);
          return;
        }
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            format: selectedFormat,
            story: {
              id: actualStory.id,
              title: actualStory.title,
              scenes: actualStory.scenes,
              characters: actualStory.characters,
              createdAt: actualStory.createdAt instanceof Date ? actualStory.createdAt.toISOString() : actualStory.createdAt,
              updatedAt: actualStory.updatedAt instanceof Date ? actualStory.updatedAt.toISOString() : actualStory.updatedAt,
            },
          }),
        });
        if (res.status === 403) {
          setShowUpgradeModal(true);
          setIsExporting(false);
          return;
        }
        if (res.status === 501) {
          setExportError('PDF/DOCX export is coming soon.');
          setIsExporting(false);
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setExportError((err?.error?.message as string) || 'Export failed.');
          setIsExporting(false);
          return;
        }
        const blob = await res.blob();
        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
        const filename = `${actualStory.title.replace(/\s+/g, '_')}_${timestamp}.${selectedFormat}`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } finally {
        setIsExporting(false);
      }
      return;
    }

    const content = generateExportContent(selectedFormat);
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `${actualStory.title.replace(/\s+/g, '_')}_${timestamp}.${selectedFormat}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const generateExportContent = (format: string): string => {
    switch (format) {
      case 'txt':
        return generatePlainText();
      case 'md':
        return generateMarkdown();
      case 'json':
        return generateJSON();
      case 'html':
        return generateHTML();
      case 'pdf':
      case 'docx':
        return generatePlainText();
      default:
        return generatePlainText();
    }
  };

  const generatePlainText = (): string => {
    let content = `${actualStory.title}\n`;
    content += `${'='.repeat(actualStory.title.length)}\n\n`;
    content += `Last Updated: ${format(actualStory.updatedAt, 'MMMM d, yyyy')}\n\n`;
    
    if (includeCharacters && actualStory.characters.length > 0) {
      content += 'CHARACTERS\n';
      content += `${'-'.repeat(10)}\n\n`;
      actualStory.characters.forEach(char => {
        content += `${char.name}\n`;
        content += `${char.description}\n`;
        if (char.goals.length > 0) {
          content += `Goals: ${char.goals.join(', ')}\n`;
        }
        if (char.flaws.length > 0) {
          content += `Flaws: ${char.flaws.join(', ')}\n`;
        }
        content += '\n';
      });
      content += '\n';
    }
    
    content += 'SCENES\n';
    content += `${'-'.repeat(6)}\n\n`;
    actualStory.scenes.forEach((scene, index) => {
      content += `[Scene ${index + 1}: ${scene.title}]\n`;
      content += `Emotion: ${scene.emotion}\n\n`;
      content += `${scene.content}\n\n`;
      content += `${'-'.repeat(50)}\n\n`;
    });
    
    return content;
  };

  const generateMarkdown = (): string => {
    let content = `# ${actualStory.title}\n\n`;
    content += `*Last Updated: ${format(actualStory.updatedAt, 'MMMM d, yyyy')}*\n\n`;
    
    if (includeCharacters && actualStory.characters.length > 0) {
      content += '## Characters\n\n';
      actualStory.characters.forEach(char => {
        content += `### ${char.name}\n\n`;
        content += `${char.description}\n\n`;
        if (char.goals.length > 0) {
          content += '**Goals:**\n';
          char.goals.forEach(goal => {
            content += `- ${goal}\n`;
          });
          content += '\n';
        }
        if (char.flaws.length > 0) {
          content += '**Flaws:**\n';
          char.flaws.forEach(flaw => {
            content += `- ${flaw}\n`;
          });
          content += '\n';
        }
      });
      content += '\n';
    }
    
    content += '## Scenes\n\n';
    actualStory.scenes.forEach((scene, index) => {
      content += `### Scene ${index + 1}: ${scene.title}\n\n`;
      content += `*Emotion: ${scene.emotion}*\n\n`;
      content += `${scene.content}\n\n`;
      content += '---\n\n';
    });
    
    return content;
  };

  const generateJSON = (): string => {
    const exportData = {
      metadata: {
        title: actualStory.title,
        createdAt: actualStory.createdAt instanceof Date ? actualStory.createdAt.toISOString() : String(actualStory.createdAt),
        updatedAt: actualStory.updatedAt instanceof Date ? actualStory.updatedAt.toISOString() : String(actualStory.updatedAt),
        version: '1.0',
      },
      stats: {
        totalWords: stats.totalWords,
        totalCharacters: stats.totalCharacters,
        totalScenes: stats.totalScenes,
        estimatedReadTime: stats.estimatedReadTime,
      },
      characters: includeCharacters ? actualStory.characters : [],
      scenes: actualStory.scenes.map(scene => ({
        id: scene.id,
        title: scene.title,
        content: scene.content,
        position: scene.position,
        emotion: scene.emotion,
        wordCount: scene.content.split(' ').length,
      })),
    };
    
    return JSON.stringify(exportData, null, 2);
  };

  const generateHTML = (): string => {
    let content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${actualStory.title}</title>
  <style>
    body {
      font-family: Georgia, serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
      background: #fff;
    }
    h1 { color: #1a1a1a; border-bottom: 3px solid #6366f1; padding-bottom: 0.5rem; }
    h2 { color: #4b5563; margin-top: 2rem; }
    h3 { color: #6b7280; }
    .scene { margin: 2rem 0; padding: 1.5rem; background: #f9fafb; border-left: 4px solid #6366f1; }
    .scene-header { display: flex; justify-content: space-between; color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem; }
    .character { margin: 1rem 0; padding: 1rem; background: #f3f4f6; }
    .character-name { font-weight: bold; color: #1f2937; }
    .metadata { color: #6b7280; font-size: 0.875rem; margin-bottom: 2rem; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; padding: 1rem; background: #f9fafb; }
  </style>
</head>
<body>
  <h1>${actualStory.title}</h1>
  <p class="metadata">Last Updated: ${format(actualStory.updatedAt, 'MMMM d, yyyy')}</p>
  
  <div class="stats">
    <div><strong>Word Count:</strong> ${stats.totalWords}</div>
    <div><strong>Scenes:</strong> ${stats.totalScenes}</div>
    <div><strong>Characters:</strong> ${actualStory.characters.length}</div>
    <div><strong>Read Time:</strong> ~${stats.estimatedReadTime} min</div>
  </div>
`;
    
    if (includeCharacters && actualStory.characters.length > 0) {
      content += '  <h2>Characters</h2>\n';
      actualStory.characters.forEach(char => {
        content += `  <div class="character">
    <div class="character-name">${char.name}</div>
    <div>${char.description}</div>`;
        if (char.goals.length > 0) {
          content += '    <div><strong>Goals:</strong> ' + char.goals.join(', ') + '</div>\n';
        }
        if (char.flaws.length > 0) {
          content += '    <div><strong>Flaws:</strong> ' + char.flaws.join(', ') + '</div>\n';
        }
        content += '  </div>\n';
      });
    }
    
    content += '  <h2>Scenes</h2>\n';
    actualStory.scenes.forEach((scene, index) => {
      content += `  <div class="scene">
    <div class="scene-header">
      <span>Scene ${index + 1}</span>
      <span>${scene.emotion}</span>
    </div>
    <h3>${scene.title}</h3>
    <div>${scene.content.replace(/\n/g, '<br>')}</div>
  </div>\n`;
    });
    
    content += '</body>\n</html>';
    
    return content;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 overflow-x-hidden"
    >
      {/* Tab Selection - single column scroll on mobile, touch-friendly */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 border-b border-gray-700 pb-2 gap-1 sm:overflow-x-auto">
        <button
          onClick={() => setActiveTab('text')}
          className={`min-h-[44px] px-4 py-2.5 font-medium transition-colors border-b-2 sm:border-b-2 whitespace-nowrap text-left sm:text-center rounded-t-lg sm:rounded-t ${
            activeTab === 'text'
              ? 'text-purple-400 border-purple-400 bg-purple-500/10'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Text Export
        </button>
        <button
          onClick={() => setActiveTab('narrate')}
          className={`min-h-[44px] px-4 py-2.5 font-medium transition-colors border-b-2 whitespace-nowrap text-left sm:text-center rounded-t-lg sm:rounded-t ${
            activeTab === 'narrate'
              ? 'text-purple-400 border-purple-400 bg-purple-500/10'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Volume2 className="w-4 h-4 inline mr-2" />
          Narrate
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`min-h-[44px] px-4 py-2.5 font-medium transition-colors border-b-2 whitespace-nowrap text-left sm:text-center rounded-t-lg sm:rounded-t ${
            activeTab === 'social'
              ? 'text-purple-400 border-purple-400 bg-purple-500/10'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Twitter className="w-4 h-4 inline mr-2" />
          Social Media
        </button>
        <button
          onClick={() => setActiveTab('publishing')}
          className={`min-h-[44px] px-4 py-2.5 font-medium transition-colors border-b-2 whitespace-nowrap text-left sm:text-center rounded-t-lg sm:rounded-t ${
            activeTab === 'publishing'
              ? 'text-purple-400 border-purple-400 bg-purple-500/10'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Book className="w-4 h-4 inline mr-2" />
          Publishing
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`min-h-[44px] px-4 py-2.5 font-medium transition-colors border-b-2 whitespace-nowrap text-left sm:text-center rounded-t-lg sm:rounded-t ${
            activeTab === 'analysis'
              ? 'text-purple-400 border-purple-400 bg-purple-500/10'
              : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Analysis
        </button>
      </div>

      {/* Narrate Tab */}
      {activeTab === 'narrate' && (
        <NarratePanel story={actualStory} />
      )}

      {/* Social Media Export Tab */}
      {activeTab === 'social' && (
        <SocialMediaExports story={actualStory} />
      )}

      {/* Publishing Export Tab */}
      {activeTab === 'publishing' && (
        <PublishingExports story={actualStory} />
      )}

      {/* Analysis Export Tab */}
      {activeTab === 'analysis' && (
        <AnalysisExports story={actualStory} />
      )}

      {/* Text Export Tab */}
      {activeTab === 'text' && (
        <>
      {/* Stats Dashboard - single column on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={16} className="text-green-400" />
            <span className="text-xs text-gray-500">Word Count</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalWords.toLocaleString()}
          </div>
        </div>

        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-blue-400" />
            <span className="text-xs text-gray-500">Characters</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalCharacters.toLocaleString()}
          </div>
        </div>

        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Download size={16} className="text-purple-400" />
            <span className="text-xs text-gray-500">Scenes</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalScenes}
          </div>
        </div>

        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 size={16} className="text-orange-400" />
            <span className="text-xs text-gray-500">Read Time</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ~{stats.estimatedReadTime}m
          </div>
        </div>
      </div>

      {/* Export Format Selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">Export Format</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.id}
              onClick={() => handleFormatChange(format.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedFormat === format.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <format.icon size={18} className={selectedFormat === format.id ? 'text-green-400' : 'text-gray-400'} />
                <span className={`font-medium text-sm ${selectedFormat === format.id ? 'text-green-400' : 'text-white'}`}>
                  {format.label}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {format.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeCharacters}
            onChange={(e) => setIncludeCharacters(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500 bg-gray-700"
          />
          <span className="text-sm text-gray-400">Include character information</span>
        </label>
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-400">Preview</h4>
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {copiedToClipboard ? (
              <>
                <Check size={14} className="text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 max-h-48 min-h-0 overflow-y-auto">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
            {generateExportContent(selectedFormat).slice(0, 500)}
            {generateExportContent(selectedFormat).length > 500 ? '\n\n... (truncated)' : ''}
          </pre>
        </div>
      </div>

      {exportError && (
        <p className="text-sm text-amber-400" role="alert">
          {exportError}
        </p>
      )}

      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* Download Button - touch-friendly */}
      <button
        onClick={handleDownload}
        disabled={isExporting}
        className="w-full min-h-[44px] py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download size={18} />
            Export as {EXPORT_FORMATS.find(f => f.id === selectedFormat)?.label}
          </>
        )}
      </button>
        </>
      )}
    </motion.div>
  );
}

function calculateStats(story: Story): ExportStats {
  const totalWords = story.scenes.reduce((acc, scene) => {
    return acc + scene.content.split(/\s+/).filter(word => word.length > 0).length;
  }, 0);

  const totalCharacters = story.scenes.reduce((acc, scene) => {
    return acc + scene.content.length;
  }, 0);

  const totalScenes = story.scenes.length;
  const estimatedReadTime = Math.ceil(totalWords / 200);

  return {
    totalWords,
    totalCharacters,
    totalScenes,
    estimatedReadTime,
  };
}
