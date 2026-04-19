export const RECIPE_LANGUAGES = ['en', 'nl'] as const;
export const RECIPE_STATUSES = ['draft', 'published', 'archived'] as const;

export type RecipeLang = (typeof RECIPE_LANGUAGES)[number];
export type RecipeStatus = (typeof RECIPE_STATUSES)[number];

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

export interface AdminRecipeTranslationRecord {
	title: string;
	description: string;
	bodyMarkdown: string | null;
	ingredientSections: RecipeIngredientSection[];
	instructionSteps: string[];
	exists: boolean;
}

export interface AdminRecipeSummary {
	id: string;
	slug: string;
	status: RecipeStatus;
	createdOn: string;
	updatedAt: string;
	titles: Partial<Record<RecipeLang, string>>;
	availableLanguages: RecipeLang[];
}

export interface AdminRecipeRecord {
	id: string;
	slug: string;
	status: RecipeStatus;
	imagePath: string | null;
	category: string | null;
	tags: string[];
	createdOn: string;
	updatedAt: string;
	translations: Record<RecipeLang, AdminRecipeTranslationRecord>;
}

export interface AdminRecipeUpdatePayload {
	slug: string;
	status: RecipeStatus;
	imagePath: string | null;
	category: string | null;
	tags: string[];
	createdOn: string;
	translations: Record<RecipeLang, AdminRecipeTranslationRecord>;
}
