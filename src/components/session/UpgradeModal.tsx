'use client';

import { X, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Shown when the user hits a free-tier limit (e.g. story count). Prompts upgrade.
 */
export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="upgrade-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              Free tier limit reached
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You've reached the maximum number of stories on the free plan. Upgrade to Pro or Studio to create more stories and unlock cloud sync.
          </p>
          <div className="flex gap-3">
            <a
              href="/auth"
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-center transition-colors"
            >
              Upgrade
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
