/**
 * Retry Utility
 * Provides exponential backoff retry logic for API calls
 */

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry on 4xx errors (except 429 rate limit)
            if (error.status >= 400 && error.status < 500 && error.status !== 429) {
                console.error(`[Retry] 4xx error (${error.status}), not retrying:`, error.message);
                throw error;
            }

            // If this was the last attempt, throw the error
            if (attempt === maxRetries - 1) {
                console.error(`[Retry] All ${maxRetries} attempts exhausted`);
                throw error;
            }

            // Calculate exponential backoff delay
            const exponentialDelay = baseDelay * Math.pow(2, attempt);

            // Add jitter (random 0-1000ms) to prevent thundering herd
            const jitter = Math.random() * 1000;

            const totalDelay = exponentialDelay + jitter;

            console.log(
                `[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(totalDelay)}ms...`,
                error.message
            );

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, totalDelay));
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Check if an error is retryable
 * 
 * @param error - The error to check
 * @returns true if the error should be retried
 */
export function isRetryableError(error: any): boolean {
    // Retry on 5xx errors (server errors)
    if (error.status >= 500 && error.status < 600) {
        return true;
    }

    // Retry on 429 (rate limit)
    if (error.status === 429) {
        return true;
    }

    // Retry on network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        return true;
    }

    // Don't retry on 4xx errors (client errors)
    if (error.status >= 400 && error.status < 500) {
        return false;
    }

    // Retry on unknown errors (could be network issues)
    return true;
}
