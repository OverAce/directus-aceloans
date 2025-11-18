import type { GravityForms } from '../gravity-forms';

export interface SendNotificationParams {
	form_id: string | number;
	entry_id: string | number;
	notification_id: string;
	send_to?: string;
	from_name?: string;
	from_email?: string;
	reply_to?: string;
	bcc?: string;
	subject?: string;
	message?: string;
	routing?: Array<{
		email: string;
		operator: string;
		value: string;
		field_id: string;
	}>;
	[key: string]: any;
}

export interface GetNotificationsParams {
	form_id: string | number;
}

export interface GetNotificationParams {
	form_id: string | number;
	notification_id: string;
}

export const notifications = {
	actions: {
		list: {
			handler: async (client: GravityForms, params: GetNotificationsParams) => {
				const { form_id } = params;
				return await client.makeRequest('GET', `forms/${form_id}/notifications`);
			},
		},
		get: {
			handler: async (client: GravityForms, params: GetNotificationParams) => {
				const { form_id, notification_id } = params;
				return await client.makeRequest('GET', `forms/${form_id}/notifications/${notification_id}`);
			},
		},
		send: {
			handler: async (client: GravityForms, params: SendNotificationParams) => {
				const { form_id, entry_id, notification_id, ...notificationData } = params;
				return await client.makeRequest(
					'POST', 
					`forms/${form_id}/entries/${entry_id}/notifications/${notification_id}`,
					notificationData
				);
			},
		},
		resend: {
			handler: async (client: GravityForms, params: SendNotificationParams) => {
				// Alias for send - useful for retry scenarios
				const { form_id, entry_id, notification_id, ...notificationData } = params;
				return await client.makeRequest(
					'POST', 
					`forms/${form_id}/entries/${entry_id}/notifications/${notification_id}`,
					notificationData
				);
			},
		},
	},
};