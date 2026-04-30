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
			label: 'List Entries',
			icon: 'list',
			handler: async (client: GravityForms, params: GetEntriesParams) => {
				return await client.makeRequest('GET', 'entries', params);
			},
			options: [
				{
					field: 'form_ids',
					name: 'Form IDs',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'Comma-separated list of form IDs to filter entries',
						width: 'half',
					},
				},
				{
					field: 'status',
					name: 'Status',
					type: 'string',
					meta: {
						interface: 'select-dropdown',
						note: 'Filter entries by status',
						width: 'half',
						options: {
							choices: [
								{ text: 'Active', value: 'active' },
								{ text: 'Spam', value: 'spam' },
								{ text: 'Trash', value: 'trash' },
							],
						},
					},
				},
				{
					field: 'page',
					name: 'Page',
					type: 'integer',
					meta: {
						interface: 'input',
						note: 'Page number for pagination',
						width: 'half',
					},
				},
				{
					field: 'page_size',
					name: 'Page Size',
					type: 'integer',
					meta: {
						interface: 'input',
						note: 'Number of entries per page (max 100)',
						width: 'half',
					},
				},
			],
		},
		get: {
			label: 'Get Entry',
			icon: 'description',
			handler: async (client: GravityForms, params: GetEntryParams) => {
				const { id } = params;
				return await client.makeRequest('GET', `entries/${id}`);
			},
			options: [
				{
					field: 'id',
					name: 'Entry ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the entry to retrieve',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
			],
		},
		create: {
			label: 'Create Entry',
			icon: 'add',
			handler: async (client: GravityForms, params: CreateEntryParams) => {
				return await client.makeRequest('POST', 'entries', params);
			},
			options: [
				{
					field: 'form_id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the form to submit to',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'input_values',
					name: 'Input Values',
					type: 'json',
					meta: {
						interface: 'input-code',
						note: 'Form field values as JSON object (field_id: value)',
						width: 'full',
						required: true,
						options: {
							language: 'json',
						},
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'source_url',
					name: 'Source URL',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'URL where the form was submitted from',
						width: 'full',
					},
				},
			],
		},
		update: {
			label: 'Update Entry',
			icon: 'edit',
			handler: async (client: GravityForms, params: UpdateEntryParams) => {
				const { id, ...updateData } = params;
				return await client.makeRequest('PUT', `entries/${id}`, updateData);
			},
			options: [
				{
					field: 'id',
					name: 'Entry ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the entry to update',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'status',
					name: 'Status',
					type: 'string',
					meta: {
						interface: 'select-dropdown',
						note: 'Update entry status',
						width: 'half',
						options: {
							choices: [
								{ text: 'Active', value: 'active' },
								{ text: 'Spam', value: 'spam' },
								{ text: 'Trash', value: 'trash' },
							],
						},
					},
				},
				{
					field: 'is_starred',
					name: 'Is Starred',
					type: 'boolean',
					meta: {
						interface: 'boolean',
						note: 'Star/unstar the entry',
						width: 'half',
					},
				},
				{
					field: 'is_read',
					name: 'Is Read',
					type: 'boolean',
					meta: {
						interface: 'boolean',
						note: 'Mark entry as read/unread',
						width: 'half',
					},
				},
				{
					field: 'field_values',
					name: 'Field Values',
					type: 'json',
					meta: {
						interface: 'input-code',
						note: 'Updated field values as JSON object',
						width: 'full',
						options: {
							language: 'json',
						},
					},
				},
			],
		},
		delete: {
			label: 'Delete Entry',
			icon: 'delete',
			handler: async (client: GravityForms, params: DeleteEntryParams) => {
				const { id, force = false } = params;
				const queryParams = force ? { force: 'true' } : {};
				return await client.makeRequest('DELETE', `entries/${id}`, queryParams);
			},
			options: [
				{
					field: 'id',
					name: 'Entry ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the entry to delete',
						width: 'half',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'force',
					name: 'Force Delete',
					type: 'boolean',
					meta: {
						interface: 'boolean',
						note: 'Permanently delete (bypass trash)',
						width: 'half',
					},
				},
			],
		},
		submit: {
			label: 'Submit Form',
			icon: 'send',
			handler: async (client: GravityForms, params: CreateEntryParams) => {
				// Alias for create - more intuitive for form submissions
				return await client.makeRequest('POST', 'entries', params);
			},
			options: [
				{
					field: 'form_id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the form to submit',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'input_values',
					name: 'Form Data',
					type: 'json',
					meta: {
						interface: 'input-code',
						note: 'Form submission data as JSON object (field_id: value)',
						width: 'full',
						required: true,
						options: {
							language: 'json',
						},
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'source_url',
					name: 'Source URL',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'URL where the form was submitted from',
						width: 'full',
					},
				},
			],
		},
	},
};