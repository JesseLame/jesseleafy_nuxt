<script setup lang="ts">
import { computed, ref } from 'vue';

useSeoMeta({
	title: "Set Password - Jesse's Leafy Feasts",
	description: 'Complete your invite or reset your password for Jesse\'s Leafy Feasts.',
});

type PasswordMode = 'invite' | 'recovery' | 'generic';

const route = useRoute();

const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

const { session, isLoading, updatePassword } = useAuth();

const mode = computed<PasswordMode>(() => {
	const rawMode = Array.isArray(route.query.mode) ? route.query.mode[0] : route.query.mode;

	if (rawMode === 'invite' || rawMode === 'recovery') {
		return rawMode;
	}

	return 'generic';
});

const pageCopy = computed(() => {
	if (mode.value === 'invite') {
		return {
			title: 'Create your password',
			description: 'Your invite link is ready. Choose a password to finish setting up your account.',
			buttonLabel: 'Set password',
		};
	}

	if (mode.value === 'recovery') {
		return {
			title: 'Reset your password',
			description: 'Choose a new password for your existing account.',
			buttonLabel: 'Update password',
		};
	}

	return {
		title: 'Set your password',
		description: 'Choose a password to continue with your account.',
		buttonLabel: 'Save password',
	};
});

const hasSession = computed(() => Boolean(session.value));
const canShowForm = computed(() => !isLoading.value && hasSession.value);
const showInvalidLinkState = computed(() => !isLoading.value && !hasSession.value);

const handleSubmit = async () => {
	errorMessage.value = '';

	if (!password.value || !confirmPassword.value) {
		errorMessage.value = 'Please fill in both password fields.';
		return;
	}

	if (password.value !== confirmPassword.value) {
		errorMessage.value = 'Passwords do not match.';
		return;
	}

	isSubmitting.value = true;

	try {
		await updatePassword(password.value);
		await navigateTo('/', { replace: true });
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Unable to update your password right now.';
	} finally {
		isSubmitting.value = false;
	}
};
</script>

<template>
	<div class="min-h-screen flex items-start justify-center p-6 pt-16">
		<div class="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
			<h1 class="text-3xl font-extrabold text-green-700 mb-3">
				{{ pageCopy.title }}
			</h1>
			<p class="text-gray-700 mb-6">
				{{ pageCopy.description }}
			</p>

			<div v-if="isLoading" class="text-sm text-gray-500">
				Checking your link...
			</div>

			<form v-else-if="canShowForm" class="space-y-4" @submit.prevent="handleSubmit">
				<div>
					<label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">New password</label>
					<input
						id="new-password"
						v-model="password"
						type="password"
						autocomplete="new-password"
						required
						class="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
						placeholder="Enter your new password"
					/>
				</div>

				<div>
					<label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
					<input
						id="confirm-password"
						v-model="confirmPassword"
						type="password"
						autocomplete="new-password"
						required
						class="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
						placeholder="Re-enter your new password"
					/>
				</div>

				<p v-if="errorMessage" class="text-sm text-red-600">
					{{ errorMessage }}
				</p>

				<button
					type="submit"
					:disabled="isSubmitting"
					class="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
				>
					{{ isSubmitting ? 'Saving...' : pageCopy.buttonLabel }}
				</button>
			</form>

			<div v-else-if="showInvalidLinkState" class="space-y-4">
				<p class="text-sm text-red-600">
					This link is invalid or has expired. Request a new invite or password reset email to continue.
				</p>
				<NuxtLink
					to="/login"
					class="inline-flex px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
				>
					Back to login
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
