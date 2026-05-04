<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import RecipeAdminEditorPanel from '~/components/admin/RecipeAdminEditorPanel.vue';
import RecipeAdminListPanel from '~/components/admin/RecipeAdminListPanel.vue';
import {
	RECIPE_STATUSES,
	type AdminRecipeLocalizedFields,
	type AdminRecipeListStatusFilter,
	type AdminRecipeRecord,
	type AdminRecipeSummary,
	type AdminRecipeUpdatePayload,
	type RecipeLang,
	type RecipeStatus,
} from '~/types/recipe';
import {
	getRecipeImageSourceLabel,
	getRecipeImageValidationError,
	getRecipeStorageImage,
} from '~/utils/recipeImages';

const DEFAULT_ADMIN_RECIPE_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 250;
const EMPTY_STATUS_COUNTS: Record<RecipeStatus, number> = {
	archived: 0,
	draft: 0,
	published: 0,
};

useSeoMeta({
	title: "Recipe Admin - Jesse's Leafy Feasts",
	description: 'A private Supabase-backed workspace for managing recipe content.',
});

const route = useRoute();
const router = useRouter();
const { isAuthenticated, isAdmin, isLoading } = useAuth();
const { createRecipe, getRecipe, listRecipes, translateRecipe, updateRecipe } = useRecipeAdmin();
const { deleteRecipeImage, resolveRecipeImagePreviewUrl, uploadRecipeImage } = useRecipeImages();

const recipes = ref<AdminRecipeSummary[]>([]);
const searchQuery = ref('');
const statusFilter = ref<AdminRecipeListStatusFilter>('all');
const totalCount = ref(0);
const totalPages = ref(1);
const pageSize = ref(DEFAULT_ADMIN_RECIPE_PAGE_SIZE);
const statusCounts = ref<Record<RecipeStatus, number>>({ ...EMPTY_STATUS_COUNTS });
const loadingRecipes = ref(false);
const loadingRecipe = ref(false);
const creatingRecipe = ref(false);
const savingRecipe = ref(false);
const translatingRecipe = ref(false);
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
let listRequestId = 0;
let searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

function getSingleQueryValue(value: unknown) {
	return Array.isArray(value) ? value[0] ?? '' : typeof value === 'string' ? value : '';
}

function isRecipeStatus(value: string): value is RecipeStatus {
	return RECIPE_STATUSES.includes(value as RecipeStatus);
}

const selectedRecipeId = computed(() => getSingleQueryValue(route.query.recipe));

const currentPage = computed(() => {
	const value = getSingleQueryValue(route.query.page);
	const parsedPage = Number.parseInt(value, 10);

	if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
		return 1;
	}

	return parsedPage;
});

const activeStatusFilter = computed<AdminRecipeListStatusFilter>(() => {
	const value = getSingleQueryValue(route.query.status).trim();

	if (!value || value === 'all') {
		return 'all';
	}

	return isRecipeStatus(value) ? value : 'all';
});

const activeSearchQuery = computed(() => getSingleQueryValue(route.query.q).trim());

const publishedCount = computed(() => statusCounts.value.published);
const draftCount = computed(() => statusCounts.value.draft);
const archivedCount = computed(() => statusCounts.value.archived);

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

function getLocaleLabel(locale: RecipeLang) {
	return locale === 'en' ? 'English' : 'Dutch';
}

function getTargetLocale(locale: RecipeLang): RecipeLang {
	return locale === 'en' ? 'nl' : 'en';
}

function cloneLocalizedFields(translation: AdminRecipeLocalizedFields): AdminRecipeLocalizedFields {
	return {
		title: translation.title,
		description: translation.description,
		bodyMarkdown: translation.bodyMarkdown,
		ingredientSections: translation.ingredientSections.map((section) => ({
			title: section.title,
			items: [...section.items],
		})),
		instructionSections: translation.instructionSections.map((section) => ({
			title: section.title,
			steps: [...section.steps],
		})),
	};
}

