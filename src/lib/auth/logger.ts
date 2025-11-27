/**
 * Structured logging utilities for authentication operations
 * Provides consistent logging format and conditional logging based on environment
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogContext {
  operation?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  [key: string]: any;
}

/**
 * Check if logging is enabled for the current environment
 */
function isLoggingEnabled(): boolean {
  // Enable logging in development or if explicitly enabled
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === "true"
  );
}

/**
 * Format log message with context
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: LogContext
): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level}] [Auth] ${message}${contextStr}`;
}

/**
 * Redact sensitive information from context
 */
function redactSensitiveData(context: LogContext): LogContext {
  const redacted = { ...context };

  // Redact email (show only first 2 chars and domain)
  if (redacted.email && typeof redacted.email === "string") {
    const [local, domain] = redacted.email.split("@");
    if (local && domain) {
      redacted.email = `${local.substring(0, 2)}***@${domain}`;
    }
  }

  // Remove any password fields
  delete redacted.password;
  delete redacted.token;
  delete redacted.accessToken;
  delete redacted.refreshToken;

  return redacted;
}

/**
 * Logger class for structured auth logging
 */
class AuthLogger {
  private enabled: boolean;

  constructor() {
    this.enabled = isLoggingEnabled();
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    if (!this.enabled) return;

    const safeContext = context ? redactSensitiveData(context) : undefined;
    console.debug(formatLogMessage(LogLevel.DEBUG, message, safeContext));
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.enabled) return;

    const safeContext = context ? redactSensitiveData(context) : undefined;
    console.log(formatLogMessage(LogLevel.INFO, message, safeContext));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.enabled) return;

    const safeContext = context ? redactSensitiveData(context) : undefined;
    console.warn(formatLogMessage(LogLevel.WARN, message, safeContext));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    // Always log errors, even in production
    const safeContext = context ? redactSensitiveData(context) : undefined;
    const errorDetails = error instanceof Error ? { error: error.message, stack: error.stack } : { error };
    const fullContext = { ...safeContext, ...errorDetails };

    console.error(formatLogMessage(LogLevel.ERROR, message, fullContext));
  }

  /**
   * Log operation start
   */
  startOperation(operation: string, context?: LogContext): void {
    this.info(`${operation} started`, { operation, ...context });
  }

  /**
   * Log operation success
   */
  successOperation(operation: string, duration?: number, context?: LogContext): void {
    this.info(`${operation} succeeded`, { operation, duration, ...context });
  }

  /**
   * Log operation failure
   */
  failOperation(operation: string, error: Error | unknown, context?: LogContext): void {
    this.error(`${operation} failed`, error, { operation, ...context });
  }

  /**
   * Create a timer for measuring operation duration
   */
  startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }
}

// Export singleton instance
export const logger = new AuthLogger();

/**
 * Decorator for logging async operations
 */
export function logOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const timer = logger.startTimer();
  logger.startOperation(operationName, context);

  return operation()
    .then((result) => {
      const duration = timer();
      logger.successOperation(operationName, duration, context);
      return result;
    })
    .catch((error) => {
      const duration = timer();
      logger.failOperation(operationName, error, { ...context, duration });
      throw error;
    });
}
