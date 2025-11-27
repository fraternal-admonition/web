/**
 * ActivityTracker - Monitor user activity for session inactivity detection
 * 
 * Tracks user interactions (mouse, keyboard, navigation) to determine
 * if a session should be considered inactive after 24 hours.
 * 
 * Features:
 * - Throttled activity recording (max once per minute)
 * - Cross-tab synchronization via localStorage and BroadcastChannel
 * - Automatic cleanup on stop
 */

import { logger } from "./logger";

const STORAGE_KEY = "auth_last_activity";
const BROADCAST_CHANNEL_NAME = "auth_activity";
const THROTTLE_INTERVAL = 60 * 1000; // 1 minute

export class ActivityTracker {
  private lastActivity: Date;
  private inactivityThreshold: number;
  private listeners: Set<() => void>;
  private isTracking: boolean;
  private throttleTimer: NodeJS.Timeout | null;
  private broadcastChannel: BroadcastChannel | null;
  private storageListener: ((e: StorageEvent) => void) | null;

  // Event handlers (stored as properties for proper cleanup)
  private handleMouseMove: (() => void) | null;
  private handleClick: (() => void) | null;
  private handleKeyPress: (() => void) | null;
  private handleScroll: (() => void) | null;
  private handleVisibilityChange: (() => void) | null;

  constructor(thresholdMs: number = 24 * 60 * 60 * 1000) {
    // Default 24 hours
    this.lastActivity = new Date();
    this.inactivityThreshold = thresholdMs;
    this.listeners = new Set();
    this.isTracking = false;
    this.throttleTimer = null;
    this.broadcastChannel = null;
    this.storageListener = null;

    // Initialize event handlers
    this.handleMouseMove = null;
    this.handleClick = null;
    this.handleKeyPress = null;
    this.handleScroll = null;
    this.handleVisibilityChange = null;

    // Try to restore last activity from localStorage
    this.restoreLastActivity();

    logger.debug("ActivityTracker initialized", {
      threshold: thresholdMs,
      lastActivity: this.lastActivity.toISOString(),
    });
  }

  /**
   * Start tracking user activity
   */
  start(): void {
    if (this.isTracking) {
      logger.debug("ActivityTracker already tracking");
      return;
    }

    this.isTracking = true;
    logger.info("ActivityTracker started");

    // Set up event listeners with throttling
    this.handleMouseMove = this.createThrottledHandler("mousemove");
    this.handleClick = this.createThrottledHandler("click");
    this.handleKeyPress = this.createThrottledHandler("keypress");
    this.handleScroll = this.createThrottledHandler("scroll");
    this.handleVisibilityChange = this.createThrottledHandler("visibilitychange");

    // Add event listeners
    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", this.handleMouseMove, { passive: true });
      window.addEventListener("click", this.handleClick, { passive: true });
      window.addEventListener("keypress", this.handleKeyPress, { passive: true });
      window.addEventListener("scroll", this.handleScroll, { passive: true });
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }

    // Set up cross-tab communication
    this.setupCrossTabSync();