function hasLocalizedContent(translation: AdminRecipeRecord['translations'][RecipeLang]) {
	return Boolean(
		translation.exists
		|| translation.title.trim()
		|| translation.description.trim()
		|| translation.bodyMarkdown?.trim()
		|| translation.ingredientSections.length
		|| translation.instructionSections.length
	);
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

function clearSearchDebounce() {
	if (!searchDebounceTimeout) {
		return;
	}

	clearTimeout(searchDebounceTimeout);
	searchDebounceTimeout = null;
}

async function replaceAdminListState(options: {
	page?: number;
	q?: string;
	recipe?: string | null;
	status?: AdminRecipeListStatusFilter;
}) {
	const nextPage = options.page ?? currentPage.value;
	const nextStatus = options.status ?? activeStatusFilter.value;
	const nextQueryValue = (options.q ?? activeSearchQuery.value).trim();
	const nextRecipeId = options.recipe === undefined ? (selectedRecipeId.value || null) : options.recipe;
	const currentRecipeId = selectedRecipeId.value || null;

	if (
		nextPage === currentPage.value
		&& nextStatus === activeStatusFilter.value
		&& nextQueryValue === activeSearchQuery.value
		&& nextRecipeId === currentRecipeId
	) {
		return;
	}

	const nextQuery = { ...route.query };

	if (nextRecipeId) {
		nextQuery.recipe = nextRecipeId;
	} else {
		delete nextQuery.recipe;
	}

	if (nextPage > 1) {
		nextQuery.page = String(nextPage);
	} else {
		delete nextQuery.page;
	}

	if (nextStatus !== 'all') {
		nextQuery.status = nextStatus;
	} else {
		delete nextQuery.status;
	}

	if (nextQueryValue) {
		nextQuery.q = nextQueryValue;
	} else {
		delete nextQuery.q;
	}

	await router.replace({ query: nextQuery });
}

async function replaceSelectedRecipe(recipeId: string | null) {
	await replaceAdminListState({ recipe: recipeId });
}

async function loadRecipeList() {
	const requestId = ++listRequestId;
	loadingRecipes.value = true;
	listError.value = '';
	const page = currentPage.value;
	const status = activeStatusFilter.value;
	const q = activeSearchQuery.value;

	try {
		const response = await listRecipes({
			page,
			q,
			status,
		});

		if (requestId !== listRequestId) {
			return;
		}

		recipes.value = response.items;
		totalCount.value = response.totalCount;
		totalPages.value = response.totalPages;
		pageSize.value = response.pageSize;
		statusCounts.value = { ...response.statusCounts };

		if (response.page !== page) {
			await replaceAdminListState({ page: response.page, q, status });
			return;
		}

		if (!recipes.value.length) {
			await replaceSelectedRecipe(null);
			clearEditorState();
			return;
		}

		if (!selectedRecipeId.value || !recipes.value.some((recipe) => recipe.id === selectedRecipeId.value)) {
			await replaceSelectedRecipe(recipes.value[0].id);
		}
	} catch (error) {
		if (requestId !== listRequestId) {
			return;
		}

		recipes.value = [];
		totalCount.value = 0;
		totalPages.value = 1;
		pageSize.value = DEFAULT_ADMIN_RECIPE_PAGE_SIZE;
		statusCounts.value = { ...EMPTY_STATUS_COUNTS };
		listError.value = getErrorMessage(error, 'Unable to load the recipe shelf right now.');
		clearEditorState();
	} finally {
		if (requestId === listRequestId) {
			loadingRecipes.value = false;
		}
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

async function handlePageChange(page: number) {
	if (page < 1 || page === currentPage.value) {
		return;
	}

	clearSearchDebounce();
	await replaceAdminListState({
		page,
		q: searchQuery.value,
		status: statusFilter.value,
	});
}

async function handleCreate() {
	if (creatingRecipe.value || loadingRecipes.value) {
		return;
	}

	clearSearchDebounce();
	creatingRecipe.value = true;
	listError.value = '';
	editorError.value = '';
	saveMessage.value = '';

	try {
		const recipe = await createRecipe();
		syncRecipeState(recipe);
		saveMessage.value = 'Draft recipe created. Add content and save when you are ready.';

		await replaceAdminListState({
			page: 1,
			q: '',
			recipe: recipe.id,
			status: 'draft',
		});
	} catch (error) {
		listError.value = getErrorMessage(error, 'Unable to create a draft recipe right now.');
	} finally {
		creatingRecipe.value = false;
	}
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

async function handleTranslate(sourceLocale: RecipeLang) {
	if (!draftRecipe.value || translatingRecipe.value || savingRecipe.value) {
		return;
	}

	const recipeId = draftRecipe.value.id;
	const targetLocale = getTargetLocale(sourceLocale);
	const sourceTranslation = draftRecipe.value.translations[sourceLocale];
	const targetTranslation = draftRecipe.value.translations[targetLocale];

	if (!sourceTranslation.title.trim() || !sourceTranslation.description.trim()) {
		editorError.value = `${getLocaleLabel(sourceLocale)} content needs both a title and description before it can be translated.`;
		return;
	}

	if (import.meta.client && hasLocalizedContent(targetTranslation)) {
		const confirmed = window.confirm(
			`${getLocaleLabel(targetLocale)} content already exists for this recipe. Replace the current ${getLocaleLabel(targetLocale).toLowerCase()} draft with a fresh translation from ${getLocaleLabel(sourceLocale).toLowerCase()}?`
		);

		if (!confirmed) {
			return;
		}
	}

	translatingRecipe.value = true;
	editorError.value = '';
	saveMessage.value = '';

	try {
		const response = await translateRecipe(recipeId, {
			sourceLocale,
			targetLocale,
			source: cloneLocalizedFields(sourceTranslation),
		});

		if (!draftRecipe.value || draftRecipe.value.id !== recipeId) {
			return;
		}

		draftRecipe.value.translations[response.targetLocale] = {
			...cloneLocalizedFields(response.translation),
			exists: draftRecipe.value.translations[response.targetLocale].exists,
		};
		saveMessage.value = `${getLocaleLabel(response.targetLocale)} draft refreshed from ${getLocaleLabel(sourceLocale)}. Review it, then save the recipe to persist the translation.`;
	} catch (error) {
		console.error('[recipe-admin] Recipe translation failed', {
			recipeId,
			sourceLocale,
			targetLocale,
			error,
		});
		editorError.value = getErrorMessage(error, 'Unable to translate this recipe right now.');
	} finally {
		translatingRecipe.value = false;
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
	activeSearchQuery,
	(value) => {
		if (searchQuery.value !== value) {
			searchQuery.value = value;
		}
	},
	{ immediate: true }
);

watch(
	activeStatusFilter,
	(value) => {
		if (statusFilter.value !== value) {
			statusFilter.value = value;
		}
	},
	{ immediate: true }
);

watch(statusFilter, async (value) => {
	if (value === activeStatusFilter.value) {
		return;
	}

	clearSearchDebounce();
	await replaceAdminListState({
		page: 1,
		q: searchQuery.value,
		status: value,
	});
});

watch(searchQuery, (value) => {
	clearSearchDebounce();

	if (value.trim() === activeSearchQuery.value) {
		return;
	}

	searchDebounceTimeout = setTimeout(() => {
		searchDebounceTimeout = null;
		void replaceAdminListState({
			page: 1,
			q: value,
			status: statusFilter.value,
		});
	}, SEARCH_DEBOUNCE_MS);
});

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
	[currentPage, activeStatusFilter, activeSearchQuery, isLoading, isAuthenticated, isAdmin],
	async ([, , , loading, authenticated, admin]) => {
		if (loading || !authenticated || !admin || !hasLoadedAdminWorkspace.value) {
			return;
		}

		await loadRecipeList();
	}
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
	clearSearchDebounce();
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
					:creating="creatingRecipe"
					:current-page="currentPage"
					:error-message="listError"
					:loading="loadingRecipes"
					:page-size="pageSize"
					:recipes="recipes"
					:selected-recipe-id="selectedRecipeId"
					:total-count="totalCount"
					:total-pages="totalPages"
					@change-page="handlePageChange"
					@create="handleCreate"
					@refresh="loadRecipeList"
					@select="handleRecipeSelection"
				/>

				<RecipeAdminEditorPanel
					class="md:col-start-2 md:row-start-1"
					v-model="draftRecipe"
					:loading="loadingRecipe"
					:is-saving="savingRecipe"
					:is-translating="translatingRecipe"
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
					@translate="handleTranslate"
				/>
			</div>
		</template>
	</div>
</template>
