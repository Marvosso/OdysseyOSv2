'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Sparkles } from 'lucide-react';
import type { ProjectMeta } from '@/lib/api/projectsClient';
import { deleteProject } from '@/lib/api/projectsClient';

interface ProjectLimitModalProps {
  open: boolean;
  onClose: () => void;
  projects: ProjectMeta[];
  onUpgrade: () => void;
  onRetry: () => void;
  onCancel: () => void;
  /** Call after delete so parent can refresh project list before retry */
  onProjectsChanged?: () => void;
}

export default function ProjectLimitModal({
  open,
  onClose,
  projects,
  onUpgrade,
  onRetry,
  onCancel,
  onProjectsChanged,
}: ProjectLimitModalProps) {
  const [step, setStep] = useState<'main' | 'delete-list' | 'confirm'>('main');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedProject = selectedId ? projects.find((p) => p.id === selectedId) : null;

  useEffect(() => {
    if (open) {
      setStep('main');
      setSelectedId(null);
      setDeleteError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleDeleteProject = async () => {
    if (!selectedId) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteProject(selectedId);
    setDeleting(false);
    if (result.success) {
      setStep('main');
      setSelectedId(null);
      onProjectsChanged?.();
      onRetry();
      onClose();
    } else {
      setDeleteError(result.error?.message ?? 'Failed to delete project');
    }
  };

  const handleCancelDelete = () => {
    setStep('main');
    setSelectedId(null);
    setDeleteError(null);
  };

  const handleConfirmDeleteClick = () => {
    if (selectedId) setStep('confirm');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={step === 'main' ? onCancel : step === 'confirm' ? () => setStep('delete-list') : handleCancelDelete}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-limit-modal-title"
    >
      <div
        className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {step === 'main' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="project-limit-modal-title"
                  className="text-xl font-bold text-white flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Project Limit Reached
                </h2>
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-300 mb-6">
                Free users can save up to 2 projects. To save this project, upgrade to Pro or delete an existing project.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onUpgrade}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Upgrade to Pro
                </button>
                <button
                  onClick={() => setStep('delete-list')}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete a Project
                </button>
                <button
                  onClick={onCancel}
                  className="px-4 py-2.5 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : step === 'confirm' && selectedProject ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Confirm delete</h2>
                <button
                  onClick={() => setStep('delete-list')}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Back"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-300 mb-4">
                Delete &quot;{selectedProject.title || 'Untitled'}&quot;? This cannot be undone.
              </p>
              {deleteError && <p className="text-red-400 text-sm mb-3">{deleteError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  onClick={() => setStep('delete-list')}
                  className="px-4 py-2.5 text-gray-400 hover:text-white transition-colors"
                >
                  Back
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Delete a project</h2>
                <button
                  onClick={handleCancelDelete}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Back"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {projects.length === 0 ? (
                <p className="text-gray-400 text-sm mb-4">No projects to delete.</p>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-3">Select a project to delete. This cannot be undone.</p>
                  <ul className="space-y-1 mb-4 max-h-48 overflow-y-auto">
                    {projects.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedId === p.id ? 'bg-red-600/30 text-white border border-red-500/50' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-transparent'
                          }`}
                        >
                          {p.title || 'Untitled'}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {deleteError && (
                    <p className="text-red-400 text-sm mb-3">{deleteError}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirmDeleteClick}
                      disabled={!selectedId}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Delete selected
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="px-4 py-2.5 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