    // Record initial activity
    this.recordActivity();
  }

  /**
   * Stop tracking user activity
   */
  stop(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    logger.info("ActivityTracker stopped");

    // Remove event listeners
    if (typeof window !== "undefined") {
      if (this.handleMouseMove) {
        window.removeEventListener("mousemove", this.handleMouseMove);
      }
      if (this.handleClick) {
        window.removeEventListener("click", this.handleClick);
      }
      if (this.handleKeyPress) {
        window.removeEventListener("keypress", this.handleKeyPress);
      }
      if (this.handleScroll) {
        window.removeEventListener("scroll", this.handleScroll);
      }
      if (this.handleVisibilityChange) {
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      }
    }

    // Clear throttle timer
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }

    // Clean up cross-tab sync
    this.cleanupCrossTabSync();

    // Clear event handlers
    this.handleMouseMove = null;
    this.handleClick = null;
    this.handleKeyPress = null;
    this.handleScroll = null;
    this.handleVisibilityChange = null;
  }

  /**
   * Record user activity
   */
  recordActivity(): void {
    const now = new Date();
    this.lastActivity = now;

    // Store in localStorage for cross-tab sync
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, now.toISOString());
      } catch (error) {
        logger.warn("Failed to store activity in localStorage", { error });
      }
    }

    // Broadcast to other tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: "activity",
          timestamp: now.toISOString(),
        });
      } catch (error) {
        logger.warn("Failed to broadcast activity", { error });
      }
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        logger.error("Activity listener error", error);
      }
    });

    logger.debug("Activity recorded", { timestamp: now.toISOString() });
  }

  /**
   * Check if user is inactive
   */
  isInactive(): boolean {
    const now = Date.now();
    const lastActivityTime = this.lastActivity.getTime();
    const inactiveDuration = now - lastActivityTime;

    return inactiveDuration >= this.inactivityThreshold;
  }

  /**
   * Get last activity time
   */
  getLastActivity(): Date {
    return new Date(this.lastActivity);
  }

  /**
   * Get time until inactivity (in milliseconds)
   */
  getTimeUntilInactive(): number {
    const now = Date.now();
    const lastActivityTime = this.lastActivity.getTime();
    const inactiveDuration = now - lastActivityTime;
    const remaining = this.inactivityThreshold - inactiveDuration;

    return Math.max(0, remaining);
  }

  /**
   * Subscribe to activity events
   */
  onActivity(callback: () => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Create a throttled event handler
   */
  private createThrottledHandler(eventType: string): () => void {
    return () => {
      // Only record if not currently throttled
      if (!this.throttleTimer) {
        this.recordActivity();

        // Set throttle timer
        this.throttleTimer = setTimeout(() => {
          this.throttleTimer = null;
        }, THROTTLE_INTERVAL);
      }
    };
  }

  /**
   * Set up cross-tab synchronization
   */
  private setupCrossTabSync(): void {
    // Set up BroadcastChannel for modern browsers
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === "activity" && event.data?.timestamp) {
            const remoteActivity = new Date(event.data.timestamp);

            // Update if remote activity is more recent
            if (remoteActivity > this.lastActivity) {
              this.lastActivity = remoteActivity;
              logger.debug("Activity synced from another tab", {
                timestamp: remoteActivity.toISOString(),
              });
            }
          }
        };

        logger.debug("BroadcastChannel initialized");
      } catch (error) {
        logger.warn("Failed to initialize BroadcastChannel", { error });
      }
    }

    // Set up localStorage listener as fallback
    if (typeof window !== "undefined") {
      this.storageListener = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const remoteActivity = new Date(e.newValue);

            // Update if remote activity is more recent
            if (remoteActivity > this.lastActivity) {
              this.lastActivity = remoteActivity;
              logger.debug("Activity synced from localStorage", {
                timestamp: remoteActivity.toISOString(),
              });
            }
          } catch (error) {
            logger.warn("Failed to parse activity from localStorage", { error });
          }
        }
      };

      window.addEventListener("storage", this.storageListener);
      logger.debug("localStorage listener initialized");
    }
  }

  /**
   * Clean up cross-tab synchronization
   */
  private cleanupCrossTabSync(): void {
    // Close BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (error) {
        logger.warn("Failed to close BroadcastChannel", { error });
      }
      this.broadcastChannel = null;
    }

    // Remove storage listener
    if (this.storageListener && typeof window !== "undefined") {
      window.removeEventListener("storage", this.storageListener);
      this.storageListener = null;
    }
  }

  /**
   * Restore last activity from localStorage
   */
  private restoreLastActivity(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const storedActivity = new Date(stored);

          // Only restore if it's more recent than current
          if (storedActivity > this.lastActivity) {
            this.lastActivity = storedActivity;
            logger.debug("Last activity restored from localStorage", {
              timestamp: storedActivity.toISOString(),
            });
          }
        }
      } catch (error) {
        logger.warn("Failed to restore activity from localStorage", { error });
      }
    }
  }

  /**
   * Get tracker statistics
   */
  getStats(): {
    isTracking: boolean;
    lastActivity: string;
    isInactive: boolean;
    timeUntilInactive: number;
    listenerCount: number;
  } {
    return {
      isTracking: this.isTracking,
      lastActivity: this.lastActivity.toISOString(),
      isInactive: this.isInactive(),
      timeUntilInactive: this.getTimeUntilInactive(),
      listenerCount: this.listeners.size,
    };
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker();
