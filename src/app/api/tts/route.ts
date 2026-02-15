/**
 * TTS API - AI Innate / TTSOpenAI (api.ttsopenai.com)
 * POST /api/tts - Create TTS job; returns { uuid } for async webhook flow
 * Auth: Bearer token required
 * Request: { text: string, voice?: "us-male" | "us-female" | "uk-male" | "uk-female" }
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 10;

const VALID_VOICES = ['us-male', 'us-female', 'uk-male', 'uk-female'] as const;
type ClientVoice = (typeof VALID_VOICES)[number];

const TTSOPENAI_VOICE_MAP: Record<ClientVoice, string> = {
  'us-male': 'OA001',
  'us-female': 'OA002',
  'uk-male': 'OA003',
  'uk-female': 'OA004',
};

const MAX_TEXT_LENGTH = 10000;
const AINNATE_API_BASE = 'https://api.ttsopenai.com/uapi/v1';
const UPSTREAM_TIMEOUT_MS = 10_000;

export async function POST(request: NextRequest) {
  try {
    const apiKey =
      process.env.AINNATE_API_KEY ??
      process.env.TTSOPENAI_API_KEY ??
      process.env.OPENAPI_API_KEY;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      console.error('[TTS] AINNATE_API_KEY is missing or empty');
      return NextResponse.json(
        { error: 'TTS is not configured. Set AINNATE_API_KEY in environment.' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const db = getSupabaseServiceClient();
    if (!db) {
      console.error('[TTS] Supabase service client unavailable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 503 }
      );
    }

    const { data: profile } = await db
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle();
    const tier = (profile?.tier ?? 'free') as string;
    if (tier === 'free') {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
    }

    let body: { text?: unknown; voice?: unknown };
    try {
      body = (await request.json()) as { text?: unknown; voice?: unknown };
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const text = body?.text;
    const voice = body?.voice ?? 'uk-female';

    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Missing or invalid text. Body must be { text: string, voice?: string }.' },
        { status: 400 }
      );
    }

    const trimmedInput = text.trim();
    if (trimmedInput.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const voiceId = VALID_VOICES.includes(voice as ClientVoice)
      ? TTSOPENAI_VOICE_MAP[voice as ClientVoice]
      : TTSOPENAI_VOICE_MAP['uk-female'];

    const payload = {
      model: 'tts-1',
      input: trimmedInput,
      voice_id: voiceId,
      speed: 1,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let createRes: Response;
    try {
      createRes = await fetch(`${AINNATE_API_BASE}/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      console.error('[TTS] Upstream fetch failed:', msg);
      logError('TTS upstream fetch failed', fetchErr instanceof Error ? fetchErr : new Error(msg), {
        user_id: user.id,
        timeout: isTimeout,
      });
      return NextResponse.json(
        {
          error: isTimeout
            ? 'TTS service timed out. Please try again.'
            : 'TTS service unavailable.',
          upstream_error: msg,
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!createRes.ok) {
      let errText: string;
      try {
        errText = await createRes.text();
      } catch {
        errText = '';
      }
      const safeErrText = errText.slice(0, 500);
      console.error('[TTS] Upstream error:', createRes.status, safeErrText);
      logError('TTS upstream error', new Error(`Status ${createRes.status}: ${safeErrText}`), {
        user_id: user.id,
        status: createRes.status,
      });

      let userMessage = 'TTS generation failed.';
      try {
        const errJson = JSON.parse(errText) as {
          detail?: { message?: string; error_code?: string };
          message?: string;
          error?: string;
        };
        const msg =
          errJson?.detail?.message ?? errJson?.message ?? errJson?.error;
        if (typeof msg === 'string' && msg.length > 0) userMessage = msg;
        else if (errJson?.detail?.error_code === 'API_KEY_NOT_FOUND')
          userMessage = 'Invalid TTS API key.';
        else if (errJson?.detail?.error_code === 'NOT_ENOUGH_CREDIT')
          userMessage = 'Insufficient TTS credits.';
        else if (errJson?.detail?.error_code === 'PREMIUM_PLAN_REQUIRED')
          userMessage = 'TTS Premium plan required.';
      } catch {
        /* use default userMessage */
      }

      return NextResponse.json(
        {
          error: userMessage,
          upstream_status: createRes.status,
          upstream_response: safeErrText,
        },
        { status: 502 }
      );
    }

    let createData: { result?: { uuid?: string } };
    try {
      createData = (await createRes.json()) as { result?: { uuid?: string } };
    } catch (parseErr) {
      console.error('[TTS] Failed to parse upstream JSON:', parseErr);
      return NextResponse.json(
        { error: 'Invalid response from TTS service.' },
        { status: 502 }
      );
    }

    const uuid = createData?.result?.uuid;
    if (!uuid || typeof uuid !== 'string') {
      console.error('[TTS] No uuid in upstream response:', JSON.stringify(createData).slice(0, 300));
      logError('TTS no uuid in response', new Error(JSON.stringify(createData).slice(0, 300)), {
        user_id: user.id,
      });
      return NextResponse.json(
        { error: 'TTS service did not return a task ID.' },
        { status: 502 }
      );
    }

    const { error: insertErr } = await db
      .from('tts_jobs')
      .upsert(
        { job_uuid: uuid, user_id: user.id, status: 'pending' },
        { onConflict: 'job_uuid' }
      );

    if (insertErr) {
      console.error('[TTS] Failed to store job:', insertErr.message);
      logError('TTS failed to store job', new Error(insertErr.message), { user_id: user.id });
      return NextResponse.json(
        { error: 'Failed to register TTS job. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ uuid });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[TTS] Route exception:', msg);
    logError('TTS route exception', e instanceof Error ? e : new Error(msg));
    return NextResponse.json(
      { error: 'An error occurred while generating speech.' },
      { status: 500 }
    );
  }
}
