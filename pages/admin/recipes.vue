<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import RecipeAdminEditorPanel from '~/components/admin/RecipeAdminEditorPanel.vue';
import RecipeAdminListPanel from '~/components/admin/RecipeAdminListPanel.vue';
import type {
	AdminRecipeRecord,
	AdminRecipeSummary,
	AdminRecipeUpdatePayload,
	RecipeStatus,
} from '~/types/recipe';
import {
	getRecipeImageSourceLabel,
	getRecipeImageValidationError,
	getRecipeStorageImage,
} from '~/utils/recipeImages';

useSeoMeta({
	title: "Recipe Admin - Jesse's Leafy Feasts",
	description: 'A private Supabase-backed workspace for managing recipe content.',
});

const route = useRoute();
const router = useRouter();
const { isAuthenticated, isAdmin, isLoading } = useAuth();
const { getRecipe, listRecipes, updateRecipe } = useRecipeAdmin();
const { deleteRecipeImage, resolveRecipeImagePreviewUrl, uploadRecipeImage } = useRecipeImages();

const recipes = ref<AdminRecipeSummary[]>([]);
const searchQuery = ref('');
const statusFilter = ref<'all' | RecipeStatus>('all');
const loadingRecipes = ref(false);
const loadingRecipe = ref(false);
const savingRecipe = ref(false);
const listError = ref('');
const editorError = ref('');
const saveMessage = ref('');
const draftRecipe = ref<AdminRecipeRecord | null>(null);
const savedRecipe = ref<AdminRecipeRecord | null>(null);
const activeRecipeId = ref('');
const hasLoadedAdminWorkspace = ref(false);
const selectedImageFile = ref<File | null>(null);
const selectedImagePreviewUrl = ref('');
const imageError = ref('');

let detailRequestId = 0;

const selectedRecipeId = computed(() => {
	const value = route.query.recipe;
	return Array.isArray(value) ? value[0] ?? '' : typeof value === 'string' ? value : '';
});

const publishedCount = computed(() => recipes.value.filter((recipe) => recipe.status === 'published').length);
const draftCount = computed(() => recipes.value.filter((recipe) => recipe.status === 'draft').length);
const archivedCount = computed(() => recipes.value.filter((recipe) => recipe.status === 'archived').length);

const filteredRecipes = computed(() => {
	const normalizedQuery = searchQuery.value.trim().toLowerCase();

	return recipes.value.filter((recipe) => {
		if (statusFilter.value !== 'all' && recipe.status !== statusFilter.value) {
			return false;
		}

		if (!normalizedQuery) {
			return true;
		}

		const titleHaystack = [recipe.titles.en, recipe.titles.nl]
			.filter((value): value is string => Boolean(value))
			.join(' ')
			.toLowerCase();

		return recipe.slug.toLowerCase().includes(normalizedQuery) || titleHaystack.includes(normalizedQuery);
	});
});

const selectedRecipeSummary = computed(() => {
	return recipes.value.find((recipe) => recipe.id === selectedRecipeId.value) ?? null;
});

const isDirty = computed(() => {
	return serializeRecipeRecord(draftRecipe.value) !== serializeRecipeRecord(savedRecipe.value)
		|| Boolean(selectedImageFile.value);
});

const imagePreviewUrl = computed(() => {
	if (selectedImagePreviewUrl.value) {
		return selectedImagePreviewUrl.value;
	}

	return resolveRecipeImagePreviewUrl(draftRecipe.value?.imagePath);
});

const imageFileName = computed(() => selectedImageFile.value?.name || '');

const imageReference = computed(() => {
	return draftRecipe.value?.imagePath?.trim() || null;
});

const imageSourceLabel = computed(() => {
	if (selectedImageFile.value) {
		return 'Pending upload';
	}

	return getRecipeImageSourceLabel(draftRecipe.value?.imagePath);
});

function serializeRecipeRecord(recipe: AdminRecipeRecord | null) {
	return JSON.stringify(recipe ?? null);
}

function cloneRecipeRecord(recipe: AdminRecipeRecord) {
	return JSON.parse(JSON.stringify(recipe)) as AdminRecipeRecord;
}

function buildUpdatePayload(recipe: AdminRecipeRecord, imagePathOverride = recipe.imagePath): AdminRecipeUpdatePayload {
	return {
		slug: recipe.slug,
		status: recipe.status,
		imagePath: imagePathOverride,
		category: recipe.category,
		tags: [...recipe.tags],
		createdOn: recipe.createdOn,
		translations: {
			en: cloneRecipeRecord(recipe).translations.en,
			nl: cloneRecipeRecord(recipe).translations.nl,
		},
	};
}

function clearPendingImageState() {
	if (import.meta.client && selectedImagePreviewUrl.value) {
		URL.revokeObjectURL(selectedImagePreviewUrl.value);
	}

	selectedImageFile.value = null;
	selectedImagePreviewUrl.value = '';
	imageError.value = '';
}

