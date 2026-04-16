<script setup lang="ts">
import BoardIdeaImage from '~/components/boards/BoardIdeaImage.vue';
import { BOARD_IDEA_IMAGE_MAX_BYTES } from '~/utils/boardIdeaImages';
import type { IdeaMediaSource, IdeaType } from '~/types/board';
import { MANUAL_IDEA_TYPE_OPTIONS } from '~/utils/board';

withDefaults(defineProps<{
	canRemoveImage: boolean;
	editingIdeaId: string | null;
	idPrefix?: string;
	imageError: string;
	imageFileName: string;
	isSavingIdea: boolean;
	mediaPreviewIdea: IdeaMediaSource | null;
	secondaryActionLabel?: string | null;
}>(), {
	idPrefix: 'idea',
	secondaryActionLabel: null,
});

const emit = defineEmits<{
	'remove-image': [];
	'save-idea': [];
	'select-image-file': [file: File | null];
	'secondary-action': [];
}>();

const ideaTitle = defineModel<string>('ideaTitle', { required: true });
const ideaType = defineModel<IdeaType>('ideaType', { required: true });
const ideaDescription = defineModel<string>('ideaDescription', { required: true });
const ideaImageMode = defineModel<'url' | 'upload'>('ideaImageMode', { required: true });
const ideaImageUrl = defineModel<string>('ideaImageUrl', { required: true });
const ideaReferenceUrl = defineModel<string>('ideaReferenceUrl', { required: true });
const ideaNotes = defineModel<string>('ideaNotes', { required: true });
const ideaTagsInput = defineModel<string>('ideaTagsInput', { required: true });

const maxUploadSizeMb = BOARD_IDEA_IMAGE_MAX_BYTES / (1024 * 1024);

const handleFileChange = (event: Event) => {
	const input = event.target as HTMLInputElement | null;
	emit('select-image-file', input?.files?.[0] ?? null);

	if (input) {
		input.value = '';
	}
};
</script>

