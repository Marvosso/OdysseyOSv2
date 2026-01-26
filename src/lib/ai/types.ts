/**
 * AI Service Types
 * 
 * Type definitions for AI service operations
 */

import type { Scene, Character, Chapter, StoryId } from '@/types/models';

/**
 * AI Model identifier
 */
export type AIModel = 
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'gemini-pro'
  | 'custom';

/**
 * Scene analysis context
 */
export interface SceneAnalysisContext {
  /** Previous scenes for context */
  readonly previousScenes?: readonly Scene[];
  /** Next scenes for context */
  readonly nextScenes?: readonly Scene[];
  /** Story ID for additional context */
  readonly storyId?: StoryId;
  /** Characters in the scene */
  readonly characters?: readonly Character[];
  /** Analysis focus areas */
  readonly focusAreas?: readonly string[];
}

/**
 * Scene analysis result
 */
export interface SceneAnalysisResult {
  /** Emotional tone analysis */
  readonly emotion: {
    readonly detected: string;
    readonly confidence: number;
    readonly intensity: number;
  };
  /** Pacing analysis */
  readonly pacing: {
    readonly score: number; // 0-1
    readonly assessment: string;
    readonly suggestions: readonly string[];
  };
  /** Character development */
  readonly characterDevelopment: {
    readonly insights: readonly string[];
    readonly arcs: readonly string[];
  };
  /** Writing quality */
  readonly writingQuality: {
    readonly score: number; // 0-1
    readonly strengths: readonly string[];
    readonly improvements: readonly string[];
  };
  /** Overall feedback */
  readonly feedback: string;
}

/**
 * Outline suggestion context
 */
export interface OutlineSuggestionContext {
  /** Current outline state */
  readonly currentOutline?: {
    readonly chapters: readonly Chapter[];
    readonly summary?: string;
  };
  /** Story genre */
  readonly genre?: string;
  /** Target audience */
  readonly targetAudience?: string;
  /** Themes */
  readonly themes?: readonly string[];
}

/**
 * Outline suggestion result
 */
export interface OutlineSuggestionResult {
  /** Suggested chapters */
  readonly suggestedChapters: readonly {
    readonly title: string;
    readonly summary: string;
    readonly order: number;
    readonly estimatedWordCount: number;
  }[];
  /** Structural improvements */
  readonly structuralImprovements: readonly string[];
  /** Pacing suggestions */
  readonly pacingSuggestions: readonly string[];
  /** Character arc suggestions */
  readonly characterArcSuggestions: readonly string[];
  /** Overall recommendations */
  readonly recommendations: string;
}

/**
 * Character analysis context
 */
export interface CharacterAnalysisContext {
  /** Scenes where character appears */
  readonly scenes: readonly Scene[];
  /** Other characters for relationship analysis */
  readonly otherCharacters?: readonly Character[];
  /** Story context */
  readonly storyId?: StoryId;
}

/**
 * Character analysis result
 */
export interface CharacterAnalysisResult {
  /** Character consistency */
  readonly consistency: {
    readonly score: number; // 0-1
    readonly issues: readonly string[];
    readonly strengths: readonly string[];
  };
  /** Character development arc */
  readonly developmentArc: {
    readonly currentStage: string;
    readonly progression: readonly string[];
    readonly suggestions: readonly string[];
  };
  /** Dialogue analysis */
  readonly dialogue: {
    readonly authenticity: number; // 0-1
    readonly voice: string;
    readonly improvements: readonly string[];
  };
  /** Relationships */
  readonly relationships: readonly {
    readonly characterId: string;
    readonly relationshipType: string;
    readonly dynamics: string;
    readonly suggestions: readonly string[];
  }[];
  /** Overall assessment */
  readonly assessment: string;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  /** Input tokens */
  readonly inputTokens: number;
  /** Output tokens */
  readonly outputTokens: number;
  /** Total tokens */
  readonly totalTokens: number;
  /** Model used */
  readonly model: AIModel;
}

/**
 * Cost information
 */
export interface CostInfo {
  /** Cost in USD */
  readonly cost: number;
  /** Input cost */
  readonly inputCost: number;
  /** Output cost */
  readonly outputCost: number;
  /** Model used */
  readonly model: AIModel;
  /** Timestamp */
  readonly timestamp: Date;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  /** Whether request is allowed */
  readonly allowed: boolean;
  /** Remaining requests */
  readonly remaining: number;
  /** Reset timestamp */
  readonly resetAt: number;
  /** Retry after (seconds) */
  readonly retryAfter?: number;
}

/**
 * AI operation result base
 */
export interface AIOperationResult<T> {
  /** Operation result data */
  readonly data: T;
  /** Token usage */
  readonly tokenUsage: TokenUsage;
  /** Cost information */
  readonly cost: CostInfo;
  /** Rate limit info */
  readonly rateLimit?: RateLimitInfo;
}

/**
 * AI operation error
 */
export interface AIOperationError {
  /** Error code */
  readonly code: string;
  /** Error message */
  readonly message: string;
  /** Whether it's a rate limit error */
  readonly isRateLimit: boolean;
  /** Whether it's a cost limit error */
  readonly isCostLimit: boolean;
  /** Retry after (seconds) */
  readonly retryAfter?: number;
}
