/**
 * TTS Webhook - Receives callbacks from Ainnate when TTS completes
 * Register URL at ttsopenai.com/profile/integration/webhooks
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

type WebhookPayload = {
  event?: string;
  data?: {
    uuid?: string;
    job_id?: string;
    status?: string | number;
    media_url?: string;
    audio_url?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebhookPayload;
    const data = body?.data;
    const jobId = data?.job_id ?? data?.uuid;
    const status = data?.status;
    const audioUrl = data?.audio_url ?? data?.media_url ?? null;

    if (!jobId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const db = getSupabaseServiceClient();
    if (!db) {
      logError("TTS webhook: no Supabase client", new Error("Config"));
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const isCompleted =
      status === "completed" ||
      status === 2 ||
      body?.event === "TTS_TEXT_SUCCESS";

    if (isCompleted && audioUrl) {
      const { error } = await db
        .from("tts_jobs")
        .update({
          status: "completed",
          media_url: audioUrl,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq("job_uuid", jobId);

      if (error) {
        logError("TTS webhook: update failed", new Error(error.message), { job_id: jobId });
      }
    } else if (body?.event === "TTS_TEXT_FAILED" || status === "failed" || status === 3) {
      const errMsg = (data as { error_message?: string })?.error_message ?? "TTS conversion failed";
      await db
        .from("tts_jobs")
        .update({
          status: "failed",
          error_message: errMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("job_uuid", jobId);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    logError("TTS webhook failed", e);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
