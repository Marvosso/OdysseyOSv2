/**
 * API Response Helpers
 * 
 * Standardized response formatting for API routes
 */

import type { NextResponse } from 'next/server';

/**
 * Success response type
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Error response type
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * API Response type (union)
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    statusCode?: number;
    requestId?: string;
  }
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(options?.requestId && { requestId: options.requestId }),
    },
  };

  return new Response(JSON.stringify(response), {
    status: options?.statusCode || 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: {
    code: string;
    message: string;
    details?: unknown;
  },
  options?: {
    statusCode?: number;
    requestId?: string;
  }
): Response {
  const response: ApiErrorResponse = {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      ...(options?.requestId && { requestId: options.requestId }),
    },
  };

  return new Response(JSON.stringify(response), {
    status: options?.statusCode || 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Parse JSON request body safely
 */
export async function parseJsonBody<T = unknown>(
  request: Request
): Promise<T> {
  try {
    const text = await request.text();
    if (!text) {
      throw new Error('Request body is empty');
    }
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(
      `Invalid JSON in request body: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get request ID from headers (for tracing)
 */
export function getRequestId(request: Request): string | undefined {
  return (
    request.headers.get('x-request-id') ||
    request.headers.get('x-correlation-id') ||
    undefined
  );
}
