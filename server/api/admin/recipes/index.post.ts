import type { AdminRecipeRecord } from '~/types/recipe';
import { createAdminRecipeRecord } from '~/server/utils/adminRecipes';
import { requireServerAdminUser } from '~/server/utils/adminAccess';
import { getServerSupabaseAdminClient } from '~/server/utils/supabase';

export default defineEventHandler(async (event): Promise<AdminRecipeRecord> => {
	await requireServerAdminUser(event);

	return createAdminRecipeRecord(getServerSupabaseAdminClient(event));
});
