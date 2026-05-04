import type { H3Event } from 'h3';
import type { AdminRecipeLocalizedFields, RecipeIngredientSection, RecipeInstructionSection, RecipeLang } from '~/types/recipe';
import { normalizeIngredientSections, normalizeInstructionSections } from '~/utils/recipe';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_TRANSLATION_MODEL = 'claude-3-5-sonnet-latest';

interface AnthropicTextBlock {
	type: 'text';
	text: string;
}

interface AnthropicMessageResponse {
	content?: Array<AnthropicTextBlock | { type: string }>;
}

interface AnthropicErrorResponse {
	type?: string;
	error?: {
		type?: string;
		message?: string;
	};
}

function createTranslationError(statusCode: number, statusMessage: string) {
	return createError({
		statusCode,
		statusMessage,
	});
}

function logTranslationDebug(message: string, details: Record<string, unknown>) {
	console.error(`[recipe-translation] ${message}`, details);
}

function getLocaleLabel(locale: RecipeLang) {
	return locale === 'en' ? 'English' : 'Dutch';
}

function sanitizeDebugText(value: string, maxLength = 500) {
	return value
		.replace(/sk-ant-[a-zA-Z0-9_-]+/g, '[redacted-api-key]')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLength);
}

function getUnknownErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return sanitizeDebugText(error.message, 240) || 'Unknown error';
	}

	return typeof error === 'string'
		? sanitizeDebugText(error, 240) || 'Unknown error'
		: 'Unknown error';
}

function parseAnthropicErrorResponse(value: string) {
	try {
		return JSON.parse(value) as AnthropicErrorResponse;
	} catch {
		return null;
	}
}

function getAnthropicRequestId(response: Response) {
	return response.headers.get('request-id')?.trim()
		|| response.headers.get('anthropic-request-id')?.trim()
		|| null;
}

function getSourceStructureSummary(source: AdminRecipeLocalizedFields) {
	return {
		hasBodyMarkdown: Boolean(source.bodyMarkdown?.trim()),
		ingredientSectionCount: source.ingredientSections.length,
		ingredientItemsPerSection: source.ingredientSections.map((section) => section.items.length),
		instructionSectionCount: source.instructionSections.length,
		instructionStepsPerSection: source.instructionSections.map((section) => section.steps.length),
	};
}

function normalizeRecipeLinksInText(value: string) {
	return value
		.replace(/\/recipes\/(?:en|nl)\/([a-z0-9_-]+)(?:\.md)?/g, '/recipes/$1')
		.replace(/\/recipes\/([a-z0-9_-]+)\.md/g, '/recipes/$1');
}

function normalizeTranslatedString(value: unknown) {
	return typeof value === 'string' ? normalizeRecipeLinksInText(value.trim()) : '';
}

function normalizeTranslatedNullableString(value: unknown) {
	const normalized = normalizeTranslatedString(value);
	return normalized || null;
}

function normalizeIngredientSectionLinks(sections: RecipeIngredientSection[]) {
	return sections.map((section) => ({
		title: section.title ? normalizeRecipeLinksInText(section.title) : null,
		items: section.items.map((item) => normalizeRecipeLinksInText(item)),
	}));
}

function normalizeInstructionSectionLinks(sections: RecipeInstructionSection[]) {
	return sections.map((section) => ({
		title: section.title ? normalizeRecipeLinksInText(section.title) : null,
		steps: section.steps.map((step) => normalizeRecipeLinksInText(step)),
	}));
}

function normalizeTranslatedLocalizedFields(value: unknown): AdminRecipeLocalizedFields {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw createTranslationError(502, 'Recipe translation returned an invalid payload.');
	}

	const translation = value as Record<string, unknown>;

	return {
		title: normalizeTranslatedString(translation.title),
		description: normalizeTranslatedString(translation.description),
		bodyMarkdown: normalizeTranslatedNullableString(translation.bodyMarkdown),
		ingredientSections: normalizeIngredientSectionLinks(normalizeIngredientSections(translation.ingredientSections)),
		instructionSections: normalizeInstructionSectionLinks(normalizeInstructionSections(translation.instructionSections)),
	};
}

