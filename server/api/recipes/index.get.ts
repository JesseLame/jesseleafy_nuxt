import type { RecipeSummary } from '~/types/recipe';
import { listPublishedRecipes } from '~/server/utils/recipes';
import { getServerSupabaseClient } from '~/server/utils/supabase';
import { isRecipeLang } from '~/utils/recipe';

export default defineEventHandler(async (event): Promise<RecipeSummary[]> => {
	const query = getQuery(event);
	const lang = Array.isArray(query.lang) ? query.lang[0] : query.lang;

	if (!isRecipeLang(lang)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Provide a valid recipe language.',
		});
	}

	const rawLimit = Array.isArray(query.limit) ? query.limit[0] : query.limit;
	let limit: number | undefined;

	if (typeof rawLimit === 'string' && rawLimit.trim()) {
		const parsedLimit = Number.parseInt(rawLimit, 10);

		if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Provide a valid positive recipe limit.',
			});
		}

		limit = parsedLimit;
	}

	return listPublishedRecipes(getServerSupabaseClient(event), lang, limit);
});
