<script setup lang="ts">
import { computed, ref } from 'vue';
import { Handle, Position, type NodeProps } from '@vue-flow/core';
import { NodeResizer, type OnResizeEnd } from '@vue-flow/node-resizer';
import BoardIdeaImage from '~/components/boards/BoardIdeaImage.vue';
import { BOARD_IMAGE_CARD_HEIGHT, BOARD_IMAGE_CARD_WIDTH, getBoardIdeaVisualSourceKey, ideaHasVisualMedia } from '~/utils/boardIdeaImages';
import type { BoardFlowNodeData } from '~/utils/boardFlow';
import {
	formatIdeaTypeLabel,
	getBoardItemCardClasses,
	getPromotedConceptMemberCount,
	getPromotedConceptMemberTitles,
	isPromotedConceptIdea,
} from '~/utils/board';
import { getBoardIdeaVideoReference, parseBoardIdeaVideoReferenceUrl } from '~/utils/boardIdeaVideos';

const props = defineProps<{
	isCanvasDragging: boolean;
	nodeProps: NodeProps<BoardFlowNodeData>;
}>();

const emit = defineEmits<{
	'edit-requested': [];
	'resize-end': [payload: { height: number; itemId: string; width: number }];
}>();

const item = computed(() => props.nodeProps.data.item);
const cardHasVisualMedia = computed(() => ideaHasVisualMedia(item.value.idea));
const imageSourceKey = computed(() => getBoardIdeaVisualSourceKey(item.value.idea));
const videoReference = computed(() => getBoardIdeaVideoReference(item.value.idea?.metadata));
const cardHasVideoPreview = computed(() => Boolean(videoReference.value || parseBoardIdeaVideoReferenceUrl(item.value.idea?.reference_url)));
const mediaAspectRatio = computed(() => (cardHasVideoPreview.value ? (videoReference.value?.aspectRatio ?? 16 / 9) : 4 / 3));
const mediaFrameStyle = computed(() => ({ aspectRatio: String(mediaAspectRatio.value) }));
const isConceptSummaryCard = computed(() => isPromotedConceptIdea(item.value.idea));
const conceptMemberCount = computed(() => getPromotedConceptMemberCount(item.value.idea));
const conceptMemberTitles = computed(() => getPromotedConceptMemberTitles(item.value.idea).slice(0, 3));
const isResizing = ref(false);
const isMediaInteractionLocked = computed(() => props.isCanvasDragging || isResizing.value);
const minWidth = computed(() => (cardHasVisualMedia.value ? BOARD_IMAGE_CARD_WIDTH : 260));
const minHeight = computed(() => (cardHasVisualMedia.value ? BOARD_IMAGE_CARD_HEIGHT : 160));

const handleResizeStart = () => {
	isResizing.value = true;
};

const handleResizeEnd = (event: OnResizeEnd) => {
	isResizing.value = false;
	emit('resize-end', {
		itemId: item.value.id,
		width: Math.max(Math.round(event.params.width), minWidth.value),
		height: Math.max(Math.round(event.params.height), minHeight.value),
	});
};
</script>

<template>
	<div
		class="board-flow-card-drag relative flex h-full w-full cursor-grab flex-col rounded-[1.75rem] border-2 px-4 py-3 text-left shadow-md transition active:cursor-grabbing"
		:class="[
			getBoardItemCardClasses(item.style),
			nodeProps.selected ? 'ring-2 ring-[color:var(--board-accent)] shadow-xl' : 'border-transparent',
		]"
		@contextmenu.prevent="emit('edit-requested')"
		@dblclick.prevent="emit('edit-requested')"
	>
		<NodeResizer
			:is-visible="nodeProps.selected"
			:min-width="minWidth"
			:min-height="minHeight"
			color="#15803d"
			handle-class-name="nodrag"
			line-class-name="nodrag"
			@resize-start="handleResizeStart"
			@resize-end="handleResizeEnd"
		/>

		<Handle
			type="target"
			:position="Position.Left"
			class="!h-3 !w-3 !border-2 !border-white !bg-green-700"
		/>
		<Handle
			type="source"
			:position="Position.Right"
			class="!h-3 !w-3 !border-2 !border-white !bg-green-700"
		/>

		<div class="flex items-start justify-between gap-2">
			<div>
				<p class="board-studio-kicker text-[10px]">
					{{ formatIdeaTypeLabel(item.idea?.type || 'Idea') }}
				</p>
				<h3 class="board-studio-display mt-2 text-[1.35rem] leading-none text-[color:var(--board-ink)]">
					{{ item.idea?.title || 'Untitled card' }}
				</h3>
			</div>

			<span
				v-if="item.concept_id"
				class="board-studio-pill nodrag"
			>
				Concept
			</span>
		</div>

		<BoardIdeaImage
			v-if="cardHasVisualMedia && item.idea"
			:key="`${item.id}:${imageSourceKey}`"
			:idea="item.idea"
			:alt="item.idea.title"
			:is-interaction-locked="isMediaInteractionLocked"
			mode="board-card"
			:frame-style="mediaFrameStyle"
			wrapper-class="mt-4 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--board-outline)] bg-white/60 p-3"
			image-class="rounded-[1.15rem] object-cover"
		/>

		<p
			v-if="item.idea?.description"
			class="mt-3 text-sm leading-6 text-[color:var(--board-muted)]"
			:class="cardHasVisualMedia ? 'line-clamp-2' : 'line-clamp-3'"
		>
			{{ item.idea.description }}
		</p>

		<div
			v-if="isConceptSummaryCard && conceptMemberCount"
			class="mt-3 rounded-2xl border border-[color:var(--board-outline)] bg-white/65 px-3 py-3"
		>
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--board-muted)]">
				{{ conceptMemberCount }} linked member{{ conceptMemberCount === 1 ? '' : 's' }}
			</p>
			<p
				v-if="conceptMemberTitles.length"
				class="mt-2 text-sm leading-6 text-[color:var(--board-ink)]"
			>
				{{ conceptMemberTitles.join(' · ') }}
			</p>
		</div>

		<div v-if="item.idea?.reference_url" class="mt-3">
			<a
				:href="item.idea.reference_url"
				target="_blank"
				rel="noopener noreferrer"
				class="board-studio-button board-studio-button-secondary nodrag"
				@click.stop
			>
				Open link
			</a>
		</div>

		<div v-if="item.idea?.tags.length" class="mt-auto flex flex-wrap gap-2 pt-4">
			<span
				v-for="tag in item.idea.tags.slice(0, 3)"
				:key="tag"
				class="board-studio-pill nodrag"
			>
				{{ tag }}
			</span>
		</div>
	</div>
</template>
