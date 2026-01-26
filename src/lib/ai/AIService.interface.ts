/**
 * AI Service Interface
 * 
 * Model-agnostic interface for AI operations
 */

import type {
  Scene,
  Character,
  Chapter,
  SceneAnalysisContext,
  SceneAnalysisResult,
  OutlineSuggestionContext,
  OutlineSuggestionResult,
  CharacterAnalysisContext,
  CharacterAnalysisResult,
  AIOperationResult,
  AIOperationError,
  AIModel,
  RateLimitInfo,
} from './types';

/**
 * AI Service configuration
 */
export interface AIServiceConfig {
  /** Default model to use */
  defaultModel: AIModel;
  /** User ID for cost tracking */
  userId: string;
  /** Rate limit configuration */
  rateLimitConfig?: {
    maxRequests: number;
    windowMs: number;
    maxTokens?: number;
    maxCost?: number;
  };
  /** Cost limit per user */
  costLimit?: number;
}

/**
 * AI Service Interface
 * 
 * All AI service implementations must implement this interface
 */
export interface IAIService {
  /**
   * Analyze a scene
   * 
   * @param scene Scene to analyze
   * @param context Additional context for analysis
   * @returns Analysis result with token usage and cost
   */
  analyzeScene(
    scene: Scene,
    context?: SceneAnalysisContext
  ): Promise<AIOperationResult<SceneAnalysisResult>>;

  /**
   * Suggest outline improvements
   * 
   * @param outline Current outline or context
   * @param context Additional context for suggestions
   * @returns Suggestion result with token usage and cost
   */
  suggestOutline(
    outline: OutlineSuggestionContext,
    context?: { storyId?: string; currentChapters?: readonly Chapter[] }
  ): Promise<AIOperationResult<OutlineSuggestionResult>>;

  /**
   * Analyze a character
   * 
   * @param character Character to analyze
   * @param scenes Scenes where character appears
   * @param context Additional context for analysis
   * @returns Analysis result with token usage and cost
   */
  analyzeCharacter(
    character: Character,
    scenes: readonly Scene[],
    context?: CharacterAnalysisContext
  ): Promise<AIOperationResult<CharacterAnalysisResult>>;

  /**
   * Get current rate limit status
   * 
   * @returns Rate limit information
   */
  getRateLimitStatus(): Promise<RateLimitInfo>;

  /**
   * Get total cost for current user
   * 
   * @returns Total cost in USD
   */
  getTotalCost(): Promise<number>;

  /**
   * Check if service is available
   * 
   * @returns True if service is available
   */
  isAvailable(): Promise<boolean>;
}
