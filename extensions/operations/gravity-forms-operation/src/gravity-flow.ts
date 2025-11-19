import HmacSHA1 from 'crypto-js/hmac-sha1.js';
import Base64 from 'crypto-js/enc-base64.js';

export interface APIError {
	code: string;
	message: string;
	details?: any;
	endpoint?: string;
	method?: string;
	timestamp?: string;
	statusCode?: number;
}

export class GravityFlow {
	private baseUrl: string;
	private consumerKey: string;
	private consumerSecret: string;
	private request: any;
	private log: any;
	private retryAttempts: number = 3;
	private retryDelay: number = 1000; // ms

	constructor(baseUrl: string, consumerKey: string, consumerSecret: string, request: any, log: any) {
		this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
		this.consumerKey = consumerKey;
		this.consumerSecret = consumerSecret;
		this.request = request;
		this.log = log;
	}

	/**
	 * Generate OAuth 1.0a signature for GravityFlow API
	 * Uses the same OAuth authentication as Gravity Forms
	 */
	private generateSignature(method: string, url: string, params: Record<string, string>): string {
		const timestamp = Math.floor(Date.now() / 1000).toString();
		const nonce = Math.random().toString(36).substring(2, 15);

		const oauthParams = {
			oauth_consumer_key: this.consumerKey,
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
		const signingKey = `${encodeURIComponent(this.consumerSecret)}&`;
		const signature = Base64.stringify(HmacSHA1(baseString, signingKey));

		return signature;
	}

	/**
	 * Parse API error response
	 */
	private async parseAPIError(response: Response, endpoint: string, method: string): Promise<APIError> {
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
			message: this.getErrorMessage(response.status, errorDetails),
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
	private getErrorMessage(statusCode: number, details: any): string {
		const detailMessage = details?.message || details?.error || '';

		switch (statusCode) {
			case 400:
				return `Bad Request: ${detailMessage || 'Invalid parameters provided'}`;
			case 401:
				return 'Authentication failed. Please check your consumer key and secret.';
			case 403:
				return 'Forbidden: You do not have permission to access this resource.';
			case 404:
				return `Workflow not found: ${detailMessage || 'The requested workflow does not exist'}`;
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

	/**
	 * Check if error should be retried
	 */
	private shouldRetry(statusCode: number, attempt: number): boolean {
		if (attempt >= this.retryAttempts) {
			return false;
		}

		// Retry on rate limiting and server errors
		const retryableStatuses = [429, 500, 502, 503, 504];
		return retryableStatuses.includes(statusCode);
	}

	/**
	 * Delay execution with exponential backoff
	 */
	private async delay(attempt: number): Promise<void> {
		const delayMs = this.retryDelay * Math.pow(2, attempt);
		this.log.info(`Retrying in ${delayMs}ms...`);
		return new Promise(resolve => setTimeout(resolve, delayMs));
	}

	/**
	 * Make authenticated request to GravityFlow API with retry logic
	 */
	async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
		const url = `${this.baseUrl}/wp-json/gravityflow/v2/${endpoint}`;
		const params: Record<string, string> = {};

		if (method === 'GET' && data) {
			Object.keys(data).forEach(key => {
				params[key] = String(data[key]);
			});
		}

		let lastError: APIError | null = null;

		for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
			try {
				const signature = this.generateSignature(method, url, params);
				const timestamp = Math.floor(Date.now() / 1000).toString();
				const nonce = Math.random().toString(36).substring(2, 15);

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

				this.log.info(`[GravityFlow API] ${method} ${endpoint}${attempt > 0 ? ` (attempt ${attempt + 1}/${this.retryAttempts})` : ''}`);

				const response = await this.request(requestUrl, requestOptions);

				if (!response.ok) {
					const apiError = await this.parseAPIError(response, endpoint, method);
					lastError = apiError;

					this.log.warn(`[GravityFlow API] Request failed: ${apiError.message}`, {
						statusCode: apiError.statusCode,
						endpoint: apiError.endpoint,
						details: apiError.details,
					});

					if (this.shouldRetry(apiError.statusCode!, attempt)) {
						await this.delay(attempt);
						continue;
					}

					throw new Error(apiError.message);
				}

				this.log.info(`[GravityFlow API] Request successful: ${method} ${endpoint}`);
				return await response.json();

			} catch (error) {
				if (lastError) {
					// If we have a parsed API error, use that
					this.log.error(`[GravityFlow API] Request failed after ${attempt + 1} attempts`, lastError);
					throw new Error(lastError.message);
				}

				// Network or other unexpected error
				this.log.error(`[GravityFlow API] Unexpected error:`, error);

				if (attempt < this.retryAttempts - 1) {
					this.log.warn(`[GravityFlow API] Retrying due to network error...`);
					await this.delay(attempt);
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

	// Workflow methods
	async getWorkflows(params?: any): Promise<any> {
		return await this.makeRequest('GET', 'workflows', params);
	}

	async getWorkflow(id: string | number): Promise<any> {
		return await this.makeRequest('GET', `workflows/${id}`);
	}

	async createWorkflow(workflow: any): Promise<any> {
		return await this.makeRequest('POST', 'workflows', workflow);
	}

	async updateWorkflow(id: string | number, workflow: any): Promise<any> {
		return await this.makeRequest('PUT', `workflows/${id}`, workflow);
	}

	async deleteWorkflow(id: string | number, force: boolean = false): Promise<any> {
		const params = force ? { force: 'true' } : {};
		return await this.makeRequest('DELETE', `workflows/${id}`, params);
	}

	// Workflow Steps methods
	async getWorkflowSteps(workflowId: string | number): Promise<any> {
		return await this.makeRequest('GET', `workflows/${workflowId}/steps`);
	}

	async getWorkflowStep(workflowId: string | number, stepId: string | number): Promise<any> {
		return await this.makeRequest('GET', `workflows/${workflowId}/steps/${stepId}`);
	}

	async createWorkflowStep(workflowId: string | number, step: any): Promise<any> {
		return await this.makeRequest('POST', `workflows/${workflowId}/steps`, step);
	}

	async updateWorkflowStep(workflowId: string | number, stepId: string | number, step: any): Promise<any> {
		return await this.makeRequest('PUT', `workflows/${workflowId}/steps/${stepId}`, step);
	}

	async deleteWorkflowStep(workflowId: string | number, stepId: string | number): Promise<any> {
		return await this.makeRequest('DELETE', `workflows/${workflowId}/steps/${stepId}`);
	}

	// Entry Workflow Actions
	async getEntryWorkflow(entryId: string | number): Promise<any> {
		return await this.makeRequest('GET', `entries/${entryId}/workflow`);
	}

	async completeWorkflowStep(entryId: string | number, stepData?: any): Promise<any> {
		return await this.makeRequest('POST', `entries/${entryId}/workflow/complete`, stepData);
	}

	async restartWorkflow(entryId: string | number): Promise<any> {
		return await this.makeRequest('POST', `entries/${entryId}/workflow/restart`);
	}

	async cancelWorkflow(entryId: string | number): Promise<any> {
		return await this.makeRequest('POST', `entries/${entryId}/workflow/cancel`);
	}
}
