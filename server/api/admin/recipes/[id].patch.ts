import type { AdminRecipeRecord } from '~/types/recipe';
import { parseAdminRecipeUpdatePayload } from '~/server/utils/adminRecipePayload';
import { getAdminRecipeRecord, updateAdminRecipeRecord } from '~/server/utils/adminRecipes';
import { requireServerAdminUser } from '~/server/utils/adminAccess';
import { getServerSupabaseAdminClient } from '~/server/utils/supabase';

function isHandledError(error: unknown) {
	return Boolean(error && typeof error === 'object' && 'statusCode' in error);
}

export default defineEventHandler(async (event): Promise<AdminRecipeRecord> => {
	await requireServerAdminUser(event);

	const recipeId = getRouterParam(event, 'id')?.trim();

	if (!recipeId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Provide a valid recipe id.',
		});
	}

	const client = getServerSupabaseAdminClient(event);
	const currentRecipe = await getAdminRecipeRecord(client, recipeId);

	if (!currentRecipe) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Recipe not found.',
		});
	}

	const body = await readBody(event);
	const payload = parseAdminRecipeUpdatePayload(body, currentRecipe);

	try {
		const updatedRecipe = await updateAdminRecipeRecord(client, recipeId, payload);

		if (!updatedRecipe) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Recipe not found.',
			});
		}

		return updatedRecipe;
	} catch (error) {
		if (isHandledError(error)) {
			throw error;
		}

		if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
			throw createError({
				statusCode: 409,
				statusMessage: 'That slug is already in use by another recipe.',
			});
		}

		throw error;
	}
});
