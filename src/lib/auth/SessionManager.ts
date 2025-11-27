/**
 * SessionManager - Manage session lifecycle, expiration, and warnings
 * 
 * Handles:
 * - Session expiry monitoring
 * - Warning notifications (5 minutes before expiry)
 * - Inactivity timeout (24 hours)
 * - Session refresh
 * - Activity tracking integration
 */

import { SupabaseClient, Session } from "@supabase/supabase-js";
import { logger } from "./logger";
import { ActivityTracker } from "./ActivityTracker";

// TESTING: Set to 30 seconds for quick testing (change back to 5 * 60 * 1000 for production)
const WARNING_BEFORE_EXPIRY = 30 * 1000; // 30 seconds for testing
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export class SessionManager {
  private supabase: SupabaseClient;
  private onExpiry: () => void;
  private onWarning: () => void;
  private activityTracker: ActivityTracker | null;

  // Timers
  private expiryTimer: NodeJS.Timeout | null;
  private warningTimer: NodeJS.Timeout | null;
  private inactivityCheckTimer: NodeJS.Timeout | null;

  // State
  private currentSession: Session | null;
  private isMonitoring: boolean;

  constructor(
    supabase: SupabaseClient,
    onExpiry: () => void,
    onWarning: () => void,
    activityTracker?: ActivityTracker
  ) {
    this.supabase = supabase;
    this.onExpiry = onExpiry;
    this.onWarning = onWarning;
    this.activityTracker = activityTracker || null;

    this.expiryTimer = null;
    this.warningTimer = null;
    this.inactivityCheckTimer = null;

    this.currentSession = null;
    this.isMonitoring = false;

    logger.debug("SessionManager initialized");
  }

  /**
   * Start monitoring a session
   */
  startMonitoring(session: Session): void {
    if (this.isMonitoring) {
      logger.debug("SessionManager already monitoring, stopping previous");
      this.stopMonitoring();
    }

    this.currentSession = session;
    this.isMonitoring = true;

    logger.info("SessionManager started monitoring", {
      userId: session.user.id,
      expiresAt: session.expires_at,
    });

    // Set up expiry timer
    this.setupExpiryTimer(session);

    // Set up warning timer
    this.setupWarningTimer(session);

    // Set up inactivity check
    this.setupInactivityCheck();

    // Start activity tracking if available
    if (this.activityTracker) {
      this.activityTracker.start();
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    logger.info("SessionManager stopped monitoring");

    this.isMonitoring = false;
    this.currentSession = null;

    // Clear all timers
    this.clearTimers();

    // Stop activity tracking
    if (this.activityTracker) {
      this.activityTracker.stop();
    }
  }

  /**
   * Record user activity (resets inactivity timer)
   */
  recordActivity(): void {
    if (this.activityTracker) {
      this.activityTracker.recordActivity();
    }

    logger.debug("Activity recorded");
  }

  /**
   * Check if session is about to expire
   */
  isNearExpiry(): boolean {
    if (!this.currentSession) {
      return false;
    }

    const timeUntilExpiry = this.getTimeUntilExpiry();
    return timeUntilExpiry > 0 && timeUntilExpiry <= WARNING_BEFORE_EXPIRY;
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<Session | null> {
    console.log("🔄 SessionManager.refreshSession() called");
    logger.info("SessionManager refreshing session");

    try {
      console.log("📡 Calling supabase.auth.refreshSession()...");
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        console.error("❌ Session refresh failed:", error);
        logger.error("Session refresh failed", error);
        return null;
      }

      if (data.session) {
        console.log("✅ Session refreshed successfully!");
        console.log("New expires_at:", data.session.expires_at);
        console.log("New expiry time:", new Date(data.session.expires_at! * 1000).toLocaleString());
        
        logger.info("Session refreshed successfully", {
          expiresAt: data.session.expires_at,
        });

        // Restart monitoring with new session
        console.log("🔄 Restarting monitoring with new session...");
        this.startMonitoring(data.session);

        return data.session;
      }

      console.warn("⚠️ No session returned from refresh");
      return null;
    } catch (error) {
      console.error("💥 Session refresh error:", error);
      logger.error("Session refresh error", error);
      return null;
    }
  }

  /**
   * Get time until session expiry (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    if (!this.currentSession || !this.currentSession.expires_at) {
      return 0;
    }

    const expiryTime = this.currentSession.expires_at * 1000; // Convert to ms
    const now = Date.now();
    const remaining = expiryTime - now;

    return Math.max(0, remaining);
  }

  /**
   * Get time until inactivity timeout (in milliseconds)
   */
  getTimeUntilInactivity(): number {
    if (!this.activityTracker) {
      return Infinity;
    }

    return this.activityTracker.getTimeUntilInactive();
  }

  /**
   * Check if user is inactive
   */
  isInactive(): boolean {
    if (!this.activityTracker) {
      return false;
    }

    return this.activityTracker.isInactive();
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Get monitoring status
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Set up expiry timer
   */
  private setupExpiryTimer(session: Session): void {
    const timeUntilExpiry = this.getTimeUntilExpiry();

    if (timeUntilExpiry <= 0) {
      logger.warn("Session already expired");
      this.handleExpiry();
      return;
    }

    logger.debug("Setting up expiry timer", {
      timeUntilExpiry,
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
    });

    this.expiryTimer = setTimeout(() => {
      logger.info("Session expired");
      this.handleExpiry();
    }, timeUntilExpiry);
  }

  /**
   * Set up warning timer (5 minutes before expiry)
   */
  private setupWarningTimer(session: Session): void {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    const timeUntilWarning = timeUntilExpiry - WARNING_BEFORE_EXPIRY;

    // DEBUG LOGGING
    console.log("=== SESSION WARNING TIMER SETUP ===");
    console.log("Session expires_at:", session.expires_at);
    console.log("Current time:", Date.now());
    console.log("Expiry time (ms):", session.expires_at! * 1000);
    console.log("Time until expiry (ms):", timeUntilExpiry);
    console.log("Time until expiry (minutes):", timeUntilExpiry / 1000 / 60);
    console.log("WARNING_BEFORE_EXPIRY (ms):", WARNING_BEFORE_EXPIRY);
    console.log("Time until warning (ms):", timeUntilWarning);
    console.log("Time until warning (seconds):", timeUntilWarning / 1000);
    console.log("===================================");

    if (timeUntilWarning <= 0) {
      // Already past warning time
      if (timeUntilExpiry > 0) {
        // But not expired yet, show warning immediately
        console.log("⚠️ SHOWING WARNING IMMEDIATELY");
        logger.info("Session near expiry, showing warning immediately");
        this.handleWarning();
      }
      return;
    }

    console.log(`⏰ Warning timer set for ${timeUntilWarning / 1000} seconds from now`);

    logger.debug("Setting up warning timer", {
      timeUntilWarning,
      warningAt: new Date(Date.now() + timeUntilWarning).toISOString(),
    });

    this.warningTimer = setTimeout(() => {
      console.log("🚨 WARNING TIMER FIRED!");
      logger.info("Session near expiry, showing warning");
      this.handleWarning();
    }, timeUntilWarning);
  }

  /**
   * Set up inactivity check (runs every minute)
   */
  private setupInactivityCheck(): void {
    if (!this.activityTracker) {
      return;
    }

    // Check inactivity every minute
    const checkInterval = 60 * 1000; // 1 minute

    this.inactivityCheckTimer = setInterval(() => {
      if (this.activityTracker && this.activityTracker.isInactive()) {
        logger.info("User inactive for 24 hours, triggering expiry");
        this.handleExpiry();
      }
    }, checkInterval);

    logger.debug("Inactivity check timer set up", { checkInterval });
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    if (this.inactivityCheckTimer) {
      clearInterval(this.inactivityCheckTimer);
      this.inactivityCheckTimer = null;
    }

    logger.debug("All timers cleared");
  }

  /**
   * Handle session expiry
   */
  private handleExpiry(): void {
    logger.info("Handling session expiry");

    // Stop monitoring
    this.stopMonitoring();

    // Call expiry callback
    try {
      this.onExpiry();
    } catch (error) {
      logger.error("Error in expiry callback", error);
    }
  }

  /**
   * Handle session warning
   */
  private handleWarning(): void {
    logger.info("Handling session warning");

    // Call warning callback
    try {
      this.onWarning();
    } catch (error) {
      logger.error("Error in warning callback", error);
    }
  }

  /**
   * Get session manager statistics
   */
  getStats(): {
    isMonitoring: boolean;
    hasSession: boolean;
    timeUntilExpiry: number;
    timeUntilInactivity: number;
    isNearExpiry: boolean;
    isInactive: boolean;
  } {
    return {
      isMonitoring: this.isMonitoring,
      hasSession: this.currentSession !== null,
      timeUntilExpiry: this.getTimeUntilExpiry(),
      timeUntilInactivity: this.getTimeUntilInactivity(),
      isNearExpiry: this.isNearExpiry(),
      isInactive: this.isInactive(),
    };
  }
}
