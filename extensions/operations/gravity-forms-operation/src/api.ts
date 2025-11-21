/// <reference types="@directus/extensions/api.d.ts" />
import { defineOperationApi } from '@directus/extensions-sdk';
import { log, request } from 'directus:api';
import { forms, entries, notifications, workflows } from './endpoints';
import { GravityForms } from './gravity-forms';
import { GravityFlow } from './gravity-flow';

export interface Options {
	baseUrl: string;
	consumerKey: string;
	consumerSecret: string;
	endpoint: string;
	action: string;
	[key: string]: any;
}

const endpoints = {
	forms,
	entries,
	notifications,
	workflows,
};

export default defineOperationApi<Options>({
	id: 'gravity-forms-operation',
	handler: async (options) => {
		const { endpoint, action, baseUrl, consumerKey, consumerSecret, ...params } = options;

		// Use GravityFlow client for workflows endpoint, GravityForms for others
		const client = endpoint === 'workflows'
			? new GravityFlow(baseUrl, consumerKey, consumerSecret, request, log)
			: new GravityForms(baseUrl, consumerKey, consumerSecret, request, log);

		const selectedEndpoint = endpoints[endpoint as keyof typeof endpoints];

		if (!selectedEndpoint) {
			throw new Error(`Unsupported endpoint: ${endpoint}`);
		}

		const selectedAction = selectedEndpoint.actions[action as keyof typeof selectedEndpoint.actions];

		if (!selectedAction) {
			throw new Error(`Unsupported action: ${action} for endpoint: ${endpoint}`);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		return (selectedAction as { handler: Function }).handler(client, params);
	},
});
