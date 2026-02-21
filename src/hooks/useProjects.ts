'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { fetchProjects, createProject, fetchProject } from '@/lib/api/projectsClient';
import type { ProjectMeta } from '@/lib/api/projectsClient';

export interface CreateProjectOutcome {
  success: true;
  id: string;
}
export interface CreateProjectLimitReached {
  success: false;
  error: { code: 'PROJECT_LIMIT_REACHED'; message: string };
}
export interface CreateProjectOtherError {
  success: false;
  error: { code: string; message: string };
}

export type CreateNewProjectResult = CreateProjectOutcome | CreateProjectLimitReached | CreateProjectOtherError;

export interface UseProjectsResult {
  projects: ProjectMeta[];
  loading: boolean;
  activeProjectId: string | null;
  switchProject: (id: string) => Promise<boolean>;
  createNewProject: (title?: string) => Promise<CreateNewProjectResult>;
  refreshProjects: () => Promise<void>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const activeProjectId = StoryStorage.getActiveProjectId();

  const refreshProjects = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setUser(session.user as { id: string });
    const list = await fetchProjects();
    setProjects(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        setProjects([]);
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(session.user as { id: string });
      const list = await fetchProjects();
      if (cancelled) return;
      setProjects(list);
      setLoading(false);
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshProjects();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [refreshProjects]);

  const switchProject = useCallback(async (id: string): Promise<boolean> => {
    const full = await fetchProject(id);
    if (!full) return false;
    StoryStorage.loadProjectIntoStorage(full);
    return true;
  }, []);

  const createNewProject = useCallback(async (title: string = 'Untitled'): Promise<CreateNewProjectResult> => {
    const result = await createProject(title);
    if (!result.success) return { success: false, error: result.error };
    const project = result.data;
    StoryStorage.loadProjectIntoStorage(project);
    setProjects((prev) => [
      {
        id: project.id,
        title: project.title,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        templateUsed: project.templateUsed,
      },
      ...prev,
    ]);
    return { success: true, id: project.id };
  }, []);

  return {
    projects,
    loading,
    activeProjectId,
    switchProject,
    createNewProject,
    refreshProjects,
  };
}
