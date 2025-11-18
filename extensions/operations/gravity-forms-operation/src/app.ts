import { defineOperationApp } from '@directus/extensions-sdk';
import GravityFormsOptions from './options.vue';

export default defineOperationApp({
	id: 'gravity-forms-operation',
	name: 'Gravity Forms',
	icon: 'dynamic_form',
	description: 'Interact with Gravity Forms via REST API',
	overview: ({ endpoint, action }) => [
		{ label: 'Endpoint', text: endpoint },
		{ label: 'Action', text: action },
	],
	options: GravityFormsOptions as any,
});
