import type { GravityFlow } from '../gravity-flow';

export interface GetWorkflowsParams {
	status?: 'active' | 'inactive' | 'complete';
	form_ids?: string | number | Array<string | number>;
	created_by?: string | number;
	page?: number;
	page_size?: number;
	[key: string]: any;
}

export interface GetWorkflowParams {
	id: string | number;
}

export interface CreateWorkflowParams {
	name: string;
	form_id: string | number;
	description?: string;
	[key: string]: any;
}

export interface UpdateWorkflowParams {
	id: string | number;
	name?: string;
	description?: string;
	status?: string;
	[key: string]: any;
}

export interface DeleteWorkflowParams {
	id: string | number;
	force?: boolean;
}

export interface GetWorkflowStepsParams {
	workflow_id: string | number;
}

export interface GetWorkflowStepParams {
	workflow_id: string | number;
	step_id: string | number;
}

export interface CreateWorkflowStepParams {
	workflow_id: string | number;
	type: string;
	name: string;
	[key: string]: any;
}

export interface UpdateWorkflowStepParams {
	workflow_id: string | number;
	step_id: string | number;
	[key: string]: any;
}

export interface DeleteWorkflowStepParams {
	workflow_id: string | number;
	step_id: string | number;
}

export interface GetEntryWorkflowParams {
	entry_id: string | number;
}

export interface CompleteWorkflowStepParams {
	entry_id: string | number;
	note?: string;
	assignee?: string | number;
	[key: string]: any;
}

export interface RestartWorkflowParams {
	entry_id: string | number;
}

export interface CancelWorkflowParams {
	entry_id: string | number;
}

export const workflows = {
	actions: {
		list: {
			label: 'List Workflows',
			icon: 'list',
			handler: async (client: GravityFlow, params: GetWorkflowsParams) => {
				return await client.getWorkflows(params);
			},
			options: [
				{
					field: 'status',
					name: 'Status',
					type: 'string',
					meta: {
						interface: 'select-dropdown',
						note: 'Filter workflows by status',
						width: 'half',
						options: {
							choices: [
								{ text: 'Active', value: 'active' },
								{ text: 'Inactive', value: 'inactive' },
								{ text: 'Complete', value: 'complete' },
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
			],
		},
		get: {
			label: 'Get Workflow',
			icon: 'description',
			handler: async (client: GravityFlow, params: GetWorkflowParams) => {
				const { id } = params;
				return await client.getWorkflow(id);
			},
			options: [
				{
					field: 'id',
					name: 'Workflow ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the workflow to retrieve',
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
			label: 'Create Workflow',
			icon: 'add',
			handler: async (client: GravityFlow, params: CreateWorkflowParams) => {
				return await client.createWorkflow(params);
			},
			options: [
				{
					field: 'name',
					name: 'Workflow Name',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The name of the new workflow',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'form_id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The form ID this workflow is associated with',
						width: 'half',
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
						note: 'Optional workflow description',
						width: 'full',
					},
				},
			],
		},
		update: {
			label: 'Update Workflow',
			icon: 'edit',
			handler: async (client: GravityFlow, params: UpdateWorkflowParams) => {
				const { id, ...updateData } = params;
				return await client.updateWorkflow(id, updateData);
			},
			options: [
				{
					field: 'id',
					name: 'Workflow ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the workflow to update',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'name',
					name: 'Workflow Name',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'Updated workflow name',
						width: 'half',
					},
				},
				{
					field: 'description',
					name: 'Description',
					type: 'text',
					meta: {
						interface: 'input-multiline',
						note: 'Updated workflow description',
						width: 'half',
					},
				},
			],
		},
		delete: {
			label: 'Delete Workflow',
			icon: 'delete',
			handler: async (client: GravityFlow, params: DeleteWorkflowParams) => {
				const { id, force = false } = params;
				return await client.deleteWorkflow(id, force);
			},
			options: [
				{
					field: 'id',
					name: 'Workflow ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the workflow to delete',
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
						note: 'Permanently delete',
						width: 'half',
					},
				},
			],
		},
		get_steps: {
			label: 'Get Workflow Steps',
			icon: 'stairs',
			handler: async (client: GravityFlow, params: GetWorkflowStepsParams) => {
				const { workflow_id } = params;
				return await client.getWorkflowSteps(workflow_id);
			},
			options: [
				{
					field: 'workflow_id',
					name: 'Workflow ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the workflow',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
			],
		},
		get_entry_workflow: {
			label: 'Get Entry Workflow Status',
			icon: 'info',
			handler: async (client: GravityFlow, params: GetEntryWorkflowParams) => {
				const { entry_id } = params;
				return await client.getEntryWorkflow(entry_id);
			},
			options: [
				{
					field: 'entry_id',
					name: 'Entry ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the entry to get workflow status for',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
			],
		},
		complete_step: {
			label: 'Complete Workflow Step',
			icon: 'check',
			handler: async (client: GravityFlow, params: CompleteWorkflowStepParams) => {
				const { entry_id, ...stepData } = params;
				return await client.completeWorkflowStep(entry_id, stepData);
			},
			options: [
				{
					field: 'entry_id',
					name: 'Entry ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the entry with the workflow',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'note',
					name: 'Note',
					type: 'text',
					meta: {
						interface: 'input-multiline',
						note: 'Optional note for step completion',
						width: 'full',
					},
				},
				{
					field: 'assignee',
					name: 'Assignee',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'User ID or email for next assignee',
						width: 'half',
					},
				},
			],
		},
		restart_workflow: {
			label: 'Restart Workflow',
			icon: 'restart_alt',
			handler: async (client: GravityFlow, params: RestartWorkflowParams) => {
				const { entry_id } = params;
				return await client.restartWorkflow(entry_id);
			},
			options: [
				{
					field: 'entry_id',
					name: 'Entry ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the entry to restart workflow for',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
			],
		},
		cancel_workflow: {
			label: 'Cancel Workflow',
			icon: 'cancel',
			handler: async (client: GravityFlow, params: CancelWorkflowParams) => {
				const { entry_id } = params;
				return await client.cancelWorkflow(entry_id);
			},
			options: [
				{
					field: 'entry_id',
					name: 'Entry ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the entry to cancel workflow for',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
			],
		},
	},
};