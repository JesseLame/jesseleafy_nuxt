import { computed } from 'vue';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

export function useAuth() {
	const session = useState<Session | null>('auth-session', () => null);
	const user = useState<User | null>('auth-user', () => null);
	const isLoading = useState<boolean>('auth-loading', () => false);

	const supabase = import.meta.client ? (useNuxtApp().$supabase as SupabaseClient | null) : null;

	const isAuthenticated = computed(() => Boolean(user.value));
	const isAdmin = computed(() => user.value?.app_metadata?.role === 'admin');

	const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
		if (!supabase) {
			throw new Error('Account creation is unavailable because Supabase auth is not configured.');
		}

		isLoading.value = true;

		try {
			const emailRedirectTo = `${window.location.origin}/`;
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						name,
					},
					emailRedirectTo,
				},
			});

			if (error) {
				throw error;
			}

			session.value = data.session;
			user.value = data.session?.user ?? null;

			return data;
		} finally {
			isLoading.value = false;
		}
	};

	const signInWithPassword = async (email: string, password: string) => {
		if (!supabase) {
			throw new Error('Login is unavailable because Supabase auth is not configured.');
		}

		isLoading.value = true;

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				throw error;
			}

			session.value = data.session;
			user.value = data.user;

			return data;
		} finally {
			isLoading.value = false;
		}
	};

	const signOut = async () => {
		if (!supabase) {
			session.value = null;
			user.value = null;
			return;
		}

		isLoading.value = true;

		try {
			const { error } = await supabase.auth.signOut();

			if (error) {
				throw error;
			}

			session.value = null;
			user.value = null;
		} finally {
			isLoading.value = false;
		}
	};

	const updatePassword = async (password: string) => {
		if (!supabase) {
			throw new Error('Password updates are unavailable because Supabase auth is not configured.');
		}

		isLoading.value = true;

		try {
			const { data, error } = await supabase.auth.updateUser({
				password,
			});

			if (error) {
				throw error;
			}

			user.value = data.user;

			return data;
		} finally {
			isLoading.value = false;
		}
	};

	return {
		user,
		session,
		isAuthenticated,
		isAdmin,
		isLoading,
		signUp,
		signInWithPassword,
		signOut,
		updatePassword,
	};
}
