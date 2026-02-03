'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Plus, Trash2, Volume2, ChevronDown, ChevronUp, MapPin, User, FileText, ExternalLink, AlertTriangle, Timer, Users, Brain, GitBranch } from 'lucide-react';
import type { Scene, Story, SceneStatus } from '@/types/story';
// NarrationControls disabled - narration feature temporarily disabled
// import NarrationControls from '@/components/narration/NarrationControls';
import { computeWordCount } from '@/utils/wordCount';
import { getWorldElementsForScene, findWorldElementByName } from '@/lib/world/worldLinkHelper';
import WorldElementTooltip from '@/components/world/WorldElementTooltip';
import { useRouter } from 'next/navigation';
import { StoryStorage } from '@/lib/storage/storyStorage';
import ConsistencyPanel from '@/components/analysis/ConsistencyPanel';
import type { ConsistencyIssue } from '@/lib/analysis/consistencyChecker';
import SprintTimer from '@/components/writing/SprintTimer';
import WritingRoom from '@/components/collaboration/WritingRoom';
import SceneInsights from '@/components/analysis/SceneInsights';
import BranchingTool from '@/components/experiment/BranchingTool';

// Component to display word count (memoized for performance)
function SceneWordCount({ content }: { content: string }) {
  const wordCount = useMemo(() => computeWordCount(content), [content]);
  return (
    <span className="text-xs text-gray-400 flex items-center gap-1">
      <FileText className="w-3 h-3" />
      {wordCount.toLocaleString()} words
    </span>
  );
}

interface StoryCanvasProps {
  initialStory?: Story;
  onStoryChange?: (story: Story) => void;
}

