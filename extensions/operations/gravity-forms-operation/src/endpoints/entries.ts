import type { GravityForms } from '../gravity-forms';

export interface GetEntriesParams {
	form_ids?: string | number | Array<string | number>;
	status?: 'active' | 'spam' | 'trash';
	created_by?: string | number;
	date_created_start?: string;
	date_created_end?: string;
	page?: number;
	page_size?: number;
	offset?: number;
	sorting?: {
		key?: string;
		direction?: 'ASC' | 'DESC';
	};
	[key: string]: any;
}

export interface GetEntryParams {
	id: string | number;
}

export interface CreateEntryParams {
	form_id: string | number;
	input_values: Record<string, any>;
	field_values?: Record<string, any>;
	source_url?: string;
	target_page?: string;
	created_by?: string | number;
	date_created?: string;
	ip?: string;
	user_agent?: string;
	[key: string]: any;
}

export interface UpdateEntryParams {
	id: string | number;
	form_id?: string | number;
	status?: 'active' | 'spam' | 'trash';
	field_values?: Record<string, any>;
	date_created?: string;
	is_starred?: boolean;
	is_read?: boolean;
	[key: string]: any;
}

export interface DeleteEntryParams {
	id: string | number;
	force?: boolean;
}

export const entries = {
	actions: {
		list: {
			handler: async (client: GravityForms, params: GetEntriesParams) => {
				return await client.makeRequest('GET', 'entries', params);
			},
		},
		get: {
			handler: async (client: GravityForms, params: GetEntryParams) => {
				const { id } = params;
				return await client.makeRequest('GET', `entries/${id}`);
			},
		},
		create: {
			handler: async (client: GravityForms, params: CreateEntryParams) => {
				return await client.makeRequest('POST', 'entries', params);
			},
		},
		update: {
			handler: async (client: GravityForms, params: UpdateEntryParams) => {
				const { id, ...updateData } = params;
				return await client.makeRequest('PUT', `entries/${id}`, updateData);
			},
		},
		delete: {
			handler: async (client: GravityForms, params: DeleteEntryParams) => {
				const { id, force = false } = params;
				const queryParams = force ? { force: 'true' } : {};
				return await client.makeRequest('DELETE', `entries/${id}`, queryParams);
			},
		},
		submit: {
			handler: async (client: GravityForms, params: CreateEntryParams) => {
				// Alias for create - more intuitive for form submissions
				return await client.makeRequest('POST', 'entries', params);
			},
		},
	},
};