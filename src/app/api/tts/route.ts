import { NextRequest, NextResponse } from 'next/server';

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
      console.error('[TTS] OPENAI_API_KEY is not set');
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
      console.error('[TTS] OpenAI error:', res.status, errText);
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
    console.error('[TTS] Error:', e);
    return NextResponse.json(
      { error: 'An error occurred while generating speech.' },
      { status: 500 }
    );
  }
}
