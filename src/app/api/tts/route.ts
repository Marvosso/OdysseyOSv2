/**
 * TTS API - TTSOpenAI (docs: https://docs-tts.ainnate.com/getting-started)
 * POST /api/tts - Generate speech from text using TTSOpenAI (api.ttsopenai.com)
 * Auth: x-api-key header, key from tts.ainnate.com (tts-...)
 * Request: { text: string, voice: "us-male" | "us-female" | "uk-male" | "uk-female" }
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';

const VALID_VOICES = ['us-male', 'us-female', 'uk-male', 'uk-female'] as const;
type ClientVoice = (typeof VALID_VOICES)[number];

/** TTSOpenAI voice_id per https://docs-tts.ainnate.com/resources/tts-text - see Voice Library at ttsopenai.com */
const TTSOPENAI_VOICE_MAP: Record<ClientVoice, string> = {
  'us-male': 'OA001',
  'us-female': 'OA002',
  'uk-male': 'OA003',
  'uk-female': 'OA004',
};

const MAX_TEXT_LENGTH = 10000; // per docs: max 10,000 chars
const TTSOPENAI_BASE = 'https://api.ttsopenai.com/uapi/v1'; // docs-tts.ainnate.com

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/tts/route.ts:20',message:'TTS route entered',data:{hasAuth:!!request.headers.get('authorization')},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/tts/route.ts:26',message:'TTS 401 - no auth token',data:{},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const db = getSupabaseServiceClient();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
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

    const body = await request.json();
    const { text, voice } = body as { text?: unknown; voice?: unknown };

    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Missing or invalid text. Body must be { text: string, voice: "us-male" | "us-female" | "uk-male" | "uk-female" }.' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (!VALID_VOICES.includes(voice as ClientVoice)) {
      return NextResponse.json(
        { error: 'Invalid voice. Must be one of: us-male, us-female, uk-male, uk-female.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TTSOPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      logError('TTS: API key not set', new Error('Config missing'));
      return NextResponse.json(
        { error: 'TTS is not configured. Set TTSOPENAI_API_KEY (tts-... key from tts.ainnate.com).' },
        { status: 503 }
      );
    }
    if (!apiKey.startsWith('tts-')) {
      return NextResponse.json(
        { error: 'TTS requires a tts- API key from tts.ainnate.com. Set TTSOPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    const trimmedInput = text.trim();
    {
      // TTSOpenAI / Ainnate (tts.ainnate.com, api.ttsopenai.com) - uses x-api-key header
      const voiceId = TTSOPENAI_VOICE_MAP[voice as ClientVoice];
      const createRes = await fetch(`${TTSOPENAI_BASE}/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice_id: voiceId,
          speed: 1,
          input: trimmedInput,
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        logError('TTS TTSOpenAI request failed', new Error(`Status ${createRes.status}: ${errText.slice(0, 200)}`), { user_id: user.id });
        let userMessage = 'TTS generation failed.';
        try {
          const errJson = JSON.parse(errText) as { detail?: { message?: string; error_code?: string }; message?: string; error?: string };
          const msg = errJson?.detail?.message ?? errJson?.message ?? errJson?.error;
          if (typeof msg === 'string' && msg.length > 0) userMessage = msg;
          else if (errJson?.detail?.error_code === 'API_KEY_NOT_FOUND') userMessage = 'Invalid TTS API key. Check your key at tts.ainnate.com.';
          else if (errJson?.detail?.error_code === 'NOT_ENOUGH_CREDIT') userMessage = 'Insufficient TTS credits. Top up at tts.ainnate.com.';
        } catch {
          /* ignore */
        }
        return NextResponse.json({ error: userMessage }, { status: 502 });
      }

      const createData = (await createRes.json()) as { success?: boolean; result?: { uuid?: string; status?: number; media_url?: string } };
      const uuid = createData?.result?.uuid;
      if (!uuid) {
        logError('TTS TTSOpenAI no uuid in response', new Error(JSON.stringify(createData).slice(0, 200)), { user_id: user.id });
        return NextResponse.json({ error: 'TTS service did not return a task ID.' }, { status: 502 });
      }

      // Poll for result (TTSOpenAI is async; status 2 = Completed)
      // Keep under Vercel Hobby 10s timeout: ~2s POST + 12*0.5s = ~8s
      const maxAttempts = 12;
      const pollIntervalMs = 500;
      const resultPaths = [`/result/${uuid}`, `/text-to-speech/result/${uuid}`];
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        let resultRes: Response | null = null;
        for (const path of resultPaths) {
          resultRes = await fetch(`${TTSOPENAI_BASE}${path}`, {
            headers: { 'x-api-key': apiKey },
          });
          if (resultRes.ok) break;
        }
        if (!resultRes || !resultRes.ok) continue;
        const resultData = (await resultRes.json()) as { success?: boolean; result?: { status?: number; media_url?: string; error_message?: string } };
        const status = resultData?.result?.status;
        if (status === 2) {
          const mediaUrl = resultData?.result?.media_url;
          if (mediaUrl) {
            const audioRes = await fetch(mediaUrl);
            if (audioRes.ok) {
              const contentType = audioRes.headers.get('content-type') || 'audio/mpeg';
              return new NextResponse(audioRes.body ?? undefined, {
                status: 200,
                headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
              });
            }
          }
          break;
        }
        if (status === 3) {
          const errMsg = resultData?.result?.error_message ?? 'TTS conversion failed.';
          return NextResponse.json({ error: errMsg }, { status: 502 });
        }
      }
      return NextResponse.json({
        error: 'TTS conversion timed out. Per docs-tts.ainnate.com, set up webhooks at tts.ainnate.com/profile/integration/webhook for async results.',
      }, { status: 502 });
    }
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/tts/route.ts:118',message:'TTS route exception → 500',data:{errorMsg:e instanceof Error?e.message:String(e)},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    logError('TTS failed', e);
    return NextResponse.json(
      { error: 'An error occurred while generating speech.' },
      { status: 500 }
    );
  }
}
