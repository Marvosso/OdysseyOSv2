import { NextResponse } from 'next/server';

/**
 * Returns current deploy/build id. Always no-store so the client can detect new deploys.
 * Vercel sets VERCEL_GIT_COMMIT_SHA; fallback to build time for local.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function GET() {
  const build =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    `build-${Date.now()}`;
  return NextResponse.json(
    { build },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    }
  );
}
