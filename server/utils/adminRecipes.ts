import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
	RECIPE_LANGUAGES,
	RECIPE_STATUSES,
	type AdminRecipeListParams,
	type AdminRecipeListResponse,
	type AdminRecipeRecord,
	type AdminRecipeStatusCounts,
	type AdminRecipeSummary,
	type AdminRecipeTranslationRecord,
	type AdminRecipeUpdatePayload,
	type RecipeLang,
	type RecipeStatus,
} from '~/types/recipe';
import { normalizeIngredientSections, normalizeInstructionSections } from '~/utils/recipe';

const ADMIN_RECIPE_PAGE_SIZE = 25;

type AdminRecipeTranslationRow = {
	locale: string;
	title: string;
	description: string;
	body_markdown: string | null;
	ingredient_sections: unknown;
	instruction_steps: unknown;
};

type AdminRecipeSummaryRow = {
	id: string;
	slug: string;
	status: RecipeStatus;
	created_on: string;
	updated_at: string;
	recipe_translations: Array<Pick<AdminRecipeTranslationRow, 'locale' | 'title'>> | null;
};

type AdminRecipeIdRow = {
	id: string;
};

type AdminRecipeTranslationIdRow = {
	recipe_id: string;
};

type AdminRecipeDetailRow = {
	id: string;
	slug: string;
	status: RecipeStatus;
	image_path: string | null;
	category: string | null;
	tags: unknown;
	created_on: string;
	updated_at: string;
	recipe_translations: AdminRecipeTranslationRow[] | null;
};

