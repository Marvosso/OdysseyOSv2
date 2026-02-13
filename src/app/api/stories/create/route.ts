/**
 * Create story API route
 *
 * POST /api/stories/create
 * - Authenticates via Supabase (JWT in Authorization header)
 * - Checks user_profiles tier and story count (never trusts client tier)
 * - Returns 403 if free tier and story count >= limit
 * - Inserts story into Supabase on success
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, parseJsonBody } from '@/lib/api/response';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return createErrorResponse(
        { code: 'UNAUTHORIZED', message: 'Authorization required' },
        { statusCode: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(
        { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
        { statusCode: 401 }
      );
    }

    const db = getSupabaseServiceClient();
    if (!db) {
      return createErrorResponse(
        { code: 'SERVICE_UNAVAILABLE', message: 'Server configuration error' },
        { statusCode: 503 }
      );
    }

    const [{ count: storyCount }, profileResult] = await Promise.all([
      db.from('stories').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      db.from('user_profiles').select('tier, story_limit').eq('id', user.id).maybeSingle(),
    ]);

    const tier = profileResult.data?.tier ?? 'free';
    const storyLimit =
      typeof profileResult.data?.story_limit === 'number' && profileResult.data.story_limit >= 0
        ? profileResult.data.story_limit
        : 3;

    if (tier === 'free' && (storyCount ?? 0) >= storyLimit) {
      return createErrorResponse(
        { code: 'FORBIDDEN', message: 'Free tier limit reached' },
        { statusCode: 403 }
      );
    }

    const body = await parseJsonBody<{ title?: string; id?: string }>(request);
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled';
    const id =
      typeof body.id === 'string' && body.id.trim()
        ? body.id.trim()
        : `story-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const { error: insertError } = await db.from('stories').insert({
      id,
      user_id: user.id,
      title,
      summary: '',
      word_count: 0,
      status: 'draft',
      metadata: {},
      cloud_updated_at: new Date().toISOString(),
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return createErrorResponse(
          { code: 'CONFLICT', message: 'Story with this id already exists' },
          { statusCode: 409 }
        );
      }
      console.error('[api/stories/create] Insert error:', insertError);
      return createErrorResponse(
        { code: 'STORAGE_ERROR', message: 'Failed to create story' },
        { statusCode: 500 }
      );
    }

    return createSuccessResponse(
      { id, title },
      { statusCode: 201 }
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes('Invalid JSON')) {
      return createErrorResponse(
        { code: 'BAD_REQUEST', message: e.message },
        { statusCode: 400 }
      );
    }
    console.error('[api/stories/create] Error:', e);
    return createErrorResponse(
      { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      { statusCode: 500 }
    );
  }
}
