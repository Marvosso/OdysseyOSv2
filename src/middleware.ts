/**
 * Next.js Middleware
 * 
 * Global middleware for API routes and auth redirects
 * Handles rate limiting, CORS, request logging, and authenticated user redirects
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, RateLimitConfigs } from '@/lib/api/rateLimit';

/**
 * Middleware configuration
 */
const middlewareConfig = {
  // API routes to apply middleware to
  apiRoutes: ['/api'],
  
  // Rate limit configuration per route pattern
  rateLimits: {
    '/api/session': RateLimitConfigs.strict,
    '/api/stories': RateLimitConfigs.standard,
    default: RateLimitConfigs.standard,
  },
};

/**
 * Check if path matches API routes
 */
function isApiRoute(pathname: string): boolean {
  return middlewareConfig.apiRoutes.some(route => pathname.startsWith(route));
}

/**
 * Get rate limit config for path
 */
function getRateLimitConfig(pathname: string) {
  for (const [pattern, rateLimitConfig] of Object.entries(middlewareConfig.rateLimits)) {
    if (pathname.startsWith(pattern)) {
      return rateLimitConfig;
    }
  }
  return middlewareConfig.rateLimits.default;
}

/**
 * Check if user has an active Supabase session by checking cookies
 */
function hasSupabaseSession(request: NextRequest): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl) {
    return false;
  }

  // Extract project ref from URL (e.g., https://xxx.supabase.co -> xxx)
  const projectRefMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!projectRefMatch) {
    return false;
  }

  const projectRef = projectRefMatch[1];
  const authCookieName = `sb-${projectRef}-auth-token`;

  // Check if any auth token cookie exists
  const cookies = request.cookies.getAll();
  return cookies.some(cookie => cookie.name.startsWith(authCookieName));
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if authenticated user is trying to access auth page
  if (pathname === '/auth' || pathname.startsWith('/auth/')) {
    if (hasSupabaseSession(request)) {
      // User is authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Not authenticated, allow access to auth page
    return NextResponse.next();
  }

  // Only apply rate limiting to API routes
  if (!isApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Rate limiting
  const rateLimitConfig = getRateLimitConfig(pathname);
  const rateLimit = await checkRateLimit(request, rateLimitConfig);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          ...(rateLimit.retryAfter && {
            'Retry-After': rateLimit.retryAfter.toString(),
          }),
        },
      }
    );
  }

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString());

  // CORS headers (for future use)
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}

/**
 * Middleware matcher
 * Run middleware on API routes and auth page
 */
export const config = {
  matcher: ['/api/:path*', '/auth/:path*'],
};
