<script setup lang="ts">
import type { Field, FieldMeta } from '@directus/types';
import type { Options as GravityFormsOptions } from './api';
import { computed, ref, watch } from 'vue';
import { forms, entries, notifications, workflows } from './endpoints';

type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

type FlexibleFieldMeta = PartialExcept<FieldMeta, 'interface'>;

type FlexibleField = {
	field: string;
	name?: string;
	type?: string;
	meta: FlexibleFieldMeta;
} & Partial<Omit<Field, 'meta'>>;

const props = withDefaults(
	defineProps<{
		value: GravityFormsOptions;
	}>(),
	{
		value: () => ({
			baseUrl: '',
			consumerKey: '',
			consumerSecret: '',
			endpoint: '',
			action: '',
		}),
	},
);

const emit = defineEmits<{
	(e: 'input', value: Record<string, any>): void;
}>();

const endpoints = {
	forms,
	entries,
	notifications,
	workflows,
};

const formValues = ref<GravityFormsOptions>(props.value);

const endpoint = computed(() => formValues.value.endpoint || '');
const action = computed(() => formValues.value.action || '');

const actionChoices = computed(() => {
	const selectedEndpoint = endpoints[endpoint.value as keyof typeof endpoints];
	if (!selectedEndpoint)
		return [];

	return Object.entries(selectedEndpoint.actions).map(([key, value]) => ({
		text: value.label,
		value: key,
		icon: value.icon,
	}));
});

const staticFields: FlexibleField[] = [
	{
		field: 'info',
		type: 'alias',
		meta: {
			width: 'full',
			interface: 'presentation-notice',
			options: {
				icon: 'dynamic_form',
				text: 'Gravity Forms REST API integration for Directus Flows. Manage forms, entries, and notifications.',
			},
		},
	},
	{
		field: 'baseUrl',
		name: 'WordPress Site URL',
		type: 'string',
		meta: {
			interface: 'input',
			note: 'The base URL of your WordPress site (e.g., https://example.com)',
			options: {
				placeholder: 'https://your-site.com',
			},
		},
	},
	{
		field: 'consumerKey',
		name: 'Consumer Key',
		type: 'string',
		meta: {
			interface: 'input',
			note: 'The OAuth consumer key for Gravity Forms REST API access',
			options: {
				masked: true,
			},
		},
	},
	{
		field: 'consumerSecret',
		name: 'Consumer Secret',
		type: 'string',
		meta: {
			interface: 'input',
			note: 'The OAuth consumer secret for Gravity Forms REST API access',
			options: {
				masked: true,
			},
		},
	},
	{
		field: 'endpoint',
		name: 'Endpoint',
		type: 'string',
		meta: {
			width: 'half',
			interface: 'select-dropdown',
			note: 'The Gravity Forms API endpoint to interact with',
			options: {
				choices: [
					{ text: 'Forms', value: 'forms', icon: 'dynamic_form' },
					{ text: 'Entries', value: 'entries', icon: 'list_alt' },
					{ text: 'Notifications', value: 'notifications', icon: 'notifications' },
					{ text: 'Workflows', value: 'workflows', icon: 'account_tree' },
				],
			},
		},
	},
	{
		field: 'action',
		name: 'Action',
		type: 'string',
		meta: {
			width: 'half',
			note: 'The action to perform via the API.',
			interface: 'select-dropdown',
			options: {
				choices: actionChoices,
			},
		},
	},
];

const dynamicFields = computed(() => {
	if (!endpoint.value || !action.value)
		return [];

	const selectedEndpoint = endpoints[endpoint.value as keyof typeof endpoints];
	if (!selectedEndpoint)
		return [];

	return selectedEndpoint.actions[action.value]?.options || [];
});

const allFields = computed(() => {
	return [...staticFields, ...dynamicFields.value];
});

watch(
	formValues,
	(newValues) => {
		emit('input', newValues);
	},
	{ deep: true },
);

watch(
	() => props.value,
	(newValue) => {
		if (newValue !== null && JSON.stringify(newValue) !== JSON.stringify(formValues.value)) {
			formValues.value = { ...newValue };
		}
	},
	{ deep: true },
);
</script>

<template>
	<v-form v-model="formValues" :fields="allFields" primary-key="+" />
</template>
