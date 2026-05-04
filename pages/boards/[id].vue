<script setup lang="ts">
import { computed, watch } from 'vue';
import type { Connection } from '@vue-flow/core';
import BoardCanvas from '~/components/boards/BoardCanvas.vue';
import BoardIdeaEditorModal from '~/components/boards/BoardIdeaEditorModal.vue';
import BoardHeader from '~/components/boards/BoardHeader.vue';
import BoardWorkspacePanel from '~/components/boards/BoardWorkspacePanel.vue';

const route = useRoute();
const { isAuthenticated, isLoading } = useAuth();

const boardId = computed(() => {
	const value = route.params.id;
	return Array.isArray(value) ? value[0] ?? '' : String(value ?? '');
});

const {
	allTags,
	activeWorkspaceSection,
	board,
	boardDescriptionDraft,
	boardItems,
	boardRelations,
	boardTitleDraft,
	boardReady,
	canRemoveIdeaImage,
	beginRelationEditing,
	conceptBusyId,
	conceptItemCounts,
	conceptNotes,
	conceptTitle,
	closeIdeaEditorModal,
	editingIdeaId,
	editingBoardItemId,
	filteredIdeas,
	handleCancelBoardEditing,
	handleBoardItemResizeEnd,
	handleBoardItemsMoved,
	handleCanvasSelectionChange,
	handleCreateRelationFromCanvas,
	handleCreateConcept,
	handleDeleteBoard,
	handleDeleteIdea,
	handleRemoveEditingBoardItem,
	handleDeleteSelection,
	handleDeleteSelectedRelation,
	handleDuplicateConcept,
	handleIdeaImageFileSelected,
	handlePlaceIdea,
	handleSaveBoard,
	handleSaveIdea,
	handleSaveSelectedRelation,
	handleStartBoardEditing,
	handleUngroupSelection,
	ideaDescription,
	ideaEditorModalTitle,
	ideaImageError,
	ideaImageFileName,
	ideaImageMode,
	ideaImageUrl,
	ideaPreviewMedia,
	ideaReferenceUrl,
	ideaNotes,
	ideaTagsInput,
	ideaTitle,
	ideaType,
	isEditingBoard,
	isIdeaEditorModalOpen,
	isDeletingBoard,
	isSavingBoard,
	isWorkspaceOpen,
	isSavingIdea,
	libraryTagFilter,
	libraryTypeFilter,
	loadBoardData,
	loadingBoard,
	openWorkspace,
	openIdeaEditorModalFromBoardItem,
	pageError,
	populateIdeaForm,
	removeIdeaImage,
	relationKind,
	relationLabel,
	relationSummary,
	resetIdeaForm,
	selectedBoardRelation,
	selectConcept,
	selectedCardTone,
	selectedItemCount,
	selectedItemIds,
	selectedRelationIds,
	selectionConceptId,
	setActiveWorkspaceSection,
	toggleWorkspace,
	visibleConcepts,
} = useBoardDetail(boardId);

const handleRelationConnect = async (connection: Connection) => {
	await handleCreateRelationFromCanvas({
		source: connection.source,
		target: connection.target,
	});
};

