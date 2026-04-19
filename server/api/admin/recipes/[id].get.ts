import type { AdminRecipeRecord } from '~/types/recipe';
import { getAdminRecipeRecord } from '~/server/utils/adminRecipes';
import { requireServerAdminUser } from '~/server/utils/adminAccess';
import { getServerSupabaseAdminClient } from '~/server/utils/supabase';

export default defineEventHandler(async (event): Promise<AdminRecipeRecord> => {
	await requireServerAdminUser(event);

	const recipeId = getRouterParam(event, 'id')?.trim();

	if (!recipeId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Provide a valid recipe id.',
		});
	}

	const recipe = await getAdminRecipeRecord(getServerSupabaseAdminClient(event), recipeId);

	if (!recipe) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Recipe not found.',
		});
	}

	return recipe;
});