function stripCodeFences(value: string) {
	const trimmed = value.trim();

	if (!trimmed.startsWith('```')) {
		return trimmed;
	}

	return trimmed
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```$/, '')
		.trim();
}

function parseAnthropicTranslation(value: string) {
	try {
		return JSON.parse(stripCodeFences(value));
	} catch {
		throw createTranslationError(502, 'Recipe translation returned invalid JSON.');
	}
}

function getTextContent(data: AnthropicMessageResponse) {
	const text = (data.content ?? [])
		.flatMap((block) => ('text' in block && typeof block.text === 'string' ? [block.text] : []))
		.join('\n')
		.trim();

	if (!text) {
		throw createTranslationError(502, 'Recipe translation returned an empty response.');
	}

	return text;
}

function hasBodyContent(value: string | null) {
	return Boolean(value?.trim());
}

function assertMatchingStructure(source: AdminRecipeLocalizedFields, translation: AdminRecipeLocalizedFields) {
	if (!translation.title || !translation.description) {
		throw createTranslationError(502, 'Recipe translation is missing a title or description.');
	}

	if (hasBodyContent(source.bodyMarkdown) !== hasBodyContent(translation.bodyMarkdown)) {
		throw createTranslationError(502, 'Recipe translation did not preserve the body content structure.');
	}

	if (source.ingredientSections.length !== translation.ingredientSections.length) {
		throw createTranslationError(502, 'Recipe translation did not preserve the ingredient section structure.');
	}

	for (const [index, sourceSection] of source.ingredientSections.entries()) {
		const translatedSection = translation.ingredientSections[index];

		if (!translatedSection) {
			throw createTranslationError(502, 'Recipe translation did not preserve the ingredient section structure.');
		}

		if (Boolean(sourceSection.title) !== Boolean(translatedSection.title)) {
			throw createTranslationError(502, 'Recipe translation did not preserve an ingredient section title.');
		}

		if (sourceSection.items.length !== translatedSection.items.length) {
			throw createTranslationError(502, 'Recipe translation did not preserve all ingredient lines.');
		}
	}

	if (source.instructionSections.length !== translation.instructionSections.length) {
		throw createTranslationError(502, 'Recipe translation did not preserve the instruction section structure.');
	}

	for (const [index, sourceSection] of source.instructionSections.entries()) {
		const translatedSection = translation.instructionSections[index];

		if (!translatedSection) {
			throw createTranslationError(502, 'Recipe translation did not preserve the instruction section structure.');
		}

		if (Boolean(sourceSection.title) !== Boolean(translatedSection.title)) {
			throw createTranslationError(502, 'Recipe translation did not preserve an instruction section title.');
		}

		if (sourceSection.steps.length !== translatedSection.steps.length) {
			throw createTranslationError(502, 'Recipe translation did not preserve all instruction steps.');
		}
	}
}

function buildTranslationPrompt(
	sourceLocale: RecipeLang,
	targetLocale: RecipeLang,
	source: AdminRecipeLocalizedFields
) {
	return [
		`Translate this recipe content from ${getLocaleLabel(sourceLocale)} to ${getLocaleLabel(targetLocale)}.`,
		'Return only a raw JSON object with these keys: title, description, bodyMarkdown, ingredientSections, instructionSections.',
		'Preserve the exact number of ingredient sections, ingredient lines per section, instruction sections, and instruction steps per section.',
		'If a section title exists in the source, translate it and keep it as a section title. If a section title is null, keep it null.',
		'Keep recipe slugs and internal recipe links normalized as /recipes/<slug>.',
		'Do not add explanations, comments, markdown code fences, or extra keys.',
		'Keep quantities, numbers, and structured recipe references intact while translating only the user-facing text.',
		'Here is the source JSON:',
		JSON.stringify(source, null, 2),
	].join('\n\n');
}

export async function translateRecipeWithClaude(
	event: H3Event,
	sourceLocale: RecipeLang,
	targetLocale: RecipeLang,
	source: AdminRecipeLocalizedFields,
	context: {
		recipeId?: string;
	} = {}
) {
	const runtimeConfig = useRuntimeConfig(event);
	const apiKey = runtimeConfig.claudeApiKey?.trim();
	const debugContext = {
		recipeId: context.recipeId ?? null,
		sourceLocale,
		targetLocale,
		model: CLAUDE_TRANSLATION_MODEL,
		...getSourceStructureSummary(source),
	};

	if (!apiKey) {
		logTranslationDebug('Missing Claude API key', {
			...debugContext,
			expectedEnvVars: ['CLAUDE_API', 'ANTHROPIC_API_KEY'],
		});
		throw createTranslationError(503, 'Recipe translation is unavailable because no Claude API key is configured on the server. Expected CLAUDE_API or ANTHROPIC_API_KEY.');
	}

	let response: Response;

	try {
		response = await fetch(ANTHROPIC_MESSAGES_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: CLAUDE_TRANSLATION_MODEL,
				max_tokens: 4000,
				temperature: 0,
				system: 'You are a precise bilingual recipe translator. Output valid JSON only.',
				messages: [
					{
						role: 'user',
						content: buildTranslationPrompt(sourceLocale, targetLocale, source),
					},
				],
				}),
			});
	} catch (error) {
		logTranslationDebug('Network error while calling Anthropic', {
			...debugContext,
			error: getUnknownErrorMessage(error),
		});
		throw createTranslationError(503, `Recipe translation failed before Anthropic responded: ${getUnknownErrorMessage(error)}. Check the server logs for details.`);
	}

	if (!response.ok) {
		const requestId = getAnthropicRequestId(response);
		const rawErrorText = await response.text();
		const rawErrorExcerpt = sanitizeDebugText(rawErrorText);
		const parsedError = parseAnthropicErrorResponse(rawErrorText);
		const upstreamType = parsedError?.error?.type?.trim() || parsedError?.type?.trim() || null;
		const upstreamMessage = sanitizeDebugText(parsedError?.error?.message || rawErrorText, 240);

		logTranslationDebug('Anthropic returned an error response', {
			...debugContext,
			upstreamStatus: response.status,
			upstreamStatusText: response.statusText,
			upstreamRequestId: requestId,
			upstreamErrorType: upstreamType,
			upstreamErrorMessage: upstreamMessage,
			upstreamBodyExcerpt: rawErrorExcerpt,
		});

		const prefix = `Recipe translation failed at Anthropic (HTTP ${response.status}${requestId ? `, request ${requestId}` : ''}${upstreamType ? `, ${upstreamType}` : ''})`;

		if (response.status === 429) {
			throw createTranslationError(503, `${prefix}: ${upstreamMessage || 'Rate limited. Please try again in a moment.'}`);
		}

		throw createTranslationError(503, `${prefix}: ${upstreamMessage || response.statusText || 'No extra error details were returned.'}`);
	}

	const data = await response.json() as AnthropicMessageResponse;
	const rawTextContent = getTextContent(data);

	let translation: AdminRecipeLocalizedFields;

	try {
		translation = normalizeTranslatedLocalizedFields(parseAnthropicTranslation(rawTextContent));
		assertMatchingStructure(source, translation);
	} catch (error) {
		logTranslationDebug('Anthropic returned an unusable translation payload', {
			...debugContext,
			error: getUnknownErrorMessage(error),
			rawTextExcerpt: sanitizeDebugText(rawTextContent, 800),
		});
		throw error;
	}

	return translation;
}
