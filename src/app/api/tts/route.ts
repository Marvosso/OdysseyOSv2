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

const TTS_MODEL = 'gpt-4o-mini-tts';
const MAX_TEXT_LENGTH = 4096;

export async function POST(request: NextRequest) {
  try {
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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logError('TTS: OPENAI_API_KEY not set', new Error('Config missing'));
      return NextResponse.json(
        { error: 'TTS is not configured.' },
        { status: 503 }
      );
    }

    const openaiVoice = OPENAI_VOICE_MAP[voice as ClientVoice];
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: text.trim(),
        voice: openaiVoice,
        response_format: 'mp3',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logError('TTS OpenAI request failed', new Error(`Status ${res.status}: ${errText.slice(0, 200)}`), { user_id: user.id });
      return NextResponse.json(
        { error: 'TTS generation failed.' },
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
    logError('TTS failed', e);
    return NextResponse.json(
      { error: 'An error occurred while generating speech.' },
      { status: 500 }
    );
  }
}
