/**
 * Export API route
 *
 * POST /api/export
 * - Authenticates via Supabase (JWT in Authorization header)
 * - Fetches tier from user_profiles (never trust client)
 * - If tier === 'free' and format !== 'txt': returns 403
 * - Otherwise generates and returns the requested format
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

type ExportFormat = 'txt' | 'pdf' | 'docx';

interface ExportBody {
  format: ExportFormat;
  story: {
    id: string;
    title: string;
    scenes: Array<{
      id: string;
      title: string;
      content: string;
      position: number;
      emotion?: string;
      status?: string;
    }>;
    characters: Array<{
      id: string;
      name: string;
      description: string;
      goals?: string[];
      flaws?: string[];
    }>;
    createdAt?: string;
    updatedAt?: string;
  };
}

function buildPlainText(story: ExportBody['story']): string {
  const updatedAt = story.updatedAt
    ? new Date(story.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  let content = `${story.title}\n`;
  content += `${'='.repeat(story.title.length)}\n\n`;
  content += `Last Updated: ${updatedAt}\n\n`;

  if (story.characters?.length) {
    content += 'CHARACTERS\n';
    content += `${'-'.repeat(10)}\n\n`;
    story.characters.forEach((char) => {
      content += `${char.name}\n`;
      content += `${char.description ?? ''}\n`;
      if (char.goals?.length) content += `Goals: ${char.goals.join(', ')}\n`;
      if (char.flaws?.length) content += `Flaws: ${char.flaws.join(', ')}\n`;
      content += '\n';
    });
    content += '\n';
  }

  content += 'SCENES\n';
  content += `${'-'.repeat(6)}\n\n`;
  (story.scenes ?? []).forEach((scene, index) => {
    content += `[Scene ${index + 1}: ${scene.title ?? ''}]\n`;
    if (scene.emotion) content += `Emotion: ${scene.emotion}\n\n`;
    content += `${scene.content ?? ''}\n\n`;
    content += `${'-'.repeat(50)}\n\n`;
  });

  return content;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authorization required' } },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    const db = getSupabaseServiceClient();
    if (!db) {
      return NextResponse.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: 'Server configuration error' } },
        { status: 503 }
      );
    }

    const { data: profile } = await db
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle();

    const tier = (profile?.tier as string | undefined) ?? 'free';
    const body = (await request.json()) as ExportBody;
    const format = body?.format ?? 'txt';

    const allowedFormats: ExportFormat[] = ['txt', 'pdf', 'docx'];
    if (!allowedFormats.includes(format)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid format. Use txt, pdf, or docx.' } },
        { status: 400 }
      );
    }

    if (tier === 'free' && format !== 'txt') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'PDF and DOCX export require Pro or Studio.' } },
        { status: 403 }
      );
    }

    if (!body?.story?.title) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing or invalid story in body.' } },
        { status: 400 }
      );
    }

    const story = body.story;

    if (format === 'txt') {
      const text = buildPlainText(story);
      const filename = `${story.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.txt`;
      return new NextResponse(text, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === 'pdf' || format === 'docx') {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'PDF/DOCX generation is not yet implemented.' } },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid format.' } },
      { status: 400 }
    );
  } catch (e) {
    console.error('[api/export] Error:', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred.' } },
      { status: 500 }
    );
  }
}
