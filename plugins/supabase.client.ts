import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';

export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig();

	const session = useState<Session | null>('auth-session', () => null);
	const user = useState<User | null>('auth-user', () => null);
	const isLoading = useState<boolean>('auth-loading', () => true);

	const supabaseUrl = config.public.supabaseUrl;
	const supabaseAnonKey = config.public.supabaseAnonKey;

	if (!supabaseUrl || !supabaseAnonKey) {
		session.value = null;
		user.value = null;
		isLoading.value = false;

		return {
			provide: {
				supabase: null as SupabaseClient | null,
			},
		};
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			autoRefreshToken: true,
			detectSessionInUrl: true,
			persistSession: true,
		},
	});

	const applySession = (nextSession: Session | null) => {
		session.value = nextSession;
		user.value = nextSession?.user ?? null;
		isLoading.value = false;
	};

	void supabase.auth
		.getSession()
		.then(({ data }) => {
			applySession(data.session);
		})
		.catch(() => {
			applySession(null);
		});

	supabase.auth.onAuthStateChange((_event, nextSession) => {
		applySession(nextSession);
	});

	return {
		provide: {
			supabase,
		},
	};
});
