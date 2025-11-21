import type { APIError } from './types';
import { generateOAuthSignature } from './utils/oauth';
import { parseAPIError } from './utils/error-handling';
import { shouldRetry, delay } from './utils/retry';

export class GravityForms {
	private baseUrl: string;
	private consumerKey: string;
	private consumerSecret: string;
	private request: any;
	private log: any;
	private retryAttempts: number;
	private retryDelay: number; // ms

	constructor(
		baseUrl: string,
		consumerKey: string,
		consumerSecret: string,
		request: any,
		log: any,
		retryAttempts: number = 3,
		retryDelay: number = 1000
	) {
		this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
		this.consumerKey = consumerKey;
		this.consumerSecret = consumerSecret;
		this.request = request;
		this.log = log;
		this.retryAttempts = retryAttempts;
		this.retryDelay = retryDelay;
	}

	/**
	 * Make authenticated request to Gravity Forms API with retry logic
	 */
	async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
		const url = `${this.baseUrl}/wp-json/gf/v2/${endpoint}`;
		const params: Record<string, string> = {};

		if (method === 'GET' && data) {
			Object.keys(data).forEach(key => {
				params[key] = String(data[key]);
			});
		}

		let lastError: APIError | null = null;

		for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
			try {
				const { signature, timestamp, nonce } = generateOAuthSignature(
					method,
					url,
					params,
					this.consumerKey,
					this.consumerSecret
				);

				const authHeader = [
					`oauth_consumer_key="${this.consumerKey}"`,
					`oauth_nonce="${nonce}"`,
					`oauth_signature="${encodeURIComponent(signature)}"`,
					'oauth_signature_method="HMAC-SHA1"',
					`oauth_timestamp="${timestamp}"`,
					'oauth_version="1.0"',
				].join(', ');

				const headers = {
					'Authorization': `OAuth ${authHeader}`,
					'Content-Type': 'application/json',
				};

				const requestOptions: any = {
					method,
					headers,
				};

				if (method !== 'GET' && data) {
					requestOptions.body = JSON.stringify(data);
				}

				let requestUrl = url;
				if (method === 'GET' && Object.keys(params).length > 0) {
					const queryString = Object.keys(params)
						.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
						.join('&');
					requestUrl += `?${queryString}`;
				}

				this.log.info(`[Gravity Forms API] ${method} ${endpoint}${attempt > 0 ? ` (attempt ${attempt + 1}/${this.retryAttempts})` : ''}`);

				const response = await this.request(requestUrl, requestOptions);

				if (!response.ok) {
					const apiError = await parseAPIError(response, endpoint, method);
					lastError = apiError;

					this.log.warn(`[Gravity Forms API] Request failed: ${apiError.message}`, {
						statusCode: apiError.statusCode,
						endpoint: apiError.endpoint,
						details: apiError.details,
					});

					if (apiError.statusCode !== undefined && shouldRetry(apiError.statusCode, attempt, this.retryAttempts)) {
						await delay(attempt, this.retryDelay, this.log);
						continue;
					}

					throw new Error(apiError.message);
				}

				this.log.info(`[Gravity Forms API] Request successful: ${method} ${endpoint}`);
				return await response.json();

			} catch (error) {
				if (lastError) {
					// If we have a parsed API error, use that
					this.log.error(`[Gravity Forms API] Request failed after ${attempt + 1} attempts`, lastError);
					throw new Error(lastError.message);
				}

				// Network or other unexpected error
				this.log.error(`[Gravity Forms API] Unexpected error:`, error);

				if (attempt < this.retryAttempts - 1) {
					this.log.warn(`[Gravity Forms API] Retrying due to network error...`);
					await delay(attempt, this.retryDelay, this.log);
					continue;
				}

				throw error;
			}
		}

		// Should not reach here, but just in case
		if (lastError) {
			throw new Error(lastError.message);
		}

		throw new Error('Request failed after maximum retry attempts');
	}
}