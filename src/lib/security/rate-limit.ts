export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter using sliding window algorithm
 * For production, consider using Redis for distributed rate limiting
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request is allowed based on rate limit
   * @param identifier - User ID or IP address
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   */
  async checkLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // No entry or expired entry
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + windowMs;
      this.store.set(identifier, { count: 1, resetAt });

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: new Date(resetAt),
      };
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.resetAt),
      };
    }

    // Increment count
    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetAt: new Date(entry.resetAt),
    };
  }

  /**
   * Record a request for rate limiting
   */
  async recordRequest(identifier: string): Promise<void> {
    // This is handled in checkLimit
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all rate limit data (for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Destroy the rate limiter and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();
