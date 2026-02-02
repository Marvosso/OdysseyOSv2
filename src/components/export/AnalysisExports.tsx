'use client';

/**
 * Analysis Exports Component
 * 
 * Generates analysis visualizations and reports
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Network,
  Calendar,
  BarChart3,
  Download,
  Copy,
  Check,
  Eye,
} from 'lucide-react';
import type { Story } from '@/types/story';
import {
  generateCharacterRelationshipChart,
  generateTimelineVisualization,
  generateStoryBeatBreakdown,
} from '@/lib/export/analysisExports';
import CharacterRelationshipChart from './CharacterRelationshipChart';
import TimelineChart from './TimelineChart';

interface AnalysisExportsProps {
  story: Story;
}

export default function AnalysisExports({ story }: AnalysisExportsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showChart, setShowChart] = useState<'relationships' | 'timeline' | null>(null);

  const relationshipChart = generateCharacterRelationshipChart(story);
  const timeline = generateTimelineVisualization(story);
  const beatBreakdown = generateStoryBeatBreakdown(story);

  const handleCopy = async (content: string, type: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Analysis Exports</h3>

      {/* Character Relationship Chart */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-400" />
            <h4 className="text-white font-semibold">Character Relationships</h4>
            <span className="text-xs text-gray-400">
              {relationshipChart.nodes.length} characters, {relationshipChart.links.length} relationships
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChart(showChart === 'relationships' ? null : 'relationships')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => handleDownload(
                JSON.stringify(relationshipChart, null, 2),
                `${story.title}-relationships.json`
              )}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        {showChart === 'relationships' && (
          <div className="mt-3">
            <CharacterRelationshipChart data={relationshipChart} />
          </div>
        )}
      </div>

      {/* Timeline Visualization */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h4 className="text-white font-semibold">Timeline</h4>
            <span className="text-xs text-gray-400">
              {timeline.events.length} events
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChart(showChart === 'timeline' ? null : 'timeline')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => handleDownload(
                JSON.stringify(timeline, null, 2),
                `${story.title}-timeline.json`
              )}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        {showChart === 'timeline' && (
          <div className="mt-3">
            <TimelineChart data={timeline} />
          </div>
        )}
      </div>

      {/* Story Beat Breakdown */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            <h4 className="text-white font-semibold">Story Beat Breakdown</h4>
            <span className="text-xs text-gray-400">
              {beatBreakdown.summary.totalBeats} beats
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(
                JSON.stringify(beatBreakdown, null, 2),
                'beats'
              )}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied === 'beats' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => handleDownload(
                JSON.stringify(beatBreakdown, null, 2),
                `${story.title}-beats.json`
              )}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Pacing:</span>
            <span className={`font-semibold ${
              beatBreakdown.summary.pacing === 'fast' ? 'text-green-400' :
              beatBreakdown.summary.pacing === 'slow' ? 'text-yellow-400' :
              'text-blue-400'
            }`}>
              {beatBreakdown.summary.pacing.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Avg Words/Beat:</span>
            <span className="text-white">{beatBreakdown.summary.averageWordsPerBeat}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
