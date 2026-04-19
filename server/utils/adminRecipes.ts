import type { SupabaseClient } from '@supabase/supabase-js';
import {
	RECIPE_LANGUAGES,
	type AdminRecipeRecord,
	type AdminRecipeSummary,
	type AdminRecipeTranslationRecord,
	type AdminRecipeUpdatePayload,
	type RecipeLang,
	type RecipeStatus,
} from '~/types/recipe';
import { normalizeIngredientSections, normalizeInstructionSteps } from '~/utils/recipe';

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
		instructionSteps: [],
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
			instructionSteps: normalizeInstructionSteps(row.instruction_steps),
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

export async function listAdminRecipes(client: SupabaseClient): Promise<AdminRecipeSummary[]> {
	const { data, error } = await client
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
		.order('updated_at', { ascending: false });

	if (error) {
		throw error;
	}

	return ((data ?? []) as AdminRecipeSummaryRow[]).map((row) => mapAdminRecipeSummary(row));
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
			instruction_steps: translation.instructionSteps,
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
