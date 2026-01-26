/**
 * AI Service Rate Limiting
 * 
 * Rate limiting hooks for AI operations
 */

import type { RateLimitInfo } from './types';

/**
 * Rate limit configuration
 */
export interface AIRateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum tokens per window */
  maxTokens?: number;
  /** Maximum cost per window (USD) */
  maxCost?: number;
}

/**
 * Rate limit store for AI operations
 */
class AIRateLimitStore {
  private requestCounts: Map<string, { count: number; resetAt: number; tokens: number; cost: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.requestCounts.entries()) {
        if (value.resetAt < now) {
          this.requestCounts.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Get or create rate limit entry
   */
  private getEntry(key: string, windowMs: number) {
    const entry = this.requestCounts.get(key);
    const now = Date.now();

    if (!entry || entry.resetAt < now) {
      const resetAt = now + windowMs;
      const newEntry = { count: 0, resetAt, tokens: 0, cost: 0 };
      this.requestCounts.set(key, newEntry);
      return newEntry;
    }

    return entry;
  }

  /**
   * Check rate limit
   */
  checkRateLimit(
    userId: string,
    config: AIRateLimitConfig,
    tokens?: number,
    cost?: number
  ): RateLimitInfo {
    const key = userId;
    const entry = this.getEntry(key, config.windowMs);

    // Check request count limit
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter: Math.ceil((entry.resetAt - Date.now()) / 1000),
      };
    }

    // Check token limit
    if (config.maxTokens && tokens && entry.tokens + tokens > config.maxTokens) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter: Math.ceil((entry.resetAt - Date.now()) / 1000),
      };
    }

    // Check cost limit
    if (config.maxCost && cost && entry.cost + cost > config.maxCost) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter: Math.ceil((entry.resetAt - Date.now()) / 1000),
      };
    }

    // Update counts
    entry.count++;
    if (tokens) entry.tokens += tokens;
    if (cost) entry.cost += cost;

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Record usage (after operation completes)
   */
  recordUsage(userId: string, tokens: number, cost: number): void {
    const entry = this.requestCounts.get(userId);
    if (entry) {
      entry.tokens += tokens;
      entry.cost += cost;
    }
  }

  /**
   * Clear rate limit data
   */
  clear(): void {
    this.requestCounts.clear();
  }

  /**
   * Destroy cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Global rate limit store
const rateLimitStore = new AIRateLimitStore();

/**
 * Default rate limit configurations
 */
export const DefaultRateLimits: Record<string, AIRateLimitConfig> = {
  /** Free tier */
  free: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxTokens: 10000,
    maxCost: 0.10, // $0.10 per hour
  },
  
  /** Basic tier */
  basic: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxTokens: 100000,
    maxCost: 1.00, // $1.00 per hour
  },
  
  /** Pro tier */
  pro: {
    maxRequests: 200,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxTokens: 500000,
    maxCost: 10.00, // $10.00 per hour
  },
  
  /** Unlimited (for testing) */
  unlimited: {
    maxRequests: Number.MAX_SAFE_INTEGER,
    windowMs: 60 * 60 * 1000,
  },
};

/**
 * Rate limit hook
 * Checks rate limits before operation
 */
export async function checkAIRateLimit(
  userId: string,
  config: AIRateLimitConfig,
  estimatedTokens?: number,
  estimatedCost?: number
): Promise<RateLimitInfo> {
  return rateLimitStore.checkRateLimit(userId, config, estimatedTokens, estimatedCost);
}

/**
 * Record AI operation usage
 */
export function recordAIUsage(userId: string, tokens: number, cost: number): void {
  rateLimitStore.recordUsage(userId, tokens, cost);
}

/**
 * Export store for testing
 */
export { rateLimitStore };
