<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
	errorMessage: string;
	isOpen: boolean;
	isSubmitting: boolean;
}>();

const emit = defineEmits<{
	close: [];
	submit: [];
}>();

const boardTitle = defineModel<string>('boardTitle', { required: true });
const boardDescription = defineModel<string>('boardDescription', { required: true });

const titleInputRef = ref<HTMLInputElement | null>(null);

const focusTitleInput = () => {
	if (!props.isOpen) {
		return;
	}

	void nextTick(() => {
		titleInputRef.value?.focus();
		titleInputRef.value?.select();
	});
};

const requestClose = () => {
	if (props.isSubmitting) {
		return;
	}

	emit('close');
};

const handleWindowKeyDown = (event: KeyboardEvent) => {
	if (!props.isOpen || props.isSubmitting || event.key !== 'Escape') {
		return;
	}

	event.preventDefault();
	requestClose();
};

onMounted(() => {
	window.addEventListener('keydown', handleWindowKeyDown);
});

onBeforeUnmount(() => {
	window.removeEventListener('keydown', handleWindowKeyDown);
});

watch(
	() => props.isOpen,
	(isOpen) => {
		if (isOpen) {
			focusTitleInput();
		}
	}
);
</script>

<template>
	<Teleport to="body">
		<div
			v-if="isOpen"
			class="fixed inset-0 z-[200] flex items-center justify-center bg-green-950/35 px-4 py-8 backdrop-blur-sm"
			@click.self="requestClose"
		>
			<div
				class="board-studio board-studio-panel w-full max-w-xl overflow-hidden"
				role="dialog"
				aria-modal="true"
				aria-labelledby="create-board-title"
				aria-describedby="create-board-description"
			>
				<div class="flex items-start justify-between gap-4 border-b border-[color:var(--board-outline)] px-6 py-5">
					<div>
						<p class="board-studio-kicker">
							Board Studio
						</p>
						<h2 id="create-board-title" class="board-studio-display mt-2 text-[2rem] leading-none text-[color:var(--board-ink)]">
							Create a new board
						</h2>
						<p id="create-board-description" class="mt-3 max-w-lg text-sm leading-6 text-[color:var(--board-muted)]">
							Set up a space for a client brief, seasonal collection, recipe idea cluster, or any creative thread you want to shape into concepts.
						</p>
					</div>

					<button
						type="button"
						class="board-studio-button board-studio-button-secondary shrink-0"
						:disabled="isSubmitting"
						@click="requestClose"
					>
						Close
					</button>
				</div>

				<form class="space-y-4 px-6 py-5" @submit.prevent="emit('submit')">
					<p
						v-if="errorMessage"
						class="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					>
						{{ errorMessage }}
					</p>

					<div>
						<label for="create-board-title-input" class="board-studio-label">
							Title
						</label>
						<input
							id="create-board-title-input"
							ref="titleInputRef"
							v-model="boardTitle"
							type="text"
							maxlength="120"
							class="board-studio-input mt-1 w-full"
							:disabled="isSubmitting"
							placeholder="Spring wedding cake ideas"
						/>
					</div>

					<div>
						<label for="create-board-description-input" class="board-studio-label">
							Description
						</label>
						<textarea
							id="create-board-description-input"
							v-model="boardDescription"
							rows="5"
							class="board-studio-input mt-1 min-h-32 w-full"
							:disabled="isSubmitting"
							placeholder="Client brief, mood, product goals, or what you want to explore."
						/>
					</div>

					<div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
						<button
							type="button"
							class="board-studio-button board-studio-button-secondary justify-center"
							:disabled="isSubmitting"
							@click="requestClose"
						>
							Cancel
						</button>

						<button
							type="submit"
							class="board-studio-button board-studio-button-primary justify-center"
							:disabled="isSubmitting"
						>
							{{ isSubmitting ? 'Creating board...' : 'Create and open board' }}
						</button>
					</div>
				</form>
			</div>
		</div>
	</Teleport>
</template>
