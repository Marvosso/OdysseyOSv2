/**
 * Story by ID API Route
 * 
 * GET /api/stories/[id] - Get a story by ID
 * PATCH /api/stories/[id] - Update a story
 * DELETE /api/stories/[id] - Delete a story
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, parseJsonBody } from '@/lib/api/response';
import { checkRateLimit, RateLimitConfigs } from '@/lib/api/rateLimit';
import { requireSession } from '@/lib/api/session';
import { getStoryStorage } from '@/lib/storage';
import type { Story, StoryId } from '@/types/models';
import { createStoryId } from '@/types/models';

/**
 * GET /api/stories/[id]
 * Get a story by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Require session
    await requireSession(request);

    // Get story ID from params
    const { id } = await context.params;
    const storyId = createStoryId(id);

    // Get story from storage
    const storage = getStoryStorage();
    const result = await storage.getStory(storyId);

    if (!result.success) {
      return createErrorResponse(
        {
          code: 'STORAGE_ERROR',
          message: result.error || 'Failed to get story',
        },
        { statusCode: 500 }
      );
    }

    if (!result.data) {
      return createErrorResponse(
        {
          code: 'NOT_FOUND',
          message: 'Story not found',
        },
        { statusCode: 404 }
      );
    }

    return createSuccessResponse(result.data, {
      statusCode: 200,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Session required') {
      return createErrorResponse(
        {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        { statusCode: 401 }
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
 * PATCH /api/stories/[id]
 * Update a story
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Require session
    await requireSession(request);

    // Get story ID from params
    const { id } = await context.params;
    const storyId = createStoryId(id);

    // Parse request body
    const updates = await parseJsonBody<Partial<Omit<Story, 'id' | 'version'>>>(request);

    // Update story in storage
    const storage = getStoryStorage();
    const result = await storage.updateStory(storyId, updates);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return createErrorResponse(
          {
            code: 'NOT_FOUND',
            message: 'Story not found',
          },
          { statusCode: 404 }
        );
      }

      return createErrorResponse(
        {
          code: 'STORAGE_ERROR',
          message: result.error || 'Failed to update story',
        },
        { statusCode: 500 }
      );
    }

    return createSuccessResponse(result.data, {
      statusCode: 200,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Session required') {
      return createErrorResponse(
        {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        { statusCode: 401 }
      );
    }

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
 * DELETE /api/stories/[id]
 * Delete a story
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
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

    // Require session
    await requireSession(request);

    // Get story ID from params
    const { id } = await context.params;
    const storyId = createStoryId(id);

    // Delete story from storage
    const storage = getStoryStorage();
    const result = await storage.deleteStory(storyId);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return createErrorResponse(
          {
            code: 'NOT_FOUND',
            message: 'Story not found',
          },
          { statusCode: 404 }
        );
      }

      return createErrorResponse(
        {
          code: 'STORAGE_ERROR',
          message: result.error || 'Failed to delete story',
        },
        { statusCode: 500 }
      );
    }

    return createSuccessResponse(null, {
      statusCode: 200,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Session required') {
      return createErrorResponse(
        {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        { statusCode: 401 }
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
