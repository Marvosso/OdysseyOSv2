/**
 * GET /api/tts/status?uuid=... - Poll TTS job status (auth required)
 * Returns { status, media_url?, error_message? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get('uuid');
  if (!uuid?.trim()) {
    return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });
  }

  const db = getSupabaseServiceClient();
  if (!db) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
  }

  const { data: job, error } = await db
    .from('tts_jobs')
    .select('status, media_url, error_message')
    .eq('job_uuid', uuid.trim())
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    media_url: job.media_url ?? undefined,
    error_message: job.error_message ?? undefined,
  });
}
