import type { AdminRecipeSummary } from '~/types/recipe';
import { listAdminRecipes } from '~/server/utils/adminRecipes';
import { requireServerAdminUser } from '~/server/utils/adminAccess';
import { getServerSupabaseAdminClient } from '~/server/utils/supabase';

export default defineEventHandler(async (event): Promise<AdminRecipeSummary[]> => {
	await requireServerAdminUser(event);
	return listAdminRecipes(getServerSupabaseAdminClient(event));
});