export default function StoryCanvas({
  initialStory,
  onStoryChange,
}: StoryCanvasProps) {
  const router = useRouter();
  
  // Load story from storage or use initialStory
  const loadStory = (): Story => {
    const savedStory = StoryStorage.loadStory();
    const savedScenes = StoryStorage.loadScenes();
    
    if (savedStory) {
      // Use saved story but ensure scenes are loaded
      return {
        ...savedStory,
        scenes: savedScenes.length > 0 ? savedScenes : savedStory.scenes,
      };
    }
    
    if (initialStory) {
      return initialStory;
    }
    
    // Default empty story
    return {
      id: 'story-1',
      title: 'Untitled Story',
      scenes: [],
      characters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const [story, setStory] = useState<Story>(() => {
    const baseStory = loadStory();
    
    // Ensure backward compatibility: add default status and wordCount to existing scenes
    const scenesWithDefaults = baseStory.scenes.map(scene => ({
      ...scene,
      status: scene.status || 'draft',
      wordCount: scene.wordCount ?? computeWordCount(scene.content),
    }));
    
    return {
      ...baseStory,
      scenes: scenesWithDefaults,
    };
  });
  
  // Reload story when storage changes (e.g., after import)
  useEffect(() => {
    const reloadStory = () => {
      const loaded = loadStory();
      const scenesWithDefaults = loaded.scenes.map(scene => ({
        ...scene,
        status: scene.status || 'draft',
        wordCount: scene.wordCount ?? computeWordCount(scene.content),
      }));
      setStory({
        ...loaded,
        scenes: scenesWithDefaults,
      });
    };

    // Listen for storage changes
    const handleStorageChange = () => {
      reloadStory();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check periodically for changes (for same-tab updates)
    // Use longer interval to reduce interference with navigation
    const interval = setInterval(reloadStory, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const [expandedNarration, setExpandedNarration] = useState<string | null>(null);
  const [highlightedContent, setHighlightedContent] = useState<Record<string, string>>({});
  const [expandedMetadata, setExpandedMetadata] = useState<Record<string, boolean>>({});
  const [showConsistencyPanel, setShowConsistencyPanel] = useState(false);
  const [showSprintTimer, setShowSprintTimer] = useState(false);
  const [showWritingRoom, setShowWritingRoom] = useState(false);
  const [insightsSceneId, setInsightsSceneId] = useState<string | null>(null);
  const [showBranchingTool, setShowBranchingTool] = useState(false);

  const handleIssueClick = (issue: ConsistencyIssue) => {
    if (issue.sceneId) {
      const sceneElement = document.getElementById(`scene-${issue.sceneId}`);
      if (sceneElement) {
        sceneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the scene briefly
        sceneElement.classList.add('ring-2', 'ring-yellow-500');
        setTimeout(() => {
          sceneElement.classList.remove('ring-2', 'ring-yellow-500');
        }, 2000);
      }
    }
  };

  // Save story to storage whenever it changes
  useEffect(() => {
    if (story && story.scenes.length > 0) {
      StoryStorage.saveStory(story);
      StoryStorage.saveScenes(story.scenes);
    }
  }, [story]);

  const addScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: 'New Scene',
      content: '',
      position: story.scenes.length,
      emotion: 'neutral',
      status: 'draft',
      wordCount: 0,
      createdAt: new Date(),
    };

    const updated = {
      ...story,
      scenes: [...story.scenes, newScene],
      updatedAt: new Date(),
    };

    setStory(updated);
    onStoryChange?.(updated);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...story, title: e.target.value, updatedAt: new Date() };
    setStory(updated);
    onStoryChange?.(updated);
  };

  return (
    <div className="w-full">
      {/* Story Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-gray-700">
        <input
          type="text"
          value={story.title}
          onChange={handleTitleChange}
          className="text-3xl font-bold bg-transparent border-none outline-none text-white w-full"
          placeholder="Story Title"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{story.scenes.length} scenes</span>
            <span>•</span>
            <span>{story.characters.length} characters</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWritingRoom(!showWritingRoom)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                showWritingRoom
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="Collaborative Writing Room"
            >
              <Users className="w-4 h-4" />
              Collaborate
            </button>
            <button
              onClick={() => setShowSprintTimer(!showSprintTimer)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                showSprintTimer
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="Writing Sprint Timer"
            >
              <Timer className="w-4 h-4" />
              Sprint
            </button>
            <button
              onClick={() => setShowConsistencyPanel(!showConsistencyPanel)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                showConsistencyPanel
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="Consistency Checker"
            >
              <AlertTriangle className="w-4 h-4" />
              Consistency
            </button>
          </div>
          {/* Narration disabled - feature temporarily disabled */}
          {/* {story.scenes.length > 0 && (
            <button
              onClick={() => {
                const allText = story.scenes.map(s => s.content).join('\n\n');
                if (allText.trim()) {
                  setExpandedNarration('story');
                }
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg flex items-center gap-2 transition-colors"
              title="Narrate entire story"
            >
              <Volume2 className="w-4 h-4" />
              Narrate Story
            </button>
          )} */}
        </div>
      </div>

      {/* Narration disabled - feature temporarily disabled */}
      {/* Story-wide narration panel commented out */}

      {/* Scenes List */}
      <div className="space-y-4">
        <AnimatePresence>
          {story.scenes.map((scene) => (
            <motion.div
              key={scene.id}
              id={`scene-${scene.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden"
            >
              <div className="p-4 bg-gray-800/50 border-b border-gray-700">
                {/* Header Row */}
                <div className="flex items-center gap-4 mb-2">
                  <GripVertical size={20} className="text-gray-500 cursor-grab" />
                  <input
                    type="text"
                    value={scene.title}
                    onChange={(e) => {
                      const updatedScenes = story.scenes.map((s) =>
                        s.id === scene.id ? { ...s, title: e.target.value } : s
                      );
                      const updated = { ...story, scenes: updatedScenes, updatedAt: new Date() };
                      setStory(updated);
                      onStoryChange?.(updated);
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-lg font-semibold text-white"
                    placeholder="Scene Title"
                  />
                  <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 capitalize">
                    {scene.emotion}
                  </span>
                  {/* Narration disabled - feature temporarily disabled */}
                  {/* <button
                    onClick={() => {
                      if (expandedNarration === scene.id) {
                        setExpandedNarration(null);
                      } else {
                        setExpandedNarration(scene.id);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                    title="Narrate this scene"
                    aria-label="Narrate scene"
                  >
                    <Volume2 size={16} />
                  </button> */}
                  <button
                    onClick={() => {
                      const updatedScenes = story.scenes.filter((s) => s.id !== scene.id);
                      const updated = { ...story, scenes: updatedScenes, updatedAt: new Date() };
                      setStory(updated);
                      onStoryChange?.(updated);
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    aria-label="Delete scene"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* Metadata Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status Badge */}
                  <select
                    value={scene.status}
                    onChange={(e) => {
                      const updatedScenes = story.scenes.map((s) =>
                        s.id === scene.id ? { ...s, status: e.target.value as SceneStatus } : s
                      );
                      const updated = { ...story, scenes: updatedScenes, updatedAt: new Date() };
                      setStory(updated);
                      onStoryChange?.(updated);
                    }}
                    className={`text-xs px-2 py-1 rounded font-medium border transition-colors ${
                      scene.status === 'draft'
                        ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300'
                        : scene.status === 'revised'
                        ? 'bg-blue-900/30 border-blue-700/50 text-blue-300'
                        : 'bg-green-900/30 border-green-700/50 text-green-300'
                    }`}
                  >
                    <option value="draft">Draft</option>
                    <option value="revised">Revised</option>
                    <option value="final">Final</option>
                  </select>
                  
                  {/* Word Count */}
                  <SceneWordCount content={scene.content} />
                  
                  {/* POV Character */}
                  {scene.povCharacter && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {scene.povCharacter}
                    </span>
                  )}
                  
                  {/* Location with World Element Link */}
                  {scene.location && (() => {
                    const worldElement = findWorldElementByName(scene.location, 'location');
                    const linkedElements = getWorldElementsForScene(scene);
                    const allLinkedElements = worldElement && !linkedElements.some(e => e.id === worldElement.id)
                      ? [...linkedElements, worldElement]
                      : linkedElements;
                    
                    return (
                      <WorldElementTooltip elements={allLinkedElements}>
                        <button
                          onClick={() => worldElement && router.push('/dashboard/world')}
                          className={`text-xs flex items-center gap-1 transition-colors ${
                            worldElement
                              ? 'text-blue-400 hover:text-blue-300 cursor-pointer'
                              : 'text-gray-400'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          {scene.location}
                          {worldElement && <ExternalLink className="w-2.5 h-2.5" />}
                        </button>
                      </WorldElementTooltip>
                    );
                  })()}
                  
                  {/* Metadata Toggle */}
                  <button
                    onClick={() => {
                      setExpandedMetadata({
                        ...expandedMetadata,
                        [scene.id]: !expandedMetadata[scene.id],
                      });
                    }}
                    className="ml-auto text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                  >
                    {expandedMetadata[scene.id] ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show Details
                      </>
                    )}
                  </button>
                </div>
                
                {/* Expanded Metadata */}
                {expandedMetadata[scene.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-gray-700 space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {/* POV Character */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">POV Character</label>
                        <input
                          type="text"
                          value={scene.povCharacter || ''}
                          onChange={(e) => {
                            const updatedScenes = story.scenes.map((s) =>
                              s.id === scene.id ? { ...s, povCharacter: e.target.value || undefined } : s
                            );
                            const updated = { ...story, scenes: updatedScenes, updatedAt: new Date() };
                            setStory(updated);
                            onStoryChange?.(updated);
                          }}
                          placeholder="Character name..."
                          className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-700 rounded text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      {/* Location */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Location</label>
                        <input
                          type="text"
                          value={scene.location || ''}
                          onChange={(e) => {
                            const updatedScenes = story.scenes.map((s) =>
                              s.id === scene.id ? { ...s, location: e.target.value || undefined } : s
                            );
                            const updated = { ...story, scenes: updatedScenes, updatedAt: new Date() };
                            setStory(updated);
                            onStoryChange?.(updated);
                          }}
                          placeholder="Scene location..."
                          className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-700 rounded text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="p-4">
                {/* Narration disabled - feature temporarily disabled */}
                {/* {expandedNarration === scene.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <NarrationControls
                      text={scene.content}
                      onHighlightChange={(html) => {
                        if (html === scene.content) {
                          const newHighlighted = { ...highlightedContent };
                          delete newHighlighted[scene.id];
                          setHighlightedContent(newHighlighted);
                        } else {
                          setHighlightedContent({ ...highlightedContent, [scene.id]: html });
                        }
                      }}
                    />
                  </motion.div>
                )} */}
                
                {/* Scene Content */}
                <div className="relative">
                  {/* Highlighted overlay when narrating */}
                  {highlightedContent[scene.id] && expandedNarration === scene.id ? (
                    <div
                      className="w-full bg-gray-900/50 rounded p-3 text-gray-300 border border-gray-700 min-h-[100px] whitespace-pre-wrap pointer-events-none absolute inset-0 z-10"
                      dangerouslySetInnerHTML={{ __html: highlightedContent[scene.id] }}
                    />
                  ) : null}
                  
                  {/* Editable textarea (always present, behind highlight when narrating) */}
                  <textarea
                    value={scene.content}
                    onChange={(e) => {
                      const wordCount = computeWordCount(e.target.value);
                      const updatedScenes = story.scenes.map((s) =>
                        s.id === scene.id ? { ...s, content: e.target.value, wordCount, updatedAt: new Date() } : s
                      );
                      const updated = { ...story, scenes: updatedScenes, updatedAt: new Date() };
                      setStory(updated);
                      onStoryChange?.(updated);
                      // Clear highlight when content changes
                      if (highlightedContent[scene.id]) {
                        const newHighlighted = { ...highlightedContent };
                        delete newHighlighted[scene.id];
                        setHighlightedContent(newHighlighted);
                      }
                    }}
                    className="w-full bg-gray-900/50 rounded p-3 text-gray-300 border border-gray-700 focus:border-blue-500 outline-none min-h-[100px] resize-y"
                    placeholder="Write your scene here..."
                    style={{
                      opacity: highlightedContent[scene.id] && expandedNarration === scene.id ? 0 : 1,
                    }}
                  />
                  
                  {/* Scene Insights Button */}
                  {scene.content.trim() && (
                    <button
                      onClick={() => setInsightsSceneId(insightsSceneId === scene.id ? null : scene.id)}
                      className="absolute top-2 right-2 p-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors z-20"
                      title="Scene Insights"
                    >
                      <Brain className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Scene Insights Panel */}
                <AnimatePresence>
                  {insightsSceneId === scene.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <SceneInsights
                        scene={scene}
                        onClose={() => setInsightsSceneId(null)}
                        onApplySuggestion={(suggestion, rewrittenText) => {
                          // Apply rewrite to scene
                          const updatedScenes = story.scenes.map((s) =>
                            s.id === scene.id
                              ? { ...s, content: rewrittenText, updatedAt: new Date() }
                              : s
                          );
                          const updated = { ...story, scenes: updatedScenes, updatedAt: new Date() };
                          setStory(updated);
                          onStoryChange?.(updated);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Scene Button */}
        {story.scenes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
            <p className="text-gray-400 mb-4">No scenes yet. Start creating your story!</p>
            <button
              onClick={addScene}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add First Scene
            </button>
          </div>
        ) : (
          <button
            onClick={addScene}
            className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-all inline-flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Scene
          </button>
        )}
      </div>

      {/* Writing Room */}
      <AnimatePresence>
        {showWritingRoom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <WritingRoom
              story={story}
              userId={StoryStorage.getGuestSessionId() || 'guest-' + Date.now()}
              userName={`Guest ${(StoryStorage.getGuestSessionId() || '').substring(0, 4)}`}
              onClose={() => setShowWritingRoom(false)}
              onStoryUpdate={(updatedStory) => {
                setStory(updatedStory);
                onStoryChange?.(updatedStory);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sprint Timer */}
      <AnimatePresence>
        {showSprintTimer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <SprintTimer
              initialContent=""
              onContentChange={(content) => {
                // Content from sprint timer can be saved separately
                // or integrated into the story scenes
              }}
              onClose={() => setShowSprintTimer(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consistency Panel */}
      <AnimatePresence>
        {showConsistencyPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <ConsistencyPanel
              storyId={story.id}
              onIssueClick={handleIssueClick}
              autoRefresh={true}
              refreshInterval={5000}
            />
          </motion.div>
        )}

        {/* Branching Tool */}
        {showBranchingTool && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-4 bg-gray-800 rounded-lg border border-gray-700 z-50 overflow-y-auto"
          >
            <div className="p-6">
              <BranchingTool
                story={story}
                onStoryUpdate={(updated) => {
                  setStory(updated);
                  onStoryChange?.(updated);
                }}
                onClose={() => setShowBranchingTool(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
