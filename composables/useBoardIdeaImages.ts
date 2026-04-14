import type { SupabaseClient } from '@supabase/supabase-js';
import type { BoardIdeaUploadImage } from '~/types/board';
import {
	BOARD_IDEA_IMAGE_BUCKET,
	type IdeaImageSource,
	getBoardIdeaUploadImage,
	sanitizeBoardIdeaImageFileName,
} from '~/utils/boardIdeaImages';

function getSupabaseClient() {
	return import.meta.client ? (useNuxtApp().$supabase as SupabaseClient | null) : null;
}

function requireSupabaseClient() {
	const client = getSupabaseClient();

	if (!client) {
		throw new Error('Board image uploads are unavailable because Supabase is not configured.');
	}

	return client;
}

export function useBoardIdeaImages() {
	const signedUrlCache = useState<Record<string, string>>('board-idea-image-signed-url-cache', () => ({}));

	const getCacheKey = (boardImage: BoardIdeaUploadImage) => `${boardImage.bucket}:${boardImage.path}`;

	const clearResolvedIdeaImageUrl = (boardImage: BoardIdeaUploadImage | null | undefined) => {
		if (!boardImage) {
			return;
		}

		delete signedUrlCache.value[getCacheKey(boardImage)];
	};

	const resolveIdeaImageUrl = async (idea: IdeaImageSource | null | undefined): Promise<string | null> => {
		const boardImage = getBoardIdeaUploadImage(idea?.metadata);

		if (boardImage) {
			const cacheKey = getCacheKey(boardImage);
			const cachedUrl = signedUrlCache.value[cacheKey];

			if (cachedUrl) {
				return cachedUrl;
			}

			const client = requireSupabaseClient();
			const { data, error } = await client.storage.from(boardImage.bucket).createSignedUrl(boardImage.path, 60 * 60);

			if (error) {
				throw error;
			}

			signedUrlCache.value[cacheKey] = data.signedUrl;
			return data.signedUrl;
		}

		const directUrl = idea?.image_url?.trim();
		return directUrl || null;
	};

	const importIdeaImageUrl = async (url: string): Promise<BoardIdeaUploadImage> => {
		const client = requireSupabaseClient();
		const {
			data: { session },
		} = await client.auth.getSession();

		if (!session?.access_token) {
			throw new Error('You need to be logged in to import idea images.');
		}

		const response = await $fetch<{ boardImage: BoardIdeaUploadImage }>('/api/board-images/import', {
			method: 'POST',
			body: { url },
			headers: {
				Authorization: `Bearer ${session.access_token}`,
			},
		});

		return response.boardImage;
	};

	const uploadIdeaImage = async (file: File, userId: string): Promise<BoardIdeaUploadImage> => {
		const client = requireSupabaseClient();
		const safeName = sanitizeBoardIdeaImageFileName(file.name);
		const randomId = globalThis.crypto?.randomUUID?.() || String(Date.now());
		const path = `${userId}/${Date.now()}-${randomId}-${safeName}`;

		const { error } = await client.storage.from(BOARD_IDEA_IMAGE_BUCKET).upload(path, file, {
			cacheControl: '3600',
			contentType: file.type || undefined,
			upsert: false,
		});

		if (error) {
			throw error;
		}

		return {
			source: 'upload',
			bucket: BOARD_IDEA_IMAGE_BUCKET,
			path,
		};
	};

	const deleteIdeaImageUpload = async (boardImage: BoardIdeaUploadImage | null | undefined) => {
		if (!boardImage) {
			return;
		}

		const client = requireSupabaseClient();
		const { error } = await client.storage.from(boardImage.bucket).remove([boardImage.path]);

		clearResolvedIdeaImageUrl(boardImage);

		if (error) {
			throw error;
		}
	};

	return {
		clearResolvedIdeaImageUrl,
		deleteIdeaImageUpload,
		importIdeaImageUrl,
		resolveIdeaImageUrl,
		uploadIdeaImage,
	};
}
