<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { BOARD_RELATION_KIND_OPTIONS } from '~/utils/board';

const props = defineProps<{
	anchorX: number;
	anchorY: number;
	isOpen: boolean;
	relationSummary: string;
	selectedRelationId: string | null;
}>();

const emit = defineEmits<{
	close: [];
	'delete-selected-relation': [];
	'save-selected-relation': [];
}>();

const relationLabel = defineModel<string>('relationLabel', { required: true });
const relationKind = defineModel<string>('relationKind', { required: true });

const panelRef = ref<HTMLElement | null>(null);
const labelInputRef = ref<HTMLInputElement | null>(null);
const panelPosition = ref({ left: 16, top: 16 });

const positionPopover = () => {
	if (!props.isOpen || !import.meta.client) {
		return;
	}

	const panelWidth = panelRef.value?.offsetWidth ?? 352;
	const panelHeight = panelRef.value?.offsetHeight ?? 320;
	const margin = 12;
	const maxLeft = Math.max(margin, window.innerWidth - panelWidth - margin);
	const maxTop = Math.max(margin, window.innerHeight - panelHeight - margin);

	panelPosition.value = {
		left: Math.min(Math.max(props.anchorX + 12, margin), maxLeft),
		top: Math.min(Math.max(props.anchorY + 12, margin), maxTop),
	};
};

const focusLabelInput = () => {
	void nextTick(() => {
		positionPopover();
		labelInputRef.value?.focus();
		labelInputRef.value?.select();
	});
};

const handlePointerDown = (event: PointerEvent) => {
	if (!props.isOpen) {
		return;
	}

	const target = event.target;

	if (!(target instanceof Node) || panelRef.value?.contains(target)) {
		return;
	}

	emit('close');
};

const handleKeydown = (event: KeyboardEvent) => {
	if (!props.isOpen || event.key !== 'Escape') {
		return;
	}

	event.preventDefault();
	emit('close');
};

onMounted(() => {
	document.addEventListener('pointerdown', handlePointerDown, true);
	document.addEventListener('keydown', handleKeydown);
	window.addEventListener('resize', positionPopover);
});

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', handlePointerDown, true);
	document.removeEventListener('keydown', handleKeydown);
	window.removeEventListener('resize', positionPopover);
});

watch(
	() => props.isOpen,
	(isOpen) => {
		if (isOpen) {
			focusLabelInput();
		}
	}
);

watch(
	() => [props.anchorX, props.anchorY, props.selectedRelationId],
	() => {
		if (props.isOpen) {
			focusLabelInput();
		}
	}
);
</script>

<template>
	<Teleport to="body">
		<div v-if="isOpen && selectedRelationId" class="pointer-events-none fixed inset-0 z-[180]">
			<section
				ref="panelRef"
				class="pointer-events-auto fixed w-[min(22rem,calc(100vw-1.5rem))] rounded-[1.75rem] border border-green-900/10 bg-white/95 p-5 shadow-2xl backdrop-blur-sm"
				:style="{
					left: `${panelPosition.left}px`,
					top: `${panelPosition.top}px`,
				}"
				role="dialog"
				aria-modal="false"
				aria-label="Edit board link"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">
							Board link
						</p>
						<h2 class="mt-2 text-lg font-bold text-green-900">
							Edit relation
						</h2>
						<p class="mt-2 text-sm text-gray-600">
							{{ relationSummary }}
						</p>
					</div>

					<button
						type="button"
						class="rounded-full border border-green-700/20 px-3 py-1.5 text-xs font-semibold text-green-900 transition hover:bg-green-50"
						aria-label="Close link editor"
						@click="emit('close')"
					>
						Close
					</button>
				</div>

				<div class="mt-5 space-y-3">
					<div>
						<label for="board-link-kind" class="block text-sm font-medium text-gray-700">
							Relation kind
						</label>
						<select
							id="board-link-kind"
							v-model="relationKind"
							class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
						>
							<option v-for="option in BOARD_RELATION_KIND_OPTIONS" :key="option.value" :value="option.value">
								{{ option.label }}
							</option>
						</select>
					</div>

					<div>
						<label for="board-link-label" class="block text-sm font-medium text-gray-700">
							Label
						</label>
						<input
							id="board-link-label"
							ref="labelInputRef"
							v-model="relationLabel"
							type="text"
							maxlength="120"
							class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
							placeholder="Optional edge label"
						/>
					</div>
				</div>

				<div class="mt-5 flex items-center gap-3">
					<button
						type="button"
						class="flex-1 rounded-2xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
						@click="emit('save-selected-relation')"
					>
						Save link
					</button>

					<button
						type="button"
						class="rounded-2xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
						@click="emit('delete-selected-relation')"
					>
						Delete
					</button>
				</div>
			</section>
		</div>
	</Teleport>
</template>
