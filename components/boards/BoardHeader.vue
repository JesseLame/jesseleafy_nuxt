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
	<div class="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/80 px-6 py-5 shadow-xl backdrop-blur-sm">
		<div>
			<div class="flex items-center gap-3">
				<NuxtLink to="/boards" class="text-sm font-semibold text-green-700 hover:underline">
					Back to boards
				</NuxtLink>
				<span class="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-800">
					Private board
				</span>
			</div>
			<h1 class="mt-3 text-3xl font-black text-green-900">
				{{ board?.title || 'Board' }}
			</h1>
			<p class="mt-2 max-w-3xl text-sm text-gray-700 sm:text-base">
				{{ board?.description || 'Place reusable ideas on the canvas, connect them into concepts, then duplicate concepts when you want to iterate.' }}
			</p>
		</div>

		<button
			type="button"
			class="rounded-full border border-green-700/20 px-4 py-2 text-sm font-semibold text-green-900 transition hover:bg-green-50"
			:disabled="loadingBoard"
			@click="emit('refresh')"
		>
			Refresh board
		</button>
	</div>
</template>
