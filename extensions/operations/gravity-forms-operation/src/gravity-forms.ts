import { createHash } from 'node:crypto';

export class GravityForms {
	private baseUrl: string;
	private consumerKey: string;
	private consumerSecret: string;
	private request: any;
	private log: any;

	constructor(baseUrl: string, consumerKey: string, consumerSecret: string, request: any, log: any) {
		this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
		this.consumerKey = consumerKey;
		this.consumerSecret = consumerSecret;
		this.request = request;
		this.log = log;
	}

	/**
	 * Generate OAuth 1.0a signature for Gravity Forms API
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

		// Generate signature
		const signingKey = `${encodeURIComponent(this.consumerSecret)}&`;
		const signature = createHash('sha1')
			.update(`${signingKey}${baseString}`, 'utf8')
			.digest('base64');

		return signature;
	}

	/**
	 * Make authenticated request to Gravity Forms API
	 */
	async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
		const url = `${this.baseUrl}/wp-json/gf/v2/${endpoint}`;
		const params: Record<string, string> = {};

		if (method === 'GET' && data) {
			Object.keys(data).forEach(key => {
				params[key] = String(data[key]);
			});
		}

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

		try {
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

			this.log.info(`Making ${method} request to: ${requestUrl}`);
			
			const response = await this.request(requestUrl, requestOptions);
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			this.log.error('Gravity Forms API request failed:', error);
			throw error;
		}
	}
}