/**
 * ProfileCache - Caching layer for user profiles
 * 
 * Reduces redundant database queries and prevents race conditions
 * by caching profile data and deduplicating concurrent requests.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";
import { retryWithBackoff } from "./retry";
import { toAuthError } from "./errors";

export type UserRole = "USER" | "TESTER" | "ADMIN";

export interface UserProfile {
  id: string;
  role: UserRole;
  display_id: string | null;
  country: string | null;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

interface CachedProfile {
  profile: UserProfile;
  timestamp: number;
  ttl: number; // Time to live in ms
}

/**
 * ProfileCache class for managing user profile caching
 */
export class ProfileCache {
  private cache: Map<string, CachedProfile>;
  private pendingRequests: Map<string, Promise<UserProfile | null>>;
  private defaultTTL: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.defaultTTL = ttlMs;

    logger.debug("ProfileCache initialized", { ttl: ttlMs });
  }

  /**
   * Get profile with caching and request deduplication
   */
  async getProfile(
    userId: string,
    supabase: SupabaseClient
  ): Promise<UserProfile | null> {
    logger.debug("ProfileCache.getProfile called", { userId });

    // Check cache first
    const cached = this.getCachedProfile(userId);
    if (cached) {
      logger.debug("ProfileCache hit", { userId });
      return cached;
    }

    logger.debug("ProfileCache miss", { userId });

    // Check if there's already a pending request for this user
    const pending = this.pendingRequests.get(userId);
    if (pending) {
      logger.debug("ProfileCache: Deduplicating request", { userId });
      return pending;
    }

    // Create new request
    const request = this.fetchProfileWithRetry(userId, supabase);

    // Store pending request for deduplication
    this.pendingRequests.set(userId, request);

    try {
      const profile = await request;

      // Cache the result if successful
      if (profile) {
        this.setCachedProfile(userId, profile);
      }

      return profile;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(userId);
    }
  }

  /**
   * Fetch profile from database with retry logic
   */
  private async fetchProfileWithRetry(
    userId: string,
    supabase: SupabaseClient
  ): Promise<UserProfile | null> {
    const timer = logger.startTimer();

    try {
      const profile = await retryWithBackoff(async () => {
        logger.debug("Fetching profile from database", { userId });

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          // Profile not found is not an error we should retry
          if (error.code === "PGRST116") {
            logger.warn("Profile not found", { userId, error: error.message });
            return null;
          }

          // Throw error to trigger retry
          throw new Error(`Profile fetch failed: ${error.message}`);
        }

        return data as UserProfile;
      });

      const duration = timer();
      logger.successOperation("fetchProfile", duration, { userId });

      return profile;
    } catch (error) {
      const duration = timer();
      const authError = toAuthError(error, "fetchProfile");
      logger.failOperation("fetchProfile", authError, { userId, duration });
      return null;
    }
  }

  /**
   * Get cached profile if valid
   */
  private getCachedProfile(userId: string): UserProfile | null {
    const cached = this.cache.get(userId);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache entry is still valid
    if (age < cached.ttl) {
      return cached.profile;
    }

    // Cache expired, remove it
    logger.debug("ProfileCache entry expired", { userId, age });
    this.cache.delete(userId);
    return null;
  }

  /**
   * Set cached profile
   */
  private setCachedProfile(userId: string, profile: UserProfile): void {
    this.cache.set(userId, {
      profile,
      timestamp: Date.now(),
      ttl: this.defaultTTL,
    });

    logger.debug("ProfileCache entry set", { userId, ttl: this.defaultTTL });
  }

  /**
   * Invalidate cache for specific user
   */
  invalidate(userId: string): void {
    const existed = this.cache.delete(userId);
    logger.debug("ProfileCache invalidated", { userId, existed });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.pendingRequests.clear();
    logger.debug("ProfileCache cleared", { entriesCleared: size });
  }

  /**
   * Check if profile is cached
   */
  has(userId: string): boolean {
    return this.getCachedProfile(userId) !== null;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    pendingRequests: number;
  } {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, cached] of this.cache.entries()) {
      const age = now - cached.timestamp;
      if (age >= cached.ttl) {
        this.cache.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug("ProfileCache cleanup completed", { entriesCleaned: cleaned });
    }
  }
}

// Export singleton instance
export const profileCache = new ProfileCache();
