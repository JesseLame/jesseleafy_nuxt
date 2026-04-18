import type { RecipeDetail } from '~/types/recipe';
import { getPublishedRecipeDetail } from '~/server/utils/recipes';
import { getServerSupabaseClient } from '~/server/utils/supabase';
import { isRecipeLang } from '~/utils/recipe';

export default defineEventHandler(async (event): Promise<RecipeDetail | null> => {
	const lang = getRouterParam(event, 'lang');
	const slug = getRouterParam(event, 'slug')?.trim();

	if (!isRecipeLang(lang)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Provide a valid recipe language.',
		});
	}

	if (!slug) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Provide a valid recipe slug.',
		});
	}

	return getPublishedRecipeDetail(getServerSupabaseClient(event), lang, slug);
});
