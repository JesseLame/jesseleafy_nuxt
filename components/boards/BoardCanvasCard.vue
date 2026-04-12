<script setup lang="ts">
import { computed } from 'vue';
import BoardIdeaImage from '~/components/boards/BoardIdeaImage.vue';
import { ideaHasImage } from '~/composables/useBoardIdeaImages';
import type { BoardItemWithIdea } from '~/types/board';
import { formatIdeaTypeLabel, getBoardItemCardClasses } from '~/utils/board';

const props = defineProps<{
	item: BoardItemWithIdea;
	selected: boolean;
}>();

const emit = defineEmits<{
	pointerdown: [event: PointerEvent];
}>();

const cardHasImage = computed(() => ideaHasImage(props.item.idea));
const useCompactImageLayout = computed(() => cardHasImage.value && props.item.height < 210);
</script>

<template>
	<button
		type="button"
		class="absolute flex cursor-grab flex-col rounded-[1.75rem] border-2 px-4 py-3 text-left shadow-md transition focus:outline-none focus:ring-2 focus:ring-green-500/50 active:cursor-grabbing"
		:class="[
			getBoardItemCardClasses(item.style),
			selected ? 'ring-2 ring-green-600 shadow-xl' : 'border-transparent',
		]"
		:style="{
			left: `${item.position_x}px`,
			top: `${item.position_y}px`,
			width: `${item.width}px`,
			height: `${item.height}px`,
			zIndex: item.z_index,
		}"
		@pointerdown="emit('pointerdown', $event)"
	>
		<div class="flex items-start justify-between gap-2">
			<div>
				<p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-700/70">
					{{ formatIdeaTypeLabel(item.idea?.type || 'Idea') }}
				</p>
				<h3 class="mt-2 text-lg font-semibold text-green-950">
					{{ item.idea?.title || 'Untitled card' }}
				</h3>
			</div>

			<span
				v-if="item.concept_id"
				class="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-800"
			>
				Concept
			</span>
		</div>

		<BoardIdeaImage
			v-if="cardHasImage && item.idea"
			:idea="item.idea"
			:alt="item.idea.title"
			:image-class="useCompactImageLayout ? 'mt-3 h-16 w-full rounded-xl object-cover' : 'mt-3 h-24 w-full rounded-2xl object-cover'"
		/>

		<p
			v-if="item.idea?.description"
			class="mt-3 text-sm text-gray-700"
			:class="useCompactImageLayout ? 'line-clamp-2' : 'line-clamp-3'"
		>
			{{ item.idea.description }}
		</p>

		<div v-if="item.idea?.tags.length" class="mt-auto flex flex-wrap gap-2 pt-4">
			<span
				v-for="tag in item.idea.tags.slice(0, 3)"
				:key="tag"
				class="rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-gray-700"
			>
				{{ tag }}
			</span>
		</div>
	</button>
</template>
