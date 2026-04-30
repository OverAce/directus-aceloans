import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../../../src/utils/error-handling.js';

describe('getErrorMessage', () => {
	it('returns bad request message for 400', () => {
		const msg = getErrorMessage(400, { message: 'Missing form_id' });
		expect(msg).toBe('Bad Request: Missing form_id');
	});

	it('returns fallback bad request message when no detail provided', () => {
		const msg = getErrorMessage(400, {});
		expect(msg).toBe('Bad Request: Invalid parameters provided');
	});

	it('returns authentication failure for 401', () => {
		const msg = getErrorMessage(401, {});
		expect(msg).toBe('Authentication failed. Please check your consumer key and secret.');
	});

	it('returns forbidden message for 403', () => {
		const msg = getErrorMessage(403, {});
		expect(msg).toBe('Forbidden: You do not have permission to access this resource.');
	});

	it('returns not found message for 404 with detail', () => {
		const msg = getErrorMessage(404, { message: 'Form 99 not found' });
		expect(msg).toBe('Resource not found: Form 99 not found');
	});

	it('returns not found fallback for 404 without detail', () => {
		const msg = getErrorMessage(404, {});
		expect(msg).toBe('Resource not found: The requested resource does not exist');
	});

	it('returns rate limit message for 429', () => {
		const msg = getErrorMessage(429, {});
		expect(msg).toBe('Rate limit exceeded. Please try again later.');
	});

	it('returns server error for 500-504', () => {
		for (const code of [500, 502, 503, 504]) {
			const msg = getErrorMessage(code, { message: 'Internal failure' });
			expect(msg).toBe('Server error: Internal failure');
		}
	});

	it('returns server error fallback when no detail provided', () => {
		const msg = getErrorMessage(500, {});
		expect(msg).toBe('Server error: The server encountered an error');
	});

	it('returns generic message for unknown status codes', () => {
		const msg = getErrorMessage(418, { message: "I'm a teapot" });
		expect(msg).toBe("Request failed with status 418: I'm a teapot");
	});

	it('uses error field as fallback when message is absent', () => {
		const msg = getErrorMessage(400, { error: 'invalid_request' });
		expect(msg).toBe('Bad Request: invalid_request');
	});
});
