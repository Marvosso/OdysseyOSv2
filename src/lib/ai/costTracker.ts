/**
 * Cost Tracking Utilities
 * 
 * Tracks AI API costs per user and operation
 */

import type { AIModel, CostInfo } from './types';
import type { TokenUsage } from './types';

/**
 * Cost per 1K tokens (input) by model
 * Prices are approximate and may vary
 */
const INPUT_COST_PER_1K: Record<AIModel, number> = {
  'gpt-4': 0.03, // $0.03 per 1K input tokens
  'gpt-4-turbo': 0.01, // $0.01 per 1K input tokens
  'gpt-3.5-turbo': 0.0015, // $0.0015 per 1K input tokens
  'claude-3-opus': 0.015, // $0.015 per 1K input tokens
  'claude-3-sonnet': 0.003, // $0.003 per 1K input tokens
  'claude-3-haiku': 0.00025, // $0.00025 per 1K input tokens
  'gemini-pro': 0.0005, // $0.0005 per 1K input tokens
  'custom': 0.01, // Default
};

/**
 * Cost per 1K tokens (output) by model
 */
const OUTPUT_COST_PER_1K: Record<AIModel, number> = {
  'gpt-4': 0.06, // $0.06 per 1K output tokens
  'gpt-4-turbo': 0.03, // $0.03 per 1K output tokens
  'gpt-3.5-turbo': 0.002, // $0.002 per 1K output tokens
  'claude-3-opus': 0.075, // $0.075 per 1K output tokens
  'claude-3-sonnet': 0.015, // $0.015 per 1K output tokens
  'claude-3-haiku': 0.00125, // $0.00125 per 1K output tokens
  'gemini-pro': 0.001, // $0.001 per 1K output tokens
  'custom': 0.01, // Default
};

/**
 * Calculate cost from token usage
 */
export function calculateCost(tokenUsage: TokenUsage): CostInfo {
  const inputCost = (tokenUsage.inputTokens / 1000) * INPUT_COST_PER_1K[tokenUsage.model];
  const outputCost = (tokenUsage.outputTokens / 1000) * OUTPUT_COST_PER_1K[tokenUsage.model];
  const totalCost = inputCost + outputCost;

  return {
    cost: totalCost,
    inputCost,
    outputCost,
    model: tokenUsage.model,
    timestamp: new Date(),
  };
}

/**
 * User cost tracking
 */
export class UserCostTracker {
  private userCosts: Map<string, { total: number; operations: number; lastReset: Date }> = new Map();
  private readonly resetIntervalMs: number;

  constructor(resetIntervalMs: number = 30 * 24 * 60 * 60 * 1000) {
    // Default: monthly reset
    this.resetIntervalMs = resetIntervalMs;
  }

  /**
   * Track cost for a user
   */
  trackCost(userId: string, cost: number): void {
    const userData = this.userCosts.get(userId) || {
      total: 0,
      operations: 0,
      lastReset: new Date(),
    };

    // Reset if interval has passed
    if (Date.now() - userData.lastReset.getTime() > this.resetIntervalMs) {
      userData.total = 0;
      userData.operations = 0;
      userData.lastReset = new Date();
    }

    userData.total += cost;
    userData.operations += 1;

    this.userCosts.set(userId, userData);
  }

  /**
   * Get total cost for a user
   */
  getTotalCost(userId: string): number {
    const userData = this.userCosts.get(userId);
    if (!userData) {
      return 0;
    }

    // Reset if interval has passed
    if (Date.now() - userData.lastReset.getTime() > this.resetIntervalMs) {
      return 0;
    }

    return userData.total;
  }

  /**
   * Get operation count for a user
   */
  getOperationCount(userId: string): number {
    const userData = this.userCosts.get(userId);
    if (!userData) {
      return 0;
    }

    // Reset if interval has passed
    if (Date.now() - userData.lastReset.getTime() > this.resetIntervalMs) {
      return 0;
    }

    return userData.operations;
  }

  /**
   * Check if user has exceeded cost limit
   */
  hasExceededLimit(userId: string, limit: number): boolean {
    return this.getTotalCost(userId) >= limit;
  }

  /**
   * Reset cost tracking for a user
   */
  resetUser(userId: string): void {
    this.userCosts.delete(userId);
  }

  /**
   * Reset all cost tracking
   */
  resetAll(): void {
    this.userCosts.clear();
  }

  /**
   * Get all user costs (for admin/debugging)
   */
  getAllCosts(): Map<string, { total: number; operations: number; lastReset: Date }> {
    return new Map(this.userCosts);
  }
}

// Global cost tracker instance
export const globalCostTracker = new UserCostTracker();
