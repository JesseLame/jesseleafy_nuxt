import type {
	BoardIdeaVideoProvider,
	BoardIdeaVideoReference,
	IdeaMediaSource,
	IdeaMetadata,
} from '~/types/board';

export interface ParsedBoardIdeaVideoReference {
	provider: BoardIdeaVideoProvider;
	videoId: string;
	canonicalUrl: string;
}

const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function normalizeHost(hostname: string) {
	return hostname.toLowerCase().replace(/^www\./, '');
}

function parseYouTubeVideoId(url: URL) {
	const hostname = normalizeHost(url.hostname);

	if (hostname === 'youtu.be') {
		return url.pathname.split('/').filter(Boolean)[0] ?? '';
	}

	if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
		if (url.pathname === '/watch') {
			return url.searchParams.get('v') ?? '';
		}

		const segments = url.pathname.split('/').filter(Boolean);

		if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live') {
			return segments[1] ?? '';
		}
	}

	if (hostname === 'youtube-nocookie.com') {
		const segments = url.pathname.split('/').filter(Boolean);

		if (segments[0] === 'embed') {
			return segments[1] ?? '';
		}
	}

	return '';
}

function parseVimeoVideoId(url: URL) {
	const hostname = normalizeHost(url.hostname);
	const segments = url.pathname.split('/').filter(Boolean);

	if (hostname === 'player.vimeo.com' && segments[0] === 'video') {
		return segments[1] ?? '';
	}

	for (let index = segments.length - 1; index >= 0; index -= 1) {
		if (/^\d+$/.test(segments[index] ?? '')) {
			return segments[index] ?? '';
		}
	}

	return '';
}

export function parseBoardIdeaVideoReferenceUrl(value: string | null | undefined): ParsedBoardIdeaVideoReference | null {
	const trimmedValue = value?.trim();

	if (!trimmedValue) {
		return null;
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(trimmedValue);
	} catch {
		return null;
	}

	const hostname = normalizeHost(parsedUrl.hostname);

	if (['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(hostname)) {
		const videoId = parseYouTubeVideoId(parsedUrl);

		if (!YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
			return null;
		}

		return {
			provider: 'youtube',
			videoId,
			canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
		};
	}

	if (hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com')) {
		const videoId = parseVimeoVideoId(parsedUrl);

		if (!/^\d+$/.test(videoId)) {
			return null;
		}

		return {
			provider: 'vimeo',
			videoId,
			canonicalUrl: `https://vimeo.com/${videoId}`,
		};
	}

	return null;
}

export function buildBoardIdeaVideoEmbedUrl(provider: BoardIdeaVideoProvider, videoId: string) {
	if (provider === 'youtube') {
		return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&modestbranding=1`;
	}

	return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&controls=0&autopause=0&background=1&title=0&byline=0&portrait=0`;
}

export function buildBoardIdeaVideoThumbnailUrl(provider: BoardIdeaVideoProvider, videoId: string) {
	if (provider === 'youtube') {
		return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
	}

	return '';
}

export function getBoardIdeaVideoReference(metadata: unknown): BoardIdeaVideoReference | null {
	if (!isRecord(metadata)) {
		return null;
	}

	const videoReference = metadata.videoReference;

	if (!isRecord(videoReference)) {
		return null;
	}

	if (
		(videoReference.provider !== 'youtube' && videoReference.provider !== 'vimeo')
		|| typeof videoReference.videoId !== 'string'
		|| !videoReference.videoId
		|| typeof videoReference.embedUrl !== 'string'
		|| !videoReference.embedUrl
		|| typeof videoReference.thumbnailUrl !== 'string'
		|| !videoReference.thumbnailUrl
	) {
		return null;
	}

	return {
		provider: videoReference.provider,
		videoId: videoReference.videoId,
		embedUrl: videoReference.embedUrl,
		thumbnailUrl: videoReference.thumbnailUrl,
		title: typeof videoReference.title === 'string' && videoReference.title ? videoReference.title : undefined,
		aspectRatio: typeof videoReference.aspectRatio === 'number' && Number.isFinite(videoReference.aspectRatio) && videoReference.aspectRatio > 0
			? videoReference.aspectRatio
			: undefined,
	};
}

export function withBoardIdeaVideoReference(
	metadata: IdeaMetadata | Record<string, unknown> | null | undefined,
	videoReference: BoardIdeaVideoReference | null
): IdeaMetadata {
	const nextMetadata: IdeaMetadata = isRecord(metadata) ? { ...metadata } : {};

	if (videoReference) {
		nextMetadata.videoReference = videoReference;
		return nextMetadata;
	}

	delete nextMetadata.videoReference;
	return nextMetadata;
}

export function getBoardIdeaVideoSourceKey(idea: Pick<IdeaMediaSource, 'metadata' | 'reference_url'> | null | undefined) {
	const storedVideoReference = getBoardIdeaVideoReference(idea?.metadata);

	if (storedVideoReference) {
		return `video:${storedVideoReference.provider}:${storedVideoReference.videoId}`;
	}

	const parsedReference = parseBoardIdeaVideoReferenceUrl(idea?.reference_url);

	if (!parsedReference) {
		return '';
	}

	return `video-link:${parsedReference.provider}:${parsedReference.videoId}`;
}

export function getBoardIdeaVideoProviderLabel(provider: BoardIdeaVideoProvider | null | undefined) {
	if (provider === 'youtube') {
		return 'YouTube';
	}

	if (provider === 'vimeo') {
		return 'Vimeo';
	}

	return '';
}
