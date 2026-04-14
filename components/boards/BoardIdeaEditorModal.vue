<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import BoardIdeaEditorForm from '~/components/boards/BoardIdeaEditorForm.vue';
import type { IdeaMediaSource, IdeaType } from '~/types/board';

const props = defineProps<{
	canRemoveImage: boolean;
	editingIdeaId: string | null;
	imageError: string;
	imageFileName: string;
	isOpen: boolean;
	isSavingIdea: boolean;
	mediaPreviewIdea: IdeaMediaSource | null;
	modalTitle: string;
}>();

const emit = defineEmits<{
	close: [];
	'remove-current-board-item': [];
	'remove-image': [];
	'save-idea': [];
	'select-image-file': [file: File | null];
}>();

const ideaTitle = defineModel<string>('ideaTitle', { required: true });
const ideaType = defineModel<IdeaType>('ideaType', { required: true });
const ideaDescription = defineModel<string>('ideaDescription', { required: true });
const ideaImageMode = defineModel<'url' | 'upload'>('ideaImageMode', { required: true });
const ideaImageUrl = defineModel<string>('ideaImageUrl', { required: true });
const ideaReferenceUrl = defineModel<string>('ideaReferenceUrl', { required: true });
const ideaNotes = defineModel<string>('ideaNotes', { required: true });
const ideaTagsInput = defineModel<string>('ideaTagsInput', { required: true });

const handleWindowKeyDown = (event: KeyboardEvent) => {
	if (props.isOpen && event.key === 'Escape') {
		emit('close');
	}
};

onMounted(() => {
	window.addEventListener('keydown', handleWindowKeyDown);
});

onBeforeUnmount(() => {
	window.removeEventListener('keydown', handleWindowKeyDown);
});
</script>

<template>
	<div
		v-if="isOpen"
		class="fixed inset-0 z-[200] flex items-center justify-center bg-green-950/35 px-4 py-8 backdrop-blur-sm"
		@click.self="emit('close')"
	>
		<div
			class="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
			role="dialog"
			aria-modal="true"
			:aria-label="modalTitle"
		>
			<div class="flex items-start justify-between gap-4 border-b border-green-900/10 px-6 py-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">
						Board Card
					</p>
					<h2 class="mt-2 text-2xl font-bold text-green-950">
						{{ modalTitle }}
					</h2>
					<p class="mt-2 text-sm text-gray-600">
						Changes here update the shared idea, while removing this card only clears this placement from the board.
					</p>
				</div>

				<button
					type="button"
					class="rounded-full border border-green-700/20 px-3 py-2 text-xs font-semibold text-green-900 transition hover:bg-green-50"
					@click="emit('close')"
				>
					Close
				</button>
			</div>

			<div class="max-h-[calc(100vh-8rem)] overflow-y-auto px-6 py-5">
				<BoardIdeaEditorForm
					v-model:idea-title="ideaTitle"
					v-model:idea-type="ideaType"
					v-model:idea-description="ideaDescription"
					v-model:idea-image-mode="ideaImageMode"
					v-model:idea-image-url="ideaImageUrl"
					v-model:idea-reference-url="ideaReferenceUrl"
					v-model:idea-notes="ideaNotes"
					v-model:idea-tags-input="ideaTagsInput"
					:editing-idea-id="editingIdeaId"
					:can-remove-image="canRemoveImage"
					id-prefix="idea-modal"
					:image-error="imageError"
					:image-file-name="imageFileName"
					:is-saving-idea="isSavingIdea"
					:media-preview-idea="mediaPreviewIdea"
					secondary-action-label="Remove from board"
					@remove-image="emit('remove-image')"
					@save-idea="emit('save-idea')"
					@select-image-file="emit('select-image-file', $event)"
					@secondary-action="emit('remove-current-board-item')"
				/>
			</div>
		</div>
	</div>
</template>
