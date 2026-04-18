import type { RecipeIngredientSection, RecipeLang } from '~/types/recipe';

export function isRecipeLang(value: unknown): value is RecipeLang {
	return value === 'en' || value === 'nl';
}

export function buildRecipePath(lang: RecipeLang, slug: string) {
	return `/recipes/${lang}/${slug}`;
}

export function extractRecipeSlugFromHref(href: string): string | null {
	const withLanguage = href.match(/^\/recipes\/(?:en|nl)\/([^/]+?)(?:\.md)?$/);

	if (withLanguage) {
		return withLanguage[1];
	}

	const withoutLanguage = href.match(/^\/recipes\/([^/]+?)(?:\.md)?$/);

	if (withoutLanguage) {
		return withoutLanguage[1];
	}

	return null;
}

export function normalizeRecipeHref(href: string, language: RecipeLang): string {
	const linkedSlug = extractRecipeSlugFromHref(href);

	if (!linkedSlug) {
		return href;
	}

	return buildRecipePath(language, linkedSlug);
}

export function flattenIngredientSections(sections: RecipeIngredientSection[]) {
	return sections.flatMap((section) => section.items);
}

export function formatIngredientSectionTitle(title: string | null) {
	return title ? title.replace(/_/g, ' ') : '';
}

export function normalizeIngredientSections(value: unknown): RecipeIngredientSection[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((section) => {
		if (!section || typeof section !== 'object') {
			return [];
		}

		const title = typeof (section as { title?: unknown }).title === 'string'
			? (section as { title: string }).title.trim() || null
			: null;

		const items = Array.isArray((section as { items?: unknown }).items)
			? (section as { items: unknown[] }).items
				.filter((item): item is string => typeof item === 'string')
				.map((item) => item.trim())
				.filter(Boolean)
			: [];

		if (!items.length) {
			return [];
		}

		return [{ title, items }];
	});
}

export function normalizeInstructionSteps(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter((step): step is string => typeof step === 'string')
		.map((step) => step.trim())
		.filter(Boolean);
}