const handleRelationEditRequested = ({ relationId }: { anchorX: number; anchorY: number; relationId: string }) => {
	beginRelationEditing(relationId);
	openWorkspace();
	setActiveWorkspaceSection('links');
};

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
	<div class="board-studio board-studio-page mx-auto flex min-h-screen w-full max-w-[1640px] flex-col gap-6 px-4 py-6 sm:px-6">
		<BoardHeader
			:board="board"
			v-model:board-title="boardTitleDraft"
			v-model:board-description="boardDescriptionDraft"
			:is-editing-board="isEditingBoard"
			:is-deleting-board="isDeletingBoard"
			:is-saving-board="isSavingBoard"
			:loading-board="loadingBoard"
			@cancel-editing="handleCancelBoardEditing"
			@delete-board="handleDeleteBoard"
			@refresh="loadBoardData"
			@save-board="handleSaveBoard"
			@start-editing="handleStartBoardEditing"
		/>

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
			<div class="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2">
				<BoardWorkspacePanel
					v-model:active-section="activeWorkspaceSection"
					v-model:idea-title="ideaTitle"
					v-model:idea-type="ideaType"
					v-model:idea-description="ideaDescription"
					v-model:idea-image-mode="ideaImageMode"
					v-model:idea-image-url="ideaImageUrl"
					v-model:idea-reference-url="ideaReferenceUrl"
					v-model:idea-notes="ideaNotes"
					v-model:idea-tags-input="ideaTagsInput"
					v-model:library-type-filter="libraryTypeFilter"
					v-model:library-tag-filter="libraryTagFilter"
					v-model:concept-title="conceptTitle"
					v-model:concept-notes="conceptNotes"
					v-model:relation-kind="relationKind"
					v-model:relation-label="relationLabel"
					:all-tags="allTags"
					:can-remove-image="canRemoveIdeaImage"
					:concept-busy-id="conceptBusyId"
					:concept-item-counts="conceptItemCounts"
					:editing-idea-id="editingIdeaId"
					:filtered-ideas="filteredIdeas"
					:image-error="ideaImageError"
					:image-file-name="ideaImageFileName"
					:is-open="isWorkspaceOpen"
					:is-saving-idea="isSavingIdea"
					:media-preview-idea="ideaPreviewMedia"
					:relation-summary="relationSummary"
					:selected-card-tone="selectedCardTone"
					:selected-item-count="selectedItemCount"
					:selected-relation-id="selectedBoardRelation?.id ?? null"
					:selection-concept-id="selectionConceptId"
					:visible-concepts="visibleConcepts"
					@create-concept="handleCreateConcept"
					@delete-idea="handleDeleteIdea"
					@delete-selected-relation="handleDeleteSelectedRelation"
					@delete-selection="handleDeleteSelection"
					@duplicate-concept="handleDuplicateConcept"
					@edit-idea="populateIdeaForm"
					@place-idea="handlePlaceIdea"
					@remove-image="removeIdeaImage"
					@reset-idea-form="resetIdeaForm"
					@save-idea="handleSaveIdea"
					@save-selected-relation="handleSaveSelectedRelation"
					@select-concept="selectConcept"
					@select-image-file="handleIdeaImageFileSelected"
					@toggle-open="toggleWorkspace"
					@ungroup-selection="handleUngroupSelection"
				/>
			</div>

			<BoardCanvas
				:board-items="boardItems"
				:board-relations="boardRelations"
				:selected-item-ids="selectedItemIds"
				:selected-relation-ids="selectedRelationIds"
				@board-item-resized="handleBoardItemResizeEnd"
				@board-items-moved="handleBoardItemsMoved"
				@card-edit-requested="openIdeaEditorModalFromBoardItem"
				@relation-edit-requested="handleRelationEditRequested"
				@relation-connected="handleRelationConnect"
				@selection-change="handleCanvasSelectionChange"
			/>
		</div>

		<BoardIdeaEditorModal
			v-if="editingBoardItemId"
			v-model:idea-title="ideaTitle"
			v-model:idea-type="ideaType"
			v-model:idea-description="ideaDescription"
			v-model:idea-image-mode="ideaImageMode"
			v-model:idea-image-url="ideaImageUrl"
			v-model:idea-reference-url="ideaReferenceUrl"
			v-model:idea-notes="ideaNotes"
			v-model:idea-tags-input="ideaTagsInput"
			:can-remove-image="canRemoveIdeaImage"
			:editing-idea-id="editingIdeaId"
			:image-error="ideaImageError"
			:image-file-name="ideaImageFileName"
			:is-open="isIdeaEditorModalOpen"
			:is-saving-idea="isSavingIdea"
			:media-preview-idea="ideaPreviewMedia"
			:modal-title="ideaEditorModalTitle"
			@close="closeIdeaEditorModal"
			@remove-current-board-item="handleRemoveEditingBoardItem"
			@remove-image="removeIdeaImage"
			@save-idea="handleSaveIdea"
			@select-image-file="handleIdeaImageFileSelected"
		/>
	</div>
</template>
