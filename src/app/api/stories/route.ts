/**
 * Stories API Route
 * 
 * GET /api/stories - List all stories
 * POST /api/stories - Create a new story
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, parseJsonBody } from '@/lib/api/response';
import { ApiErrors, handleApiError } from '@/lib/api/errors';
import { checkRateLimit, RateLimitConfigs } from '@/lib/api/rateLimit';
import { requireSession } from '@/lib/api/session';
import { getStoryStorage } from '@/lib/storage';
import type { Story } from '@/types/models';
import { createStoryId, createVersion, createTextContent, createWordCount } from '@/types/models';

/**
 * GET /api/stories
 * List all stories
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

    // Require session (placeholder)
    await requireSession(request);

    // Get stories from storage
    const storage = getStoryStorage();
    const result = await storage.listStories();

    if (!result.success) {
      return createErrorResponse(
        {
          code: 'STORAGE_ERROR',
          message: result.error || 'Failed to list stories',
        },
        { statusCode: 500 }
      );
    }

    return createSuccessResponse(result.data || [], {
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
 * POST /api/stories
 * Create a new story
 */
export async function POST(request: NextRequest) {
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
    const session = await requireSession(request);

    // Parse request body
    const body = await parseJsonBody<Partial<Story>>(request);

    // Validate required fields
    if (!body.title) {
      return createErrorResponse(
        {
          code: 'VALIDATION_ERROR',
          message: 'Title is required',
          details: { field: 'title' },
        },
        { statusCode: 422 }
      );
    }

    // Create story object
    const story: Story = {
      id: createStoryId(`story-${Date.now()}-${Math.random().toString(36).substring(7)}`),
      title: body.title,
      description: body.description || createTextContent(''),
      genre: body.genre || 'fiction',
      targetAudience: body.targetAudience || 'adults',
      themes: body.themes || [],
      status: body.status || 'draft',
      chapters: body.chapters || [],
      characters: body.characters || [],
      wordCount: body.wordCount || createWordCount(''),
      version: createVersion(),
      metadata: body.metadata || {
        tags: [],
        notes: '',
      },
    };

    // Save to storage
    const storage = getStoryStorage();
    const result = await storage.createStory(story);

    if (!result.success) {
      return createErrorResponse(
        {
          code: 'STORAGE_ERROR',
          message: result.error || 'Failed to create story',
        },
        { statusCode: 500 }
      );
    }

    return createSuccessResponse(result.data, {
      statusCode: 201,
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
