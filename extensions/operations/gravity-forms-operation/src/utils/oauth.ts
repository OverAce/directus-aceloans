/**
 * Shared OAuth utilities for Gravity Forms and GravityFlow API clients
 */

import HmacSHA1 from 'crypto-js/hmac-sha1.js';
import Base64 from 'crypto-js/enc-base64.js';

/**
 * Generate OAuth 1.0a signature for Gravity Forms/GravityFlow API
 */
export function generateOAuthSignature(
	method: string,
	url: string,
	params: Record<string, string>,
	consumerKey: string,
	consumerSecret: string
): { signature: string; timestamp: string; nonce: string } {
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const nonce = Math.random().toString(36).substring(2, 15);

	const oauthParams = {
		oauth_consumer_key: consumerKey,
		oauth_nonce: nonce,
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: timestamp,
		oauth_version: '1.0',
		...params,
	};

	// Sort parameters
	const sortedParams = Object.keys(oauthParams)
		.sort()
		.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
		.join('&');

	// Create signature base string
	const baseString = [
		method.toUpperCase(),
		encodeURIComponent(url),
		encodeURIComponent(sortedParams),
	].join('&');

	// Generate signature using HMAC-SHA1
	const signingKey = `${encodeURIComponent(consumerSecret)}&`;
	const signature = Base64.stringify(HmacSHA1(baseString, signingKey));

	return { signature, timestamp, nonce };
}
