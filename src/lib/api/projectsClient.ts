/**
 * Client for /api/projects - list, create, get, update
 * Call with Supabase session token for auth.
 */

export interface ProjectMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  templateUsed: string;
}

export interface ProjectFull {
  id: string;
  title: string;
  content: Record<string, unknown>;
  outline: Record<string, unknown>;
  templateUsed: string;
  createdAt: string;
  updatedAt: string;
}

async function getToken(): Promise<string | null> {
  const { supabase } = await import('@/lib/supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ success: true; data: T } | { success: false; error: { code: string; message: string } }> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not signed in' } };
  }
  const res = await fetch(path, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error?.message ?? res.statusText ?? 'Request failed';
    return { success: false, error: { code: String(json?.error?.code ?? res.status), message } };
  }
  return { success: true, data: json.data as T };
}

export async function fetchProjects(): Promise<ProjectMeta[]> {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const result = await api<ProjectMeta[]>(`${base}/api/projects`);
  return result.success ? result.data : [];
}

export type CreateProjectResult =
  | { success: true; data: ProjectFull }
  | { success: false; error: { code: string; message: string } };

export async function createProject(title: string = 'Untitled'): Promise<CreateProjectResult> {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const result = await api<ProjectFull>(`${base}/api/projects`, {
    method: 'POST',
    body: { title },
  });
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}

export async function fetchProject(id: string): Promise<ProjectFull | null> {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const result = await api<ProjectFull>(`${base}/api/projects/${encodeURIComponent(id)}`);
  return result.success ? result.data : null;
}

export async function updateProject(
  id: string,
  payload: { title?: string; content?: unknown; outline?: unknown; templateUsed?: string }
): Promise<boolean> {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const result = await api<unknown>(`${base}/api/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
  });
  return result.success;
}

export async function deleteProject(id: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const token = await getToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not signed in' } };
  const res = await fetch(`${base}/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: { code: String(json?.error?.code ?? res.status), message: json?.error?.message ?? res.statusText } };
  }
  return { success: true };
}
