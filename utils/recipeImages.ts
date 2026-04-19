export const RECIPE_IMAGE_BUCKET = 'recipe-images';
export const RECIPE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const STORAGE_PROTOCOL = 'storage://';

type RecipeImageStorageReference = {
	kind: 'storage';
	bucket: string;
	path: string;
	ref: string;
};

type RecipeImageDirectReference = {
	kind: 'direct';
	url: string;
};

export type RecipeImageReference = RecipeImageStorageReference | RecipeImageDirectReference;

type RecipeImageFileLike = {
	size: number;
	type?: string | null;
};

function normalizeString(value: string | null | undefined) {
	return typeof value === 'string' ? value.trim() : '';
}

function encodeStoragePath(path: string) {
	return path
		.split('/')
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join('/');
}

export function sanitizeRecipeImageFileName(name: string) {
	const trimmedName = name.split('/').pop()?.split('\\').pop()?.trim() || 'image';
	return trimmedName
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9._-]/g, '')
		.replace(/-{2,}/g, '-');
}

export function buildRecipeImageStorageRef(bucket: string, path: string) {
	return `${STORAGE_PROTOCOL}${bucket}/${path}`;
}

export function getRecipeStorageImage(value: string | null | undefined): RecipeImageStorageReference | null {
	const normalized = normalizeString(value);

	if (!normalized.startsWith(STORAGE_PROTOCOL)) {
		return null;
	}

	const storageLocation = normalized.slice(STORAGE_PROTOCOL.length);
	const slashIndex = storageLocation.indexOf('/');

	if (slashIndex <= 0 || slashIndex === storageLocation.length - 1) {
		return null;
	}

	const bucket = storageLocation.slice(0, slashIndex).trim();
	const path = storageLocation.slice(slashIndex + 1).trim();

	if (!bucket || !path) {
		return null;
	}

	return {
		kind: 'storage',
		bucket,
		path,
		ref: buildRecipeImageStorageRef(bucket, path),
	};
}

export function isRecipeStorageImageReference(value: string | null | undefined) {
	return Boolean(getRecipeStorageImage(value));
}

export function parseRecipeImageReference(value: string | null | undefined): RecipeImageReference | null {
	const storageImage = getRecipeStorageImage(value);

	if (storageImage) {
		return storageImage;
	}

	const normalized = normalizeString(value);

	if (!normalized) {
		return null;
	}

	return {
		kind: 'direct',
		url: normalized,
	};
}

export function resolveRecipeImageUrl(value: string | null | undefined, supabaseUrl?: string | null) {
	const reference = parseRecipeImageReference(value);

	if (!reference) {
		return null;
	}

	if (reference.kind === 'direct') {
		return reference.url;
	}

	const normalizedSupabaseUrl = normalizeString(supabaseUrl);

	if (!normalizedSupabaseUrl) {
		return null;
	}

	return new URL(
		`/storage/v1/object/public/${encodeURIComponent(reference.bucket)}/${encodeStoragePath(reference.path)}`,
		normalizedSupabaseUrl
	).toString();
}

export function getRecipeImageValidationError(file: RecipeImageFileLike | null | undefined) {
	if (!file) {
		return '';
	}

	if (typeof file.type === 'string' && file.type && !file.type.startsWith('image/')) {
		return 'Choose an image file.';
	}

	if (file.size > RECIPE_IMAGE_MAX_BYTES) {
		return `Images must be ${RECIPE_IMAGE_MAX_BYTES / (1024 * 1024)} MB or smaller.`;
	}

	return '';
}

export function getRecipeImageSourceLabel(value: string | null | undefined) {
	const reference = parseRecipeImageReference(value);

	if (!reference) {
		return 'No image';
	}

	if (reference.kind === 'storage') {
		return 'Supabase upload';
	}

	if (reference.url.startsWith('/')) {
		return 'Legacy local path';
	}

	if (/^https?:\/\//i.test(reference.url)) {
		return 'External URL';
	}

	return 'Direct image reference';
}
