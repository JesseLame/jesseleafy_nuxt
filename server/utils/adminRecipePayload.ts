import type {
	AdminRecipeLocalizedFields,
	AdminRecipeRecord,
	AdminRecipeTranslatePayload,
	AdminRecipeTranslationRecord,
	AdminRecipeUpdatePayload,
	RecipeLang,
} from '~/types/recipe';
import { RECIPE_LANGUAGES } from '~/types/recipe';
import { isRecipeLang, isRecipeStatus, normalizeIngredientSections, normalizeInstructionSections } from '~/utils/recipe';

function createPayloadError(statusMessage: string) {
	return createError({
		statusCode: 400,
		statusMessage,
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeString(value: unknown) {
	return typeof value === 'string' ? value.trim() : '';
}

function normalizeNullableString(value: unknown) {
	const normalized = normalizeString(value);
	return normalized || null;
}

function normalizeTags(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter((tag): tag is string => typeof tag === 'string')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

function isValidIsoDate(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

	if (!match) {
		return false;
	}

	const year = Number.parseInt(match[1], 10);
	const month = Number.parseInt(match[2], 10);
	const day = Number.parseInt(match[3], 10);
	const date = new Date(Date.UTC(year, month - 1, day));

	return date.getUTCFullYear() === year
		&& date.getUTCMonth() === month - 1
		&& date.getUTCDate() === day;
}

function getLocaleLabel(locale: RecipeLang) {
	return locale === 'en' ? 'English' : 'Dutch';
}

function normalizeLocalizedFields(source: unknown): AdminRecipeLocalizedFields {
	const translation = isRecord(source) ? source : {};
	return {
		title: normalizeString(translation.title),
		description: normalizeString(translation.description),
		bodyMarkdown: normalizeNullableString(translation.bodyMarkdown),
		ingredientSections: normalizeIngredientSections(translation.ingredientSections),
		instructionSections: normalizeInstructionSections(translation.instructionSections),
	};
}

function hasLocalizedContent(translation: AdminRecipeLocalizedFields) {
	return Boolean(
		translation.title
		|| translation.description
		|| translation.bodyMarkdown
		|| translation.ingredientSections.length
		|| translation.instructionSections.length
	);
}

function normalizeTranslation(
	locale: RecipeLang,
	source: unknown,
	currentTranslation: AdminRecipeTranslationRecord
): AdminRecipeTranslationRecord {
	const translation = normalizeLocalizedFields(source);
	const hasContent = hasLocalizedContent(translation);

	if (!hasContent && currentTranslation.exists) {
		throw createPayloadError(`${getLocaleLabel(locale)} content already exists. Removing translations is not supported yet.`);
	}

	if (hasContent && (!translation.title || !translation.description)) {
		throw createPayloadError(`${getLocaleLabel(locale)} content needs both a title and description before it can be saved.`);
	}

	return {
		...translation,
		exists: currentTranslation.exists || hasContent,
	};
}

export function parseAdminRecipeUpdatePayload(body: unknown, currentRecipe: AdminRecipeRecord): AdminRecipeUpdatePayload {
	if (!isRecord(body)) {
		throw createPayloadError('Provide a valid recipe update payload.');
	}

	const slug = normalizeString(body.slug);

	if (!slug || !/^[a-z0-9_-]+$/.test(slug)) {
		throw createPayloadError('Use a slug with only lowercase letters, numbers, underscores, and hyphens.');
	}

	if (!isRecipeStatus(body.status)) {
		throw createPayloadError('Choose a valid recipe status.');
	}

	const createdOn = normalizeString(body.createdOn);

	if (!isValidIsoDate(createdOn)) {
		throw createPayloadError('Use a valid created date in YYYY-MM-DD format.');
	}

	const translationsSource = isRecord(body.translations) ? body.translations : {};
	const translations = Object.fromEntries(
		RECIPE_LANGUAGES.map((locale) => [
			locale,
			normalizeTranslation(locale, translationsSource[locale], currentRecipe.translations[locale]),
		])
	) as Record<RecipeLang, AdminRecipeTranslationRecord>;

	return {
		slug,
		status: body.status,
		imagePath: normalizeNullableString(body.imagePath),
		category: normalizeNullableString(body.category),
		tags: normalizeTags(body.tags),
		createdOn,
		translations,
	};
}

export function parseAdminRecipeTranslatePayload(body: unknown): AdminRecipeTranslatePayload {
	if (!isRecord(body)) {
		throw createPayloadError('Provide a valid translation payload.');
	}

	const sourceLocale = body.sourceLocale;
	const targetLocale = body.targetLocale;

	if (!isRecipeLang(sourceLocale) || !isRecipeLang(targetLocale)) {
		throw createPayloadError('Choose valid recipe languages for translation.');
	}

	if (sourceLocale === targetLocale) {
		throw createPayloadError('Choose different source and target languages for translation.');
	}

	const source = normalizeLocalizedFields(body.source);

	if (!source.title || !source.description) {
		throw createPayloadError(`${getLocaleLabel(sourceLocale)} content needs both a title and description before it can be translated.`);
	}

	return {
		sourceLocale,
		targetLocale,
		source,
	};
}
