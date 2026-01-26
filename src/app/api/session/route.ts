/**
 * Session API Route
 * 
 * GET /api/session - Get current session
 * POST /api/session - Create/login session (placeholder)
 * DELETE /api/session - Logout/invalidate session
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, parseJsonBody } from '@/lib/api/response';
import { checkRateLimit, RateLimitConfigs } from '@/lib/api/rateLimit';
import { getSession, createSession, invalidateSession } from '@/lib/api/session';
import type { Session } from '@/lib/api/session';

/**
 * GET /api/session
 * Get current session
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, RateLimitConfigs.standard);
    if (!rateLimit.allowed) {
      return createErrorResponse(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
        },
        { statusCode: 429 }
      );
    }

    // Get session
    const session = await getSession(request);

    if (!session) {
      return createErrorResponse(
        {
          code: 'UNAUTHORIZED',
          message: 'No active session',
        },
        { statusCode: 401 }
      );
    }

    return createSuccessResponse(session, {
      statusCode: 200,
    });
  } catch (error) {
    return createErrorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { statusCode: 500 }
    );
  }
}

/**
 * POST /api/session
 * Create/login session (placeholder)
 * 
 * TODO: Implement actual authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (stricter for login)
    const rateLimit = await checkRateLimit(request, RateLimitConfigs.strict);
    if (!rateLimit.allowed) {
      return createErrorResponse(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
        },
        { statusCode: 429 }
      );
    }

    // Parse request body
    const body = await parseJsonBody<{
      userId?: string;
      email?: string;
      password?: string; // Placeholder - not validated yet
    }>(request);

    // Placeholder: In production, validate credentials
    // For now, create a session with provided or default userId
    const userId = body.userId || 'user-placeholder-123';
    
    const session = await createSession(userId, {
      email: body.email,
      name: body.email?.split('@')[0],
    });

    return createSuccessResponse(session, {
      statusCode: 201,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid JSON')) {
      return createErrorResponse(
        {
          code: 'BAD_REQUEST',
          message: error.message,
        },
        { statusCode: 400 }
      );
    }

    return createErrorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { statusCode: 500 }
    );
  }
}

/**
 * DELETE /api/session
 * Logout/invalidate session
 */
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, RateLimitConfigs.standard);
    if (!rateLimit.allowed) {
      return createErrorResponse(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
        },
        { statusCode: 429 }
      );
    }

    // Get session to invalidate
    const session = await getSession(request);

    if (session) {
      await invalidateSession(session.sessionId);
    }

    return createSuccessResponse({ success: true }, {
      statusCode: 200,
    });
  } catch (error) {
    return createErrorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { statusCode: 500 }
    );
  }
}