function clearEditorState() {
	clearPendingImageState();
	draftRecipe.value = null;
	savedRecipe.value = null;
	activeRecipeId.value = '';
	editorError.value = '';
	saveMessage.value = '';
}

function syncRecipeState(recipe: AdminRecipeRecord) {
	clearPendingImageState();
	draftRecipe.value = cloneRecipeRecord(recipe);
	savedRecipe.value = cloneRecipeRecord(recipe);
	activeRecipeId.value = recipe.id;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
	if (error && typeof error === 'object' && 'data' in error) {
		const data = error.data;

		if (data && typeof data === 'object' && 'statusMessage' in data && typeof data.statusMessage === 'string') {
			return data.statusMessage;
		}
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallbackMessage;
}

async function replaceSelectedRecipe(recipeId: string | null) {
	const nextQuery = { ...route.query };

	if (recipeId) {
		nextQuery.recipe = recipeId;
	} else {
		delete nextQuery.recipe;
	}

	await router.replace({ query: nextQuery });
}

async function loadRecipeList() {
	loadingRecipes.value = true;
	listError.value = '';

	try {
		recipes.value = await listRecipes();

		if (!recipes.value.length) {
			await replaceSelectedRecipe(null);
			clearEditorState();
			return;
		}

		if (!selectedRecipeId.value || !recipes.value.some((recipe) => recipe.id === selectedRecipeId.value)) {
			await replaceSelectedRecipe(recipes.value[0].id);
		}
	} catch (error) {
		recipes.value = [];
		listError.value = getErrorMessage(error, 'Unable to load the recipe shelf right now.');
		clearEditorState();
	} finally {
		loadingRecipes.value = false;
	}
}

async function loadRecipeDetail(recipeId: string) {
	const requestId = ++detailRequestId;
	loadingRecipe.value = true;
	editorError.value = '';
	saveMessage.value = '';

	try {
		const recipe = await getRecipe(recipeId);

		if (requestId !== detailRequestId) {
			return;
		}

		syncRecipeState(recipe);
	} catch (error) {
		if (requestId !== detailRequestId) {
			return;
		}

		clearEditorState();
		editorError.value = getErrorMessage(error, 'Unable to load that recipe right now.');
	} finally {
		if (requestId === detailRequestId) {
			loadingRecipe.value = false;
		}
	}
}

async function handleRecipeSelection(recipeId: string) {
	if (!recipeId || recipeId === selectedRecipeId.value) {
		return;
	}

	await replaceSelectedRecipe(recipeId);
}

async function handleSave() {
	if (!draftRecipe.value || !isDirty.value) {
		return;
	}

	if (imageError.value) {
		editorError.value = imageError.value;
		return;
	}

	savingRecipe.value = true;
	editorError.value = '';
	saveMessage.value = '';
	const previousImagePath = savedRecipe.value?.imagePath ?? null;
	let uploadedImagePath: string | null = null;
	let nextImagePath = draftRecipe.value.imagePath;

	try {
		if (selectedImageFile.value) {
			uploadedImagePath = await uploadRecipeImage(selectedImageFile.value, draftRecipe.value.id);
			nextImagePath = uploadedImagePath;
		}

		const updatedRecipe = await updateRecipe(draftRecipe.value.id, buildUpdatePayload(draftRecipe.value, nextImagePath));
		syncRecipeState(updatedRecipe);
		saveMessage.value = 'Recipe saved to Supabase.';

		if (previousImagePath !== nextImagePath && getRecipeStorageImage(previousImagePath)) {
			try {
				await deleteRecipeImage(previousImagePath);
			} catch {
				editorError.value = 'Recipe saved, but the previous uploaded image could not be cleaned up.';
			}
		}

		await loadRecipeList();
	} catch (error) {
		if (uploadedImagePath) {
			try {
				await deleteRecipeImage(uploadedImagePath);
			} catch {
				// Keep the original save error visible.
			}
		}

		editorError.value = getErrorMessage(error, 'Unable to save this recipe right now.');
	} finally {
		savingRecipe.value = false;
	}
}

function handleReset() {
	if (!savedRecipe.value) {
		return;
	}

	clearPendingImageState();
	draftRecipe.value = cloneRecipeRecord(savedRecipe.value);
	editorError.value = '';
	saveMessage.value = '';
}

function handleImageFileSelection(file: File | null) {
	clearPendingImageState();

	if (!file) {
		return;
	}

	const validationError = getRecipeImageValidationError(file);

	if (validationError) {
		imageError.value = validationError;
		return;
	}

	selectedImageFile.value = file;

	if (import.meta.client) {
		selectedImagePreviewUrl.value = URL.createObjectURL(file);
	}
}

function handleRemoveImage() {
	clearPendingImageState();

	if (!draftRecipe.value) {
		return;
	}

	draftRecipe.value.imagePath = null;
}

watch(
	[isLoading, isAuthenticated, isAdmin],
	async ([loading, authenticated, admin]) => {
		if (loading) {
			return;
		}

		if (!authenticated) {
			const redirectTarget = encodeURIComponent(route.fullPath || '/admin/recipes');
			await navigateTo(`/login?redirect=${redirectTarget}`, { replace: true });
			return;
		}

		if (!admin) {
			return;
		}

		if (!hasLoadedAdminWorkspace.value) {
			hasLoadedAdminWorkspace.value = true;
			await loadRecipeList();
		}
	},
	{ immediate: true }
);

watch(
	[selectedRecipeId, isLoading, isAuthenticated, isAdmin],
	async ([recipeId, loading, authenticated, admin]) => {
		if (loading || !authenticated || !admin) {
			return;
		}

		if (!recipeId) {
			if (!loadingRecipes.value && recipes.value.length) {
				await replaceSelectedRecipe(recipes.value[0].id);
				return;
			}

			clearEditorState();
			return;
		}

		if (recipeId === activeRecipeId.value && draftRecipe.value) {
			return;
		}

		await loadRecipeDetail(recipeId);
	},
	{ immediate: true }
);

onBeforeUnmount(() => {
	clearPendingImageState();
});
</script>

<template>
	<div class="board-studio board-studio-page mx-auto flex min-h-screen w-full max-w-[1640px] flex-col gap-6 px-4 py-6 sm:px-6">
		<div
			v-if="isLoading"
			class="board-studio-panel board-studio-empty flex min-h-[20rem] place-content-center"
		>
			Checking your admin session...
		</div>

		<div
			v-else-if="!isAuthenticated"
			class="board-studio-panel board-studio-empty flex min-h-[20rem] place-content-center"
		>
			Redirecting you to login...
		</div>

		<section
			v-else-if="!isAdmin"
			class="board-studio-panel board-studio-empty flex min-h-[24rem] flex-col items-center justify-center gap-4 text-center"
		>
			<p class="board-studio-kicker">
				403
			</p>
			<h2 class="board-studio-display text-3xl text-[var(--board-accent-strong)]">
				This workspace is reserved for recipe admins.
			</h2>
			<p class="max-w-2xl text-sm text-[var(--board-muted)] sm:text-base">
				Your account is signed in, but it does not have the `app_metadata.role = admin` access required for recipe management.
			</p>
		</section>

		<template v-else>
			<section class="board-studio-toolbar">
				<div class="min-w-0">
					<p class="board-studio-kicker">
						Recipe Admin
					</p>
					<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
						<h1 class="text-lg font-semibold text-[var(--board-accent-strong)] sm:text-xl">
							Editor workbench
						</h1>
						<p class="text-xs text-[var(--board-muted)] sm:text-sm">
							Recipe shelf on the left, live content editor on the right.
						</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center justify-end gap-2">
					<span class="board-studio-pill board-studio-pill-compact">
						Published {{ publishedCount }}
					</span>
					<span class="board-studio-pill board-studio-pill-compact">
						Drafts {{ draftCount }}
					</span>
					<span class="board-studio-pill board-studio-pill-compact">
						Archived {{ archivedCount }}
					</span>
					<span v-if="selectedRecipeSummary" class="board-studio-pill board-studio-pill-compact">
						Editing {{ selectedRecipeSummary.slug }}
					</span>
					<span v-if="isDirty" class="board-studio-pill board-studio-pill-compact">
						Unsaved changes
					</span>
				</div>
			</section>

			<div class="grid gap-6 md:grid-cols-[19.5rem_minmax(0,1fr)] md:items-start lg:grid-cols-[21rem_minmax(0,1fr)]">
				<RecipeAdminListPanel
					class="md:col-start-1 md:row-start-1"
					v-model:search-query="searchQuery"
					v-model:status-filter="statusFilter"
					:recipes="filteredRecipes"
					:recipes-count="recipes.length"
					:selected-recipe-id="selectedRecipeId"
					:loading="loadingRecipes"
					:error-message="listError"
					@refresh="loadRecipeList"
					@select="handleRecipeSelection"
				/>

				<RecipeAdminEditorPanel
					class="md:col-start-2 md:row-start-1"
					v-model="draftRecipe"
					:loading="loadingRecipe"
					:is-saving="savingRecipe"
					:is-dirty="isDirty"
					:error-message="editorError"
					:image-error="imageError"
					:image-file-name="imageFileName"
					:image-preview-url="imagePreviewUrl"
					:image-reference="imageReference"
					:image-source-label="imageSourceLabel"
					:save-message="saveMessage"
					@remove-image="handleRemoveImage"
					@reset="handleReset"
					@save="handleSave"
					@select-image-file="handleImageFileSelection"
				/>
			</div>
		</template>
	</div>
</template>
