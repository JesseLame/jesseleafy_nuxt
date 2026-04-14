<script setup lang="ts">
import BoardIdeaImage from '~/components/boards/BoardIdeaImage.vue';
import { BOARD_IDEA_IMAGE_MAX_BYTES } from '~/utils/boardIdeaImages';
import type { IdeaMediaSource, IdeaType } from '~/types/board';
import { IDEA_TYPE_OPTIONS } from '~/utils/board';

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
	<form class="space-y-3" @submit.prevent="emit('save-idea')">
		<div>
			<label :for="`${idPrefix}-title`" class="block text-sm font-medium text-gray-700">
				Title
			</label>
			<input
				:id="`${idPrefix}-title`"
				v-model="ideaTitle"
				type="text"
				maxlength="120"
				class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
				placeholder="Swiss buttercream"
			/>
		</div>

		<div>
			<label :for="`${idPrefix}-type`" class="block text-sm font-medium text-gray-700">
				Type
			</label>
			<select
				:id="`${idPrefix}-type`"
				v-model="ideaType"
				class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
			>
				<option v-for="option in IDEA_TYPE_OPTIONS" :key="option.value" :value="option.value">
					{{ option.label }}
				</option>
			</select>
		</div>

		<div>
			<label :for="`${idPrefix}-tags`" class="block text-sm font-medium text-gray-700">
				Tags
			</label>
			<input
				:id="`${idPrefix}-tags`"
				v-model="ideaTagsInput"
				type="text"
				class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
				placeholder="wedding, pastel, elegant"
			/>
		</div>

		<div>
			<label :for="`${idPrefix}-description`" class="block text-sm font-medium text-gray-700">
				Description
			</label>
			<textarea
				:id="`${idPrefix}-description`"
				v-model="ideaDescription"
				rows="3"
				class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
				placeholder="Short explanation of what this idea adds."
			/>
		</div>

		<div>
			<label :for="`${idPrefix}-reference-url`" class="block text-sm font-medium text-gray-700">
				Reference URL
			</label>
			<input
				:id="`${idPrefix}-reference-url`"
				v-model="ideaReferenceUrl"
				type="url"
				class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
				placeholder="https://example.com/recipe-or-blog"
			/>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700">
				Image
			</label>

			<div class="mt-1 grid grid-cols-2 gap-2 rounded-2xl bg-green-50 p-1">
				<button
					type="button"
					class="rounded-xl px-3 py-2 text-sm font-semibold transition"
					:class="ideaImageMode === 'url' ? 'bg-white text-green-900 shadow-sm' : 'text-green-800/80 hover:bg-white/70'"
					@click="ideaImageMode = 'url'"
				>
					URL
				</button>
				<button
					type="button"
					class="rounded-xl px-3 py-2 text-sm font-semibold transition"
					:class="ideaImageMode === 'upload' ? 'bg-white text-green-900 shadow-sm' : 'text-green-800/80 hover:bg-white/70'"
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
					class="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
					placeholder="https://..."
				/>
			</div>

			<div v-else class="mt-3 space-y-3">
				<input
					:id="`${idPrefix}-image-upload`"
					accept="image/*"
					type="file"
					class="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 file:mr-3 file:rounded-full file:border-0 file:bg-green-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-green-900 hover:file:bg-green-200"
					@change="handleFileChange"
				/>

				<p class="text-xs text-gray-500">
					Upload JPG, PNG, WEBP, or another image format up to {{ maxUploadSizeMb }} MB.
				</p>

				<p v-if="imageFileName" class="text-sm text-gray-600">
					{{ imageFileName }}
				</p>
			</div>

			<div v-if="mediaPreviewIdea" class="mt-3">
				<BoardIdeaImage
					:idea="mediaPreviewIdea"
					:alt="mediaPreviewIdea.title"
					mode="editor"
					:allow-live-preview="false"
					wrapper-class="overflow-hidden rounded-2xl border border-green-900/10 bg-green-50/40 p-3"
					image-class="h-[220px] w-full rounded-[1.2rem] object-cover"
				/>

				<div v-if="canRemoveImage" class="mt-3 flex justify-end">
					<button
						type="button"
						class="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
						@click="emit('remove-image')"
					>
						Remove image
					</button>
				</div>
			</div>

			<p v-if="imageError" class="mt-2 text-sm text-red-600">
				{{ imageError }}
			</p>
		</div>

		<div>
			<label :for="`${idPrefix}-notes`" class="block text-sm font-medium text-gray-700">
				Notes
			</label>
			<textarea
				:id="`${idPrefix}-notes`"
				v-model="ideaNotes"
				rows="3"
				class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
				placeholder="Extra context, pairings, or reminders."
			/>
		</div>

		<div class="flex flex-col gap-2 sm:flex-row">
			<button
				type="submit"
				:disabled="isSavingIdea"
				class="flex-1 rounded-2xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{{ isSavingIdea ? 'Saving...' : editingIdeaId ? 'Update idea' : 'Add idea' }}
			</button>

			<button
				v-if="secondaryActionLabel && editingIdeaId"
				type="button"
				class="rounded-2xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
				@click="emit('secondary-action')"
			>
				{{ secondaryActionLabel }}
			</button>
		</div>
	</form>
</template>
