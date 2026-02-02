'use client';

/**
 * Backup/Restore Interface
 * 
 * Allows users to create encrypted backups and restore from them
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Upload,
  Trash2,
  Lock,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AccountStorage, type BackupMetadata } from '@/lib/storage/accountStorage';
import { StoryStorage } from '@/lib/storage/storyStorage';

interface BackupRestoreProps {
  onClose?: () => void;
}

export default function BackupRestore({ onClose }: BackupRestoreProps) {
  const [backups, setBackups] = useState<Array<BackupMetadata & { data?: any }>>([]);
  const [showCreateBackup, setShowCreateBackup] = useState(false);
  const [showRestore, setShowRestore] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    const loaded = AccountStorage.getBackups();
    setBackups(loaded);
  };

  const handleCreateBackup = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const backup = await AccountStorage.createBackup(
        password,
        backupDescription || undefined
      );
      
      setSuccess(`Backup created successfully: ${backup.id}`);
      setPassword('');
      setBackupDescription('');
      setShowCreateBackup(false);
      loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (!confirm('Are you sure you want to restore this backup? This will overwrite your current data.')) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      await AccountStorage.restoreBackup(backupId, password);
      setSuccess('Backup restored successfully! Reloading...');
      setPassword('');
      setShowRestore(null);
      
      // Reload page after restore
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    try {
      const updated = backups.filter((b) => b.id !== backupId);
      localStorage.setItem(
        'odysseyos_backup_metadata',
        JSON.stringify(updated)
      );
      loadBackups();
      setSuccess('Backup deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete backup');
    }
  };

  const handleExportBackup = (backup: BackupMetadata & { data?: any }) => {
    if (!backup.data) {
      setError('Backup data not available');
      return;
    }

    try {
      const exportData = {
        ...backup,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `odysseyos-backup-${backup.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Backup exported');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export backup');
    }
  };

  const handleImportBackup = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate backup structure
        if (!data.id || !data.data) {
          setError('Invalid backup file');
          return;
        }

        // Add to backups
        const backups = AccountStorage.getBackups();
        backups.push(data);
        localStorage.setItem(
          'odysseyos_backup_metadata',
          JSON.stringify(backups)
        );
        
        loadBackups();
        setSuccess('Backup imported successfully');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import backup');
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            Backup & Restore
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Create encrypted backups and restore your stories
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-200 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:bg-red-900/30 rounded"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-200 text-sm">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto p-1 hover:bg-green-900/30 rounded"
            >
              <X className="w-4 h-4 text-green-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCreateBackup(true)}
          className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-5 h-5" />
          Create Backup
        </button>
        <label className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          Import Backup
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportBackup(file);
            }}
          />
        </label>
      </div>

      {/* Create Backup Dialog */}
      <AnimatePresence>
        {showCreateBackup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-4"
          >
            <h4 className="text-white font-semibold">Create Encrypted Backup</h4>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
              <input
                type="text"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="e.g., Before major rewrite"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Encryption Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password to encrypt backup"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-600 rounded"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This password encrypts your backup. You'll need it to restore.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateBackup}
                disabled={isProcessing || !password.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
              >
                {isProcessing ? 'Creating...' : 'Create Backup'}
              </button>
              <button
                onClick={() => {
                  setShowCreateBackup(false);
                  setPassword('');
                  setBackupDescription('');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backups List */}
      <div className="space-y-3">
        <h4 className="text-white font-semibold">Your Backups</h4>
        
        {backups.length === 0 ? (
          <div className="p-8 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No backups yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first backup to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <h5 className="text-white font-semibold">
                        {backup.description || 'Backup'}
                      </h5>
                      {backup.encrypted && (
                        <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 text-xs rounded">
                          Encrypted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(backup.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        {(backup.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportBackup(backup)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Export backup"
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setShowRestore(backup.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Restore backup"
                    >
                      <Upload className="w-4 h-4 text-purple-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Delete backup"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Restore Dialog */}
                <AnimatePresence>
                  {showRestore === backup.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-700 space-y-3"
                    >
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Enter Password to Restore
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Backup encryption password"
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-600 rounded"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestore(backup.id)}
                          disabled={isProcessing || !password.trim()}
                          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                        >
                          {isProcessing ? 'Restoring...' : 'Restore Backup'}
                        </button>
                        <button
                          onClick={() => {
                            setShowRestore(null);
                            setPassword('');
                          }}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
