<script setup lang="ts">
import type { BoardItemWithIdea } from '~/types/board';
import BoardCanvasCard from '~/components/boards/BoardCanvasCard.vue';

defineProps<{
	boardItems: BoardItemWithIdea[];
	selectedItemIds: string[];
}>();

const emit = defineEmits<{
	'card-pointerdown': [event: PointerEvent, item: BoardItemWithIdea];
}>();
</script>

<template>
	<section class="min-w-0 flex-1 rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-sm">
		<div class="flex items-center justify-between gap-3">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">
					Canvas
				</p>
				<h2 class="mt-2 text-2xl font-bold text-green-900">
					Freeform board
				</h2>
			</div>

			<div class="rounded-full bg-green-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-green-800">
				{{ boardItems.length }} cards
			</div>
		</div>

		<div class="mt-5 overflow-auto rounded-3xl border border-green-900/10 bg-[linear-gradient(to_right,rgba(34,197,94,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,197,94,0.08)_1px,transparent_1px)] bg-[size:32px_32px]">
			<div class="relative h-[2400px] w-[4000px]">
				<BoardCanvasCard
					v-for="item in boardItems"
					:key="item.id"
					:item="item"
					:selected="selectedItemIds.includes(item.id)"
					@pointerdown="emit('card-pointerdown', $event, item)"
				/>

				<div
					v-if="!boardItems.length"
					class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-green-900/80"
				>
					<div class="max-w-md rounded-3xl bg-white/90 px-8 py-10 shadow-lg">
						<h3 class="text-xl font-semibold text-green-900">
							Start by placing an idea on the board
						</h3>
						<p class="mt-2 text-sm text-gray-700">
							Use the library on the left to add reusable pieces, then drop them into this space and move them around until a concept starts to form.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
