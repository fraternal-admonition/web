/**
 * Retry utilities for authentication operations
 * Implements exponential backoff strategy for retryable operations
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Retry an async operation with exponential backoff
 * @param operation - The async operation to retry
 * @param config - Retry configuration
 * @returns The result of the operation
 * @throws The last error if all retries fail
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if this was the last attempt
      if (attempt < config.maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Increase delay for next attempt (exponential backoff)
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  // All retries failed, throw the last error
  throw lastError!;
}

/**
 * Retry an operation with a custom retry condition
 * @param operation - The async operation to retry
 * @param shouldRetry - Function to determine if error is retryable
 * @param config - Retry configuration
 * @returns The result of the operation
 */
export async function retryWithCondition<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: Error, attempt: number) => boolean,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (attempt < config.maxRetries && shouldRetry(lastError, attempt)) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      } else {
        // Either max retries reached or error is not retryable
        throw lastError;
      }
    }
  }

  throw lastError!;
}

/**
 * Create a timeout promise that rejects after a specified duration
 * @param ms - Timeout duration in milliseconds
 * @param message - Error message for timeout
 * @returns A promise that rejects after the timeout
 */
export function createTimeout(ms: number, message = "Operation timed out"): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Race an operation against a timeout
 * @param operation - The async operation to execute
 * @param timeoutMs - Timeout duration in milliseconds
 * @param timeoutMessage - Error message for timeout
 * @returns The result of the operation or timeout error
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  return Promise.race([
    operation,
    createTimeout(timeoutMs, timeoutMessage),
  ]);
}
