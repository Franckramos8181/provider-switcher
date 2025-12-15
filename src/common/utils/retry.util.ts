import { CustomLogger } from "../logger/custom-logger.service";

/**
 * Retries an async operation with exponential backoff.
 * @param maxAttempts - Maximum retry attempts
 * @param initialDelayMs - Initial delay in ms, doubles each retry
 * @param fn - Async function to execute
 * @param logger - Optional logger instance
 * @param context - Optional context for logging
 */
export async function retry<T>(
    maxAttempts: number = 3,
    initialDelayMs: number = 1000,
    fn: () => Promise<T>,
    logger?: CustomLogger,
    context?: string,
): Promise<T> {
    let lastError: Error;
    let currentDelay = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxAttempts) {
                logger?.warn(
                    `Retry attempt failed, retrying...`,
                    context || 'RetryUtil',
                    {
                        attempt,
                        maxAttempts,
                        delayMs: currentDelay,
                        errorMessage: lastError.message,
                    }
                );
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= 2;
            }
        }
    }

    logger?.error(
        'All retry attempts exhausted',
        lastError!.stack,
        context || 'RetryUtil',
        {
            maxAttempts,
            errorMessage: lastError!.message,
        }
    );

    throw lastError!;
}
