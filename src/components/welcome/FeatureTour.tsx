'use client';

/**
 * Feature Tour Component
 * 
 * Interactive tour showing all OdysseyOS features with tooltips and modals
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  Sparkles,
  FileText,
  Globe,
  BarChart3,
  Download,
  Share2,
  Upload,
  Volume2,
  X,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Feature {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  shortDescription: string;
  detailedDescription: string;
  features?: string[];
}

const features: Feature[] = [
  {
    id: 'stories',
    label: 'Stories',
    icon: BookOpen,
    path: '/dashboard',
    shortDescription: 'Write and organize scenes for your story with real-time editing.',
    detailedDescription: 'The Stories tab is your main writing workspace. Create, edit, and organize scenes with support for narration, scene metadata (status, POV character, location), and word count tracking. Link scenes to world elements and characters for a cohesive narrative.',
    features: [
      'Scene-by-scene writing interface',
      'Real-time word count tracking',
      'Scene status management (Draft, Revised, Final)',
      'POV character and location tracking',
      'Narration support with voice selection',
      'Link scenes to world elements',
    ],
  },
  {
    id: 'characters',
    label: 'Characters',
    icon: Users,
    path: '/dashboard/characters',
    shortDescription: 'Build and manage your story characters with detailed profiles.',
    detailedDescription: 'Create comprehensive character profiles with names, descriptions, motivations, and relationships. Characters are automatically detected during story import and can be linked to scenes and world elements.',
    features: [
      'Character profile builder',
      'Automatic character detection from imported stories',
      'Link characters to scenes and world elements',
      'Character relationship tracking',
    ],
  },
  {
    id: 'ai',
    label: 'AI Tools',
    icon: Sparkles,
    path: '/dashboard/ai',
    shortDescription: 'Leverage AI to analyze story structure and get writing suggestions.',
    detailedDescription: 'Use AI-powered tools to analyze your story structure, detect narrative patterns, and receive intelligent writing suggestions. The AI can help identify pacing issues, character development opportunities, and structural improvements.',
    features: [
      'Story structure analysis',
      'Narrative pattern detection',
      'Writing suggestions and improvements',
      'Pacing and flow analysis',
    ],
  },
  {
    id: 'outline',
    label: 'Outline',
    icon: FileText,
    path: '/dashboard/outline',
    shortDescription: 'Plan your story structure with visual outlines and chapter organization.',
    detailedDescription: 'Build and visualize your story outline with chapters, scenes, and plot points. Organize your narrative structure before writing, or use it to track your progress as you develop your story.',
    features: [
      'Visual story outline builder',
      'Chapter and scene organization',
      'Plot point tracking',
      'Story structure visualization',
    ],
  },
  {
    id: 'world',
    label: 'World Builder',
    icon: Globe,
    path: '/dashboard/world',
    shortDescription: 'Create and manage your story world with locations, cultures, and systems.',
    detailedDescription: 'Build rich, interconnected worlds with locations, cultures, factions, magic systems, and more. Link world elements to scenes and characters to maintain consistency throughout your narrative.',
    features: [
      'Location and culture creation',
      'Magic and technology systems',
      'Political and economic structures',
      'Link world elements to scenes and characters',
      'Consistency tracking',
    ],
  },
  {
    id: 'beats',
    label: 'Beats',
    icon: BarChart3,
    path: '/dashboard/beats',
    shortDescription: 'Track story beats and narrative pacing throughout your story.',
    detailedDescription: 'Visualize and manage story beats to ensure proper pacing and narrative flow. Track key moments, plot points, and emotional arcs across your entire story.',
    features: [
      'Story beat visualization',
      'Pacing analysis',
      'Plot point tracking',
      'Emotional arc management',
    ],
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    path: '/dashboard/export',
    shortDescription: 'Export your story in multiple formats for publishing or sharing.',
    detailedDescription: 'Export your completed story in various formats including PDF, DOCX, EPUB, and plain text. Customize formatting options to match your publishing needs.',
    features: [
      'Multiple export formats (PDF, DOCX, EPUB, TXT)',
      'Customizable formatting',
      'Chapter and scene organization',
      'Metadata inclusion',
    ],
  },
  {
    id: 'publish',
    label: 'Publish',
    icon: Share2,
    path: '/dashboard/publish',
    shortDescription: 'Prepare and publish your story to various platforms.',
    detailedDescription: 'Prepare your story for publication with formatting tools, metadata management, and platform-specific export options. Get your story ready for readers.',
    features: [
      'Publication preparation',
      'Platform-specific formatting',
      'Metadata management',
      'Cover and formatting tools',
    ],
  },
  {
    id: 'import',
    label: 'Import',
    icon: Upload,
    path: '/dashboard/import',
    shortDescription: 'Import existing stories from text files with automatic structure detection.',
    detailedDescription: 'Import your existing stories from .txt or .md files. OdysseyOS automatically detects word count, chapters, scenes, and characters. Preview the parsed structure before importing to ensure accuracy.',
    features: [
      'Upload .txt and .md files',
      'Paste text directly',
      'Automatic word count calculation',
      'Chapter detection with confidence scoring',
      'Scene break detection',
      'Character name detection using heuristics',
      'Preview before importing',
    ],
  },
  {
    id: 'narration',
    label: 'Narration',
    icon: Volume2,
    path: '/dashboard',
    shortDescription: 'Listen to your story with customizable narration and voice selection.',
    detailedDescription: 'Use the Web Speech API to narrate your story with system voices. Select different voices, adjust playback speed, and highlight text as it\'s read. Background music support coming soon.',
    features: [
      'System voice selection',
      'Playback speed control',
      'Real-time text highlighting',
      'Scene and story-wide narration',
      'Background music (coming soon)',
    ],
  },
];

interface FeatureModalProps {
  feature: Feature | null;
  isOpen: boolean;
  onClose: () => void;
}

function FeatureModal({ feature, isOpen, onClose }: FeatureModalProps) {
  const router = useRouter();

  if (!feature) return null;

  const Icon = feature.icon;

  const handleNavigate = () => {
    onClose();
    router.push(feature.path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-700 gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 bg-purple-600/20 rounded-lg flex-shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{feature.label}</h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">{feature.shortDescription}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4">
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{feature.detailedDescription}</p>

                {feature.features && feature.features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Key Features:</h3>
                    <ul className="space-y-2">
                      {feature.features.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={handleNavigate}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <span>Go to {feature.label}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function FeatureTour() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedFeature(null), 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-600/20 rounded-lg">
          <Info className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Feature Tour</h1>
          <p className="text-gray-400 mt-1">
            Explore all the features OdysseyOS has to offer
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isHovered = hoveredFeature === feature.id;

          return (
            <div
              key={feature.id}
              className="relative"
              onMouseEnter={() => setHoveredFeature(feature.id)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Feature Card */}
              <motion.button
                onClick={() => handleFeatureClick(feature)}
                className="w-full text-left p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-purple-500/50 hover:bg-gray-800 transition-all duration-200 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.label}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{feature.shortDescription}</p>
                  </div>
                </div>
              </motion.button>

              {/* Hover Tooltip - Hidden on mobile, shown on desktop */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="hidden md:block absolute z-10 bottom-full left-0 right-0 mb-2 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl pointer-events-none"
                  >
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {feature.shortDescription}
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs text-purple-400 font-medium">Click for details →</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-3">Getting Started</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          OdysseyOS is a comprehensive writing platform designed to help you create, organize, and publish your stories. 
          Start by importing an existing story or create a new one in the Stories tab. Use the sidebar to navigate between 
          different features and explore how they can enhance your writing workflow.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm">
            Tip: Hover over any feature for a quick preview
          </span>
          <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm">
            Tip: Click any feature to learn more
          </span>
        </div>
      </div>

      {/* Modal */}
      <FeatureModal
        feature={selectedFeature}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
