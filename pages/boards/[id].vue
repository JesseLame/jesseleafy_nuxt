<script setup lang="ts">
import { computed, watch } from 'vue';
import BoardCanvas from '~/components/boards/BoardCanvas.vue';
import BoardHeader from '~/components/boards/BoardHeader.vue';
import BoardIdeaLibrary from '~/components/boards/BoardIdeaLibrary.vue';
import BoardToolsPanel from '~/components/boards/BoardToolsPanel.vue';

const route = useRoute();
const { isAuthenticated, isLoading } = useAuth();

const boardId = computed(() => {
	const value = route.params.id;
	return Array.isArray(value) ? value[0] ?? '' : String(value ?? '');
});

const {
	allTags,
	board,
	boardItems,
	boardReady,
	conceptBusyId,
	conceptItemCounts,
	conceptNotes,
	conceptTitle,
	editingIdeaId,
	filteredIdeas,
	handleCreateConcept,
	handleDeleteIdea,
	handleDeleteSelection,
	handleDuplicateConcept,
	handleIdeaImageFileSelected,
	handlePlaceIdea,
	handleSaveIdea,
	handleUngroupSelection,
	ideaDescription,
	ideaImageError,
	ideaImageFileName,
	ideaImageMode,
	ideaImagePreviewUrl,
	ideaImageUrl,
	ideaNotes,
	ideaTagsInput,
	ideaTitle,
	ideaType,
	isLibraryOpen,
	isRightRailOpen,
	isSavingIdea,
	leftColumnClass,
	libraryTagFilter,
	libraryTypeFilter,
	loadBoardData,
	loadingBoard,
	mergeBoardItem,
	nextZIndex,
	pageError,
	populateIdeaForm,
	removeIdeaImage,
	resetIdeaForm,
	saveBoardItemPosition,
	selectBoardItems,
	selectConcept,
	selectedCardTone,
	selectedItemCount,
	selectedItemIds,
	selectionConceptId,
	setPageError,
	sortedBoardItems,
	toggleLibrary,
	toggleRightRail,
	toggleSelection,
	visibleConcepts,
} = useBoardDetail(boardId);

const { handleCanvasCardPointerDown } = useBoardCanvas({
	boardItems,
	selectedItemIds,
	nextZIndex,
	mergeBoardItem,
	selectBoardItems,
	toggleSelection,
	saveBoardItemPosition,
	setPageError,
});

useSeoMeta({
	title: () => (board.value ? `${board.value.title} - Boards - Jesse's Leafy Feasts` : 'Board - Jesse\'s Leafy Feasts'),
	description: () => board.value?.description || 'A private idea board for product concepts and creative planning.',
});

watch(
	[isLoading, isAuthenticated, boardId],
	async ([loading, authenticated]) => {
		if (loading) {
			return;
		}

		if (!authenticated) {
			const redirectTarget = encodeURIComponent(route.fullPath || `/boards/${boardId.value}`);
			await navigateTo(`/login?redirect=${redirectTarget}`, { replace: true });
			return;
		}

		await loadBoardData();
	},
	{ immediate: true }
);
</script>

<template>
	<div class="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6">
		<BoardHeader :board="board" :loading-board="loadingBoard" @refresh="loadBoardData" />

		<p v-if="pageError" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{{ pageError }}
		</p>

		<div v-if="isLoading || loadingBoard" class="rounded-3xl border border-dashed border-green-200 bg-green-50/70 px-6 py-12 text-center text-sm text-green-900/80">
			Loading board...
		</div>

		<div v-else-if="!boardReady" class="rounded-3xl border border-dashed border-red-200 bg-white/80 px-6 py-12 text-center shadow-xl backdrop-blur-sm">
			<h2 class="text-2xl font-semibold text-green-900">
				Board not found
			</h2>
			<p class="mt-2 text-sm text-gray-700">
				This board may have been removed, or you may not have access to it.
			</p>
		</div>

		<div v-else class="flex flex-col gap-6 lg:flex-row lg:items-start">
			<div
				class="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2"
				:class="leftColumnClass"
			>
				<BoardIdeaLibrary
					v-model:idea-title="ideaTitle"
					v-model:idea-type="ideaType"
					v-model:idea-description="ideaDescription"
					v-model:idea-image-mode="ideaImageMode"
					v-model:idea-image-url="ideaImageUrl"
					v-model:idea-notes="ideaNotes"
					v-model:idea-tags-input="ideaTagsInput"
					v-model:library-type-filter="libraryTypeFilter"
					v-model:library-tag-filter="libraryTagFilter"
					:all-tags="allTags"
					:editing-idea-id="editingIdeaId"
					:filtered-ideas="filteredIdeas"
					:image-error="ideaImageError"
					:image-file-name="ideaImageFileName"
					:image-preview-url="ideaImagePreviewUrl"
					:is-open="isLibraryOpen"
					:is-saving-idea="isSavingIdea"
					@delete-idea="handleDeleteIdea"
					@edit-idea="populateIdeaForm"
					@place-idea="handlePlaceIdea"
					@remove-image="removeIdeaImage"
					@reset-idea-form="resetIdeaForm"
					@save-idea="handleSaveIdea"
					@select-image-file="handleIdeaImageFileSelected"
					@toggle-open="toggleLibrary"
				/>

				<BoardToolsPanel
					v-model:concept-title="conceptTitle"
					v-model:concept-notes="conceptNotes"
					:concept-busy-id="conceptBusyId"
					:concept-item-counts="conceptItemCounts"
					:is-open="isRightRailOpen"
					:selected-card-tone="selectedCardTone"
					:selected-item-count="selectedItemCount"
					:selection-concept-id="selectionConceptId"
					:visible-concepts="visibleConcepts"
					@create-concept="handleCreateConcept"
					@delete-selection="handleDeleteSelection"
					@duplicate-concept="handleDuplicateConcept"
					@select-concept="selectConcept"
					@toggle-open="toggleRightRail"
					@ungroup-selection="handleUngroupSelection"
				/>
			</div>

			<BoardCanvas
				:board-items="sortedBoardItems"
				:selected-item-ids="selectedItemIds"
				@card-pointerdown="handleCanvasCardPointerDown"
			/>
		</div>
	</div>
</template>
