import type { GravityFlow } from '../gravity-flow';

// TODO: Implement GravityFlow client class (Task 03)
// This is a placeholder for the workflows endpoint

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

export interface CompleteWorkflowStepParams {
	entry_id: string | number;
	workflow_id?: string | number;
	step_id?: string | number;
	note?: string;
	assignee?: string | number;
	[key: string]: any;
}

// PLACEHOLDER: Will be implemented in Task 03
export const workflows = {
	actions: {
		list: {
			handler: async (client: GravityFlow, params: GetWorkflowsParams) => {
				// TODO: Implement workflow listing
				throw new Error('GravityFlow workflows not yet implemented - see Task 03');
			},
		},
		get: {
			handler: async (client: GravityFlow, params: GetWorkflowParams) => {
				// TODO: Implement get workflow
				throw new Error('GravityFlow workflows not yet implemented - see Task 03');
			},
		},
		complete_step: {
			handler: async (client: GravityFlow, params: CompleteWorkflowStepParams) => {
				// TODO: Implement step completion
				throw new Error('GravityFlow workflows not yet implemented - see Task 03');
			},
		},
	},
};