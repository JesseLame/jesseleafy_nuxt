<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RECIPE_LANGUAGES, type AdminRecipeRecord, type RecipeLang, type RecipeStatus } from '~/types/recipe';
import { RECIPE_IMAGE_MAX_BYTES } from '~/utils/recipeImages';

const recipe = defineModel<AdminRecipeRecord | null>({ required: false });

const props = defineProps<{
	loading: boolean;
	isSaving: boolean;
	isDirty: boolean;
	errorMessage: string;
	saveMessage: string;
	imageError: string;
	imageFileName: string;
	imagePreviewUrl: string | null;
	imageReference: string | null;
	imageSourceLabel: string;
}>();

const emit = defineEmits<{
	'remove-image': [];
	save: [];
	'select-image-file': [file: File | null];
	reset: [];
}>();

const activeLocale = ref<RecipeLang>('en');
const maxUploadSizeMb = RECIPE_IMAGE_MAX_BYTES / (1024 * 1024);

const statusOptions: Array<{ value: RecipeStatus; label: string }> = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'published', label: 'Published' },
	{ value: 'archived', label: 'Archived' },
];

const activeTranslation = computed(() => {
	if (!recipe.value) {
		return null;
	}

	return recipe.value.translations[activeLocale.value];
});

const localeTabs = computed(() => {
	if (!recipe.value) {
		return [];
	}

	return RECIPE_LANGUAGES.map((locale) => ({
		locale,
		label: locale === 'en' ? 'English' : 'Dutch',
		title: recipe.value?.translations[locale].title || 'Untitled locale',
		exists: recipe.value?.translations[locale].exists ?? false,
	}));
});

const formatDateTime = (value: string) => {
	return new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
};

const updateSectionTitle = (index: number, value: string) => {
	if (!activeTranslation.value) {
		return;
	}

	activeTranslation.value.ingredientSections[index].title = value || null;
};

const updateSectionItems = (index: number, value: string) => {
	if (!activeTranslation.value) {
		return;
	}

	activeTranslation.value.ingredientSections[index].items = value
		.split('\n')
		.map((item) => item.trim())
		.filter(Boolean);
};

const updateInstructionSteps = (value: string) => {
	if (!activeTranslation.value) {
		return;
	}

	activeTranslation.value.instructionSteps = value
		.split('\n')
		.map((step) => step.trim())
		.filter(Boolean);
};

const handleTagsInput = (event: Event) => {
	if (!recipe.value || !(event.target instanceof HTMLInputElement)) {
		return;
	}

	recipe.value.tags = event.target.value
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
};

const handleSectionTitleInput = (index: number, event: Event) => {
	if (!(event.target instanceof HTMLInputElement)) {
		return;
	}

	updateSectionTitle(index, event.target.value);
};

const handleSectionItemsInput = (index: number, event: Event) => {
	if (!(event.target instanceof HTMLTextAreaElement)) {
		return;
	}

	updateSectionItems(index, event.target.value);
};

const handleInstructionStepsInput = (event: Event) => {
	if (!(event.target instanceof HTMLTextAreaElement)) {
		return;
	}

	updateInstructionSteps(event.target.value);
};

const addIngredientSection = () => {
	if (!activeTranslation.value) {
		return;
	}

	activeTranslation.value.ingredientSections.push({
		title: null,
		items: [],
	});
};

const removeIngredientSection = (index: number) => {
	if (!activeTranslation.value) {
		return;
	}

	activeTranslation.value.ingredientSections.splice(index, 1);
};

const handleImageFileChange = (event: Event) => {
	const input = event.target as HTMLInputElement | null;
	emit('select-image-file', input?.files?.[0] ?? null);

	if (input) {
		input.value = '';
	}
};

watch(
	recipe,
	(nextRecipe) => {
		if (!nextRecipe) {
			activeLocale.value = 'en';
		}
	},
	{ immediate: true }
);
</script>

