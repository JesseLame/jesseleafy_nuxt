import type { SupabaseClient } from '@supabase/supabase-js';
import type { BoardIdeaUploadImage, Idea, IdeaMetadata } from '~/types/board';

export const BOARD_IDEA_IMAGE_BUCKET = 'board-idea-images';
export const BOARD_IDEA_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const DEFAULT_BOARD_CARD_WIDTH = 260;
export const DEFAULT_BOARD_CARD_HEIGHT = 160;
export const BOARD_IMAGE_CARD_WIDTH = 320;
export const BOARD_IMAGE_CARD_HEIGHT = 380;

type IdeaImageSource = Pick<Idea, 'image_url' | 'metadata'>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

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

function sanitizeFileName(name: string) {
	const trimmedName = name.split('/').pop()?.split('\\').pop()?.trim() || 'image';
	return trimmedName
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9._-]/g, '')
		.replace(/-{2,}/g, '-');
}

export function getBoardIdeaUploadImage(metadata: unknown): BoardIdeaUploadImage | null {
	if (!isRecord(metadata)) {
		return null;
	}

	const boardImage = metadata.boardImage;

	if (!isRecord(boardImage)) {
		return null;
	}

	if (
		boardImage.source !== 'upload'
		|| typeof boardImage.bucket !== 'string'
		|| !boardImage.bucket
		|| typeof boardImage.path !== 'string'
		|| !boardImage.path
	) {
		return null;
	}

	return {
		source: 'upload',
		bucket: boardImage.bucket,
		path: boardImage.path,
	};
}

export function withBoardIdeaUploadImage(
	metadata: IdeaMetadata | Record<string, unknown> | null | undefined,
	boardImage: BoardIdeaUploadImage | null
): IdeaMetadata {
	const nextMetadata: IdeaMetadata = isRecord(metadata) ? { ...metadata } : {};

	if (boardImage) {
		nextMetadata.boardImage = boardImage;
		return nextMetadata;
	}

	delete nextMetadata.boardImage;
	return nextMetadata;
}

export function ideaHasImage(idea: IdeaImageSource | null | undefined) {
	return Boolean(idea?.image_url?.trim()) || Boolean(getBoardIdeaUploadImage(idea?.metadata));
}

export function getBoardIdeaUploadFileName(boardImage: BoardIdeaUploadImage | null | undefined) {
	return boardImage?.path.split('/').pop() || 'uploaded-image';
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
		const directUrl = idea?.image_url?.trim();

		if (directUrl) {
			return directUrl;
		}

		const boardImage = getBoardIdeaUploadImage(idea?.metadata);

		if (!boardImage) {
			return null;
		}

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
	};

	const uploadIdeaImage = async (file: File, userId: string): Promise<BoardIdeaUploadImage> => {
		const client = requireSupabaseClient();
		const safeName = sanitizeFileName(file.name);
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
		resolveIdeaImageUrl,
		uploadIdeaImage,
	};
}
