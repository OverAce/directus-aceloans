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
			label: 'List Forms',
			icon: 'list',
			handler: async (client: GravityForms, params: GetFormsParams) => {
				return await client.makeRequest('GET', 'forms', params);
			},
			options: [
				{
					field: 'active',
					name: 'Active Forms Only',
					type: 'boolean',
					meta: {
						interface: 'boolean',
						note: 'Return only active forms',
						width: 'half',
					},
				},
				{
					field: 'trash',
					name: 'Include Trash',
					type: 'boolean',
					meta: {
						interface: 'boolean',
						note: 'Include trashed forms',
						width: 'half',
					},
				},
			],
		},
		get: {
			label: 'Get Form',
			icon: 'description',
			handler: async (client: GravityForms, params: GetFormParams) => {
				const { id } = params;
				return await client.makeRequest('GET', `forms/${id}`);
			},
			options: [
				{
					field: 'id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the form to retrieve',
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
			label: 'Create Form',
			icon: 'add',
			handler: async (client: GravityForms, params: CreateFormParams) => {
				return await client.makeRequest('POST', 'forms', params);
			},
			options: [
				{
					field: 'title',
					name: 'Form Title',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The title of the new form',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'description',
					name: 'Description',
					type: 'text',
					meta: {
						interface: 'input-multiline',
						note: 'Optional form description',
						width: 'full',
					},
				},
				{
					field: 'fields',
					name: 'Form Fields',
					type: 'json',
					meta: {
						interface: 'input-code',
						note: 'Form fields configuration (JSON)',
						width: 'full',
						options: {
							language: 'json',
						},
					},
				},
			],
		},
		update: {
			label: 'Update Form',
			icon: 'edit',
			handler: async (client: GravityForms, params: UpdateFormParams) => {
				const { id, ...updateData } = params;
				return await client.makeRequest('PUT', `forms/${id}`, updateData);
			},
			options: [
				{
					field: 'id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the form to update',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'title',
					name: 'Form Title',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'Updated form title',
						width: 'half',
					},
				},
				{
					field: 'description',
					name: 'Description',
					type: 'text',
					meta: {
						interface: 'input-multiline',
						note: 'Updated form description',
						width: 'half',
					},
				},
				{
					field: 'is_active',
					name: 'Is Active',
					type: 'boolean',
					meta: {
						interface: 'boolean',
						note: 'Set form active status',
						width: 'half',
					},
				},
				{
					field: 'is_trash',
					name: 'Is Trash',
					type: 'boolean',
					meta: {
						interface: 'boolean',
						note: 'Move form to trash',
						width: 'half',
					},
				},
			],
		},
		delete: {
			label: 'Delete Form',
			icon: 'delete',
			handler: async (client: GravityForms, params: DeleteFormParams) => {
				const { id, force = false } = params;
				const queryParams = force ? { force: 'true' } : {};
				return await client.makeRequest('DELETE', `forms/${id}`, queryParams);
			},
			options: [
				{
					field: 'id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the form to delete',
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
	},
};