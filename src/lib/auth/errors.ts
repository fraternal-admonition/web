/**
 * Error classification and handling utilities for authentication
 */

export enum AuthErrorCode {
  PROFILE_FETCH_FAILED = "PROFILE_FETCH_FAILED",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  NETWORK_ERROR = "NETWORK_ERROR",
  BANNED_USER = "BANNED_USER",
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  TIMEOUT = "TIMEOUT",
  RATE_LIMITED = "RATE_LIMITED",
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  retryable: boolean;
  timestamp: Date;
  context?: {
    operation?: string;
    userId?: string;
    details?: any;
  };
}

/**
 * Create a standardized auth error
 */
export function createAuthError(
  code: AuthErrorCode,
  message: string,
  retryable: boolean,
  context?: AuthError["context"]
): AuthError {
  return {
    code,
    message,
    retryable,
    timestamp: new Date(),
    context,
  };
}

/**
 * Check if an error is retryable based on its type
 */
export function isRetryableError(error: Error | AuthError): boolean {
  // If it's already an AuthError, use its retryable flag
  if ("retryable" in error) {
    return error.retryable;
  }

  const message = error.message.toLowerCase();

  // Network errors are retryable
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("connection")
  ) {
    return true;
  }

  // Rate limiting is retryable
  if (message.includes("rate limit") || message.includes("429")) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (message.includes("500") || message.includes("502") || message.includes("503")) {
    return true;
  }

  // Profile fetch failures are retryable
  if (message.includes("profile") && message.includes("fetch")) {
    return true;
  }

  // Default to not retryable
  return false;
}

/**
 * Convert a generic error to an AuthError
 */
export function toAuthError(
  error: unknown,
  operation?: string
): AuthError {
  // Already an AuthError
  if (error && typeof error === "object" && "code" in error && "retryable" in error) {
    return error as AuthError;
  }

  // Convert Error to AuthError
  if (error instanceof Error) {
    const message = error.message;
    const retryable = isRetryableError(error);

    // Classify the error
    let code = AuthErrorCode.UNKNOWN_ERROR;

    if (message.includes("timeout")) {
      code = AuthErrorCode.TIMEOUT;
    } else if (message.includes("network") || message.includes("fetch failed")) {
      code = AuthErrorCode.NETWORK_ERROR;
    } else if (message.includes("rate limit") || message.includes("429")) {
      code = AuthErrorCode.RATE_LIMITED;
    } else if (message.includes("banned")) {
      code = AuthErrorCode.BANNED_USER;
    } else if (message.includes("unauthorized") || message.includes("401")) {
      code = AuthErrorCode.UNAUTHORIZED;
    } else if (message.includes("credentials") || message.includes("password")) {
      code = AuthErrorCode.INVALID_CREDENTIALS;
    } else if (message.includes("verify") && message.includes("email")) {
      code = AuthErrorCode.EMAIL_NOT_VERIFIED;
    } else if (message.includes("session") && message.includes("expired")) {
      code = AuthErrorCode.SESSION_EXPIRED;
    } else if (message.includes("profile")) {
      code = AuthErrorCode.PROFILE_FETCH_FAILED;
    }

    return createAuthError(code, message, retryable, { operation });
  }

  // Unknown error type
  return createAuthError(
    AuthErrorCode.UNKNOWN_ERROR,
    String(error),
    false,
    { operation }
  );
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyMessage(error: AuthError): string {
  switch (error.code) {
    case AuthErrorCode.NETWORK_ERROR:
      return "Network error. Please check your connection and try again.";
    case AuthErrorCode.TIMEOUT:
      return "The request timed out. Please try again.";
    case AuthErrorCode.RATE_LIMITED:
      return "Too many requests. Please wait a moment and try again.";
    case AuthErrorCode.INVALID_CREDENTIALS:
      return "Invalid email or password. Please try again.";
    case AuthErrorCode.EMAIL_NOT_VERIFIED:
      return "Please verify your email before signing in.";
    case AuthErrorCode.BANNED_USER:
      return "Your account has been suspended. Please contact support.";
    case AuthErrorCode.UNAUTHORIZED:
      return "You don't have permission to access this resource.";
    case AuthErrorCode.SESSION_EXPIRED:
      return "Your session has expired. Please sign in again.";
    case AuthErrorCode.PROFILE_FETCH_FAILED:
      return "Failed to load your profile. Please try again.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
}

/**
 * Check if an error code represents a non-retryable auth failure
 */
export function isAuthFailure(code: AuthErrorCode): boolean {
  return [
    AuthErrorCode.INVALID_CREDENTIALS,
    AuthErrorCode.EMAIL_NOT_VERIFIED,
    AuthErrorCode.BANNED_USER,
    AuthErrorCode.UNAUTHORIZED,
  ].includes(code);
}

/**
 * Check if an error should trigger a sign out
 */
export function shouldSignOut(error: AuthError): boolean {
  return [
    AuthErrorCode.SESSION_EXPIRED,
    AuthErrorCode.BANNED_USER,
    AuthErrorCode.UNAUTHORIZED,
  ].includes(error.code);
}
