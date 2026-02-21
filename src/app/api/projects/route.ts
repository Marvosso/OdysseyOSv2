/**
 * Projects API
 * GET /api/projects - List projects for the current user
 * POST /api/projects - Create a new project (tier limit: free = max 2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, parseJsonBody } from '@/lib/api/response';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { logError, logDbError } from '@/lib/logger';

const FREE_TIER_PROJECT_LIMIT = 2;

async function getUserId(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return createErrorResponse(
      { code: 'UNAUTHORIZED', message: 'Authorization required' },
      { statusCode: 401 }
    ) as NextResponse;
  }
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return createErrorResponse(
      { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      { statusCode: 401 }
    ) as NextResponse;
  }
  return { userId: user.id };
}

/**
 * GET /api/projects - List all projects for the current user
 */
export async function GET(request: NextRequest) {
  const auth = await getUserId(request);
  if (auth instanceof NextResponse) return auth;
  const db = getSupabaseServiceClient();
  if (!db) {
    return createErrorResponse(
      { code: 'SERVICE_UNAVAILABLE', message: 'Server configuration error' },
      { statusCode: 503 }
    );
  }
  const { data, error } = await db
    .from('projects')
    .select('id, title, created_at, updated_at, template_used')
    .eq('user_id', auth.userId)
    .order('updated_at', { ascending: false });
  if (error) {
    logDbError('select', 'projects', error, { user_id: auth.userId });
    return createErrorResponse(
      { code: 'STORAGE_ERROR', message: 'Failed to list projects' },
      { statusCode: 500 }
    );
  }
  return createSuccessResponse(
    data.map((p) => ({
      id: p.id,
      title: p.title,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      templateUsed: p.template_used ?? '',
    }))
  );
}

/**
 * POST /api/projects - Create a new project (does not overwrite existing)
 * Enforces tier limit server-side: FREE = max 2 projects.
 */
export async function POST(request: NextRequest) {
  const auth = await getUserId(request);
  if (auth instanceof NextResponse) return auth;
  const db = getSupabaseServiceClient();
  if (!db) {
    return createErrorResponse(
      { code: 'SERVICE_UNAVAILABLE', message: 'Server configuration error' },
      { statusCode: 503 }
    );
  }

  const [countResult, profileResult] = await Promise.all([
    db.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', auth.userId),
    db.from('user_profiles').select('tier').eq('id', auth.userId).maybeSingle(),
  ]);
  const tier = (profileResult.data?.tier as string) ?? 'free';
  const count = countResult.count ?? 0;
  if (tier === 'free' && count >= FREE_TIER_PROJECT_LIMIT) {
    return createErrorResponse(
      { code: 'PROJECT_LIMIT_REACHED', message: 'Free users can save up to 2 projects. Upgrade to Pro or delete an existing project.' },
      { statusCode: 403 }
    );
  }

  const body = await parseJsonBody<{ title?: string }>(request).catch(() => ({}));
  const title =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled';

  const now = new Date().toISOString();
  const { data: project, error } = await db
    .from('projects')
    .insert({
      user_id: auth.userId,
      title,
      content: {},
      outline: {},
      template_used: '',
      created_at: now,
      updated_at: now,
    })
    .select('id, title, content, outline, template_used, created_at, updated_at')
    .single();

  if (error) {
    logDbError('insert', 'projects', error, { user_id: auth.userId });
    return createErrorResponse(
      { code: 'STORAGE_ERROR', message: 'Failed to create project' },
      { statusCode: 500 }
    );
  }

  return createSuccessResponse(
    {
      id: project.id,
      title: project.title,
      content: project.content ?? {},
      outline: project.outline ?? {},
      templateUsed: project.template_used ?? '',
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    },
    { statusCode: 201 }
  );
}
