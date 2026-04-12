<script setup lang="ts">
import { computed, ref, watch } from 'vue';

useSeoMeta({
	title: "Login - Jesse's Leafy Feasts",
	description: 'Sign in to Jesse\'s Leafy Feasts with your email and password.',
});

const route = useRoute();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

const { isAuthenticated, isLoading, signInWithPassword } = useAuth();

const normalizeRedirectTarget = (value: string | string[] | undefined) => {
	const candidate = Array.isArray(value) ? value[0] : value;

	if (!candidate || !candidate.startsWith('/')) {
		return '/';
	}

	return candidate;
};

const redirectTarget = computed(() => normalizeRedirectTarget(route.query.redirect as string | string[] | undefined));

const redirectIfAuthenticated = async () => {
	if (!isLoading.value && isAuthenticated.value) {
		await navigateTo(redirectTarget.value, { replace: true });
	}
};

watch(
	[isLoading, isAuthenticated, isSubmitting],
	async ([loading, authenticated, submitting]) => {
		if (!loading && authenticated && !submitting) {
			await redirectIfAuthenticated();
		}
	},
	{ immediate: true }
);

const handleSubmit = async () => {
	errorMessage.value = '';

	const trimmedEmail = email.value.trim();

	if (!trimmedEmail || !password.value) {
		errorMessage.value = 'Please enter both your email and password.';
		return;
	}

	isSubmitting.value = true;

	try {
		await signInWithPassword(trimmedEmail, password.value);
		await navigateTo(redirectTarget.value, { replace: true });
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Unable to sign in right now.';
	} finally {
		isSubmitting.value = false;
	}
};
</script>

<template>
	<div class="min-h-screen flex items-start justify-center p-6 pt-16">
		<div class="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
			<h1 class="text-3xl font-extrabold text-green-700 mb-3">
				Login
			</h1>
			<p class="text-gray-700 mb-6">
				Sign in with the email and password for your Jesse's Leafy Feasts account.
			</p>

			<form class="space-y-4" @submit.prevent="handleSubmit">
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
						autocomplete="current-password"
						required
						class="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
						placeholder="Enter your password"
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
					{{ isSubmitting ? 'Signing in...' : 'Sign in' }}
				</button>
			</form>

			<p class="mt-6 text-sm text-gray-700">
				Need an account?
				<NuxtLink to="/create-account" class="font-semibold text-green-700 hover:underline">
					Create one here
				</NuxtLink>
			</p>
		</div>
	</div>
</template>
