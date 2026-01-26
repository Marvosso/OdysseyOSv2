/**
 * Next.js Middleware
 * 
 * Global middleware for API routes
 * Handles rate limiting, CORS, and request logging
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
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
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
 * Only run middleware on API routes
 */
export const config = {
  matcher: '/api/:path*',
};
