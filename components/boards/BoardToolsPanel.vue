<script setup lang="ts">
import type { Concept } from '~/types/board';
import BoardConceptList from '~/components/boards/BoardConceptList.vue';
import { CARD_BACKGROUND_OPTIONS, type BoardCardBackground } from '~/utils/board';

defineProps<{
	conceptBusyId: string | null;
	conceptItemCounts: Record<string, number>;
	isOpen: boolean;
	selectedCardTone: BoardCardBackground;
	selectedItemCount: number;
	selectionConceptId: string | null;
	visibleConcepts: Concept[];
}>();

const emit = defineEmits<{
	'create-concept': [];
	'delete-selection': [];
	'duplicate-concept': [concept: Concept];
	'select-concept': [conceptId: string];
	'toggle-open': [];
	'ungroup-selection': [];
}>();

const conceptTitle = defineModel<string>('conceptTitle', { required: true });
const conceptNotes = defineModel<string>('conceptNotes', { required: true });
</script>

<template>
	<aside
		v-if="isOpen"
		class="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-sm transition-all duration-300"
	>
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">
					Board Tools
				</p>
				<h2 class="mt-2 text-2xl font-bold text-green-900">
					Selection & Concepts
				</h2>
			</div>

			<button
				type="button"
				class="rounded-full border border-green-700/20 px-3 py-2 text-xs font-semibold text-green-900 transition hover:bg-green-50"
				aria-expanded="true"
				aria-label="Collapse board tools"
				@click="emit('toggle-open')"
			>
				Hide
			</button>
		</div>

		<div class="mt-5 space-y-6">
			<section class="rounded-3xl bg-white p-5 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">
					Selection
				</p>
				<h2 class="mt-2 text-2xl font-bold text-green-900">
					Selected cards
				</h2>
				<p class="mt-2 text-sm text-gray-600">
					{{ selectedItemCount ? `${selectedItemCount} card(s) selected` : 'Click a card to select it. Shift-click to build a multi-selection.' }}
				</p>

				<div class="mt-5 space-y-3">
					<div>
						<label for="concept-title" class="block text-sm font-medium text-gray-700">
							Concept title
						</label>
						<input
							id="concept-title"
							v-model="conceptTitle"
							type="text"
							maxlength="120"
							class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
							placeholder="Wedding cake v1"
						/>
					</div>

					<div>
						<label for="concept-notes" class="block text-sm font-medium text-gray-700">
							Concept notes
						</label>
						<textarea
							id="concept-notes"
							v-model="conceptNotes"
							rows="3"
							class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
							placeholder="What ties these cards together?"
						/>
					</div>

					<div>
						<label for="selection-tone" class="block text-sm font-medium text-gray-700">
							Card tone
						</label>
						<select
							id="selection-tone"
							:model-value="selectedCardTone"
							disabled
							class="mt-1 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500"
						>
							<option v-for="option in CARD_BACKGROUND_OPTIONS" :key="option.value" :value="option.value">
								{{ option.label }}
							</option>
						</select>
						<p class="mt-1 text-xs text-gray-500">
							V1 stores card styling and uses the default tone today. Color editing can layer on later without changing the data model.
						</p>
					</div>

					<button
						type="button"
						class="w-full rounded-2xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
						:disabled="!selectedItemCount"
						@click="emit('create-concept')"
					>
						Create concept from selection
					</button>

					<button
						type="button"
						class="w-full rounded-2xl border border-green-700/20 px-4 py-3 text-sm font-semibold text-green-900 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
						:disabled="!selectionConceptId"
						@click="emit('ungroup-selection')"
					>
						Ungroup selected cards
					</button>

					<button
						type="button"
						class="w-full rounded-2xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
						:disabled="!selectedItemCount"
						@click="emit('delete-selection')"
					>
						Delete selected cards
					</button>
				</div>
			</section>

			<BoardConceptList
				:concept-busy-id="conceptBusyId"
				:concept-item-counts="conceptItemCounts"
				:visible-concepts="visibleConcepts"
				@duplicate-concept="emit('duplicate-concept', $event)"
				@select-concept="emit('select-concept', $event)"
			/>
		</div>
	</aside>

	<button
		v-else
		type="button"
		class="flex min-h-32 w-full justify-center rounded-3xl bg-white/85 p-3 shadow-xl backdrop-blur-sm transition-all duration-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/40 lg:pt-5"
		aria-expanded="false"
		aria-label="Expand board tools"
		@click="emit('toggle-open')"
	>
		<span class="text-[11px] font-semibold uppercase tracking-[0.3em] text-green-700/70 lg:[writing-mode:vertical-rl]">
			Tools
		</span>
	</button>
</template>
