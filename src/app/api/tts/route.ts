import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';

const VALID_VOICES = ['us-male', 'us-female', 'uk-male', 'uk-female'] as const;
type ClientVoice = (typeof VALID_VOICES)[number];

/** Map client voice ids to OpenAI TTS voice names */
const OPENAI_VOICE_MAP: Record<ClientVoice, string> = {
  'us-male': 'onyx',
  'us-female': 'nova',
  'uk-male': 'echo',
  'uk-female': 'fable',
};

const TTS_MODEL_PRIMARY = 'gpt-4o-mini-tts';
const TTS_MODEL_FALLBACK = 'tts-1-hd';
const MAX_TEXT_LENGTH = 4096;

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

    const apiKey = process.env.OPENAI_API_KEY ?? process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      logError('TTS: OPENAI_API_KEY not set', new Error('Config missing'));
      return NextResponse.json(
        { error: 'TTS is not configured.' },
        { status: 503 }
      );
    }

    const openaiVoice = OPENAI_VOICE_MAP[voice as ClientVoice];
    const trimmedInput = text.trim();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/tts/route.ts:82',message:'Calling OpenAI TTS',data:{voice:openaiVoice,textLen:trimmedInput.length,hasApiKey:!!apiKey},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    const tryModel = async (model: string) =>
      fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: trimmedInput,
          voice: openaiVoice,
          response_format: 'mp3',
        }),
      });

    let res = await tryModel(TTS_MODEL_PRIMARY);
    if (!res.ok && res.status === 404) {
      res = await tryModel(TTS_MODEL_FALLBACK);
    }

    if (!res.ok) {
      const errText = await res.text();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af5ba99f-ac6d-4d74-90ad-b7fd9297bb22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/tts/route.ts:99',message:'OpenAI TTS returned non-OK → 502',data:{openaiStatus:res.status,openaiErrorPreview:errText.slice(0,500)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      logError('TTS OpenAI request failed', new Error(`Status ${res.status}: ${errText.slice(0, 200)}`), { user_id: user.id });
      // Parse OpenAI error for user-friendly message (avoid exposing full API response)
      let userMessage = 'TTS generation failed.';
      try {
        const errJson = JSON.parse(errText) as { error?: { message?: string }; message?: string };
        const msg = errJson?.error?.message ?? errJson?.message;
        if (typeof msg === 'string' && msg.length > 0) userMessage = msg;
      } catch {
        /* ignore parse errors */
      }
      return NextResponse.json(
        { error: userMessage },
        { status: 502 }
      );
    }

    const contentType = res.headers.get('content-type') || 'audio/mpeg';
    return new NextResponse(res.body ?? undefined, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
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
