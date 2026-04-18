import type { H3Event } from 'h3';
import { createClient } from '@supabase/supabase-js';

function getServerSupabaseUrl(event: H3Event) {
	const config = useRuntimeConfig(event);
	const supabaseUrl = config.public.supabaseUrl?.trim();

	if (!supabaseUrl) {
		throw createError({
			statusCode: 503,
			statusMessage: 'Supabase is unavailable because the project URL is not configured.',
		});
	}

	return supabaseUrl;
}

export function getServerSupabaseClient(event: H3Event) {
	const config = useRuntimeConfig(event);
	const supabaseUrl = getServerSupabaseUrl(event);
	const supabasePublishableKey = config.public.supabasePublishableKey?.trim();

	if (!supabaseUrl || !supabasePublishableKey) {
		throw createError({
			statusCode: 503,
			statusMessage: 'Recipes are unavailable because Supabase is not configured.',
		});
	}

	return createClient(supabaseUrl, supabasePublishableKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

export function getServerSupabaseAdminClient(event: H3Event) {
	const config = useRuntimeConfig(event);
	const supabaseUrl = getServerSupabaseUrl(event);
	const supabaseSecretKey = config.supabaseSecretKey?.trim();

	if (!supabaseSecretKey) {
		throw createError({
			statusCode: 503,
			statusMessage: 'Admin Supabase operations are unavailable because the secret key is not configured.',
		});
	}

	return createClient(supabaseUrl, supabaseSecretKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

export const getServerSupabaseServiceRoleClient = getServerSupabaseAdminClient;
