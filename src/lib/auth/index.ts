/**
 * Auth utilities - Core infrastructure for authentication system
 * 
 * This module provides:
 * - Retry logic with exponential backoff
 * - Error classification and handling
 * - Structured logging for auth operations
 * - Profile caching with request deduplication
 * - Activity tracking for session inactivity detection
 * - Session lifecycle management with expiry warnings
 * - State machine for predictable auth state transitions
 */

// Retry utilities
export {
  retryWithBackoff,
  retryWithCondition,
  createTimeout,
  withTimeout,
  defaultRetryConfig,
  type RetryConfig,
} from "./retry";

// Error utilities
export {
  createAuthError,
  isRetryableError,
  toAuthError,
  getUserFriendlyMessage,
  isAuthFailure,
  shouldSignOut,
  AuthErrorCode,
  type AuthError,
} from "./errors";

// Logging utilities
export {
  logger,
  logOperation,
  LogLevel,
} from "./logger";

// Profile cache
export {
  ProfileCache,
  profileCache,
  type UserProfile,
  type UserRole,
} from "./ProfileCache";

// Activity tracker
export {
  ActivityTracker,
  activityTracker,
} from "./ActivityTracker";

// Session manager
export {
  SessionManager,
} from "./SessionManager";

// Auth state machine
export {
  AuthStateMachine,
  AuthState,
} from "./AuthStateMachine";
