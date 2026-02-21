/**
 * Single project API
 * GET /api/projects/[id] - Get full project (for loading into editor)
 * PATCH /api/projects/[id] - Update project (auto-save: title, content, outline, template_used)
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, parseJsonBody } from '@/lib/api/response';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { logError, logDbError } from '@/lib/logger';

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
 * GET /api/projects/[id] - Get full project (content + outline)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getUserId(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await context.params;
  if (!id) {
    return createErrorResponse(
      { code: 'BAD_REQUEST', message: 'Project id required' },
      { statusCode: 400 }
    );
  }
  const db = getSupabaseServiceClient();
  if (!db) {
    return createErrorResponse(
      { code: 'SERVICE_UNAVAILABLE', message: 'Server configuration error' },
      { statusCode: 503 }
    );
  }
  const { data, error } = await db
    .from('projects')
    .select('id, title, content, outline, template_used, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .single();
  if (error || !data) {
    if (error?.code === 'PGRST116') {
      return createErrorResponse(
        { code: 'NOT_FOUND', message: 'Project not found' },
        { statusCode: 404 }
      );
    }
    logDbError('select', 'projects', error, { user_id: auth.userId, project_id: id });
    return createErrorResponse(
      { code: 'STORAGE_ERROR', message: 'Failed to get project' },
      { statusCode: 500 }
    );
  }
  return createSuccessResponse({
    id: data.id,
    title: data.title,
    content: data.content ?? {},
    outline: data.outline ?? {},
    templateUsed: data.template_used ?? '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}

/**
 * PATCH /api/projects/[id] - Update project (partial: title, content, outline, template_used)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getUserId(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await context.params;
  if (!id) {
    return createErrorResponse(
      { code: 'BAD_REQUEST', message: 'Project id required' },
      { statusCode: 400 }
    );
  }
  const db = getSupabaseServiceClient();
  if (!db) {
    return createErrorResponse(
      { code: 'SERVICE_UNAVAILABLE', message: 'Server configuration error' },
      { statusCode: 503 }
    );
  }
  let body: { title?: string; content?: unknown; outline?: unknown; templateUsed?: string };
  try {
    body = await parseJsonBody(request);
  } catch {
    return createErrorResponse(
      { code: 'BAD_REQUEST', message: 'Invalid JSON body' },
      { statusCode: 400 }
    );
  }
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };
  if (typeof body.title === 'string') update.title = body.title.trim() || 'Untitled';
  if (body.content !== undefined) update.content = body.content;
  if (body.outline !== undefined) update.outline = body.outline;
  if (typeof body.templateUsed === 'string') update.template_used = body.templateUsed;

  const { data, error } = await db
    .from('projects')
    .update(update)
    .eq('id', id)
    .eq('user_id', auth.userId)
    .select('id, title, updated_at')
    .single();
  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse(
        { code: 'NOT_FOUND', message: 'Project not found' },
        { statusCode: 404 }
      );
    }
    logDbError('update', 'projects', error, { user_id: auth.userId, project_id: id });
    return createErrorResponse(
      { code: 'STORAGE_ERROR', message: 'Failed to update project' },
      { statusCode: 500 }
    );
  }
  return createSuccessResponse({ id: data.id, title: data.title, updatedAt: data.updated_at });
}

/**
 * DELETE /api/projects/[id] - Delete a project
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getUserId(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await context.params;
  if (!id) {
    return createErrorResponse(
      { code: 'BAD_REQUEST', message: 'Project id required' },
      { statusCode: 400 }
    );
  }
  const db = getSupabaseServiceClient();
  if (!db) {
    return createErrorResponse(
      { code: 'SERVICE_UNAVAILABLE', message: 'Server configuration error' },
      { statusCode: 503 }
    );
  }
  const { error } = await db
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.userId);
  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse(
        { code: 'NOT_FOUND', message: 'Project not found' },
        { statusCode: 404 }
      );
    }
    logDbError('delete', 'projects', error, { user_id: auth.userId, project_id: id });
    return createErrorResponse(
      { code: 'STORAGE_ERROR', message: 'Failed to delete project' },
      { statusCode: 500 }
    );
  }
  return createSuccessResponse({ deleted: true });
}
