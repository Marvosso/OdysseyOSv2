'use client';

import { createContext, useContext } from 'react';
import { useProjects, type UseProjectsResult } from '@/hooks/useProjects';

const ProjectsContext = createContext<UseProjectsResult | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const value = useProjects();
  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjectsContext(): UseProjectsResult | null {
  return useContext(ProjectsContext);
}
