export const RECIPE_LANGUAGES = ['en', 'nl'] as const;

export type RecipeLang = (typeof RECIPE_LANGUAGES)[number];

export interface RecipeIngredientSection {
	title: string | null;
	items: string[];
}

export interface RecipeAuthor {
	slug: string;
	displayName: string;
	bio: string | null;
	avatarPath: string | null;
}

export interface RecipeTranslation {
	lang: RecipeLang;
	title: string;
	description: string;
	bodyMarkdown: string | null;
	ingredientSections: RecipeIngredientSection[];
	instructionSteps: string[];
	nutrition: Record<string, unknown> | null;
}

export interface RecipeSummary {
	slug: string;
	lang: RecipeLang;
	path: string;
	title: string;
	description: string;
	tags: string[];
	category: string | null;
	image: string | null;
	createdOn: string;
}

export interface RecipeDetail extends RecipeSummary, RecipeTranslation {
	availableLanguages: RecipeLang[];
	authors: RecipeAuthor[];
}
