/**
 * AI Service - Public API
 */

// Types
export type {
  AIModel,
  SceneAnalysisContext,
  SceneAnalysisResult,
  OutlineSuggestionContext,
  OutlineSuggestionResult,
  CharacterAnalysisContext,
  CharacterAnalysisResult,
  TokenUsage,
  CostInfo,
  RateLimitInfo,
  AIOperationResult,
  AIOperationError,
} from './types';

// Interfaces
export type { IAIService, AIServiceConfig } from './AIService.interface';

// Implementations
export { MockAIService } from './MockAIService';

// Utilities
export {
  countTokens,
  countTokensInJSON,
  estimateOutputTokens,
  calculateTotalTokens,
  createTokenUsage,
} from './tokenCounter';

export {
  calculateCost,
  UserCostTracker,
  globalCostTracker,
} from './costTracker';

export {
  checkAIRateLimit,
  recordAIUsage,
  DefaultRateLimits,
  type AIRateLimitConfig,
} from './rateLimit';
