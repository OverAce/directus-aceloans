import { describe, it, expect, vi } from 'vitest';
import { shouldRetry, calculateRetryDelay, delay } from '../../../src/utils/retry.js';

describe('shouldRetry', () => {
	it('returns true for 429 (rate limit)', () => {
		expect(shouldRetry(429, 0, 3)).toBe(true);
	});

	it('returns true for 5xx server errors', () => {
		expect(shouldRetry(500, 0, 3)).toBe(true);
		expect(shouldRetry(502, 0, 3)).toBe(true);
		expect(shouldRetry(503, 0, 3)).toBe(true);
		expect(shouldRetry(504, 0, 3)).toBe(true);
	});

	it('returns false for non-retryable client errors', () => {
		expect(shouldRetry(400, 0, 3)).toBe(false);
		expect(shouldRetry(401, 0, 3)).toBe(false);
		expect(shouldRetry(403, 0, 3)).toBe(false);
		expect(shouldRetry(404, 0, 3)).toBe(false);
	});

	it('returns false when attempt >= maxAttempts', () => {
		expect(shouldRetry(429, 3, 3)).toBe(false);
		expect(shouldRetry(500, 5, 3)).toBe(false);
	});

	it('returns true when attempt < maxAttempts for retryable code', () => {
		expect(shouldRetry(429, 2, 3)).toBe(true);
		expect(shouldRetry(500, 0, 1)).toBe(true);
	});
});

describe('calculateRetryDelay', () => {
	it('returns baseDelay for attempt 0', () => {
		expect(calculateRetryDelay(0, 1000)).toBe(1000);
	});

	it('doubles delay for each subsequent attempt', () => {
		expect(calculateRetryDelay(1, 1000)).toBe(2000);
		expect(calculateRetryDelay(2, 1000)).toBe(4000);
	});

	it('works with custom base delay', () => {
		expect(calculateRetryDelay(0, 500)).toBe(500);
		expect(calculateRetryDelay(1, 500)).toBe(1000);
		expect(calculateRetryDelay(2, 500)).toBe(2000);
	});
});

describe('delay', () => {
	it('resolves after the calculated delay', async () => {
		vi.useFakeTimers();
		const log = { info: vi.fn() };

		const promise = delay(0, 1000, log);
		vi.advanceTimersByTime(1000);
		await promise;

		expect(log.info).toHaveBeenCalledWith('Retrying in 1000ms...');
		vi.useRealTimers();
	});

	it('uses exponential backoff for the delay duration', async () => {
		vi.useFakeTimers();
		const log = { info: vi.fn() };

		const promise = delay(2, 1000, log);
		vi.advanceTimersByTime(4000);
		await promise;

		expect(log.info).toHaveBeenCalledWith('Retrying in 4000ms...');
		vi.useRealTimers();
	});
});
