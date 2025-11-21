/**
 * Shared retry logic utilities for Gravity Forms and GravityFlow API clients
 */

/**
 * Check if error should be retried
 */
export function shouldRetry(statusCode: number, attempt: number, maxAttempts: number): boolean {
	if (attempt >= maxAttempts) {
		return false;
	}

	// Retry on rate limiting and server errors
	const retryableStatuses = [429, 500, 502, 503, 504];
	return retryableStatuses.includes(statusCode);
}

/**
 * Calculate delay for retry with exponential backoff
 */
export function calculateRetryDelay(attempt: number, baseDelay: number): number {
	return baseDelay * Math.pow(2, attempt);
}

/**
 * Delay execution with exponential backoff
 */
export async function delay(attempt: number, baseDelay: number, log: any): Promise<void> {
	const delayMs = calculateRetryDelay(attempt, baseDelay);
	log.info(`Retrying in ${delayMs}ms...`);
	return new Promise(resolve => setTimeout(resolve, delayMs));
}
