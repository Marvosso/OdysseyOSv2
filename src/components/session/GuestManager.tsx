'use client';

/**
 * Guest Manager Component
 * 
 * Manages guest session: displays ID, allows backup/restore, and future account claiming
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Download, Upload, UserPlus, Check, AlertCircle, X, Cloud, CloudUpload, CloudDownload } from 'lucide-react';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { cloudSync } from '@/lib/cloud/minimalCloudSync';

interface GuestManagerProps {
  guestId: string;
  onGuestIdChange?: (newId: string) => void;
  /** When true (e.g. user is logged in via Supabase), hide the "Claim as Account" migration prompt */
  hideClaimAccount?: boolean;
}

export default function GuestManager({ guestId, onGuestIdChange, hideClaimAccount = false }: GuestManagerProps) {
  const [copied, setCopied] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showCloudLoad, setShowCloudLoad] = useState(false);
  const [cloudStories, setCloudStories] = useState<Array<{ id: string; title: string }>>([]);
  const [loadingCloudList, setLoadingCloudList] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => cloudSync.getLastSyncTime());

  // Copy guest ID to clipboard
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(guestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Export session data as JSON file
  const handleSaveSession = () => {
    try {
      const jsonData = StoryStorage.exportGuestData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `odysseyos-backup-${guestId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export session:', error);
    }
  };

  // Restore session from JSON backup
  const handleRestoreSession = async () => {
    if (!restoreText.trim()) {
      setRestoreError('Please paste your backup JSON data');
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(false);

    try {
      const result = StoryStorage.importGuestData(null, restoreText);
      
      if (result.success) {
        setRestoreSuccess(true);
        setRestoreText('');
        // Notify parent of potential guest ID change
        const newId = StoryStorage.getGuestSessionId();
        if (newId && onGuestIdChange) {
          onGuestIdChange(newId);
        }
        // Reload page after a short delay to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setRestoreError(result.error || 'Failed to restore backup');
      }
    } catch (error) {
      setRestoreError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle file upload for restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRestoreText(text);
      }
    };
    reader.onerror = () => {
      setRestoreError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const ok = await cloudSync.syncStory();
      setSyncMessage(ok ? 'Synced to cloud.' : 'Sync failed (check console).');
      setLastSync(cloudSync.getLastSyncTime());
      if (ok) setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenCloudLoad = async () => {
    setShowCloudLoad(true);
    setLoadingCloudList(true);
    try {
      const list = await cloudSync.getCloudStories();
      setCloudStories(list.map((s: { id: string; title: string }) => ({ id: s.id, title: s.title || 'Untitled' })));
    } finally {
      setLoadingCloudList(false);
    }
  };

  const handleLoadFromCloud = async (storyId: string) => {
    setIsRestoring(true);
    setSyncMessage(null);
    try {
      const ok = await cloudSync.loadStoryFromCloud(storyId);
      setSyncMessage(ok ? 'Loaded from cloud. Reloading...' : 'Load failed.');
      if (ok) setTimeout(() => window.location.reload(), 1500);
    } finally {
      setIsRestoring(false);
    }
  };

  // Claim as Account - opens migration wizard
  const handleClaimAccount = () => {
    // This will be handled by the parent component
    // For now, we'll trigger a custom event
    window.dispatchEvent(new CustomEvent('odysseyos:open-migration'));
  };

  return (
    <div className="space-y-4">
      {/* Session / backup ID */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-400">{hideClaimAccount ? 'Session ID' : 'Guest Session ID'}</label>
          <button
            onClick={handleCopyId}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="font-mono text-lg font-bold text-purple-400 tracking-wider">
          {guestId}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Save this ID to restore your session later, or download a backup below.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Save Session */}
        <button
          onClick={handleSaveSession}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Download className="w-5 h-5" />
          Save Session
        </button>

        {/* Restore Session */}
        <button
          onClick={() => setShowRestore(!showRestore)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          <Upload className="w-5 h-5" />
          Restore Session
        </button>
      </div>

      {/* Restore Input */}
      <AnimatePresence>
        {showRestore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Restore from Backup</h3>
              <button
                onClick={() => {
                  setShowRestore(false);
                  setRestoreText('');
                  setRestoreError(null);
                  setRestoreSuccess(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Upload backup file:</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
              />
            </div>

            <div className="text-center text-gray-500 text-sm">or</div>

            {/* Text Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Paste backup JSON:</label>
              <textarea
                value={restoreText}
                onChange={(e) => {
                  setRestoreText(e.target.value);
                  setRestoreError(null);
                  setRestoreSuccess(false);
                }}
                placeholder="Paste your backup JSON data here..."
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm min-h-[120px]"
              />
            </div>

            {/* Error Message */}
            {restoreError && (
              <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{restoreError}</p>
              </div>
            )}

            {/* Success Message */}
            {restoreSuccess && (
              <div className="flex items-start gap-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-200">Backup restored successfully! Reloading...</p>
              </div>
            )}

            {/* Restore Button */}
            <button
              onClick={handleRestoreSession}
              disabled={isRestoring || !restoreText.trim()}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isRestoring ? 'Restoring...' : 'Restore Backup'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud sync - when signed in */}
      {hideClaimAccount && (
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-purple-400" />
            Cloud sync
          </h3>
          <p className="text-xs text-gray-400">
            Push your current project to the cloud or load a project from the cloud.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CloudUpload className="w-4 h-4" />
              {isSyncing ? 'Syncing...' : 'Sync to cloud'}
            </button>
            <button
              onClick={() => setShowCloudLoad(!showCloudLoad)}
              onFocus={showCloudLoad ? undefined : handleOpenCloudLoad}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CloudDownload className="w-4 h-4" />
              Load from cloud
            </button>
          </div>
          {lastSync && (
            <p className="text-xs text-gray-500">Last synced: {new Date(lastSync).toLocaleString()}</p>
          )}
          {syncMessage && (
            <p className="text-sm text-purple-300">{syncMessage}</p>
          )}
          <AnimatePresence>
            {showCloudLoad && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 space-y-2"
              >
                {loadingCloudList ? (
                  <p className="text-sm text-gray-400">Loading list...</p>
                ) : cloudStories.length === 0 ? (
                  <p className="text-sm text-gray-400">No stories in cloud.</p>
                ) : (
                  <ul className="space-y-1">
                    {cloudStories.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => handleLoadFromCloud(s.id)}
                          className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white truncate"
                        >
                          {s.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Claim as Account - hidden when user is already logged in */}
      {!hideClaimAccount && (
        <button
          onClick={handleClaimAccount}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-lg font-medium transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Claim as Account (Coming Soon)
        </button>
      )}
    </div>
  );
}
