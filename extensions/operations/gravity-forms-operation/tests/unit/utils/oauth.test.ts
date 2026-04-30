import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateOAuthSignature } from '../../../src/utils/oauth.js';

describe('generateOAuthSignature', () => {
	const fixedTimestamp = 1700000000000; // 2023-11-14T22:13:20Z
	const fixedRandom = 0.5; // produces "i" from .toString(36)

	beforeEach(() => {
		vi.spyOn(Date, 'now').mockReturnValue(fixedTimestamp);
		vi.spyOn(Math, 'random').mockReturnValue(fixedRandom);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns an object with signature, timestamp, and nonce', () => {
		const result = generateOAuthSignature(
			'GET',
			'https://example.com/wp-json/gf/v2/forms',
			{},
			'ck_test_key',
			'cs_test_secret',
		);

		expect(result).toHaveProperty('signature');
		expect(result).toHaveProperty('timestamp');
		expect(result).toHaveProperty('nonce');
	});

	it('timestamp is current epoch seconds as string', () => {
		const result = generateOAuthSignature(
			'GET',
			'https://example.com/wp-json/gf/v2/forms',
			{},
			'ck_key',
			'cs_secret',
		);

		expect(result.timestamp).toBe(Math.floor(fixedTimestamp / 1000).toString());
	});

	it('nonce is derived from Math.random()', () => {
		const result = generateOAuthSignature(
			'GET',
			'https://example.com/wp-json/gf/v2/forms',
			{},
			'ck_key',
			'cs_secret',
		);

		// Math.random() = 0.5 → (0.5).toString(36) = "0.i" → substring(2, 15) = "i"
		expect(result.nonce).toBe('i');
	});

	it('signature is a non-empty base64 string', () => {
		const result = generateOAuthSignature(
			'GET',
			'https://example.com/wp-json/gf/v2/forms',
			{},
			'ck_key',
			'cs_secret',
		);

		expect(result.signature).toBeTruthy();
		// Base64 characters: A-Z, a-z, 0-9, +, /, =
		expect(result.signature).toMatch(/^[A-Za-z0-9+/=]+$/);
	});

	it('is deterministic with fixed timestamp and nonce', () => {
		const args = [
			'GET',
			'https://example.com/wp-json/gf/v2/forms',
			{},
			'ck_key',
			'cs_secret',
		] as const;

		const result1 = generateOAuthSignature(...args);
		const result2 = generateOAuthSignature(...args);

		expect(result1.signature).toBe(result2.signature);
	});

	it('different URLs produce different signatures', () => {
		const common = [{}, 'ck_key', 'cs_secret'] as const;

		const result1 = generateOAuthSignature('GET', 'https://example.com/wp-json/gf/v2/forms', ...common);
		const result2 = generateOAuthSignature('GET', 'https://example.com/wp-json/gf/v2/entries', ...common);

		expect(result1.signature).not.toBe(result2.signature);
	});

	it('different HTTP methods produce different signatures', () => {
		const common = ['https://example.com/wp-json/gf/v2/forms', {}, 'ck_key', 'cs_secret'] as const;

		const result1 = generateOAuthSignature('GET', ...common);
		const result2 = generateOAuthSignature('POST', ...common);

		expect(result1.signature).not.toBe(result2.signature);
	});

	it('includes additional params in the signature base string', () => {
		const withoutParams = generateOAuthSignature(
			'GET',
			'https://example.com/wp-json/gf/v2/forms',
			{},
			'ck_key',
			'cs_secret',
		);

		const withParams = generateOAuthSignature(
			'GET',
			'https://example.com/wp-json/gf/v2/forms',
			{ page: '2', per_page: '10' },
			'ck_key',
			'cs_secret',
		);

		expect(withoutParams.signature).not.toBe(withParams.signature);
	});
});
