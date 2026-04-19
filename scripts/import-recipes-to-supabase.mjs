import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { parse as parseYaml } from 'yaml';

const RECIPE_LANGUAGES = ['en', 'nl'];

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const recipesRoot = path.join(projectRoot, 'content', 'recipes');
const isDryRun = process.argv.includes('--dry-run');
const RECIPE_IMAGE_STORAGE_PREFIX = 'storage://recipe-images/';

function loadDotEnv() {
	const envPath = path.join(projectRoot, '.env');

	return fs.readFile(envPath, 'utf8')
		.then((content) => {
			for (const line of content.split(/\r?\n/)) {
				const trimmedLine = line.trim();

				if (!trimmedLine || trimmedLine.startsWith('#')) {
					continue;
				}

				const separatorIndex = trimmedLine.indexOf('=');

				if (separatorIndex === -1) {
					continue;
				}

				const key = trimmedLine.slice(0, separatorIndex).trim();
				const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
				const value = rawValue.replace(/^['"]|['"]$/g, '');

				if (!process.env[key]) {
					process.env[key] = value;
				}
			}
		})
		.catch(() => {});
}

function splitFrontmatter(source) {
	const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);

	if (!match) {
		throw new Error('Recipe markdown is missing valid frontmatter.');
	}

	return {
		frontmatter: match[1],
		body: match[2].trim(),
	};
}

function normalizeCreatedDate(value) {
	if (typeof value !== 'string') {
		throw new Error('Recipe created date must be a string in dd-MM-yyyy format.');
	}

	const trimmedValue = value.trim();
	const toIsoDate = (year, month, day) => {
		const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
		const parsedDate = new Date(`${normalized}T00:00:00.000Z`);

		if (Number.isNaN(parsedDate.getTime())) {
			return null;
		}

		if (parsedDate.toISOString().slice(0, 10) !== normalized) {
			return null;
		}

		return normalized;
	};

	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
		const [year, month, day] = trimmedValue.split('-');
		const normalized = toIsoDate(year, month, day);

		if (normalized) {
			return normalized;
		}

		throw new Error(`Invalid created date "${value}". Expected dd-MM-yyyy, yyyy-MM-dd, or a valid legacy import format.`);
	}

	if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedValue)) {
		const [left, right, year] = trimmedValue.split('-');
		const normalizedDdMmYyyy = toIsoDate(year, right, left);

		if (normalizedDdMmYyyy) {
			return normalizedDdMmYyyy;
		}

		const normalizedMmDdYyyy = toIsoDate(year, left, right);

		if (normalizedMmDdYyyy) {
			return normalizedMmDdYyyy;
		}
	}

	throw new Error(`Invalid created date "${value}". Expected dd-MM-yyyy, yyyy-MM-dd, or a valid legacy import format.`);
}

function normalizeStringList(value, fieldName) {
	if (!Array.isArray(value)) {
		throw new Error(`${fieldName} must be an array of strings.`);
	}

	return value
		.filter((entry) => typeof entry === 'string')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function normalizeIngredientSections(value) {
	if (Array.isArray(value)) {
		return [{
			title: null,
			items: normalizeStringList(value, 'ingredients'),
		}];
	}

	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('ingredients must be either an array of strings or an object of string arrays.');
	}

	return Object.entries(value).map(([title, items]) => ({
		title,
		items: normalizeStringList(items, `ingredients.${title}`),
	})).filter((section) => section.items.length);
}

function normalizeTags(value) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter((entry) => typeof entry === 'string')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function normalizeNullableString(value) {
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecipeStorageImagePath(value) {
	return typeof value === 'string' && value.trim().startsWith(RECIPE_IMAGE_STORAGE_PREFIX);
}

function parseRecipeMarkdown(source, filePath) {
	const { frontmatter, body } = splitFrontmatter(source);
	const parsed = parseYaml(frontmatter);

	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error(`Frontmatter in ${filePath} did not parse into an object.`);
	}

	const data = parsed;

	if (typeof data.title !== 'string' || !data.title.trim()) {
		throw new Error(`Recipe ${filePath} is missing a title.`);
	}

	if (typeof data.description !== 'string' || !data.description.trim()) {
		throw new Error(`Recipe ${filePath} is missing a description.`);
	}

	return {
		title: data.title.trim(),
		description: data.description.trim(),
		bodyMarkdown: typeof data.description_long === 'string' && data.description_long.trim()
			? data.description_long.trim()
			: body || null,
		imagePath: typeof data.image === 'string' && data.image.trim() ? data.image.trim() : null,
		category: typeof data.category === 'string' && data.category.trim() ? data.category.trim() : null,
		tags: normalizeTags(data.tags),
		createdOn: normalizeCreatedDate(data.created),
		ingredientSections: normalizeIngredientSections(data.ingredients),
		instructionSteps: normalizeStringList(data.instructions, 'instructions'),
	};
}

function warnOnSharedFieldMismatch(slug, fieldName, values, selectedValue) {
	const uniqueValues = [...new Set(values.map((value) => JSON.stringify(value)))];

	if (uniqueValues.length > 1) {
		console.warn(`[warn] ${slug}: ${fieldName} differs between translations. Using ${JSON.stringify(selectedValue)}.`);
	}
}

