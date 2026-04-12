<script setup lang="ts">
import { computed, ref, watch } from 'vue';

useSeoMeta({
	title: "Create Account - Jesse's Leafy Feasts",
	description: 'Create your Jesse\'s Leafy Feasts account and confirm your email to get started.',
});

const route = useRoute();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);
const hasSubmitted = ref(false);

const { isAuthenticated, isLoading, signUp } = useAuth();

const redirectTarget = computed(() => {
	const value = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect;

	if (!value || !value.startsWith('/')) {
		return '/';
	}

	return value;
});

watch(
	[isLoading, isAuthenticated, isSubmitting, hasSubmitted],
	async ([loading, authenticated, submitting, submitted]) => {
		if (!loading && authenticated && !submitting && !submitted) {
			await navigateTo(redirectTarget.value, { replace: true });
		}
	},
	{ immediate: true }
);

const handleSubmit = async () => {
	errorMessage.value = '';

	const trimmedName = name.value.trim();
	const trimmedEmail = email.value.trim();

	if (!trimmedName || !trimmedEmail || !password.value || !confirmPassword.value) {
		errorMessage.value = 'Please fill in your name, email, and both password fields.';
		return;
	}

	if (password.value !== confirmPassword.value) {
		errorMessage.value = 'Passwords do not match.';
		return;
	}

	isSubmitting.value = true;

	try {
		await signUp({
			name: trimmedName,
			email: trimmedEmail,
			password: password.value,
		});

		hasSubmitted.value = true;
		name.value = '';
		email.value = '';
		password.value = '';
		confirmPassword.value = '';
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Unable to create your account right now.';
	} finally {
		isSubmitting.value = false;
	}
};
</script>

<template>
	<div class="min-h-screen flex items-start justify-center p-6 pt-16">
		<div class="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
			<h1 class="text-3xl font-extrabold text-green-700 mb-3">
				Create account
			</h1>
			<p class="text-gray-700 mb-6">
				Create your account with a display name, email address, and password.
			</p>

			<div v-if="hasSubmitted" class="space-y-4">
				<p class="text-sm text-gray-700">
					If this email can be used, check your inbox for the confirmation link to finish creating your account.
				</p>
				<NuxtLink
					to="/login"
					class="inline-flex px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
				>
					Back to login
				</NuxtLink>
			</div>

			<form v-else class="space-y-4" @submit.prevent="handleSubmit">
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
					<input
						id="name"
						v-model="name"
						type="text"
						autocomplete="name"
						required
						class="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
						placeholder="Your display name"
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
					<input
						id="email"
						v-model="email"
						type="email"
						autocomplete="email"
						required
						class="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
					<input
						id="password"
						v-model="password"
						type="password"
						autocomplete="new-password"
						required
						class="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
						placeholder="Choose a password"
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
						placeholder="Re-enter your password"
					/>
				</div>

				<p v-if="isLoading && !isSubmitting" class="text-sm text-gray-500">
					Checking your session...
				</p>

				<p v-if="errorMessage" class="text-sm text-red-600">
					{{ errorMessage }}
				</p>

				<button
					type="submit"
					:disabled="isLoading || isSubmitting"
					class="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
				>
					{{ isSubmitting ? 'Creating account...' : 'Create account' }}
				</button>
			</form>
		</div>
	</div>
</template>
