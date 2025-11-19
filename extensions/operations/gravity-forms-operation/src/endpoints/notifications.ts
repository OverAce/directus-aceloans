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
			label: 'List Notifications',
			icon: 'list',
			handler: async (client: GravityForms, params: GetNotificationsParams) => {
				const { form_id } = params;
				return await client.makeRequest('GET', `forms/${form_id}/notifications`);
			},
			options: [
				{
					field: 'form_id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the form to get notifications for',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
			],
		},
		get: {
			label: 'Get Notification',
			icon: 'description',
			handler: async (client: GravityForms, params: GetNotificationParams) => {
				const { form_id, notification_id } = params;
				return await client.makeRequest('GET', `forms/${form_id}/notifications/${notification_id}`);
			},
			options: [
				{
					field: 'form_id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the form',
						width: 'half',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'notification_id',
					name: 'Notification ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the notification to retrieve',
						width: 'half',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
			],
		},
		send: {
			label: 'Send Notification',
			icon: 'send',
			handler: async (client: GravityForms, params: SendNotificationParams) => {
				const { form_id, entry_id, notification_id, ...notificationData } = params;
				return await client.makeRequest(
					'POST',
					`forms/${form_id}/entries/${entry_id}/notifications/${notification_id}`,
					notificationData
				);
			},
			options: [
				{
					field: 'form_id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the form',
						width: 'half',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'entry_id',
					name: 'Entry ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the entry',
						width: 'half',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'notification_id',
					name: 'Notification ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the notification to send',
						width: 'full',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'send_to',
					name: 'Send To',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'Override recipient email address',
						width: 'half',
					},
				},
				{
					field: 'from_name',
					name: 'From Name',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'Override sender name',
						width: 'half',
					},
				},
				{
					field: 'from_email',
					name: 'From Email',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'Override sender email address',
						width: 'half',
					},
				},
				{
					field: 'reply_to',
					name: 'Reply To',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'Override reply-to email address',
						width: 'half',
					},
				},
				{
					field: 'subject',
					name: 'Subject',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'Override email subject',
						width: 'full',
					},
				},
				{
					field: 'message',
					name: 'Message',
					type: 'text',
					meta: {
						interface: 'input-multiline',
						note: 'Override email message body',
						width: 'full',
					},
				},
			],
		},
		resend: {
			label: 'Resend Notification',
			icon: 'refresh',
			handler: async (client: GravityForms, params: SendNotificationParams) => {
				// Alias for send - useful for retry scenarios
				const { form_id, entry_id, notification_id, ...notificationData } = params;
				return await client.makeRequest(
					'POST',
					`forms/${form_id}/entries/${entry_id}/notifications/${notification_id}`,
					notificationData
				);
			},
			options: [
				{
					field: 'form_id',
					name: 'Form ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the form',
						width: 'half',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'entry_id',
					name: 'Entry ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the entry',
						width: 'half',
						required: true,
					},
					schema: {
						is_nullable: false,
					},
				},
				{
					field: 'notification_id',
					name: 'Notification ID',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'The ID of the notification to resend',
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