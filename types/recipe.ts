export const RECIPE_LANGUAGES = ['en', 'nl'] as const;
export const RECIPE_STATUSES = ['draft', 'published', 'archived'] as const;

export type RecipeLang = (typeof RECIPE_LANGUAGES)[number];
export type RecipeStatus = (typeof RECIPE_STATUSES)[number];

export interface RecipeIngredientSection {
	title: string | null;
	items: string[];
}

export interface RecipeInstructionSection {
	title: string | null;
	steps: string[];
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
	instructionSections: RecipeInstructionSection[];
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

export interface AdminRecipeLocalizedFields {
	title: string;
	description: string;
	bodyMarkdown: string | null;
	ingredientSections: RecipeIngredientSection[];
	instructionSections: RecipeInstructionSection[];
}

export interface AdminRecipeTranslationRecord extends AdminRecipeLocalizedFields {
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

export type AdminRecipeListStatusFilter = 'all' | RecipeStatus;

export interface AdminRecipeStatusCounts {
	draft: number;
	published: number;
	archived: number;
}

export interface AdminRecipeListParams {
	page?: number;
	status?: AdminRecipeListStatusFilter;
	q?: string;
}

export interface AdminRecipeListResponse {
	items: AdminRecipeSummary[];
	page: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
	statusCounts: AdminRecipeStatusCounts;
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

export interface AdminRecipeTranslatePayload {
	sourceLocale: RecipeLang;
	targetLocale: RecipeLang;
	source: AdminRecipeLocalizedFields;
}

export interface AdminRecipeTranslateResponse {
	targetLocale: RecipeLang;
	translation: AdminRecipeLocalizedFields;
}
