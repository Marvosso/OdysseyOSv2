/**
 * GET /api/tts/status?job_id=... - Poll TTS job status (auth required)
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return Response.json({ error: "Authorization required" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("job_id");
  if (!jobId?.trim()) {
    return Response.json({ error: "Missing job_id" }, { status: 400 });
  }

  const db = getSupabaseServiceClient();
  if (!db) {
    return Response.json({ error: "Server configuration error" }, { status: 503 });
  }

  const { data: job, error } = await db
    .from("tts_jobs")
    .select("status, media_url")
    .eq("job_uuid", jobId.trim())
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  if (!job) {
    return Response.json({ status: "processing" });
  }

  if (job.status === "completed" && job.media_url) {
    return Response.json({
      status: "completed",
      audio_url: job.media_url,
    });
  }

  if (job.status === "failed") {
    return Response.json({ status: "failed" });
  }

  return Response.json({ status: "processing" });
}
