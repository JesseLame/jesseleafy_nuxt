<script setup lang="ts">
import type { Board } from '~/types/board';

defineProps<{
	board: Board | null;
	loadingBoard: boolean;
}>();

const emit = defineEmits<{
	refresh: [];
}>();
</script>

<template>
	<div class="board-studio-panel flex flex-wrap items-center justify-between gap-4 px-6 py-6">
		<div>
			<div class="flex items-center gap-3">
				<NuxtLink to="/boards" class="board-studio-button board-studio-button-ghost">
					Back to boards
				</NuxtLink>
				<span class="board-studio-pill">
					Private board
				</span>
			</div>
			<h1 class="board-studio-display mt-4 text-4xl leading-none text-[color:var(--board-ink)] sm:text-[3.25rem]">
				{{ board?.title || 'Board' }}
			</h1>
			<p class="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--board-muted)] sm:text-base">
				{{ board?.description || 'Place reusable ideas on the canvas, connect them into concepts, then duplicate concepts when you want to iterate.' }}
			</p>
		</div>

		<button
			type="button"
			class="board-studio-button board-studio-button-secondary"
			:disabled="loadingBoard"
			@click="emit('refresh')"
		>
			Refresh board
		</button>
	</div>
</template>
