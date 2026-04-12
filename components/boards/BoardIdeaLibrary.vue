<script setup lang="ts">
import BoardIdeaImage from '~/components/boards/BoardIdeaImage.vue';
import { BOARD_IDEA_IMAGE_MAX_BYTES } from '~/composables/useBoardIdeaImages';
import type { Idea, IdeaType } from '~/types/board';
import { IDEA_TYPE_OPTIONS, formatIdeaTypeLabel } from '~/utils/board';

defineProps<{
	allTags: string[];
	editingIdeaId: string | null;
	filteredIdeas: Idea[];
	imageError: string;
	imageFileName: string;
	imagePreviewUrl: string;
	isOpen: boolean;
	isSavingIdea: boolean;
}>();

const emit = defineEmits<{
	'delete-idea': [idea: Idea];
	'edit-idea': [idea: Idea];
	'place-idea': [idea: Idea];
	'remove-image': [];
	'reset-idea-form': [];
	'save-idea': [];
	'select-image-file': [file: File | null];
	'toggle-open': [];
}>();

const ideaTitle = defineModel<string>('ideaTitle', { required: true });
const ideaType = defineModel<IdeaType>('ideaType', { required: true });
const ideaDescription = defineModel<string>('ideaDescription', { required: true });
const ideaImageMode = defineModel<'url' | 'upload'>('ideaImageMode', { required: true });
const ideaImageUrl = defineModel<string>('ideaImageUrl', { required: true });
const ideaNotes = defineModel<string>('ideaNotes', { required: true });
const ideaTagsInput = defineModel<string>('ideaTagsInput', { required: true });
const libraryTypeFilter = defineModel<'all' | IdeaType>('libraryTypeFilter', { required: true });
const libraryTagFilter = defineModel<string>('libraryTagFilter', { required: true });

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
	<aside
		v-if="isOpen"
		class="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-sm transition-all duration-300"
	>
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">
					Idea Library
				</p>
				<h2 class="mt-2 text-2xl font-bold text-green-900">
					Reusable pieces
				</h2>
			</div>

			<div class="flex items-center gap-2">
				<button
					v-if="editingIdeaId"
					type="button"
					class="rounded-full border border-green-700/20 px-3 py-1.5 text-xs font-semibold text-green-900 transition hover:bg-green-50"
					@click="emit('reset-idea-form')"
				>
					New idea
				</button>

				<button
					type="button"
					class="rounded-full border border-green-700/20 px-3 py-2 text-xs font-semibold text-green-900 transition hover:bg-green-50"
					aria-expanded="true"
					aria-label="Collapse idea library"
					@click="emit('toggle-open')"
				>
					Hide
				</button>
			</div>
		</div>

		<div class="mt-5">
			<form class="space-y-3" @submit.prevent="emit('save-idea')">
				<div>
					<label for="idea-title" class="block text-sm font-medium text-gray-700">
						Title
					</label>
					<input
						id="idea-title"
						v-model="ideaTitle"
						type="text"
						maxlength="120"
						class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
						placeholder="Swiss buttercream"
					/>
				</div>

				<div>
					<label for="idea-type" class="block text-sm font-medium text-gray-700">
						Type
					</label>
					<select
						id="idea-type"
						v-model="ideaType"
						class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
					>
						<option v-for="option in IDEA_TYPE_OPTIONS" :key="option.value" :value="option.value">
							{{ option.label }}
						</option>
					</select>
				</div>

				<div>
					<label for="idea-tags" class="block text-sm font-medium text-gray-700">
						Tags
					</label>
					<input
						id="idea-tags"
						v-model="ideaTagsInput"
						type="text"
						class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
						placeholder="wedding, pastel, elegant"
					/>
				</div>

				<div>
					<label for="idea-description" class="block text-sm font-medium text-gray-700">
						Description
					</label>
					<textarea
						id="idea-description"
						v-model="ideaDescription"
						rows="3"
						class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
						placeholder="Short explanation of what this idea adds."
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
							id="idea-image-url"
							v-model="ideaImageUrl"
							type="url"
							class="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
							placeholder="https://..."
						/>
					</div>

					<div v-else class="mt-3 space-y-3">
						<input
							id="idea-image-upload"
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

					<div v-if="imagePreviewUrl" class="mt-3 overflow-hidden rounded-2xl border border-green-900/10 bg-green-50/40 p-3">
						<img
							:src="imagePreviewUrl"
							alt="Idea image preview"
							class="h-40 w-full rounded-2xl object-cover"
						>

						<div class="mt-3 flex justify-end">
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
					<label for="idea-notes" class="block text-sm font-medium text-gray-700">
						Notes
					</label>
					<textarea
						id="idea-notes"
						v-model="ideaNotes"
						rows="3"
						class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
						placeholder="Extra context, pairings, or reminders."
					/>
				</div>

				<button
					type="submit"
					:disabled="isSavingIdea"
					class="w-full rounded-2xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{{ isSavingIdea ? 'Saving...' : editingIdeaId ? 'Update idea' : 'Add idea' }}
				</button>
			</form>

			<div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
				<div>
					<label for="library-type-filter" class="block text-xs font-semibold uppercase tracking-wide text-gray-600">
						Filter by type
					</label>
					<select
						id="library-type-filter"
						v-model="libraryTypeFilter"
						class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
					>
						<option value="all">
							All types
						</option>
						<option v-for="option in IDEA_TYPE_OPTIONS" :key="option.value" :value="option.value">
							{{ option.label }}
						</option>
					</select>
				</div>

				<div>
					<label for="library-tag-filter" class="block text-xs font-semibold uppercase tracking-wide text-gray-600">
						Filter by tag
					</label>
					<select
						id="library-tag-filter"
						v-model="libraryTagFilter"
						class="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
					>
						<option value="">
							All tags
						</option>
						<option v-for="tag in allTags" :key="tag" :value="tag">
							{{ tag }}
						</option>
					</select>
				</div>
			</div>

			<div class="mt-6 space-y-3">
				<div
					v-for="idea in filteredIdeas"
					:key="idea.id"
					class="rounded-3xl border border-green-900/10 bg-white p-4 shadow-sm"
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-wide text-green-700/70">
								{{ formatIdeaTypeLabel(idea.type) }}
							</p>
							<h3 class="mt-1 text-lg font-semibold text-green-900">
								{{ idea.title }}
							</h3>
						</div>

						<button
							type="button"
							class="rounded-full border border-green-700/20 px-3 py-1.5 text-xs font-semibold text-green-900 transition hover:bg-green-50"
							@click="emit('place-idea', idea)"
						>
							Place
						</button>
					</div>

					<BoardIdeaImage
						:idea="idea"
						:alt="idea.title"
						image-class="mt-3 h-40 w-full rounded-2xl object-cover"
					/>

					<p v-if="idea.description" class="mt-2 text-sm text-gray-600">
						{{ idea.description }}
					</p>

					<div v-if="idea.tags.length" class="mt-3 flex flex-wrap gap-2">
						<span
							v-for="tag in idea.tags"
							:key="tag"
							class="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800"
						>
							{{ tag }}
						</span>
					</div>

					<div class="mt-4 flex gap-2">
						<button
							type="button"
							class="rounded-full border border-green-700/20 px-3 py-1.5 text-xs font-semibold text-green-900 transition hover:bg-green-50"
							@click="emit('edit-idea', idea)"
						>
							Edit
						</button>
						<button
							type="button"
							class="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
							@click="emit('delete-idea', idea)"
						>
							Delete
						</button>
					</div>
				</div>

				<div v-if="!filteredIdeas.length" class="rounded-3xl border border-dashed border-green-200 bg-green-50/70 px-4 py-8 text-center text-sm text-green-900/80">
					No ideas match the current filters yet.
				</div>
			</div>
		</div>
	</aside>

	<button
		v-else
		type="button"
		class="rounded-3xl border border-dashed border-green-300 bg-white/80 px-4 py-6 text-left shadow-sm transition hover:border-green-500 hover:bg-white"
		aria-label="Expand idea library"
		@click="emit('toggle-open')"
	>
		<span class="block text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">
			Idea Library
		</span>
		<span class="mt-2 block text-lg font-semibold text-green-900">
			Show reusable pieces
		</span>
	</button>
</template>
