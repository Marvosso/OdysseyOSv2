'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { Scene, Story } from '@/types/story';

interface StoryCanvasProps {
  initialStory?: Story;
  onStoryChange?: (story: Story) => void;
}

export default function StoryCanvas({
  initialStory,
  onStoryChange,
}: StoryCanvasProps) {
  const [story, setStory] = useState<Story>(
    initialStory || {
      id: 'story-1',
      title: 'Untitled Story',
      scenes: [],
      characters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  const addScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: 'New Scene',
      content: '',
      position: story.scenes.length,
      emotion: 'neutral',
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
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
          <span>{story.scenes.length} scenes</span>
          <span>•</span>
          <span>{story.characters.length} characters</span>
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-4">
        <AnimatePresence>
          {story.scenes.map((scene) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden"
            >
              <div className="p-4 bg-gray-800/50 border-b border-gray-700 flex items-center gap-4">
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
              <div className="p-4">
                <textarea
                  value={scene.content}
                  onChange={(e) => {
                    const updatedScenes = story.scenes.map((s) =>
                      s.id === scene.id ? { ...s, content: e.target.value } : s
                    );
                    const updated = { ...story, scenes: updatedScenes, updatedAt: new Date() };
                    setStory(updated);
                    onStoryChange?.(updated);
                  }}
                  className="w-full bg-gray-900/50 rounded p-3 text-gray-300 border border-gray-700 focus:border-blue-500 outline-none min-h-[100px] resize-y"
                  placeholder="Write your scene here..."
                />
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
    </div>
  );
}
