import type { AdminRecipeListResponse, AdminRecipeListStatusFilter } from '~/types/recipe';
import { listAdminRecipes } from '~/server/utils/adminRecipes';
import { requireServerAdminUser } from '~/server/utils/adminAccess';
import { getServerSupabaseAdminClient } from '~/server/utils/supabase';
import { RECIPE_STATUSES } from '~/types/recipe';

export default defineEventHandler(async (event): Promise<AdminRecipeListResponse> => {
	await requireServerAdminUser(event);
	const query = getQuery(event);
	const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
	let page = 1;

	if (typeof rawPage === 'string' && rawPage.trim()) {
		const parsedPage = Number.parseInt(rawPage, 10);

		if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Provide a valid positive page number.',
			});
		}

		page = parsedPage;
	}

	const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
	let status: AdminRecipeListStatusFilter = 'all';

	if (typeof rawStatus === 'string' && rawStatus.trim()) {
		if (rawStatus === 'all') {
			status = 'all';
		} else if (RECIPE_STATUSES.includes(rawStatus as (typeof RECIPE_STATUSES)[number])) {
			status = rawStatus as AdminRecipeListStatusFilter;
		} else {
			throw createError({
				statusCode: 400,
				statusMessage: 'Provide a valid recipe status filter.',
			});
		}
	}

	const rawQuery = Array.isArray(query.q) ? query.q[0] : query.q;
	const q = typeof rawQuery === 'string' ? rawQuery.trim() : '';

	return listAdminRecipes(getServerSupabaseAdminClient(event), {
		page,
		q,
		status,
	});
});
