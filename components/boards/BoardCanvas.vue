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
	<section class="min-w-0 flex-1 rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-sm">
		<div class="flex items-center justify-between gap-3">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">
					Canvas
				</p>
				<h2 class="mt-2 text-2xl font-bold text-green-900">
					Hybrid board
				</h2>
				<p class="mt-2 text-sm text-gray-600">
					Drag cards, resize them, pan and zoom the board, then connect ideas with handles when relationships matter.
				</p>
			</div>

			<div class="rounded-full bg-green-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-green-800">
				{{ boardItems.length }} cards · {{ boardRelations.length }} links
			</div>
		</div>

		<div class="relative mt-5 overflow-hidden rounded-3xl border border-green-900/10 bg-white/70">
			<ClientOnly>
				<div class="h-[75vh] min-h-[48rem] w-full">
					<VueFlow
						v-model:nodes="nodes"
						v-model:edges="edges"
						class="h-full w-full bg-[radial-gradient(circle_at_top,rgba(220,252,231,0.55),rgba(255,255,255,0.95)_55%)]"
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
						<Background variant="lines" :gap="32" color="rgba(34, 197, 94, 0.12)" />
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
					<div class="flex h-[60vh] min-h-[32rem] items-center justify-center px-6 text-center text-sm text-green-900/80">
						Loading board canvas...
					</div>
				</template>
			</ClientOnly>

			<div
				v-if="!boardItems.length"
				class="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-green-900/80"
			>
				<div class="max-w-md rounded-3xl bg-white/90 px-8 py-10 shadow-lg">
					<h3 class="text-xl font-semibold text-green-900">
						Start by placing an idea on the board
					</h3>
					<p class="mt-2 text-sm text-gray-700">
						Use the library on the left to add reusable pieces, then drag from a card handle when you want to show how ideas connect.
					</p>
				</div>
			</div>
		</div>
	</section>
</template>
