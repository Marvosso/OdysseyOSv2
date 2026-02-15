/**
 * POST /api/feedback - Submit beta feedback
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    let body: { message?: unknown; rating?: unknown; email?: unknown; page?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const message = body?.message;
    if (typeof message !== "string" || !message.trim()) {
      return Response.json(
        { error: "message is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    let rating: number | null = null;
    if (body?.rating != null) {
      const r = Number(body.rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return Response.json(
          { error: "rating must be an integer between 1 and 5." },
          { status: 400 }
        );
      }
      rating = r;
    }

    const email = typeof body?.email === "string" ? body.email.trim() || null : null;
    const page = typeof body?.page === "string" ? body.page.trim() || null : null;

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    let userId: string | null = null;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const db = getSupabaseServiceClient();
    if (!db) {
      return Response.json(
        { error: "Server configuration error." },
        { status: 503 }
      );
    }

    const { error } = await db.from("feedback").insert({
      user_id: userId,
      email,
      rating,
      message: message.trim(),
      page,
    });

    if (error) {
      console.error("[feedback] insert failed:", error.message);
      return Response.json(
        { error: "Failed to save feedback." },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("[feedback] route error:", err);
    return Response.json(
      { error: "An error occurred." },
      { status: 500 }
    );
  }
}
