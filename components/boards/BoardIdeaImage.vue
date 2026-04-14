<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import type { IdeaMediaSource } from '~/types/board';
import { useBoardIdeaImages } from '~/composables/useBoardIdeaImages';
import { getBoardIdeaImageSourceKey } from '~/utils/boardIdeaImages';
import {
	getBoardIdeaVideoProviderLabel,
	getBoardIdeaVideoReference,
	parseBoardIdeaVideoReferenceUrl,
} from '~/utils/boardIdeaVideos';

const props = withDefaults(defineProps<{
	idea: IdeaMediaSource | null;
	alt?: string;
	frameStyle?: CSSProperties | null;
	imageClass?: string;
	isInteractionLocked?: boolean;
	allowLivePreview?: boolean;
	mode?: 'board-card' | 'card' | 'editor';
	wrapperClass?: string;
}>(), {
	alt: '',
	allowLivePreview: true,
	frameStyle: null,
	imageClass: '',
	isInteractionLocked: false,
	mode: 'card',
	wrapperClass: '',
});

const { resolveIdeaImageUrl } = useBoardIdeaImages();

const displayUrl = ref('');
const hiddenAfterError = ref(false);
const requestId = ref(0);
const isHovered = ref(false);
const canUseHoverPreview = ref(false);
const imageSourceKey = computed(() => getBoardIdeaImageSourceKey(props.idea));
const videoReference = computed(() => getBoardIdeaVideoReference(props.idea?.metadata));
const parsedVideoReference = computed(() => parseBoardIdeaVideoReferenceUrl(props.idea?.reference_url));

const showImage = computed(() => Boolean(displayUrl.value) && !hiddenAfterError.value);
const showVideoPoster = computed(() => !showImage.value && Boolean(videoReference.value?.thumbnailUrl));
const showVideoFallbackMessage = computed(() => !showImage.value && !showVideoPoster.value && Boolean(parsedVideoReference.value));
const providerLabel = computed(() =>
	getBoardIdeaVideoProviderLabel(videoReference.value?.provider ?? parsedVideoReference.value?.provider)
);
const livePreviewEnabled = computed(() =>
	(props.mode === 'card' || props.mode === 'board-card')
	&& props.allowLivePreview
	&& canUseHoverPreview.value
	&& !props.isInteractionLocked
	&& Boolean(videoReference.value?.embedUrl)
);
const showInlinePreview = computed(() => isHovered.value && livePreviewEnabled.value);
const iframeSrc = computed(() => (showInlinePreview.value ? videoReference.value?.embedUrl ?? '' : ''));
const previewTitle = computed(() => videoReference.value?.title || props.alt || props.idea?.title || 'Video preview');
const isBoardCard = computed(() => props.mode === 'board-card');
const mediaFrameStyle = computed<CSSProperties | undefined>(() => {
	if (props.frameStyle) {
		return props.frameStyle;
	}

	if (!isBoardCard.value) {
		return undefined;
	}

	return {
		aspectRatio: String(videoReference.value?.aspectRatio ?? 16 / 9),
	};
});

const resetHoverState = () => {
	isHovered.value = false;
};

const loadImage = async (sourceKey: string, previousSourceKey?: string) => {
	requestId.value += 1;
	const activeRequestId = requestId.value;
	hiddenAfterError.value = false;

	if (!sourceKey) {
		displayUrl.value = '';
		return;
	}

	if (previousSourceKey && previousSourceKey !== sourceKey) {
		displayUrl.value = '';
	}

	try {
		const nextUrl = await resolveIdeaImageUrl(props.idea);

		if (activeRequestId !== requestId.value) {
			return;
		}

		displayUrl.value = nextUrl ?? '';
	} catch {
		if (activeRequestId !== requestId.value) {
			return;
		}

		displayUrl.value = '';
	}
};

watch(
	() => [props.idea, imageSourceKey.value],
	([nextIdea, nextSourceKey], previousValue) => {
		const previousSourceKey = previousValue?.[1];
		hiddenAfterError.value = false;

		if (!nextIdea) {
			displayUrl.value = '';
			return;
		}

		void loadImage(nextSourceKey, previousSourceKey);
	},
	{ immediate: true }
);

const handleImageError = () => {
	hiddenAfterError.value = true;
};

