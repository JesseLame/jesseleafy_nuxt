import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	AdminRecipeListParams,
	AdminRecipeListResponse,
	AdminRecipeRecord,
	AdminRecipeUpdatePayload,
} from '~/types/recipe';

function getSupabaseClient() {
	return import.meta.client ? (useNuxtApp().$supabase as SupabaseClient | null) : null;
}

function requireSupabaseClient() {
	const client = getSupabaseClient();

	if (!client) {
		throw new Error('Recipe admin is unavailable because Supabase is not configured.');
	}

	return client;
}

export function useRecipeAdmin() {
	const requireAdminHeaders = async () => {
		const client = requireSupabaseClient();
		const {
			data: { session },
		} = await client.auth.getSession();

		if (!session?.access_token) {
			throw new Error('You need to be logged in as an admin to manage recipes.');
		}

		return {
			Authorization: `Bearer ${session.access_token}`,
		};
	};

	const listRecipes = async (params: AdminRecipeListParams = {}) => {
		return $fetch<AdminRecipeListResponse>('/api/admin/recipes', {
			headers: await requireAdminHeaders(),
			params,
		});
	};

	const getRecipe = async (recipeId: string) => {
		return $fetch<AdminRecipeRecord>(`/api/admin/recipes/${recipeId}`, {
			headers: await requireAdminHeaders(),
		});
	};

	const createRecipe = async () => {
		return $fetch<AdminRecipeRecord>('/api/admin/recipes', {
			method: 'POST',
			headers: await requireAdminHeaders(),
		});
	};

	const updateRecipe = async (recipeId: string, payload: AdminRecipeUpdatePayload) => {
		return $fetch<AdminRecipeRecord>(`/api/admin/recipes/${recipeId}`, {
			method: 'PATCH',
			body: payload,
			headers: await requireAdminHeaders(),
		});
	};

	return {
		createRecipe,
		listRecipes,
		getRecipe,
		updateRecipe,
	};
}
