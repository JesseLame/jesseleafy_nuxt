import type { SupabaseClient } from '@supabase/supabase-js';
import {
	RECIPE_IMAGE_BUCKET,
	buildRecipeImageStorageRef,
	getRecipeStorageImage,
	resolveRecipeImageUrl,
	sanitizeRecipeImageFileName,
} from '~/utils/recipeImages';

function getSupabaseClient() {
	return import.meta.client ? (useNuxtApp().$supabase as SupabaseClient | null) : null;
}

function requireSupabaseClient() {
	const client = getSupabaseClient();

	if (!client) {
		throw new Error('Recipe image uploads are unavailable because Supabase is not configured.');
	}

	return client;
}

export function useRecipeImages() {
	const config = useRuntimeConfig();

	const resolveRecipeImagePreviewUrl = (imagePath: string | null | undefined) => {
		return resolveRecipeImageUrl(imagePath, config.public.supabaseUrl);
	};

	const uploadRecipeImage = async (file: File, recipeId: string) => {
		const client = requireSupabaseClient();
		const safeName = sanitizeRecipeImageFileName(file.name);
		const randomId = globalThis.crypto?.randomUUID?.() || String(Date.now());
		const path = `recipes/${recipeId}/${Date.now()}-${randomId}-${safeName}`;

		const { error } = await client.storage.from(RECIPE_IMAGE_BUCKET).upload(path, file, {
			cacheControl: '3600',
			contentType: file.type || undefined,
			upsert: false,
		});

		if (error) {
			throw error;
		}

		return buildRecipeImageStorageRef(RECIPE_IMAGE_BUCKET, path);
	};

	const deleteRecipeImage = async (imagePath: string | null | undefined) => {
		const storageImage = getRecipeStorageImage(imagePath);

		if (!storageImage) {
			return;
		}

		const client = requireSupabaseClient();
		const { error } = await client.storage.from(storageImage.bucket).remove([storageImage.path]);

		if (error) {
			throw error;
		}
	};

	return {
		deleteRecipeImage,
		resolveRecipeImagePreviewUrl,
		uploadRecipeImage,
	};
}
