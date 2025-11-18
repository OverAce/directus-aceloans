import type { GravityForms } from '../gravity-forms';

export interface GetFormsParams {
	active?: boolean;
	trash?: boolean;
	is_active?: boolean;
	is_trash?: boolean;
}

export interface GetFormParams {
	id: string | number;
}

export interface CreateFormParams {
	title: string;
	description?: string;
	labelPlacement?: string;
	descriptionPlacement?: string;
	button?: {
		type?: string;
		text?: string;
		imageUrl?: string;
	};
	fields?: any[];
	version?: string;
	[key: string]: any;
}

export interface UpdateFormParams {
	id: string | number;
	title?: string;
	description?: string;
	is_active?: boolean;
	is_trash?: boolean;
	[key: string]: any;
}

export interface DeleteFormParams {
	id: string | number;
	force?: boolean;
}

export const forms = {
	actions: {
		list: {
			handler: async (client: GravityForms, params: GetFormsParams) => {
				return await client.makeRequest('GET', 'forms', params);
			},
		},
		get: {
			handler: async (client: GravityForms, params: GetFormParams) => {
				const { id } = params;
				return await client.makeRequest('GET', `forms/${id}`);
			},
		},
		create: {
			handler: async (client: GravityForms, params: CreateFormParams) => {
				return await client.makeRequest('POST', 'forms', params);
			},
		},
		update: {
			handler: async (client: GravityForms, params: UpdateFormParams) => {
				const { id, ...updateData } = params;
				return await client.makeRequest('PUT', `forms/${id}`, updateData);
			},
		},
		delete: {
			handler: async (client: GravityForms, params: DeleteFormParams) => {
				const { id, force = false } = params;
				const queryParams = force ? { force: 'true' } : {};
				return await client.makeRequest('DELETE', `forms/${id}`, queryParams);
			},
		},
	},
};