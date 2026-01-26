/**
 * Token Counting Utilities
 * 
 * Model-agnostic token counting
 * Estimates token counts for different AI models
 */

import type { AIModel } from './types';

/**
 * Token counting configuration per model
 */
interface TokenCountConfig {
  /** Average characters per token */
  charsPerToken: number;
  /** Average words per token */
  wordsPerToken: number;
}

/**
 * Model-specific token counting configurations
 * Based on approximate tokenization rules
 */
const MODEL_CONFIGS: Record<AIModel, TokenCountConfig> = {
  'gpt-4': { charsPerToken: 4, wordsPerToken: 0.75 },
  'gpt-4-turbo': { charsPerToken: 4, wordsPerToken: 0.75 },
  'gpt-3.5-turbo': { charsPerToken: 4, wordsPerToken: 0.75 },
  'claude-3-opus': { charsPerToken: 3.5, wordsPerToken: 0.7 },
  'claude-3-sonnet': { charsPerToken: 3.5, wordsPerToken: 0.7 },
  'claude-3-haiku': { charsPerToken: 3.5, wordsPerToken: 0.7 },
  'gemini-pro': { charsPerToken: 4, wordsPerToken: 0.75 },
  'custom': { charsPerToken: 4, wordsPerToken: 0.75 }, // Default
};

/**
 * Count tokens in text (estimate)
 */
export function countTokens(text: string, model: AIModel = 'gpt-4'): number {
  if (!text || text.length === 0) {
    return 0;
  }

  const config = MODEL_CONFIGS[model];
  
  // Use character-based estimation (more accurate for most models)
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount / config.charsPerToken);
  
  // Also calculate word-based estimate and average
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const wordBasedTokens = Math.ceil(wordCount / config.wordsPerToken);
  
  // Return average of both methods for better accuracy
  return Math.ceil((estimatedTokens + wordBasedTokens) / 2);
}

/**
 * Count tokens in structured data (JSON)
 */
export function countTokensInJSON(data: unknown, model: AIModel = 'gpt-4'): number {
  const jsonString = JSON.stringify(data);
  return countTokens(jsonString, model);
}

/**
 * Estimate output tokens based on input
 * (Output is typically 20-50% of input for analysis tasks)
 */
export function estimateOutputTokens(
  inputTokens: number,
  taskType: 'analysis' | 'generation' | 'suggestion' = 'analysis'
): number {
  const multipliers = {
    analysis: 0.3, // Analysis typically returns shorter responses
    generation: 1.5, // Generation can be longer
    suggestion: 0.5, // Suggestions are medium length
  };

  return Math.ceil(inputTokens * multipliers[taskType]);
}

/**
 * Calculate total tokens (input + output)
 */
export function calculateTotalTokens(
  inputTokens: number,
  outputTokens: number
): number {
  return inputTokens + outputTokens;
}

/**
 * Token usage summary
 */
export interface TokenUsageSummary {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
  readonly model: AIModel;
}

/**
 * Create token usage summary
 */
export function createTokenUsage(
  inputTokens: number,
  outputTokens: number,
  model: AIModel
): TokenUsageSummary {
  return {
    inputTokens,
    outputTokens,
    totalTokens: calculateTotalTokens(inputTokens, outputTokens),
    model,
  };
}
