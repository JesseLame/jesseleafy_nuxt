import type { BoardIdeaVideoReference } from '~/types/board';
import {
	buildBoardIdeaVideoEmbedUrl,
	buildBoardIdeaVideoThumbnailUrl,
	parseBoardIdeaVideoReferenceUrl,
} from '~/utils/boardIdeaVideos';

function createHttpError(statusCode: number, statusMessage: string) {
	return createError({ statusCode, statusMessage });
}

interface VimeoOEmbedResponse {
	title?: string;
	thumbnail_url?: string;
	width?: number;
	height?: number;
}

function getAspectRatio(width?: number, height?: number) {
	if (typeof width !== 'number' || typeof height !== 'number' || !width || !height) {
		return undefined;
	}

	return width / height;
}

export default defineEventHandler(async (event): Promise<{ videoReference: BoardIdeaVideoReference | null }> => {
	const { url } = await readBody<{ url?: string }>(event);
	const trimmedUrl = url?.trim();

	if (!trimmedUrl) {
		throw createHttpError(400, 'Provide a reference URL to preview.');
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(trimmedUrl);
	} catch {
		throw createHttpError(400, 'Enter a valid reference URL.');
	}

	if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
		throw createHttpError(400, 'Only http and https reference URLs are allowed.');
	}

	const parsedReference = parseBoardIdeaVideoReferenceUrl(trimmedUrl);

	if (!parsedReference) {
		return { videoReference: null };
	}

	if (parsedReference.provider === 'youtube') {
		return {
			videoReference: {
				provider: 'youtube',
				videoId: parsedReference.videoId,
				embedUrl: buildBoardIdeaVideoEmbedUrl('youtube', parsedReference.videoId),
				thumbnailUrl: buildBoardIdeaVideoThumbnailUrl('youtube', parsedReference.videoId),
				aspectRatio: 16 / 9,
			},
		};
	}

	const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(parsedReference.canonicalUrl)}`;
	const oEmbedResponse = await fetch(oEmbedUrl, {
		headers: {
			Accept: 'application/json',
		},
	});

	if (!oEmbedResponse.ok) {
		return { videoReference: null };
	}

	const oEmbedData = (await oEmbedResponse.json()) as VimeoOEmbedResponse;
	const thumbnailUrl = oEmbedData.thumbnail_url?.trim();

	if (!thumbnailUrl) {
		return { videoReference: null };
	}

	return {
		videoReference: {
			provider: 'vimeo',
			videoId: parsedReference.videoId,
			embedUrl: buildBoardIdeaVideoEmbedUrl('vimeo', parsedReference.videoId),
			thumbnailUrl,
			title: oEmbedData.title?.trim() || undefined,
			aspectRatio: getAspectRatio(oEmbedData.width, oEmbedData.height),
		},
	};
});
