/**
 * TTSOpenAI webhook - receives callbacks when TTS jobs complete
 * Register URL at https://ttsopenai.com/profile/integration/webhooks
 * Events: TTS_TEXT_SUCCESS, TTS_TEXT_FAILED
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';

type WebhookPayload = {
  event?: string;
  data?: {
    uuid?: string;
    status?: number;
    media_url?: string;
    error_message?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebhookPayload;
    const event = body?.event;
    const data = body?.data;
    const uuid = data?.uuid;

    if (!uuid) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const db = getSupabaseServiceClient();
    if (!db) {
      logError('TTS webhook: no Supabase client', new Error('Config'));
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (event === 'TTS_TEXT_SUCCESS') {
      const mediaUrl = data?.media_url ?? null;
      const { error } = await db
        .from('tts_jobs')
        .update({
          status: 'completed',
          media_url: mediaUrl,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('job_uuid', uuid);

      if (error) {
        logError('TTS webhook: update failed', new Error(error.message), { job_uuid: uuid });
      }
    } else if (event === 'TTS_TEXT_FAILED') {
      const errMsg = data?.error_message ?? 'TTS conversion failed';
      const { error } = await db
        .from('tts_jobs')
        .update({
          status: 'failed',
          error_message: errMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('job_uuid', uuid);

      if (error) {
        logError('TTS webhook: update failed', new Error(error.message), { job_uuid: uuid });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    logError('TTS webhook failed', e);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