function normalizeTags(tags: unknown) {
	if (!Array.isArray(tags)) {
		return [];
	}

	return tags
		.filter((tag): tag is string => typeof tag === 'string')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

function isRecipeLanguage(value: string): value is RecipeLang {
	return RECIPE_LANGUAGES.includes(value as RecipeLang);
}

function createEmptyTranslationRecord(): AdminRecipeTranslationRecord {
	return {
		title: '',
		description: '',
		bodyMarkdown: null,
		ingredientSections: [],
		instructionSections: [],
		exists: false,
	};
}

function buildTranslationRecord(
	rows: AdminRecipeTranslationRow[] | null | undefined
): Record<RecipeLang, AdminRecipeTranslationRecord> {
	const translations = Object.fromEntries(
		RECIPE_LANGUAGES.map((locale) => [locale, createEmptyTranslationRecord()])
	) as Record<RecipeLang, AdminRecipeTranslationRecord>;

	for (const row of rows ?? []) {
		if (!isRecipeLanguage(row.locale)) {
			continue;
		}

		translations[row.locale] = {
			title: row.title?.trim() || '',
			description: row.description?.trim() || '',
			bodyMarkdown: row.body_markdown?.trim() || null,
			ingredientSections: normalizeIngredientSections(row.ingredient_sections),
			instructionSections: normalizeInstructionSections(row.instruction_steps),
			exists: true,
		};
	}

	return translations;
}

function mapAdminRecipeSummary(row: AdminRecipeSummaryRow): AdminRecipeSummary {
	const titles: Partial<Record<RecipeLang, string>> = {};
	const availableLanguages: RecipeLang[] = [];

	for (const translation of row.recipe_translations ?? []) {
		if (!isRecipeLanguage(translation.locale)) {
			continue;
		}

		titles[translation.locale] = translation.title?.trim() || '';
		availableLanguages.push(translation.locale);
	}

	return {
		id: row.id,
		slug: row.slug,
		status: row.status,
		createdOn: row.created_on,
		updatedAt: row.updated_at,
		titles,
		availableLanguages,
	};
}

function mapAdminRecipeRecord(row: AdminRecipeDetailRow): AdminRecipeRecord {
	return {
		id: row.id,
		slug: row.slug,
		status: row.status,
		imagePath: row.image_path?.trim() || null,
		category: row.category?.trim() || null,
		tags: normalizeTags(row.tags),
		createdOn: row.created_on,
		updatedAt: row.updated_at,
		translations: buildTranslationRecord(row.recipe_translations),
	};
}

function createEmptyStatusCounts(): AdminRecipeStatusCounts {
	return {
		archived: 0,
		draft: 0,
		published: 0,
	};
}

function padDatePart(value: number) {
	return String(value).padStart(2, '0');
}

function getCurrentRecipeDate() {
	const now = new Date();

	return `${now.getFullYear()}-${padDatePart(now.getMonth() + 1)}-${padDatePart(now.getDate())}`;
}

function buildDraftRecipeSlug() {
	return `draft_${Date.now()}_${randomUUID().replaceAll('-', '').slice(0, 8)}`;
}

function isUniqueViolation(error: unknown) {
	return Boolean(error && typeof error === 'object' && 'code' in error && error.code === '23505');
}

function escapeSearchPattern(value: string) {
	return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

async function getAdminRecipeStatusCounts(client: SupabaseClient): Promise<AdminRecipeStatusCounts> {
	const counts = await Promise.all(
		RECIPE_STATUSES.map(async (status) => {
			const { count, error } = await client
				.from('recipes')
				.select('id', { count: 'exact', head: true })
				.eq('status', status);

			if (error) {
				throw error;
			}

			return [status, count ?? 0] as const;
		})
	);

	return {
		...createEmptyStatusCounts(),
		...(Object.fromEntries(counts) as Partial<AdminRecipeStatusCounts>),
	};
}

async function findMatchingAdminRecipeIds(client: SupabaseClient, searchQuery: string) {
	const pattern = `%${escapeSearchPattern(searchQuery)}%`;
	const [{ data: slugMatches, error: slugError }, { data: titleMatches, error: titleError }] = await Promise.all([
		client
			.from('recipes')
			.select('id')
			.ilike('slug', pattern),
		client
			.from('recipe_translations')
			.select('recipe_id')
			.ilike('title', pattern),
	]);

	if (slugError) {
		throw slugError;
	}

	if (titleError) {
		throw titleError;
	}

	return Array.from(
		new Set([
			...((slugMatches ?? []) as AdminRecipeIdRow[]).map((row) => row.id),
			...((titleMatches ?? []) as AdminRecipeTranslationIdRow[]).map((row) => row.recipe_id),
		])
	);
}

async function fetchAdminRecipeSummariesPage(
	client: SupabaseClient,
	page: number,
	status: 'all' | RecipeStatus,
	matchingRecipeIds: string[] | null
) {
	if (matchingRecipeIds && !matchingRecipeIds.length) {
		return {
			items: [] as AdminRecipeSummary[],
			page: 1,
			pageSize: ADMIN_RECIPE_PAGE_SIZE,
			totalCount: 0,
			totalPages: 1,
		};
	}

	let countQuery = client.from('recipes').select('id', { count: 'exact', head: true });

	if (status !== 'all') {
		countQuery = countQuery.eq('status', status);
	}

	if (matchingRecipeIds) {
		countQuery = countQuery.in('id', matchingRecipeIds);
	}

	const { count, error: countError } = await countQuery;

	if (countError) {
		throw countError;
	}

	const totalCount = count ?? 0;
	const totalPages = totalCount ? Math.ceil(totalCount / ADMIN_RECIPE_PAGE_SIZE) : 1;
	const normalizedPage = totalCount ? Math.min(page, totalPages) : 1;

	if (!totalCount) {
		return {
			items: [] as AdminRecipeSummary[],
			page: normalizedPage,
			pageSize: ADMIN_RECIPE_PAGE_SIZE,
			totalCount,
			totalPages,
		};
	}

	const rangeStart = (normalizedPage - 1) * ADMIN_RECIPE_PAGE_SIZE;
	const rangeEnd = rangeStart + ADMIN_RECIPE_PAGE_SIZE - 1;

	let dataQuery = client
		.from('recipes')
		.select(`
			id,
			slug,
			status,
			created_on,
			updated_at,
			recipe_translations (
				locale,
				title
			)
		`)
		.order('updated_at', { ascending: false })
		.range(rangeStart, rangeEnd);

	if (status !== 'all') {
		dataQuery = dataQuery.eq('status', status);
	}

	if (matchingRecipeIds) {
		dataQuery = dataQuery.in('id', matchingRecipeIds);
	}

	const { data, error } = await dataQuery;

	if (error) {
		throw error;
	}

	return {
		items: ((data ?? []) as AdminRecipeSummaryRow[]).map((row) => mapAdminRecipeSummary(row)),
		page: normalizedPage,
		pageSize: ADMIN_RECIPE_PAGE_SIZE,
		totalCount,
		totalPages,
	};
}

export async function listAdminRecipes(
	client: SupabaseClient,
	params: AdminRecipeListParams = {}
): Promise<AdminRecipeListResponse> {
	const page = typeof params.page === 'number' && params.page > 0 ? params.page : 1;
	const status = params.status ?? 'all';
	const searchQuery = params.q?.trim() || '';

	const [statusCounts, matchingRecipeIds] = await Promise.all([
		getAdminRecipeStatusCounts(client),
		searchQuery ? findMatchingAdminRecipeIds(client, searchQuery) : Promise.resolve(null),
	]);

	const pageData = await fetchAdminRecipeSummariesPage(client, page, status, matchingRecipeIds);

	return {
		...pageData,
		statusCounts,
	};
}

export async function getAdminRecipeRecord(client: SupabaseClient, recipeId: string): Promise<AdminRecipeRecord | null> {
	const { data, error } = await client
		.from('recipes')
		.select(`
			id,
			slug,
			status,
			image_path,
			category,
			tags,
			created_on,
			updated_at,
			recipe_translations (
				locale,
				title,
				description,
				body_markdown,
				ingredient_sections,
				instruction_steps
			)
		`)
		.eq('id', recipeId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		return null;
	}

	return mapAdminRecipeRecord(data as AdminRecipeDetailRow);
}

export async function createAdminRecipeRecord(client: SupabaseClient): Promise<AdminRecipeRecord> {
	const createdOn = getCurrentRecipeDate();

	for (let attempt = 0; attempt < 3; attempt += 1) {
		const { data: createdRecipe, error } = await client
			.from('recipes')
			.insert({
				slug: buildDraftRecipeSlug(),
				status: 'draft',
				image_path: null,
				category: null,
				tags: [],
				created_on: createdOn,
			})
			.select('id')
			.single();

		if (error) {
			if (isUniqueViolation(error)) {
				continue;
			}

			throw error;
		}

		const recipe = await getAdminRecipeRecord(client, createdRecipe.id);

		if (!recipe) {
			throw new Error('Recipe draft was created but could not be loaded.');
		}

		return recipe;
	}

	throw new Error('Unable to generate a unique slug for the new draft recipe.');
}

export async function updateAdminRecipeRecord(
	client: SupabaseClient,
	recipeId: string,
	input: AdminRecipeUpdatePayload
): Promise<AdminRecipeRecord | null> {
	const { data: updatedRecipe, error: recipeError } = await client
		.from('recipes')
		.update({
			slug: input.slug,
			status: input.status,
			image_path: input.imagePath,
			category: input.category,
			tags: input.tags,
			created_on: input.createdOn,
		})
		.eq('id', recipeId)
		.select('id')
		.maybeSingle();

	if (recipeError) {
		throw recipeError;
	}

	if (!updatedRecipe) {
		return null;
	}

	const { data: existingTranslations, error: translationLookupError } = await client
		.from('recipe_translations')
		.select('locale')
		.eq('recipe_id', recipeId);

	if (translationLookupError) {
		throw translationLookupError;
	}

	const existingLocales = new Set(
		((existingTranslations ?? []) as Array<{ locale: string }>).flatMap((row) =>
			isRecipeLanguage(row.locale) ? [row.locale] : []
		)
	);

	for (const locale of RECIPE_LANGUAGES) {
		const translation = input.translations[locale];
		const title = translation.title.trim();
		const description = translation.description.trim();

		if (!title || !description) {
			continue;
		}

		const payload = {
			title,
			description,
			body_markdown: translation.bodyMarkdown?.trim() || null,
			ingredient_sections: translation.ingredientSections,
			instruction_steps: translation.instructionSections,
		};

		if (existingLocales.has(locale)) {
			const { error } = await client
				.from('recipe_translations')
				.update(payload)
				.eq('recipe_id', recipeId)
				.eq('locale', locale);

			if (error) {
				throw error;
			}

			continue;
		}

		const { error } = await client
			.from('recipe_translations')
			.insert({
				recipe_id: recipeId,
				locale,
				...payload,
			});

		if (error) {
			throw error;
		}
	}

	return getAdminRecipeRecord(client, recipeId);
}
