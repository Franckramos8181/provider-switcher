/**
 * Retries an async operation with exponential backoff.
 * @param maxAttempts - Maximum retry attempts
 * @param initialDelayMs - Initial delay in ms, doubles each retry
 * @param fn - Async function to execute
 */
export async function retry<T>(
    maxAttempts: number = 3,
    initialDelayMs: number = 1000,
    fn: () => Promise<T>,
): Promise<T> {
    let lastError: Error;
    let currentDelay = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxAttempts) {
                console.log(
                    `Attempt ${attempt}/${maxAttempts} failed. Retrying in ${currentDelay}ms...`
                );
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= 2;
            }
        }
    }

    throw lastError!;
}