const updateHoverPreviewCapability = () => {
	if (!import.meta.client) {
		return;
	}

	canUseHoverPreview.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	if (!canUseHoverPreview.value) {
		isHovered.value = false;
	}
};

const handleMouseEnter = () => {
	if (livePreviewEnabled.value) {
		isHovered.value = true;
	}
};

const handleMouseLeave = () => {
	isHovered.value = false;
};

watch(
	() => props.isInteractionLocked,
	(locked) => {
		if (locked) {
			resetHoverState();
		}
	}
);

onMounted(() => {
	updateHoverPreviewCapability();
	window.addEventListener('resize', updateHoverPreviewCapability);
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', updateHoverPreviewCapability);
});
</script>

<template>
	<div v-if="showImage" :class="wrapperClass">
		<div
			v-if="isBoardCard"
			class="relative w-full overflow-hidden rounded-[1.15rem]"
			:style="mediaFrameStyle"
		>
			<img
				:src="displayUrl"
				:alt="alt || idea?.title || 'Idea image'"
				class="absolute inset-0 h-full w-full"
				:class="imageClass"
				@error="handleImageError"
			/>
		</div>

		<img
			v-else
			:src="displayUrl"
			:alt="alt || idea?.title || 'Idea image'"
			:class="imageClass"
			@error="handleImageError"
		/>
	</div>

	<div
		v-else-if="showVideoPoster || showVideoFallbackMessage"
		:class="wrapperClass"
		@mouseenter="handleMouseEnter"
		@mouseleave="handleMouseLeave"
	>
		<div
			class="relative w-full overflow-hidden rounded-[1.4rem] border border-green-900/10 bg-green-950/10"
			:class="isBoardCard ? 'shrink-0' : 'h-full'"
			:style="mediaFrameStyle"
		>
			<img
				v-if="videoReference?.thumbnailUrl"
				:src="videoReference.thumbnailUrl"
				:alt="alt || idea?.title || 'Idea video preview'"
				class="absolute inset-0 h-full w-full object-cover transition duration-300"
				:class="[
					imageClass,
					showInlinePreview ? 'scale-[1.03] opacity-30' : 'opacity-100',
				]"
			/>

			<div
				v-else
				class="absolute inset-0 flex min-h-[200px] w-full items-end bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_55%),linear-gradient(135deg,rgba(20,83,45,0.9),rgba(21,128,61,0.55))] p-4"
			>
				<p class="max-w-[14rem] text-sm font-medium text-white/90">
					Video linked. Preview poster is loading or unavailable.
				</p>
			</div>

			<div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-green-950/10 via-transparent to-green-950/45" />

			<div
				v-if="showInlinePreview && iframeSrc"
				class="pointer-events-none absolute inset-0 transition duration-300"
			>
				<iframe
					:src="iframeSrc"
					:title="previewTitle"
					class="absolute inset-0 h-full w-full"
					allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
					loading="lazy"
					referrerpolicy="strict-origin-when-cross-origin"
					tabindex="-1"
				/>
			</div>

			<div class="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
				<span
					v-if="providerLabel"
					class="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm"
				>
					{{ providerLabel }}
				</span>
				<span
					v-if="(mode === 'card' || mode === 'board-card') && canUseHoverPreview && videoReference?.thumbnailUrl"
					class="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm"
				>
					Hover preview
				</span>
			</div>

			<div
				v-if="videoReference?.thumbnailUrl"
				class="pointer-events-none absolute inset-0 flex items-center justify-center"
			>
				<span
					class="flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white shadow-lg backdrop-blur-sm transition duration-300"
					:class="showInlinePreview ? 'scale-90 opacity-0' : 'scale-100 opacity-100'"
				>
					<svg viewBox="0 0 20 20" class="ml-1 h-5 w-5 fill-current" aria-hidden="true">
						<path d="M6 4.5v11l9-5.5-9-5.5z" />
					</svg>
				</span>
			</div>
		</div>

		<p
			v-if="mode === 'editor'"
			class="mt-3 text-xs font-medium text-gray-600"
		>
			{{ providerLabel || 'Video' }} preview is shown as a poster here and animates on hover on desktop board cards.
		</p>

		<p
			v-else-if="showVideoFallbackMessage"
			class="mt-3 text-xs font-medium text-gray-600"
		>
			Video linked, but the preview poster is still loading or unavailable right now.
		</p>
	</div>
</template>
