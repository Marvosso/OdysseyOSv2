/**
 * TTS API - Async flow
 * POST /api/tts - Accept { text, voice? }, call Ainnate, return { job_id }
 */
import { supabase } from "@/lib/supabaseClient";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const AINNATE_TTS_URL = process.env.AINNATE_TTS_URL ?? "https://api.ttsopenai.com/uapi/v1/text-to-speech";
const UPSTREAM_TIMEOUT_MS = 8_000;

const VALID_VOICES = ["onyx", "nova"] as const;
type ClientVoice = (typeof VALID_VOICES)[number];
const DEFAULT_VOICE: ClientVoice = "nova";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return Response.json({ error: "Authorization required" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const db = getSupabaseServiceClient();
    if (db) {
      const { data: profile } = await db
        .from("user_profiles")
        .select("tier")
        .eq("id", user.id)
        .maybeSingle();
      const tier = (profile?.tier ?? "free") as string;
      if (tier === "free") {
        return Response.json({ error: "Upgrade required" }, { status: 403 });
      }
    }

    const apiKey = process.env.AINNATE_API_KEY ?? process.env.TTSOPENAI_API_KEY;
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      console.error("[TTS] AINNATE_API_KEY is missing");
      return Response.json(
        { error: "TTS is not configured. Set AINNATE_API_KEY." },
        { status: 503 }
      );
    }

    let body: { text?: unknown; voice?: unknown };
    try {
      body = (await req.json()) as { text?: unknown; voice?: unknown };
    } catch {
      return Response.json(
        { error: "Invalid JSON body. Expected { text: string, voice?: string }." },
        { status: 400 }
      );
    }

    const text = body?.text;
    if (typeof text !== "string" || !text.trim()) {
      return Response.json(
        { error: "Missing or invalid text. Body must be { text: string }." },
        { status: 400 }
      );
    }

    const trimmedInput = text.trim();
    if (trimmedInput.length > 10000) {
      return Response.json(
        { error: "Text exceeds 10,000 characters." },
        { status: 400 }
      );
    }

    const rawVoice = body?.voice;
    const voiceKey =
      typeof rawVoice === "string" && rawVoice.trim()
        ? rawVoice.trim().toLowerCase()
        : "";
    const voice: ClientVoice =
      voiceKey === "onyx" || voiceKey === "nova" ? voiceKey : DEFAULT_VOICE;

    console.log("[TTS] selected voice:", voice);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(AINNATE_TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          input: trimmedInput,
          voice,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === "AbortError";
      console.error("[TTS] Upstream fetch failed:", msg);
      return Response.json(
        {
          error: isTimeout ? "TTS service timed out." : "TTS service unavailable.",
          upstream_error: msg,
        },
        { status: 502 }
      );
    }
    clearTimeout(timeoutId);

    if (!upstreamRes.ok) {
      let errText = "";
      try {
        errText = await upstreamRes.text();
      } catch {
        /* ignore */
      }
      const safeErr = errText.slice(0, 500);
      console.error("[TTS] Upstream error:", upstreamRes.status, safeErr);
      return Response.json(
        {
          error: "TTS generation failed.",
          upstream_status: upstreamRes.status,
          upstream_response: safeErr,
        },
        { status: 502 }
      );
    }

    let json: { result?: { uuid?: string }; job_id?: string };
    try {
      json = (await upstreamRes.json()) as { result?: { uuid?: string }; job_id?: string };
    } catch {
      return Response.json(
        { error: "Invalid JSON from TTS service. No job_id returned." },
        { status: 502 }
      );
    }

    const jobId = json?.job_id ?? json?.result?.uuid;
    if (!jobId || typeof jobId !== "string") {
      console.error("[TTS] No job_id in upstream response:", JSON.stringify(json).slice(0, 300));
      return Response.json(
        { error: "TTS service did not return a job_id." },
        { status: 502 }
      );
    }

    if (db) {
      await db
        .from("tts_jobs")
        .upsert(
          { job_uuid: jobId, user_id: user.id, status: "pending" },
          { onConflict: "job_uuid" }
        );
    }

    return Response.json({ job_id: jobId });
  } catch (err) {
    console.error("[TTS] Route crashed:", err);
    return Response.json(
      { error: "An error occurred while generating speech." },
      { status: 500 }
    );
  }
}
