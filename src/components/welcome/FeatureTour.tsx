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
  X,
  Info,
  ExternalLink,
  PenLine,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Feature {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  tier: 'free' | 'pro' | 'studio';
  shortDescription: string;
  detailedDescription: string;
  features?: string[];
}

function TierBadge({ tier }: { tier: Feature['tier'] }) {
  const styles = {
    free: 'bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    pro: 'bg-indigo-100 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/50',
    studio: 'bg-amber-100 dark:bg-amber-600/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/50',
  };
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles[tier]}`}
      title={`Available on ${label} plan`}
    >
      {label}
    </span>
  );
}

const features: Feature[] = [
  {
    id: 'stories',
    label: 'Stories',
    icon: BookOpen,
    path: '/dashboard',
    tier: 'free',
    shortDescription: 'Manage your project and chapters: add, reorder, and open chapters for editing.',
    detailedDescription: 'The Stories tab is your project hub. See your current story and a read-only list of all chapters with title, status, word count, and a short preview. Add, delete, or reorder chapters with drag-and-drop. Click a chapter to open it in the Writer tab for focused editing.',
    features: [
      'Chapter list with status and word count',
      'Short preview of each chapter',
      'Add, delete, and reorder chapters',
      'Click a chapter to open in Writer',
    ],
  },
  {
    id: 'writer',
    label: 'Writer',
    icon: PenLine,
    path: '/dashboard/writer',
    tier: 'free',
    shortDescription: 'Full-screen focused editing for one chapter at a time.',
    detailedDescription: 'The Writer tab gives you a distraction-free editing experience. Edit the current chapter with a full-width editor, collapsible side panels for characters and world elements, word count, and previous/next chapter navigation. Changes autosave as you type.',
    features: [
      'Full-width, full-screen text editor',
      'Editable chapter title',
      'Collapsible panels: Characters, World, Notes',
      'Word count and chapter progress (e.g. Chapter 3 of 10)',
      'Back to Stories, Previous/Next chapter',
      'Autosave on typing (debounced)',
      'Optional TTS playback for the chapter',
    ],
  },
  {
    id: 'characters',
    label: 'Characters',
    icon: Users,
    path: '/dashboard/characters',
    tier: 'free',
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
    tier: 'pro',
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
    tier: 'free',
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
    tier: 'pro',
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
    tier: 'pro',
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
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    path: '/dashboard/analytics',
    tier: 'pro',
    shortDescription: 'View writing metrics, goals, and productivity insights.',
    detailedDescription: 'Track your writing progress with analytics dashboards. See word count over time, writing speed, time-of-day patterns, and goal projections. Use data to build better writing habits.',
    features: [
      'Word count and writing speed charts',
      'Words per day and time-of-day insights',
      'Goal setting and projections',
      'Writing habit visualization',
    ],
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    path: '/dashboard/export',
    tier: 'free',
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
    tier: 'studio',
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
    tier: 'free',
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
            <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-2xl shadow-card-md dark:shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-600/20 rounded-lg flex-shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{feature.label}</h2>
                      <TierBadge tier={feature.tier} />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">{feature.shortDescription}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{feature.detailedDescription}</p>

                {feature.features && feature.features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Features:</h3>
                    <ul className="space-y-2">
                      {feature.features.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-2 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleNavigate}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors duration-200 font-medium shadow-sm"
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
        <div className="p-3 bg-indigo-100 dark:bg-indigo-600/20 rounded-lg">
          <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feature Tour</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
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
                className="w-full text-left p-6 bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-gray-50/80 dark:hover:bg-gray-800 transition-all duration-200 group shadow-card dark:shadow-none hover:shadow-card-md dark:hover:shadow-none"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-600/20 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-600/30 transition-colors">
                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{feature.label}</h3>
                      <TierBadge tier={feature.tier} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{feature.shortDescription}</p>
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
                    className="hidden md:block absolute z-10 bottom-full left-0 right-0 mb-2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl pointer-events-none"
                  >
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {feature.shortDescription}
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Click for details →</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="mt-8 p-6 bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700 rounded-2xl shadow-card dark:shadow-none">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Getting Started</h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          OdysseyOS is a comprehensive writing platform designed to help you create, organize, and publish your stories. 
          Start by importing an existing story or create a new one in the Stories tab. Use the sidebar to navigate between 
          different features and explore how they can enhance your writing workflow.
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Plans:</span>
          <TierBadge tier="free" />
          <TierBadge tier="pro" />
          <TierBadge tier="studio" />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
            Tip: Hover over any feature for a quick preview
          </span>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
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
