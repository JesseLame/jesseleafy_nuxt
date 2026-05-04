import type { AdminRecipeTranslateResponse } from '~/types/recipe';
import { getAdminRecipeRecord } from '~/server/utils/adminRecipes';
import { parseAdminRecipeTranslatePayload } from '~/server/utils/adminRecipePayload';
import { requireServerAdminUser } from '~/server/utils/adminAccess';
import { translateRecipeWithClaude } from '~/server/utils/recipeTranslation';
import { getServerSupabaseAdminClient } from '~/server/utils/supabase';

export default defineEventHandler(async (event): Promise<AdminRecipeTranslateResponse> => {
	await requireServerAdminUser(event);

	const recipeId = getRouterParam(event, 'id')?.trim();

	if (!recipeId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Provide a valid recipe id.',
		});
	}

	const client = getServerSupabaseAdminClient(event);
	const recipe = await getAdminRecipeRecord(client, recipeId);

	if (!recipe) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Recipe not found.',
		});
	}

	const payload = parseAdminRecipeTranslatePayload(await readBody(event));
	const translation = await translateRecipeWithClaude(
		event,
		payload.sourceLocale,
		payload.targetLocale,
		payload.source,
		{ recipeId }
	);

	return {
		targetLocale: payload.targetLocale,
		translation,
	};
});