<template>
	<form class="space-y-4" @submit.prevent="emit('save-idea')">
		<section class="board-studio-card board-studio-card-soft px-4 py-4">
			<p class="board-studio-kicker">
				Core
			</p>

			<div class="mt-4 space-y-4">
				<div>
					<label :for="`${idPrefix}-title`" class="board-studio-label">
						Title
					</label>
					<input
						:id="`${idPrefix}-title`"
						v-model="ideaTitle"
						type="text"
						maxlength="120"
						class="board-studio-input"
						placeholder="Swiss buttercream"
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label :for="`${idPrefix}-type`" class="board-studio-label">
							Type
						</label>
						<select
							:id="`${idPrefix}-type`"
							v-model="ideaType"
							class="board-studio-input"
						>
							<option v-for="option in MANUAL_IDEA_TYPE_OPTIONS" :key="option.value" :value="option.value">
								{{ option.label }}
							</option>
						</select>
					</div>

					<div>
						<label :for="`${idPrefix}-tags`" class="board-studio-label">
							Tags
						</label>
						<input
							:id="`${idPrefix}-tags`"
							v-model="ideaTagsInput"
							type="text"
							class="board-studio-input"
							placeholder="wedding, pastel, elegant"
						/>
					</div>
				</div>

				<div>
					<label :for="`${idPrefix}-description`" class="board-studio-label">
						Description
					</label>
					<textarea
						:id="`${idPrefix}-description`"
						v-model="ideaDescription"
						rows="3"
						class="board-studio-input min-h-28"
						placeholder="Short explanation of what this idea adds."
					/>
				</div>
			</div>
		</section>

		<section class="board-studio-card px-4 py-4">
			<p class="board-studio-kicker">
				Reference & Media
			</p>

			<div class="mt-4 space-y-4">
				<div>
					<label :for="`${idPrefix}-reference-url`" class="board-studio-label">
						Reference URL
					</label>
					<input
						:id="`${idPrefix}-reference-url`"
						v-model="ideaReferenceUrl"
						type="url"
						class="board-studio-input"
						placeholder="https://example.com/recipe-or-blog"
					/>
				</div>

				<div>
					<label class="board-studio-label">
						Image source
					</label>

					<div class="mt-2 grid grid-cols-2 gap-2 rounded-[1.4rem] border border-[color:var(--board-outline)] bg-white/50 p-1.5">
						<button
							type="button"
							class="rounded-[1rem] px-3 py-2 text-sm font-semibold transition"
							:class="ideaImageMode === 'url' ? 'bg-[color:var(--board-accent)] text-white shadow-sm' : 'text-[color:var(--board-muted)] hover:bg-white/75'"
							@click="ideaImageMode = 'url'"
						>
							URL
						</button>
						<button
							type="button"
							class="rounded-[1rem] px-3 py-2 text-sm font-semibold transition"
							:class="ideaImageMode === 'upload' ? 'bg-[color:var(--board-accent)] text-white shadow-sm' : 'text-[color:var(--board-muted)] hover:bg-white/75'"
							@click="ideaImageMode = 'upload'"
						>
							Upload
						</button>
					</div>

					<div v-if="ideaImageMode === 'url'" class="mt-3">
						<input
							:id="`${idPrefix}-image-url`"
							v-model="ideaImageUrl"
							type="url"
							class="board-studio-input"
							placeholder="https://..."
						/>
					</div>

					<div v-else class="mt-3 space-y-3">
						<input
							:id="`${idPrefix}-image-upload`"
							accept="image/*"
							type="file"
							class="board-studio-input file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--board-paper-soft)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--board-ink)] hover:file:bg-white"
							@change="handleFileChange"
						/>

						<p class="text-xs leading-5 text-[color:var(--board-muted)]">
							Upload JPG, PNG, WEBP, or another image format up to {{ maxUploadSizeMb }} MB.
						</p>

						<p v-if="imageFileName" class="text-sm text-[color:var(--board-muted)]">
							{{ imageFileName }}
						</p>
					</div>

					<div v-if="mediaPreviewIdea" class="mt-4">
						<BoardIdeaImage
							:idea="mediaPreviewIdea"
							:alt="mediaPreviewIdea.title"
							mode="editor"
							:allow-live-preview="false"
							wrapper-class="overflow-hidden rounded-[1.4rem] border border-[color:var(--board-outline)] bg-white/70 p-3"
							image-class="h-[220px] w-full rounded-[1.15rem] object-cover"
						/>

						<div v-if="canRemoveImage" class="mt-3 flex justify-end">
							<button
								type="button"
								class="board-studio-button board-studio-button-danger"
								@click="emit('remove-image')"
							>
								Remove image
							</button>
						</div>
					</div>

					<p v-if="imageError" class="mt-3 text-sm text-red-600">
						{{ imageError }}
					</p>
				</div>
			</div>
		</section>

		<section class="board-studio-card board-studio-card-soft px-4 py-4">
			<p class="board-studio-kicker">
				Notes
			</p>

			<div class="mt-4">
				<label :for="`${idPrefix}-notes`" class="board-studio-label">
					Context
				</label>
				<textarea
					:id="`${idPrefix}-notes`"
					v-model="ideaNotes"
					rows="3"
					class="board-studio-input min-h-28"
					placeholder="Extra context, pairings, or reminders."
				/>
			</div>
		</section>

		<div class="flex flex-col gap-2 sm:flex-row">
			<button
				type="submit"
				:disabled="isSavingIdea"
				class="board-studio-button board-studio-button-primary flex-1 justify-center"
			>
				{{ isSavingIdea ? 'Saving...' : editingIdeaId ? 'Update idea' : 'Add idea' }}
			</button>

			<button
				v-if="secondaryActionLabel && editingIdeaId"
				type="button"
				class="board-studio-button board-studio-button-danger justify-center"
				@click="emit('secondary-action')"
			>
				{{ secondaryActionLabel }}
			</button>
		</div>
	</form>
</template>
