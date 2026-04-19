import type { User } from '@supabase/supabase-js';
import type { H3Event } from 'h3';
import { getServerSupabaseAuthenticatedClient } from '~/server/utils/supabase';

function createAdminAccessError(statusCode: number, statusMessage: string) {
	return createError({
		statusCode,
		statusMessage,
	});
}

export function getBearerAccessToken(event: H3Event) {
	const authorization = getHeader(event, 'authorization');

	if (!authorization?.startsWith('Bearer ')) {
		throw createAdminAccessError(401, 'You need to be logged in as an admin to manage recipes.');
	}

	const accessToken = authorization.slice('Bearer '.length).trim();

	if (!accessToken) {
		throw createAdminAccessError(401, 'You need to be logged in as an admin to manage recipes.');
	}

	return accessToken;
}

export async function requireServerAdminUser(event: H3Event): Promise<User> {
	const accessToken = getBearerAccessToken(event);
	const client = getServerSupabaseAuthenticatedClient(event, accessToken);
	const {
		data: { user },
		error,
	} = await client.auth.getUser(accessToken);

	if (error || !user) {
		throw createAdminAccessError(401, 'You need to be logged in as an admin to manage recipes.');
	}

	if (user.app_metadata?.role !== 'admin') {
		throw createAdminAccessError(403, 'You do not have permission to manage recipes.');
	}

	return user;
}
