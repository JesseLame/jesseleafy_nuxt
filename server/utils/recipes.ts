import type { SupabaseClient } from '@supabase/supabase-js';
import type { RecipeAuthor, RecipeDetail, RecipeLang, RecipeSummary } from '~/types/recipe';
import { RECIPE_LANGUAGES } from '~/types/recipe';
import {
	buildRecipePath,
	normalizeIngredientSections,
	normalizeInstructionSteps,
} from '~/utils/recipe';

type RecipeTranslationRow = {
	locale: string;
	title: string;
	description: string;
	body_markdown: string | null;
	ingredient_sections: unknown;
	instruction_steps: unknown;
	nutrition: unknown;
};

type RecipeAuthorRow = {
	sort_order: number | null;
	authors:
		| {
			slug: string;
			display_name: string;
			bio: string | null;
			avatar_path: string | null;
		}
		| Array<{
			slug: string;
			display_name: string;
			bio: string | null;
			avatar_path: string | null;
		}>
		| null;
};

type RecipeRow = {
	slug: string;
	image_path: string | null;
	category: string | null;
	tags: unknown;
	created_on: string;
	recipe_translations: RecipeTranslationRow[] | null;
	recipe_authors?: RecipeAuthorRow[] | null;
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

function normalizeNutrition(value: unknown) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}

	return value as Record<string, unknown>;
}

function mapRecipeSummary(row: RecipeRow, lang: RecipeLang): RecipeSummary | null {
	const translation = row.recipe_translations?.find((entry) => entry.locale === lang);

	if (!translation) {
		return null;
	}

	return {
		slug: row.slug,
		lang,
		path: buildRecipePath(lang, row.slug),
		title: translation.title,
		description: translation.description,
		tags: normalizeTags(row.tags),
		category: row.category?.trim() || null,
		image: row.image_path?.trim() || null,
		createdOn: row.created_on,
	};
}

function mapRecipeAuthor(row: RecipeAuthorRow): RecipeAuthor | null {
	const author = Array.isArray(row.authors) ? row.authors[0] ?? null : row.authors;

	if (!author?.slug?.trim() || !author.display_name?.trim()) {
		return null;
	}

	return {
		slug: author.slug.trim(),
		displayName: author.display_name.trim(),
		bio: author.bio?.trim() || null,
		avatarPath: author.avatar_path?.trim() || null,
	};
}

export async function listPublishedRecipes(client: SupabaseClient, lang: RecipeLang, limit?: number) {
	let query = client
		.from('recipes')
		.select(`
			slug,
			image_path,
			category,
			tags,
			created_on,
			recipe_translations!inner (
				locale,
				title,
				description
			)
		`)
		.eq('status', 'published')
		.eq('recipe_translations.locale', lang)
		.order('created_on', { ascending: false });

	if (typeof limit === 'number') {
		query = query.limit(limit);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return ((data ?? []) as RecipeRow[])
		.map((row) => mapRecipeSummary(row, lang))
		.filter((row): row is RecipeSummary => Boolean(row));
}

export async function getPublishedRecipeDetail(client: SupabaseClient, lang: RecipeLang, slug: string) {
	const { data, error } = await client
		.from('recipes')
		.select(`
			slug,
			image_path,
			category,
			tags,
			created_on,
			recipe_translations (
				locale,
				title,
				description,
				body_markdown,
				ingredient_sections,
				instruction_steps,
				nutrition
			),
			recipe_authors (
				sort_order,
				authors (
					slug,
					display_name,
					bio,
					avatar_path
				)
			)
		`)
		.eq('slug', slug)
		.eq('status', 'published')
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		return null;
	}

	const row = data as RecipeRow;
	const translation = row.recipe_translations?.find((entry) => entry.locale === lang);

	if (!translation) {
		return null;
	}

	const availableLanguages = RECIPE_LANGUAGES.filter((candidate) =>
		row.recipe_translations?.some((entry) => entry.locale === candidate)
	);

	const authors = (row.recipe_authors ?? [])
		.slice()
		.sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
		.map((entry) => mapRecipeAuthor(entry))
		.filter((entry): entry is RecipeAuthor => Boolean(entry));

	return {
		slug: row.slug,
		lang,
		path: buildRecipePath(lang, row.slug),
		title: translation.title,
		description: translation.description,
		tags: normalizeTags(row.tags),
		category: row.category?.trim() || null,
		image: row.image_path?.trim() || null,
		createdOn: row.created_on,
		bodyMarkdown: translation.body_markdown?.trim() || null,
		ingredientSections: normalizeIngredientSections(translation.ingredient_sections),
		instructionSteps: normalizeInstructionSteps(translation.instruction_steps),
		nutrition: normalizeNutrition(translation.nutrition),
		availableLanguages,
		authors,
	} satisfies RecipeDetail;
}
