<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Idea } from '~/types/board';
import { ideaHasImage, useBoardIdeaImages } from '~/composables/useBoardIdeaImages';

const props = withDefaults(defineProps<{
	idea: Idea | null;
	alt?: string;
	imageClass?: string;
	wrapperClass?: string;
}>(), {
	alt: '',
	imageClass: '',
	wrapperClass: '',
});

const { resolveIdeaImageUrl } = useBoardIdeaImages();

const displayUrl = ref('');
const hiddenAfterError = ref(false);
const requestId = ref(0);

const showImage = computed(() => Boolean(displayUrl.value) && !hiddenAfterError.value);

const loadImage = async () => {
	requestId.value += 1;
	const activeRequestId = requestId.value;
	hiddenAfterError.value = false;

	if (!ideaHasImage(props.idea)) {
		displayUrl.value = '';
		return;
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
	() => [props.idea?.id, props.idea?.image_url, props.idea?.updated_at],
	() => {
		void loadImage();
	},
	{ immediate: true }
);

const handleImageError = () => {
	hiddenAfterError.value = true;
};
</script>

<template>
	<div v-if="showImage" :class="wrapperClass">
		<img
			:src="displayUrl"
			:alt="alt || idea?.title || 'Idea image'"
			:class="imageClass"
			@error="handleImageError"
		/>
	</div>
</template>
