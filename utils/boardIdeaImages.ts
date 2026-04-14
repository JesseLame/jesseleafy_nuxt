import type { BoardIdeaUploadImage, IdeaMediaSource, IdeaMetadata } from '~/types/board';
import { getBoardIdeaVideoSourceKey } from '~/utils/boardIdeaVideos';

export const BOARD_IDEA_IMAGE_BUCKET = 'board-idea-images';
export const BOARD_IDEA_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const DEFAULT_BOARD_CARD_WIDTH = 260;
export const DEFAULT_BOARD_CARD_HEIGHT = 160;
export const BOARD_IMAGE_CARD_WIDTH = 320;
export const BOARD_IMAGE_CARD_HEIGHT = 380;

export type IdeaImageSource = Pick<IdeaMediaSource, 'image_url' | 'metadata' | 'reference_url'>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function sanitizeBoardIdeaImageFileName(name: string) {
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

export function getBoardIdeaImageSourceKey(idea: IdeaImageSource | null | undefined) {
	const boardImage = getBoardIdeaUploadImage(idea?.metadata);

	if (boardImage) {
		return `upload:${boardImage.bucket}:${boardImage.path}`;
	}

	const directUrl = idea?.image_url?.trim();
	return directUrl ? `direct:${directUrl}` : '';
}

export function ideaHasImage(idea: IdeaImageSource | null | undefined) {
	return Boolean(getBoardIdeaImageSourceKey(idea));
}

export function getBoardIdeaVisualSourceKey(idea: IdeaImageSource | null | undefined) {
	return getBoardIdeaImageSourceKey(idea) || getBoardIdeaVideoSourceKey(idea);
}

export function ideaHasVisualMedia(idea: IdeaImageSource | null | undefined) {
	return Boolean(getBoardIdeaVisualSourceKey(idea));
}

export function getBoardIdeaUploadFileName(boardImage: BoardIdeaUploadImage | null | undefined) {
	return boardImage?.path.split('/').pop() || 'uploaded-image';
}
