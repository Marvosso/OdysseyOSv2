/**
 * GET /api/tts/audio?uuid=... - Proxy TTS audio (avoids CORS)
 * Requires auth; returns audio when job is completed
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
    .select('status, media_url')
    .eq('job_uuid', uuid.trim())
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  if (job.status !== 'completed' || !job.media_url) {
    return NextResponse.json({ error: 'Audio not ready yet' }, { status: 202 });
  }

  const audioRes = await fetch(job.media_url);
  if (!audioRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 502 });
  }

  const contentType = audioRes.headers.get('content-type') || 'audio/mpeg';
  return new NextResponse(audioRes.body ?? undefined, {
    status: 200,
    headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
  });
}
