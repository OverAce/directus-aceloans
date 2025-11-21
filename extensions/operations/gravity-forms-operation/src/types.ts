/**
 * Shared types for Gravity Forms and GravityFlow API clients
 */

export interface APIError {
	code: string;
	message: string;
	details?: any;
	endpoint?: string;
	method?: string;
	timestamp?: string;
	statusCode?: number;
}
