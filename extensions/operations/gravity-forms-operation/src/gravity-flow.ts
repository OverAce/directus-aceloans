import type { APIError } from './types';
import { generateOAuthSignature } from './utils/oauth';
import { parseAPIError } from './utils/error-handling';
import { shouldRetry, delay } from './utils/retry';

export class GravityFlow {
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

				this.log.info(`[GravityFlow API] ${method} ${endpoint}${attempt > 0 ? ` (attempt ${attempt + 1}/${this.retryAttempts})` : ''}`);

				const response = await this.request(requestUrl, requestOptions);

				if (!response.ok) {
					const apiError = await parseAPIError(response, endpoint, method);
					lastError = apiError;

					this.log.warn(`[GravityFlow API] Request failed: ${apiError.message}`, {
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