<template>
	<section class="board-studio-panel min-h-[42rem] min-w-0 p-5 sm:p-6">
		<div
			v-if="props.loading"
			class="board-studio-empty flex min-h-[36rem] place-content-center"
		>
			Loading recipe details...
		</div>

		<div
			v-else-if="!recipe"
			class="board-studio-empty flex min-h-[36rem] place-content-center"
		>
			Select a recipe from the shelf to start editing.
		</div>

		<div v-else class="flex min-w-0 flex-col gap-5">
			<div class="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--board-outline)] pb-5">
				<div class="min-w-0">
					<p class="board-studio-kicker">
						Editing
					</p>
					<h2 class="board-studio-display mt-2 text-2xl text-[var(--board-accent-strong)] sm:text-[2rem]">
						{{ recipe.slug }}
					</h2>
					<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--board-muted)] sm:text-sm">
						<span class="board-studio-pill board-studio-pill-compact">
							{{ recipe.status }}
						</span>
						<span>Last synced {{ formatDateTime(recipe.updatedAt) }}</span>
					</div>
				</div>

				<div class="flex max-w-full flex-wrap items-center gap-3">
					<button
						type="button"
						class="board-studio-button board-studio-button-secondary"
						:disabled="props.isSaving || !props.isDirty"
						@click="emit('reset')"
					>
						Reset
					</button>
					<button
						type="button"
						class="board-studio-button board-studio-button-primary"
						:disabled="props.isSaving || !props.isDirty"
						@click="emit('save')"
					>
						{{ props.isSaving ? 'Saving...' : 'Save recipe' }}
					</button>
				</div>
			</div>

			<p
				v-if="props.errorMessage"
				class="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
			>
				{{ props.errorMessage }}
			</p>

			<p
				v-if="props.saveMessage"
				class="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
			>
				{{ props.saveMessage }}
			</p>

			<section class="board-studio-card board-studio-card-soft p-5">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h3 class="text-lg font-semibold text-[var(--board-accent-strong)]">
							Shared recipe fields
						</h3>
						<p class="mt-1 text-sm text-[var(--board-muted)]">
							These values apply to the recipe across every locale.
						</p>
					</div>

					<span v-if="props.isDirty" class="board-studio-pill">
						Unsaved changes
					</span>
				</div>

				<div class="mt-5 grid gap-4 xl:grid-cols-2">
					<label class="board-studio-label">
						Slug
						<input
							v-model="recipe.slug"
							type="text"
							class="board-studio-input"
							placeholder="banana_bread"
						/>
					</label>

					<label class="board-studio-label">
						Status
						<select v-model="recipe.status" class="board-studio-input">
							<option
								v-for="option in statusOptions"
								:key="option.value"
								:value="option.value"
							>
								{{ option.label }}
							</option>
						</select>
					</label>

					<div class="xl:col-span-2">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<label class="board-studio-label">
								Recipe image
							</label>
							<span class="board-studio-pill board-studio-pill-compact">
								{{ props.imageSourceLabel }}
							</span>
						</div>

						<div class="mt-3 space-y-3 rounded-[1.6rem] border border-[color:var(--board-outline)] bg-white/60 p-4">
							<input
								accept="image/*"
								type="file"
								class="board-studio-input file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--board-paper-soft)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--board-ink)] hover:file:bg-white"
								@change="handleImageFileChange"
							/>

							<p class="text-xs leading-5 text-[color:var(--board-muted)]">
								Upload JPG, PNG, WEBP, or another image format up to {{ maxUploadSizeMb }} MB.
								Existing `/images/...` and external image references keep working.
							</p>

							<p v-if="props.imageFileName" class="text-sm text-[color:var(--board-muted)]">
								Selected file: {{ props.imageFileName }}
							</p>

							<p v-if="props.imageReference" class="break-all text-sm text-[color:var(--board-muted)]">
								Current reference: {{ props.imageReference }}
							</p>

							<div
								v-if="props.imagePreviewUrl"
								class="overflow-hidden rounded-[1.4rem] border border-[color:var(--board-outline)] bg-white/70 p-3"
							>
								<img
									:src="props.imagePreviewUrl"
									:alt="recipe.translations.en.title || recipe.slug"
									class="h-[220px] w-full rounded-[1.15rem] object-cover"
								/>
							</div>

							<div v-if="props.imagePreviewUrl || props.imageFileName || recipe.imagePath" class="flex justify-end">
								<button
									type="button"
									class="board-studio-button board-studio-button-danger"
									@click="emit('remove-image')"
								>
									Remove image
								</button>
							</div>

							<p v-if="props.imageError" class="text-sm text-red-600">
								{{ props.imageError }}
							</p>
						</div>
					</div>

					<label class="board-studio-label">
						Category
						<input
							v-model="recipe.category"
							type="text"
							class="board-studio-input"
							placeholder="Bread"
						/>
					</label>

					<label class="board-studio-label">
						Tags
						<input
							:model-value="recipe.tags.join(', ')"
							type="text"
							class="board-studio-input"
							placeholder="breakfast, banana, sweet"
							@input="handleTagsInput"
						/>
					</label>

					<label class="board-studio-label">
						Created on
						<input
							v-model="recipe.createdOn"
							type="date"
							class="board-studio-input"
						/>
					</label>
				</div>
			</section>

			<section class="board-studio-card board-studio-card-soft p-5">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div>
						<h3 class="text-lg font-semibold text-[var(--board-accent-strong)]">
							Localized content
						</h3>
						<p class="mt-1 text-sm text-[var(--board-muted)]">
							Each locale can have its own body copy, ingredient sections, and instructions.
						</p>
					</div>

					<p class="text-xs uppercase tracking-[0.16em] text-[var(--board-muted)]">
						Deleting a locale is not supported in v1.
					</p>
				</div>

				<div class="mt-5 grid gap-3 md:grid-cols-2">
					<button
						v-for="tab in localeTabs"
						:key="tab.locale"
						type="button"
						class="board-studio-tab text-left"
						:class="tab.locale === activeLocale ? 'board-studio-tab-active' : ''"
						@click="activeLocale = tab.locale"
					>
						<span>
							<span class="block text-sm font-semibold text-[var(--board-accent-strong)]">
								{{ tab.label }}
							</span>
							<span class="mt-1 block text-xs text-[var(--board-muted)]">
								{{ tab.title }}
							</span>
						</span>
						<span class="board-studio-pill">
							{{ tab.exists ? 'Existing' : 'New' }}
						</span>
					</button>
				</div>

				<div v-if="activeTranslation" class="mt-6 flex flex-col gap-5">
					<div class="grid gap-4">
						<label class="board-studio-label">
							{{ activeLocale === 'en' ? 'English title' : 'Dutch title' }}
							<input
								v-model="activeTranslation.title"
								type="text"
								class="board-studio-input"
								placeholder="Recipe title"
							/>
						</label>

						<label class="board-studio-label">
							{{ activeLocale === 'en' ? 'English description' : 'Dutch description' }}
							<textarea
								v-model="activeTranslation.description"
								rows="3"
								class="board-studio-input min-h-[7rem]"
								placeholder="A concise description for cards and SEO."
							/>
						</label>

						<label class="board-studio-label">
							Body markdown
							<textarea
								v-model="activeTranslation.bodyMarkdown"
								rows="8"
								class="board-studio-input min-h-[14rem] font-mono text-sm"
								placeholder="Optional long-form recipe story in markdown."
							/>
						</label>
					</div>

					<section class="grid gap-4">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h4 class="text-base font-semibold text-[var(--board-accent-strong)]">
									Ingredient sections
								</h4>
								<p class="mt-1 text-sm text-[var(--board-muted)]">
									Create optional section titles and enter one ingredient per line.
								</p>
							</div>

							<button
								type="button"
								class="board-studio-button board-studio-button-ghost"
								@click="addIngredientSection"
							>
								Add section
							</button>
						</div>

						<div
							v-if="!activeTranslation.ingredientSections.length"
							class="board-studio-empty"
						>
							No ingredient sections yet. Add one to start structuring the recipe.
						</div>

						<div v-else class="grid gap-4">
							<div
								v-for="(section, index) in activeTranslation.ingredientSections"
								:key="`${activeLocale}-section-${index}`"
								class="board-studio-card p-4"
							>
								<div class="flex flex-wrap items-center justify-between gap-3">
									<h5 class="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--board-muted)]">
										Section {{ index + 1 }}
									</h5>

									<button
										type="button"
										class="board-studio-button board-studio-button-danger"
										@click="removeIngredientSection(index)"
									>
										Remove
									</button>
								</div>

								<div class="mt-4 grid gap-4">
									<label class="board-studio-label">
										Section title
										<input
											:model-value="section.title || ''"
											type="text"
											class="board-studio-input"
											placeholder="Optional title"
											@input="handleSectionTitleInput(index, $event)"
										/>
									</label>

									<label class="board-studio-label">
										Items
										<textarea
											:value="section.items.join('\n')"
											rows="6"
											class="board-studio-input min-h-[10rem]"
											placeholder="1 cup flour&#10;2 ripe bananas"
											@input="handleSectionItemsInput(index, $event)"
										/>
									</label>
								</div>
							</div>
						</div>
					</section>

					<label class="board-studio-label">
						Instruction steps
						<textarea
							:value="activeTranslation.instructionSteps.join('\n')"
							rows="8"
							class="board-studio-input min-h-[14rem]"
							placeholder="Enter one instruction step per line."
							@input="handleInstructionStepsInput"
						/>
					</label>
				</div>
			</section>
		</div>
	</section>
</template>
