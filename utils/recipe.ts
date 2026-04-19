import {
	RECIPE_STATUSES,
	type RecipeIngredientSection,
	type RecipeInstructionSection,
	type RecipeLang,
	type RecipeStatus,
} from '~/types/recipe';

export function isRecipeLang(value: unknown): value is RecipeLang {
	return value === 'en' || value === 'nl';
}

export function isRecipeStatus(value: unknown): value is RecipeStatus {
	return typeof value === 'string' && RECIPE_STATUSES.includes(value as RecipeStatus);
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

function normalizeStringEntries(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter((entry): entry is string => typeof entry === 'string')
		.map((entry) => entry.trim())
		.filter(Boolean);
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

export function normalizeInstructionSections(value: unknown): RecipeInstructionSection[] {
	if (Array.isArray(value)) {
		if (!value.length) {
			return [];
		}

		if (value.every((step) => typeof step === 'string')) {
			const steps = normalizeStringEntries(value);

			return steps.length
				? [{
					title: null,
					steps,
				}]
				: [];
		}

		return value.flatMap((section) => {
			if (!section || typeof section !== 'object') {
				return [];
			}

			const title = typeof (section as { title?: unknown }).title === 'string'
				? (section as { title: string }).title.trim() || null
				: null;
			const steps = normalizeStringEntries((section as { steps?: unknown }).steps);

			if (!steps.length) {
				return [];
			}

			return [{ title, steps }];
		});
	}

	if (!value || typeof value !== 'object') {
		return [];
	}

	return Object.entries(value).flatMap(([title, steps]) => {
		const normalizedSteps = normalizeStringEntries(steps);

		if (!normalizedSteps.length) {
			return [];
		}

		return [{
			title: title.trim() || null,
			steps: normalizedSteps,
		}];
	});
}
