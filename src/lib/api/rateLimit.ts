/**
 * Rate Limiting Foundation
 * 
 * Basic rate limiting implementation
 * Can be extended with Redis or other persistent storage
 */

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional key generator function */
  keyGenerator?: (request: Request) => string;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether request is allowed */
  allowed: boolean;
  /** Remaining requests in window */
  remaining: number;
  /** When the rate limit resets (timestamp) */
  resetAt: number;
  /** Retry after (seconds) */
  retryAfter?: number;
}

/**
 * In-memory rate limit store
 * For production, replace with Redis or similar
 */
class RateLimitStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetAt < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Get current count for a key
   */
  get(key: string, windowMs: number): { count: number; resetAt: number } {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || entry.resetAt < now) {
      // Create new entry
      const resetAt = now + windowMs;
      this.store.set(key, { count: 0, resetAt });
      return { count: 0, resetAt };
    }

    return entry;
  }

  /**
   * Increment count for a key
   */
  increment(key: string, windowMs: number): { count: number; resetAt: number } {
    const entry = this.get(key, windowMs);
    entry.count++;
    this.store.set(key, entry);
    return entry;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Global rate limit store (singleton)
const rateLimitStore = new RateLimitStore();

/**
 * Default key generator (uses IP address)
 */
function defaultKeyGenerator(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Include path for per-endpoint limiting
  const path = new URL(request.url).pathname;
  
  return `${ip}:${path}`;
}

/**
 * Check rate limit
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(request);
  
  const entry = rateLimitStore.increment(key, config.windowMs);
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;
  const retryAfter = allowed
    ? undefined
    : Math.ceil((entry.resetAt - Date.now()) / 1000);

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    retryAfter,
  };
}

/**
 * Rate limit middleware factory
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: Request): Promise<RateLimitResult> => {
    return checkRateLimit(request, config);
  };
}

/**
 * Default rate limit configurations
 */
export const RateLimitConfigs = {
  /** Strict: 10 requests per minute */
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  
  /** Standard: 60 requests per minute */
  standard: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
  
  /** Relaxed: 100 requests per minute */
  relaxed: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  
  /** Per endpoint: 30 requests per minute */
  perEndpoint: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
};

/**
 * Export store for testing/cleanup
 */
export { rateLimitStore };