function pickSharedValue(slug, fieldName, entries, selector, fallbackValue) {
	const preferredEntry = entries.find((entry) => entry.lang === 'en') ?? entries[0];
	const selectedValue = selector(preferredEntry) ?? fallbackValue;
	const allValues = entries.map((entry) => selector(entry) ?? fallbackValue);

	warnOnSharedFieldMismatch(slug, fieldName, allValues, selectedValue);

	return selectedValue;
}

async function collectRecipes() {
	const recipesBySlug = new Map();

	for (const lang of RECIPE_LANGUAGES) {
		const languageDirectory = path.join(recipesRoot, lang);
		const files = (await fs.readdir(languageDirectory)).filter((file) => file.endsWith('.md')).sort();

		for (const fileName of files) {
			const filePath = path.join(languageDirectory, fileName);
			const source = await fs.readFile(filePath, 'utf8');
			const slug = fileName.replace(/\.md$/, '');
			const recipe = parseRecipeMarkdown(source, filePath);
			const existing = recipesBySlug.get(slug) ?? { slug, translations: [] };

			existing.translations.push({
				lang,
				...recipe,
			});

			recipesBySlug.set(slug, existing);
		}
	}

	return [...recipesBySlug.values()].sort((left, right) => left.slug.localeCompare(right.slug));
}

function resolveImportedImagePath(nextImagePath, existingImagePath) {
	const normalizedNextImagePath = normalizeNullableString(nextImagePath);
	const normalizedExistingImagePath = normalizeNullableString(existingImagePath);

	if (
		isRecipeStorageImagePath(normalizedExistingImagePath)
		&& (!normalizedNextImagePath || !isRecipeStorageImagePath(normalizedNextImagePath))
	) {
		return normalizedExistingImagePath;
	}

	return normalizedNextImagePath;
}

function buildRecipeRows(recipeEntries, existingRecipesBySlug) {
	return recipeEntries.map((entry) => ({
		slug: entry.slug,
		status: 'published',
		image_path: resolveImportedImagePath(
			pickSharedValue(entry.slug, 'image_path', entry.translations, (translation) => translation.imagePath, null),
			existingRecipesBySlug.get(entry.slug)?.image_path ?? null
		),
		category: pickSharedValue(entry.slug, 'category', entry.translations, (translation) => translation.category, null),
		tags: pickSharedValue(entry.slug, 'tags', entry.translations, (translation) => translation.tags, []),
		created_on: pickSharedValue(entry.slug, 'created_on', entry.translations, (translation) => translation.createdOn, null),
		metadata: {},
	}));
}

async function fetchExistingRecipesBySlug(client, slugs) {
	if (!slugs.length) {
		return new Map();
	}

	const { data, error } = await client
		.from('recipes')
		.select('slug, image_path')
		.in('slug', slugs);

	if (error) {
		throw error;
	}

	return new Map((data ?? []).map((recipe) => [recipe.slug, recipe]));
}

function buildTranslationRows(recipeEntries, recipeIdBySlug) {
	return recipeEntries.flatMap((entry) => {
		const recipeId = recipeIdBySlug.get(entry.slug);

		if (!recipeId) {
			throw new Error(`Missing inserted recipe id for slug "${entry.slug}".`);
		}

		return entry.translations.map((translation) => ({
			recipe_id: recipeId,
			locale: translation.lang,
			title: translation.title,
			description: translation.description,
			body_markdown: translation.bodyMarkdown,
			ingredient_sections: translation.ingredientSections,
			instruction_steps: translation.instructionSteps,
			nutrition: null,
			metadata: {},
		}));
	});
}

async function main() {
	await loadDotEnv();

	const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.NUXT_PUBLIC_SUPABASE_URL?.trim();
	const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.NUXT_SUPABASE_SECRET_KEY?.trim();
	const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim() || process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
	const supabaseKey = secretKey || publishableKey;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY before importing recipes.');
	}

	if (!secretKey) {
		console.warn('[warn] SUPABASE_SECRET_KEY is not set. Falling back to SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY; writes may fail if RLS is enabled.');
	}

	const client = createClient(supabaseUrl, supabaseKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
	const recipeEntries = await collectRecipes();

	if (isDryRun) {
		const translationCount = recipeEntries.reduce((sum, entry) => sum + entry.translations.length, 0);
		console.log(`Dry run complete. Parsed ${recipeEntries.length} recipes and ${translationCount} translations.`);
		return;
	}

	const existingRecipesBySlug = await fetchExistingRecipesBySlug(client, recipeEntries.map((entry) => entry.slug));
	const recipeRows = buildRecipeRows(recipeEntries, existingRecipesBySlug);
	const { data: upsertedRecipes, error: recipeUpsertError } = await client
		.from('recipes')
		.upsert(recipeRows, { onConflict: 'slug' })
		.select('id, slug');

	if (recipeUpsertError) {
		throw recipeUpsertError;
	}

	const recipeIdBySlug = new Map((upsertedRecipes ?? []).map((recipe) => [recipe.slug, recipe.id]));
	const translationRows = buildTranslationRows(recipeEntries, recipeIdBySlug);
	const { error: translationUpsertError } = await client
		.from('recipe_translations')
		.upsert(translationRows, { onConflict: 'recipe_id,locale' });

	if (translationUpsertError) {
		throw translationUpsertError;
	}

	console.log(`Imported ${recipeRows.length} recipes and ${translationRows.length} translations into Supabase.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
