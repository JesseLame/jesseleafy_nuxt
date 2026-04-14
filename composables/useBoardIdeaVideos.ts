import type { BoardIdeaVideoReference } from '~/types/board';

export function useBoardIdeaVideos() {
	const resolvedVideoReferenceCache = useState<Record<string, BoardIdeaVideoReference | null | undefined>>(
		'board-idea-video-reference-cache',
		() => ({})
	);

	const clearResolvedIdeaVideoReference = (url?: string | null) => {
		const trimmedUrl = url?.trim();

		if (!trimmedUrl) {
			return;
		}

		delete resolvedVideoReferenceCache.value[trimmedUrl];
	};

	const resolveIdeaVideoReference = async (url: string): Promise<BoardIdeaVideoReference | null> => {
		const trimmedUrl = url.trim();

		if (!trimmedUrl) {
			return null;
		}

		if (trimmedUrl in resolvedVideoReferenceCache.value) {
			return resolvedVideoReferenceCache.value[trimmedUrl] ?? null;
		}

		const response = await $fetch<{ videoReference: BoardIdeaVideoReference | null }>('/api/board-video-reference/resolve', {
			method: 'POST',
			body: { url: trimmedUrl },
		});

		resolvedVideoReferenceCache.value[trimmedUrl] = response.videoReference ?? null;
		return response.videoReference ?? null;
	};

	return {
		clearResolvedIdeaVideoReference,
		resolveIdeaVideoReference,
	};
}
