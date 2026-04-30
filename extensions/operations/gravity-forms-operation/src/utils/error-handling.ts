/**
 * Shared error handling utilities for Gravity Forms and GravityFlow API clients
 */

import type { APIError } from '../types';

/**
 * Parse API error response
 */
export async function parseAPIError(
	response: Response,
	endpoint: string,
	method: string
): Promise<APIError> {
	let errorDetails: any = {};

	try {
		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			errorDetails = await response.json();
		} else {
			errorDetails = { message: await response.text() };
		}
	} catch (e) {
		errorDetails = { message: response.statusText };
	}

	const apiError: APIError = {
		code: `HTTP_${response.status}`,
		message: getErrorMessage(response.status, errorDetails),
		details: errorDetails,
		endpoint,
		method,
		timestamp: new Date().toISOString(),
		statusCode: response.status,
	};

	return apiError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(statusCode: number, details: any): string {
	const detailMessage = details?.message || details?.error || '';

	switch (statusCode) {
		case 400:
			return `Bad Request: ${detailMessage || 'Invalid parameters provided'}`;
		case 401:
			return 'Authentication failed. Please check your consumer key and secret.';
		case 403:
			return 'Forbidden: You do not have permission to access this resource.';
		case 404:
			return `Resource not found: ${detailMessage || 'The requested resource does not exist'}`;
		case 429:
			return 'Rate limit exceeded. Please try again later.';
		case 500:
		case 502:
		case 503:
		case 504:
			return `Server error: ${detailMessage || 'The server encountered an error'}`;
		default:
			return `Request failed with status ${statusCode}: ${detailMessage || 'Unknown error'}`;
	}
}
