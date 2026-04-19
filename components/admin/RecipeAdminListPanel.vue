<script setup lang="ts">
import type { AdminRecipeSummary, RecipeStatus } from '~/types/recipe';

const searchQuery = defineModel<string>('searchQuery', { required: true });
const statusFilter = defineModel<'all' | RecipeStatus>('statusFilter', { required: true });

const props = defineProps<{
	recipes: AdminRecipeSummary[];
	recipesCount: number;
	selectedRecipeId: string;
	loading: boolean;
	errorMessage: string;
}>();

const emit = defineEmits<{
	refresh: [];
	select: [recipeId: string];
}>();

const statusOptions: Array<{ value: 'all' | RecipeStatus; label: string }> = [
	{ value: 'all', label: 'All statuses' },
	{ value: 'draft', label: 'Drafts' },
	{ value: 'published', label: 'Published' },
	{ value: 'archived', label: 'Archived' },
];

const formatStatusLabel = (status: RecipeStatus) => {
	if (status === 'draft') {
		return 'Draft';
	}

	if (status === 'archived') {
		return 'Archived';
	}

	return 'Published';
};

const formatDate = (value: string) => {
	return new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(new Date(value));
};

const getRecipeTitle = (recipe: AdminRecipeSummary) => {
	return recipe.titles.en || recipe.titles.nl || 'Untitled recipe';
};
</script>

<template>
	<aside class="board-studio-panel flex min-h-[42rem] min-w-0 flex-col p-4 sm:p-5">
		<div class="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--board-outline)] pb-4 md:flex-col md:items-start md:gap-4 lg:flex-row lg:items-center">
			<div class="min-w-0">
				<p class="board-studio-kicker">
					Recipe Shelf
				</p>
				<h2 class="mt-2 text-lg font-semibold text-[var(--board-accent-strong)]">
					Catalog
				</h2>
				<p class="mt-1 max-w-sm text-xs leading-5 text-[var(--board-muted)] sm:text-sm">
					Search, filter, and jump straight into a recipe record.
				</p>
			</div>

			<button
				type="button"
				class="board-studio-button board-studio-button-secondary"
				:disabled="loading"
				@click="emit('refresh')"
			>
				Refresh
			</button>
		</div>

		<div class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr),10.5rem] md:grid-cols-1 lg:grid-cols-[minmax(0,1fr),10.5rem]">
			<label class="board-studio-label">
				Search
				<input
					v-model="searchQuery"
					type="search"
					class="board-studio-input"
					placeholder="banana, soup, vanilla_cake"
				/>
			</label>

			<label class="board-studio-label">
				Status
				<select v-model="statusFilter" class="board-studio-input">
					<option
						v-for="option in statusOptions"
						:key="option.value"
						:value="option.value"
					>
						{{ option.label }}
					</option>
				</select>
			</label>
		</div>

		<div class="mt-3 flex flex-wrap gap-2">
			<span class="board-studio-pill board-studio-pill-compact">
				{{ recipes.length }} shown
			</span>
			<span class="board-studio-pill board-studio-pill-compact">
				{{ props.recipesCount }} total
			</span>
		</div>

		<p
			v-if="props.errorMessage"
			class="mt-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{{ props.errorMessage }}
		</p>

		<div
			v-if="props.loading"
			class="board-studio-empty mt-4 flex-1 place-content-center"
		>
			Loading the recipe shelf...
		</div>

		<div
			v-else-if="!props.recipes.length"
			class="board-studio-empty mt-4 flex-1 place-content-center"
		>
			No recipes match the current filters.
		</div>

		<div v-else class="board-studio-timeline mt-4 flex-1 overflow-y-auto pr-1">
			<button
				v-for="recipe in props.recipes"
				:key="recipe.id"
				type="button"
				class="board-studio-card board-studio-timeline-card mb-3 w-full p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--board-shadow)]"
				:class="[
					recipe.id === props.selectedRecipeId
						? 'ring-2 ring-[color:var(--board-highlight)] ring-offset-2 ring-offset-transparent'
						: ''
				]"
				@click="emit('select', recipe.id)"
			>
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0 flex-1">
						<p class="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--board-muted)]">
							{{ recipe.slug }}
						</p>
						<h3 class="mt-1.5 text-base font-semibold leading-6 text-[var(--board-accent-strong)]">
							{{ getRecipeTitle(recipe) }}
						</h3>
					</div>

					<span class="board-studio-pill board-studio-pill-compact shrink-0">
						{{ formatStatusLabel(recipe.status) }}
					</span>
				</div>

				<div class="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--board-muted)]">
					<span>Updated {{ formatDate(recipe.updatedAt) }}</span>
					<span aria-hidden="true">•</span>
					<span>Created {{ formatDate(recipe.createdOn) }}</span>
				</div>

				<div class="mt-3 flex flex-wrap gap-2">
					<span
						v-for="locale in recipe.availableLanguages"
						:key="`${recipe.id}-${locale}`"
						class="board-studio-pill board-studio-pill-compact"
					>
						{{ locale.toUpperCase() }}
					</span>
				</div>
			</button>
		</div>
	</aside>
</template>
