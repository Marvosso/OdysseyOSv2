'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Info,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import type { StoryBeat, BeatType, BeatAnalysis, BeatTemplate } from '@/types/beat';
import { beatTemplates, beatColors, beatDescriptions } from '@/lib/data/beatTemplates';

interface BeatEditorProps {
  sceneId: string;
  sceneTitle: string;
  sceneContent: string;
  onBeatChange?: (beats: StoryBeat[]) => void;
}

export default function BeatEditor({ 
  sceneId, 
  sceneTitle,
  onBeatChange 
}: BeatEditorProps) {
  const [beats, setBeats] = useState<StoryBeat[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BeatAnalysis | null>(null);
  const [draggedBeat, setDraggedBeat] = useState<string | null>(null);

  // Load beats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`beats-${sceneId}`);
    if (saved) {
      setBeats(JSON.parse(saved));
    }
  }, [sceneId]);

  // Save beats to localStorage
  useEffect(() => {
    if (beats.length > 0) {
      localStorage.setItem(`beats-${sceneId}`, JSON.stringify(beats));
      onBeatChange?.(beats);
    }
  }, [beats, sceneId, onBeatChange]);

  const addBeat = (beatType: BeatType = 'rising-action') => {
    const newBeat: StoryBeat = {
      id: `beat-${Date.now()}`,
      sceneId,
      beatType,
      title: beatDescriptions[beatType],
      description: '',
      position: beats.length,
      duration: 10,
      emotionalImpact: 5,
      importance: 5,
      conflicts: [],
      resolutions: [],
    };
    setBeats([...beats, newBeat]);
  };

  const removeBeat = (beatId: string) => {
    setBeats(beats.filter(b => b.id !== beatId));
  };

  const updateBeat = (beatId: string, updates: Partial<StoryBeat>) => {
    setBeats(beats.map(b => 
      b.id === beatId ? { ...b, ...updates } : b
    ));
  };

  const applyTemplate = (template: BeatTemplate) => {
    const newBeats: StoryBeat[] = [];
    let position = 0;

    template.structure.acts.forEach(act => {
      act.beats.forEach(beat => {
        newBeats.push({
          id: `beat-${Date.now()}-${position}`,
          sceneId,
          beatType: beat.type,
          title: `${beat.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          description: beat.description,
          position: position++,
          duration: beat.duration,
          emotionalImpact: 5,
          importance: 5,
          conflicts: [],
          resolutions: [],
        });
      });
    });

    setBeats(newBeats);
    setSelectedTemplate(template.name);
  };

  const analyzeBeats = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      const totalDuration = beats.reduce((sum, b) => sum + b.duration, 0);
      const totalImpact = beats.reduce((sum, b) => sum + b.emotionalImpact, 0);
      const avgImpact = totalImpact / beats.length || 0;
      
      const beatTypes = new Set(beats.map(b => b.beatType));
      const diversity = (beatTypes.size / 10) * 100;
      
      const pacing = totalDuration > 120 ? 'too-slow' : totalDuration < 60 ? 'too-fast' : 'balanced';
      
      const recommendations: string[] = [];
      if (pacing !== 'balanced') {
        recommendations.push(
          pacing === 'too-fast' 
            ? 'Consider adding more character development beats' 
            : 'Consider tightening the pacing with fewer beats'
        );
      }
      if (avgImpact < 4) {
        recommendations.push('Increase emotional impact in key beats');
      }
      if (diversity < 50) {
        recommendations.push('Add more variety to beat types for better flow');
      }

      setAnalysis({
        balanceScore: Math.round((diversity + avgImpact * 10) / 2),
        pacing,
        arcType: beats.length > 5 ? 'linear' : 'episodic',
        recommendations,
      });
      setIsAnalyzing(false);
    }, 1000);
  };

  const handleDragStart = (beatId: string) => {
    setDraggedBeat(beatId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedBeat || draggedBeat === targetId) return;

    const newBeats = [...beats];
    const draggedIndex = newBeats.findIndex(b => b.id === draggedBeat);
    const targetIndex = newBeats.findIndex(b => b.id === targetId);

    const [removed] = newBeats.splice(draggedIndex, 1);
    newBeats.splice(targetIndex, 0, removed);

    setBeats(newBeats.map((b, i) => ({ ...b, position: i })));
    setDraggedBeat(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Scene Breakdown
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {sceneTitle}
        </p>
      </div>

      {/* Template Selection */}
      <div className="p-4 border-b border-gray-800">
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Apply Structure Template
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(beatTemplates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => applyTemplate(template)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedTemplate === template.name
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Beats List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {beats.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No beats added yet</p>
            <p className="text-xs mt-2">Add beats to break down this scene</p>
          </div>
        ) : (
          <AnimatePresence>
            {beats.map((beat) => (
              <motion.div
                key={beat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                draggable
                onDragStart={() => handleDragStart(beat.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(beat.id)}
                className={`group relative p-4 rounded-lg border-2 transition-all ${
                  draggedBeat === beat.id
                    ? 'border-purple-500 opacity-50'
                    : 'border-gray-700 hover:border-purple-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-gray-500 mt-1 cursor-grab" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${beatColors[beat.beatType]}`}>
                        {beat.beatType.replace('-', ' ')}
                      </span>
                      <input
                        type="text"
                        value={beat.title}
                        onChange={(e) => updateBeat(beat.id, { title: e.target.value })}
                        className="flex-1 bg-transparent text-white font-medium focus:outline-none"
                      />
                    </div>

                    <textarea
                      value={beat.description}
                      onChange={(e) => updateBeat(beat.id, { description: e.target.value })}
                      placeholder="Describe this beat..."
                      className="w-full bg-gray-800/50 text-gray-300 text-sm rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={2}
                    />

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Duration</label>
                        <input
                          type="range"
                          min={1}
                          max={30}
                          value={beat.duration}
                          onChange={(e) => updateBeat(beat.id, { duration: Number(e.target.value) })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{beat.duration}%</span>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Impact</label>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={beat.emotionalImpact}
                          onChange={(e) => updateBeat(beat.id, { emotionalImpact: Number(e.target.value) })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{beat.emotionalImpact}/10</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeBeat(beat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        <button
          onClick={() => addBeat()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Beat
        </button>

        <button
          onClick={analyzeBeats}
          disabled={beats.length === 0 || isAnalyzing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Info className="w-4 h-4" />
              Analyze Scene
            </>
          )}
        </button>

        {analysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-800/50 rounded-lg p-3 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Balance Score</span>
              <span className="text-lg font-bold text-white">{analysis.balanceScore}/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Pacing</span>
              <span className={`text-sm font-medium ${
                analysis.pacing === 'balanced' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {analysis.pacing}
              </span>
            </div>
            {analysis.recommendations.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Recommendations:</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
