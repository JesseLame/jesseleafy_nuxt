<script setup lang="ts">
import { ref, watch } from 'vue';
import { VueFlow, type Connection, type EdgeMouseEvent, type GraphNode, type NodeDragEvent } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import type { BoardItemWithIdea, BoardRelation } from '~/types/board';
import BoardFlowNode from '~/components/boards/BoardFlowNode.vue';
import {
	boardItemToFlowNode,
	boardRelationToFlowEdge,
	type BoardFlowEdge,
	type BoardFlowNode as FlowNode,
} from '~/utils/boardFlow';

const props = defineProps<{
	boardItems: BoardItemWithIdea[];
	boardRelations: BoardRelation[];
	selectedItemIds: string[];
	selectedRelationIds: string[];
}>();

const emit = defineEmits<{
	'board-item-resized': [payload: { height: number; itemId: string; width: number }];
	'board-items-moved': [payload: Array<{ itemId: string; positionX: number; positionY: number }>];
	'card-edit-requested': [item: BoardItemWithIdea];
	'relation-edit-requested': [payload: { anchorX: number; anchorY: number; relationId: string }];
	'relation-connected': [connection: Connection];
	'selection-change': [payload: { itemIds: string[]; relationIds: string[] }];
}>();

const nodes = ref<FlowNode[]>([]);
const edges = ref<BoardFlowEdge[]>([]);
const isCanvasDragging = ref(false);
let lastSelectionSignature = '';

const syncNodesFromProps = () => {
	nodes.value = props.boardItems.map((item) => boardItemToFlowNode(item, props.selectedItemIds.includes(item.id)));
};

const syncEdgesFromProps = () => {
	edges.value = props.boardRelations.map((relation) =>
		boardRelationToFlowEdge(relation, props.selectedRelationIds.includes(relation.id))
	);
};

const emitSelectionChange = () => {
	const itemIds = nodes.value.filter((node) => node.selected).map((node) => node.id);
	const relationIds = edges.value.filter((edge) => edge.selected).map((edge) => edge.id);
	const signature = `${itemIds.join(',')}::${relationIds.join(',')}`;

	if (signature === lastSelectionSignature) {
		return;
	}

	lastSelectionSignature = signature;
	emit('selection-change', { itemIds, relationIds });
};

const emitMovedNodes = (movedNodes: GraphNode[]) => {
	const payload = movedNodes.map((node) => ({
		itemId: node.id,
		positionX: Math.round(node.position.x),
		positionY: Math.round(node.position.y),
	}));

	if (payload.length) {
		emit('board-items-moved', payload);
	}
};

const handleNodeDragStop = (event: NodeDragEvent) => {
	isCanvasDragging.value = false;
	emitMovedNodes([event.node]);
};

const handleNodeDragStart = () => {
	isCanvasDragging.value = true;
};

const handleSelectionDragStop = (event: NodeDragEvent) => {
	isCanvasDragging.value = false;
	emitMovedNodes(event.nodes);
};

const handleSelectionDragStart = () => {
	isCanvasDragging.value = true;
};

const handleEdgeDoubleClick = ({ edge, event }: EdgeMouseEvent) => {
	const pointerEvent = 'clientX' in event
		? event
		: (event.touches[0] ?? event.changedTouches[0]);

	emit('relation-edit-requested', {
		relationId: edge.id,
		anchorX: pointerEvent?.clientX ?? 0,
		anchorY: pointerEvent?.clientY ?? 0,
	});
};

watch(
	() => props.boardItems,
	() => {
		syncNodesFromProps();
	},
	{ deep: true, immediate: true }
);

watch(
	() => [props.boardRelations, props.selectedRelationIds],
	() => {
		syncEdgesFromProps();
	},
	{ deep: true, immediate: true }
);

watch(
	() => props.selectedItemIds,
	() => {
		syncNodesFromProps();
	},
	{ deep: true }
);

watch([nodes, edges], emitSelectionChange, { deep: true });
</script>

<template>
	<section class="board-studio-panel min-w-0 flex-1 p-5 sm:p-6">
		<div class="flex items-center justify-between gap-3">
			<div>
				<p class="board-studio-kicker">
					Canvas
				</p>
				<h2 class="board-studio-display mt-3 text-[2rem] leading-none text-[color:var(--board-ink)]">
					Hybrid board
				</h2>
			</div>

			<div class="board-studio-pill">
				{{ boardItems.length }} cards · {{ boardRelations.length }} links
			</div>
		</div>

		<div class="relative mt-6 overflow-hidden rounded-[1.9rem] border border-[color:var(--board-outline)] bg-[color:var(--board-paper-soft)]">
			<ClientOnly>
				<div class="h-[75vh] min-h-[48rem] w-full">
					<VueFlow
						v-model:nodes="nodes"
						v-model:edges="edges"
						class="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(214,164,107,0.16),transparent_28%),radial-gradient(circle_at_top,rgba(167,197,164,0.28),transparent_34%),linear-gradient(180deg,rgba(255,250,245,0.98),rgba(247,242,232,0.95))]"
						fit-view-on-init
						:min-zoom="0.2"
						:max-zoom="1.6"
						:delete-key-code="null"
						:elevate-edges-on-select="true"
						:elevate-nodes-on-select="true"
						:edges-updatable="false"
						:elements-selectable="true"
						:multi-selection-key-code="'Shift'"
						:nodes-connectable="true"
						:nodes-draggable="true"
						@connect="emit('relation-connected', $event)"
						@edge-double-click="handleEdgeDoubleClick"
						@node-drag-start="handleNodeDragStart"
						@node-drag-stop="handleNodeDragStop"
						@selection-drag-start="handleSelectionDragStart"
						@selection-drag-stop="handleSelectionDragStop"
					>
						<Background variant="lines" :gap="32" color="rgba(36, 77, 58, 0.1)" />
						<Controls position="top-right" />

						<template #node-board-card="nodeProps">
							<BoardFlowNode
								:is-canvas-dragging="isCanvasDragging"
								:node-props="nodeProps"
								@edit-requested="emit('card-edit-requested', nodeProps.data.item)"
								@resize-end="emit('board-item-resized', $event)"
							/>
						</template>
					</VueFlow>
				</div>

				<template #fallback>
					<div class="flex h-[60vh] min-h-[32rem] items-center justify-center px-6 text-center text-sm text-[color:var(--board-muted)]">
						Loading board canvas...
					</div>
				</template>
			</ClientOnly>

			<div
				v-if="!boardItems.length"
				class="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[color:var(--board-muted)]"
			>
				<div class="board-studio-card max-w-md px-8 py-10">
					<p class="board-studio-kicker">
						Blank canvas
					</p>
					<h3 class="board-studio-display mt-3 text-[1.8rem] leading-none text-[color:var(--board-ink)]">
						Start by placing an idea on the board
					</h3>
					<p class="mt-3 text-sm leading-6 text-[color:var(--board-muted)]">
						Use the library on the left to add reusable pieces, then drag from a card handle when you want to show how ideas connect.
					</p>
				</div>
			</div>
		</div>
	</section>
</template>
