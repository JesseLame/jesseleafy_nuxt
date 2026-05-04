<script setup lang="ts">
import type { Board } from '~/types/board';

const boardTitle = defineModel<string>('boardTitle', { required: true });
const boardDescription = defineModel<string>('boardDescription', { required: true });

defineProps<{
	board: Board | null;
	isEditingBoard: boolean;
	isDeletingBoard: boolean;
	isSavingBoard: boolean;
	loadingBoard: boolean;
}>();

const emit = defineEmits<{
	'cancel-editing': [];
	'delete-board': [];
	refresh: [];
	'save-board': [];
	'start-editing': [];
}>();
</script>

<template>
	<form class="board-studio-panel flex flex-wrap items-start justify-between gap-4 px-6 py-6" @submit.prevent="emit('save-board')">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-3">
				<NuxtLink to="/boards" class="board-studio-button board-studio-button-ghost">
					Back to boards
				</NuxtLink>
				<span class="board-studio-pill">
					Private board
				</span>
			</div>

			<div v-if="isEditingBoard" class="mt-4 max-w-3xl space-y-4">
				<div>
					<label for="board-title" class="board-studio-label">
						Board name
					</label>
					<input
						id="board-title"
						v-model="boardTitle"
						type="text"
						maxlength="120"
						class="board-studio-input mt-1 w-full"
						:disabled="loadingBoard || isSavingBoard || isDeletingBoard"
						placeholder="Board title"
					/>
				</div>

				<div>
					<label for="board-description" class="board-studio-label">
						Description
					</label>
					<textarea
						id="board-description"
						v-model="boardDescription"
						rows="4"
						class="board-studio-input mt-1 min-h-28 w-full"
						:disabled="loadingBoard || isSavingBoard || isDeletingBoard"
						placeholder="What are you using this board to explore?"
					/>
				</div>
			</div>

			<template v-else>
				<h1 class="board-studio-display mt-4 text-4xl leading-none text-[color:var(--board-ink)] sm:text-[3.25rem]">
					{{ board?.title || 'Board' }}
				</h1>
				<p class="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--board-muted)] sm:text-base">
					{{ board?.description || 'Place reusable ideas on the canvas, connect them into concepts, then duplicate concepts when you want to iterate.' }}
				</p>
			</template>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="board-studio-button board-studio-button-secondary"
				:disabled="loadingBoard || isDeletingBoard || isSavingBoard"
				@click="emit('refresh')"
			>
				Refresh board
			</button>

			<template v-if="board && isEditingBoard">
				<button
					type="button"
					class="board-studio-button board-studio-button-secondary"
					:disabled="isSavingBoard || isDeletingBoard"
					@click="emit('cancel-editing')"
				>
					Cancel
				</button>

				<button
					type="submit"
					class="board-studio-button board-studio-button-primary"
					:disabled="loadingBoard || isSavingBoard || isDeletingBoard"
				>
					{{ isSavingBoard ? 'Saving changes...' : 'Save changes' }}
				</button>
			</template>

			<button
				v-else-if="board"
				type="button"
				class="board-studio-button board-studio-button-secondary"
				:disabled="loadingBoard || isDeletingBoard || isSavingBoard"
				@click="emit('start-editing')"
			>
				Edit board
			</button>

			<button
				v-if="board"
				type="button"
				class="board-studio-button board-studio-button-danger"
				:disabled="loadingBoard || isDeletingBoard || isSavingBoard"
				@click="emit('delete-board')"
			>
				{{ isDeletingBoard ? 'Deleting board...' : 'Delete board' }}
			</button>
		</div>
	</form>
</template>
