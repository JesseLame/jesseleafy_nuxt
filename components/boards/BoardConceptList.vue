<script setup lang="ts">
import type { Concept } from '~/types/board';

defineProps<{
	conceptBusyId: string | null;
	conceptItemCounts: Record<string, number>;
	visibleConcepts: Concept[];
}>();

const emit = defineEmits<{
	'duplicate-concept': [concept: Concept];
	'select-concept': [conceptId: string];
}>();
</script>

<template>
	<section class="rounded-3xl bg-white p-5 shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">
			Concepts
		</p>
		<h2 class="mt-2 text-2xl font-bold text-green-900">
			Saved versions
		</h2>

		<div class="mt-5 space-y-3">
			<div
				v-for="concept in visibleConcepts"
				:key="concept.id"
				class="rounded-3xl border border-green-900/10 bg-white p-4 shadow-sm"
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<h3 class="text-lg font-semibold text-green-900">
							{{ concept.title }}
						</h3>
						<p class="mt-1 text-xs font-semibold uppercase tracking-wide text-green-700/70">
							Version {{ concept.version }} · {{ conceptItemCounts[concept.id] || 0 }} cards
						</p>
					</div>

					<button
						type="button"
						class="rounded-full border border-green-700/20 px-3 py-1.5 text-xs font-semibold text-green-900 transition hover:bg-green-50"
						@click="emit('select-concept', concept.id)"
					>
						Select
					</button>
				</div>

				<p v-if="concept.notes" class="mt-3 text-sm text-gray-600">
					{{ concept.notes }}
				</p>

				<button
					type="button"
					class="mt-4 w-full rounded-2xl border border-green-700/20 px-4 py-2.5 text-sm font-semibold text-green-900 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
					:disabled="conceptBusyId === concept.id"
					@click="emit('duplicate-concept', concept)"
				>
					{{ conceptBusyId === concept.id ? 'Duplicating...' : 'Duplicate as next version' }}
				</button>
			</div>

			<div v-if="!visibleConcepts.length" class="rounded-3xl border border-dashed border-green-200 bg-green-50/70 px-4 py-8 text-center text-sm text-green-900/80">
				No concepts yet. Select cards and create one from the panel above.
			</div>
		</div>
	</section>
</template>
