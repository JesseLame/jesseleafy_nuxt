import { computed, onBeforeUnmount, ref, shallowRef, watch, type Ref } from 'vue';
import type { Board, BoardItemWithIdea, BoardIdeaUploadImage, Concept, Idea, IdeaType } from '~/types/board';
import {
	BOARD_IDEA_IMAGE_MAX_BYTES,
	BOARD_IMAGE_CARD_HEIGHT,
	BOARD_IMAGE_CARD_WIDTH,
	getBoardIdeaUploadFileName,
	getBoardIdeaUploadImage,
	ideaHasImage,
	useBoardIdeaImages,
	withBoardIdeaUploadImage,
} from '~/composables/useBoardIdeaImages';
import { DEFAULT_BOARD_CARD_BACKGROUND, type BoardCardBackground, parseBoardTags } from '~/utils/board';

export function useBoardDetail(boardId: Ref<string>) {
	const { user } = useAuth();
	const {
		addIdeaToBoard,
		createConceptFromBoardItems,
		createIdea,
		deleteBoardItems,
		deleteIdea,
		duplicateConcept,
		loadBoardSnapshot,
		removeBoardItemsFromConcept,
		updateBoardItemPosition,
		updateIdea,
	} = useBoards();
	const { deleteIdeaImageUpload, resolveIdeaImageUrl, uploadIdeaImage } = useBoardIdeaImages();

	const board = ref<Board | null>(null);
	const ideas = ref<Idea[]>([]);
	const boardItems = ref<BoardItemWithIdea[]>([]);
	const concepts = ref<Concept[]>([]);

	const pageError = ref('');
	const loadingBoard = ref(false);
	const isSavingIdea = ref(false);
	const conceptBusyId = ref<string | null>(null);

	const ideaTitle = ref('');
	const ideaType = ref<IdeaType>('technique');
	const ideaDescription = ref('');
	const ideaImageUrl = ref('');
	const ideaReferenceUrl = ref('');
	const ideaImageMode = ref<'url' | 'upload'>('url');
	const ideaImagePreviewUrl = ref('');
	const ideaImageFileName = ref('');
	const ideaImageError = ref('');
	const ideaNotes = ref('');
	const ideaTagsInput = ref('');
	const editingIdeaId = ref<string | null>(null);
	const editingBoardItemId = ref<string | null>(null);
	const isIdeaEditorModalOpen = ref(false);

	const ideaSelectedImageFile = shallowRef<File | null>(null);
	const ideaExistingUploadImage = ref<BoardIdeaUploadImage | null>(null);
	const ideaPreviewObjectUrl = ref<string | null>(null);

	const libraryTypeFilter = ref<'all' | IdeaType>('all');
	const libraryTagFilter = ref('');
	const conceptTitle = ref('');
	const conceptNotes = ref('');
	const selectedItemIds = ref<string[]>([]);
	const selectedCardTone = ref<BoardCardBackground>(DEFAULT_BOARD_CARD_BACKGROUND);
	const isLibraryOpen = ref(true);
	const isRightRailOpen = ref(true);

	const sortedBoardItems = computed(() =>
		[...boardItems.value].sort((left, right) => left.z_index - right.z_index)
	);

	const selectedBoardItems = computed(() =>
		boardItems.value.filter((item) => selectedItemIds.value.includes(item.id))
	);

	const selectedItemCount = computed(() => selectedItemIds.value.length);

	const conceptItemCounts = computed(() => {
		return boardItems.value.reduce<Record<string, number>>((counts, item) => {
			if (item.concept_id) {
				counts[item.concept_id] = (counts[item.concept_id] ?? 0) + 1;
			}

			return counts;
		}, {});
	});

	const visibleConcepts = computed(() =>
		concepts.value.filter((concept) => (conceptItemCounts.value[concept.id] ?? 0) > 0)
	);

	const allTags = computed(() => {
		return [...new Set(ideas.value.flatMap((idea) => idea.tags))].sort((left, right) => left.localeCompare(right));
	});

	const filteredIdeas = computed(() => {
		return ideas.value.filter((idea) => {
			const matchesType = libraryTypeFilter.value === 'all' || idea.type === libraryTypeFilter.value;
			const matchesTag = !libraryTagFilter.value || idea.tags.includes(libraryTagFilter.value);
			return matchesType && matchesTag;
		});
	});

	const selectionConceptId = computed(() => {
		const conceptIds = [...new Set(selectedBoardItems.value.map((item) => item.concept_id).filter(Boolean))];
		return conceptIds.length === 1 ? conceptIds[0] ?? null : null;
	});

	const nextZIndex = computed(() => {
		return boardItems.value.reduce((highest, item) => Math.max(highest, item.z_index), 0) + 1;
	});

	const boardReady = computed(() => Boolean(board.value));
	const ideaEditorModalTitle = computed(() => {
		if (editingIdeaId.value) {
			return ideaTitle.value.trim() ? `Edit "${ideaTitle.value.trim()}"` : 'Edit idea';
		}

		return 'Edit idea';
	});

	const leftColumnClass = computed(() => {
		if (isLibraryOpen.value) {
			return 'lg:w-[22rem] lg:min-w-[22rem]';
		}

		if (isRightRailOpen.value) {
			return 'lg:w-[20rem] lg:min-w-[20rem]';
		}

		return 'lg:w-20 lg:min-w-20';
	});

	const revokeIdeaPreviewObjectUrl = () => {
		if (ideaPreviewObjectUrl.value?.startsWith('blob:')) {
			URL.revokeObjectURL(ideaPreviewObjectUrl.value);
		}

		ideaPreviewObjectUrl.value = null;
	};

	const syncIdeaImagePreview = async () => {
		if (ideaImageMode.value === 'url') {
			revokeIdeaPreviewObjectUrl();
			ideaImagePreviewUrl.value = ideaImageUrl.value.trim();
			ideaImageFileName.value = '';
			return;
		}

		if (ideaSelectedImageFile.value) {
			revokeIdeaPreviewObjectUrl();
			const objectUrl = URL.createObjectURL(ideaSelectedImageFile.value);
			ideaPreviewObjectUrl.value = objectUrl;
			ideaImagePreviewUrl.value = objectUrl;
			ideaImageFileName.value = ideaSelectedImageFile.value.name;
			return;
		}

		revokeIdeaPreviewObjectUrl();

		if (!ideaExistingUploadImage.value) {
			ideaImagePreviewUrl.value = '';
			ideaImageFileName.value = '';
			return;
		}

		ideaImageFileName.value = getBoardIdeaUploadFileName(ideaExistingUploadImage.value);

		try {
			ideaImagePreviewUrl.value = (
				await resolveIdeaImageUrl({
					image_url: null,
					metadata: withBoardIdeaUploadImage({}, ideaExistingUploadImage.value),
				})
			) ?? '';
		} catch {
			ideaImagePreviewUrl.value = '';
			ideaImageError.value = 'Unable to load the uploaded image preview right now.';
		}
	};

	const resetIdeaForm = () => {
		editingIdeaId.value = null;
		ideaTitle.value = '';
		ideaType.value = 'technique';
		ideaDescription.value = '';
		ideaImageUrl.value = '';
		ideaReferenceUrl.value = '';
		ideaImageMode.value = 'url';
		ideaImagePreviewUrl.value = '';
		ideaImageFileName.value = '';
		ideaImageError.value = '';
		ideaNotes.value = '';
		ideaTagsInput.value = '';
		ideaSelectedImageFile.value = null;
		ideaExistingUploadImage.value = null;
		revokeIdeaPreviewObjectUrl();
	};

	const toggleLibrary = () => {
		isLibraryOpen.value = !isLibraryOpen.value;
	};

	const toggleRightRail = () => {
		isRightRailOpen.value = !isRightRailOpen.value;
	};

	const populateIdeaForm = (idea: Idea) => {
		editingIdeaId.value = idea.id;
		ideaTitle.value = idea.title;
		ideaType.value = idea.type;
		ideaDescription.value = idea.description ?? '';
		ideaImageUrl.value = idea.image_url ?? '';
		ideaReferenceUrl.value = idea.reference_url ?? '';
		ideaImageError.value = '';
		ideaNotes.value = idea.notes ?? '';
		ideaTagsInput.value = idea.tags.join(', ');
		ideaSelectedImageFile.value = null;
		ideaExistingUploadImage.value = getBoardIdeaUploadImage(idea.metadata);
		ideaImageMode.value = ideaExistingUploadImage.value ? 'upload' : 'url';
		void syncIdeaImagePreview();
	};

	const openIdeaEditorModalFromBoardItem = (item: BoardItemWithIdea) => {
		if (!item.idea) {
			return;
		}

		populateIdeaForm(item.idea);
		editingBoardItemId.value = item.id;
		isIdeaEditorModalOpen.value = true;
		selectBoardItems([item.id]);
	};

	const closeIdeaEditorModal = () => {
		isIdeaEditorModalOpen.value = false;
		editingBoardItemId.value = null;
		resetIdeaForm();
	};

	const handleIdeaImageFileSelected = (file: File | null) => {
		ideaImageError.value = '';

		if (!file) {
			ideaSelectedImageFile.value = null;
			void syncIdeaImagePreview();
			return;
		}

		if (!file.type.startsWith('image/')) {
			ideaImageError.value = 'Choose an image file.';
			return;
		}

		if (file.size > BOARD_IDEA_IMAGE_MAX_BYTES) {
			ideaImageError.value = 'Images must be 5 MB or smaller.';
			return;
		}

		ideaSelectedImageFile.value = file;
		void syncIdeaImagePreview();
	};

	const removeIdeaImage = () => {
		ideaImageError.value = '';

		if (ideaImageMode.value === 'url') {
			ideaImageUrl.value = '';
			ideaImagePreviewUrl.value = '';
			return;
		}

		ideaSelectedImageFile.value = null;
		ideaExistingUploadImage.value = null;
		ideaImagePreviewUrl.value = '';
		ideaImageFileName.value = '';
		revokeIdeaPreviewObjectUrl();
	};

	const setPageError = (message: string) => {
		pageError.value = message;
	};

	const mergeBoardItem = (nextItem: BoardItemWithIdea) => {
		const index = boardItems.value.findIndex((item) => item.id === nextItem.id);

		if (index === -1) {
			boardItems.value = [...boardItems.value, nextItem];
			return;
		}

		boardItems.value = boardItems.value.map((item) => (item.id === nextItem.id ? nextItem : item));
	};

	const loadBoardData = async () => {
		if (!boardId.value) {
			return;
		}

		loadingBoard.value = true;
		pageError.value = '';

		try {
			const snapshot = await loadBoardSnapshot(boardId.value);
			board.value = snapshot.board;
			ideas.value = snapshot.ideas;
			boardItems.value = snapshot.boardItems;
			concepts.value = snapshot.concepts;
			selectedItemIds.value = selectedItemIds.value.filter((id) => snapshot.boardItems.some((item) => item.id === id));
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to load this board right now.';
		} finally {
			loadingBoard.value = false;
		}
	};

	const handleSaveIdea = async () => {
		pageError.value = '';

		if (!ideaTitle.value.trim()) {
			pageError.value = 'Ideas need a title.';
			return;
		}

		if (ideaImageError.value) {
			pageError.value = ideaImageError.value;
			return;
		}

		isSavingIdea.value = true;

		const existingIdea = editingIdeaId.value
			? ideas.value.find((idea) => idea.id === editingIdeaId.value) ?? null
			: null;
		const previousUploadImage = getBoardIdeaUploadImage(existingIdea?.metadata);
		let uploadedImageForRollback: BoardIdeaUploadImage | null = null;
		let uploadImageToDelete: BoardIdeaUploadImage | null = null;
		let nextImageUrl: string | null = null;
		let nextMetadata = withBoardIdeaUploadImage(existingIdea?.metadata, previousUploadImage);
		let nextUploadImage: BoardIdeaUploadImage | null = previousUploadImage;

		try {
			if (ideaImageMode.value === 'url') {
				nextImageUrl = ideaImageUrl.value.trim() || null;
				nextMetadata = withBoardIdeaUploadImage(existingIdea?.metadata, null);
				nextUploadImage = null;
				uploadImageToDelete = previousUploadImage;
			} else if (ideaSelectedImageFile.value) {
				if (!user.value?.id) {
					throw new Error('You need to be logged in to upload idea images.');
				}

				const uploadedImage = await uploadIdeaImage(ideaSelectedImageFile.value, user.value.id);
				uploadedImageForRollback = uploadedImage;
				nextImageUrl = null;
				nextMetadata = withBoardIdeaUploadImage(existingIdea?.metadata, uploadedImage);
				nextUploadImage = uploadedImage;
				uploadImageToDelete = previousUploadImage;
			} else if (ideaExistingUploadImage.value) {
				nextImageUrl = null;
				nextMetadata = withBoardIdeaUploadImage(existingIdea?.metadata, ideaExistingUploadImage.value);
				nextUploadImage = ideaExistingUploadImage.value;
			} else {
				nextImageUrl = null;
				nextMetadata = withBoardIdeaUploadImage(existingIdea?.metadata, null);
				nextUploadImage = null;
				uploadImageToDelete = previousUploadImage;
			}

			if (editingIdeaId.value) {
				const updatedIdea = await updateIdea(editingIdeaId.value, {
					title: ideaTitle.value,
					type: ideaType.value,
					description: ideaDescription.value,
					image_url: nextImageUrl,
					reference_url: ideaReferenceUrl.value,
					metadata: nextMetadata,
					notes: ideaNotes.value,
					tags: parseBoardTags(ideaTagsInput.value),
				});

				ideas.value = ideas.value.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea));
				boardItems.value = boardItems.value.map((item) =>
					item.idea_id === updatedIdea.id ? { ...item, idea: updatedIdea } : item
				);
			} else {
				const createdIdea = await createIdea({
					title: ideaTitle.value,
					type: ideaType.value,
					description: ideaDescription.value,
					image_url: nextImageUrl,
					reference_url: ideaReferenceUrl.value,
					metadata: nextMetadata,
					notes: ideaNotes.value,
					tags: parseBoardTags(ideaTagsInput.value),
				});

				ideas.value = [createdIdea, ...ideas.value];
			}

			uploadedImageForRollback = null;

			if (uploadImageToDelete && (!nextUploadImage || uploadImageToDelete.path !== nextUploadImage.path)) {
				try {
					await deleteIdeaImageUpload(uploadImageToDelete);
				} catch {
					pageError.value = 'Idea saved, but the previous uploaded image could not be cleaned up.';
				}
			}

			closeIdeaEditorModal();
		} catch (error) {
			if (uploadedImageForRollback) {
				try {
					await deleteIdeaImageUpload(uploadedImageForRollback);
				} catch {
					// Keep the original save error visible.
				}
			}

			pageError.value = error instanceof Error ? error.message : 'Unable to save that idea right now.';
		} finally {
			isSavingIdea.value = false;
		}
	};

	const handleDeleteIdea = async (idea: Idea) => {
		const confirmed = window.confirm(`Delete "${idea.title}" from your idea library? Any cards using it will also be removed from boards.`);

		if (!confirmed) {
			return;
		}

		pageError.value = '';

		const existingUploadImage = getBoardIdeaUploadImage(idea.metadata);

		try {
			await deleteIdea(idea.id);
			ideas.value = ideas.value.filter((entry) => entry.id !== idea.id);
			boardItems.value = boardItems.value.filter((item) => item.idea_id !== idea.id);
			selectedItemIds.value = selectedItemIds.value.filter((id) => boardItems.value.some((item) => item.id === id));

			if (editingIdeaId.value === idea.id) {
				closeIdeaEditorModal();
			}

			if (existingUploadImage) {
				try {
					await deleteIdeaImageUpload(existingUploadImage);
				} catch {
					pageError.value = 'Idea deleted, but its uploaded image could not be cleaned up.';
				}
			}
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to delete that idea right now.';
		}
	};

	const handleDeleteEditingIdea = async () => {
		if (!editingIdeaId.value) {
			pageError.value = 'Select an idea before deleting it.';
			return;
		}

		const currentIdea = ideas.value.find((idea) => idea.id === editingIdeaId.value);

		if (!currentIdea) {
			pageError.value = 'Unable to find that idea right now.';
			return;
		}

		await handleDeleteIdea(currentIdea);
	};

	const handlePlaceIdea = async (idea: Idea) => {
		pageError.value = '';

		if (!boardId.value) {
			pageError.value = 'Unable to place that idea because this board is unavailable.';
			return;
		}

		try {
			const offset = boardItems.value.length % 8;
			const createdItem = await addIdeaToBoard(boardId.value, idea.id, {
				height: ideaHasImage(idea) ? BOARD_IMAGE_CARD_HEIGHT : undefined,
				width: ideaHasImage(idea) ? BOARD_IMAGE_CARD_WIDTH : undefined,
				positionX: 80 + offset * 36,
				positionY: 80 + offset * 28,
				zIndex: nextZIndex.value,
			});

			boardItems.value = [...boardItems.value, createdItem];
			selectedItemIds.value = [createdItem.id];
			selectedCardTone.value = createdItem.style?.background ?? DEFAULT_BOARD_CARD_BACKGROUND;
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to place that idea on the board right now.';
		}
	};

	const selectBoardItems = (ids: string[]) => {
		selectedItemIds.value = ids;

		if (ids.length) {
			const firstItem = boardItems.value.find((item) => item.id === ids[0]);
			selectedCardTone.value = firstItem?.style?.background ?? DEFAULT_BOARD_CARD_BACKGROUND;
		}
	};

	const toggleSelection = (boardItemId: string, append: boolean) => {
		if (!append) {
			selectBoardItems([boardItemId]);
			return;
		}

		if (selectedItemIds.value.includes(boardItemId)) {
			selectedItemIds.value = selectedItemIds.value.filter((id) => id !== boardItemId);
			return;
		}

		selectBoardItems([...selectedItemIds.value, boardItemId]);
	};

	const selectConcept = (conceptId: string) => {
		selectBoardItems(
			boardItems.value
				.filter((item) => item.concept_id === conceptId)
				.map((item) => item.id)
		);
	};

	const handleCreateConcept = async () => {
		pageError.value = '';

		if (!selectedItemIds.value.length) {
			pageError.value = 'Select at least one card before creating a concept.';
			return;
		}

		if (!conceptTitle.value.trim()) {
			pageError.value = 'Give the concept a title first.';
			return;
		}

		if (!boardId.value) {
			pageError.value = 'Unable to create a concept because this board is unavailable.';
			return;
		}

		try {
			const createdConcept = await createConceptFromBoardItems(
				boardId.value,
				conceptTitle.value,
				selectedItemIds.value,
				conceptNotes.value
			);

			conceptTitle.value = '';
			conceptNotes.value = '';
			await loadBoardData();
			selectConcept(createdConcept.id);
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to create that concept right now.';
		}
	};

	const handleDuplicateConcept = async (concept: Concept) => {
		pageError.value = '';
		conceptBusyId.value = concept.id;

		try {
			const duplicated = await duplicateConcept(concept.id);
			await loadBoardData();
			selectConcept(duplicated.concept.id);
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to duplicate that concept right now.';
		} finally {
			conceptBusyId.value = null;
		}
	};

	const handleUngroupSelection = async () => {
		pageError.value = '';

		if (!selectedItemIds.value.length) {
			pageError.value = 'Select at least one card to ungroup.';
			return;
		}

		try {
			const updatedItems = await removeBoardItemsFromConcept(selectedItemIds.value);

			boardItems.value = boardItems.value.map((item) => {
				const nextItem = updatedItems.find((updated) => updated.id === item.id);
				return nextItem ?? item;
			});
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to ungroup the selected cards right now.';
		}
	};

	const handleDeleteSelection = async () => {
		if (!selectedItemIds.value.length) {
			return;
		}

		const confirmed = window.confirm('Delete the selected cards from this board?');

		if (!confirmed) {
			return;
		}

		pageError.value = '';

		try {
			await deleteBoardItems(selectedItemIds.value);
			boardItems.value = boardItems.value.filter((item) => !selectedItemIds.value.includes(item.id));
			selectedItemIds.value = [];
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to delete the selected cards right now.';
		}
	};

	const saveBoardItemPosition = async (boardItemId: string, input: { positionX: number; positionY: number; zIndex?: number }) => {
		return updateBoardItemPosition(boardItemId, input);
	};

	watch(ideaImageMode, () => {
		ideaImageError.value = '';
		void syncIdeaImagePreview();
	});

	watch(ideaImageUrl, () => {
		if (ideaImageMode.value === 'url') {
			ideaImagePreviewUrl.value = ideaImageUrl.value.trim();
		}
	});

	onBeforeUnmount(() => {
		revokeIdeaPreviewObjectUrl();
	});

	return {
		allTags,
		board,
		boardItems,
		boardReady,
		conceptBusyId,
		conceptItemCounts,
		conceptNotes,
		conceptTitle,
		editingIdeaId,
		editingBoardItemId,
		filteredIdeas,
		handleCreateConcept,
		handleDeleteIdea,
		handleDeleteEditingIdea,
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
		ideaReferenceUrl,
		ideaNotes,
		ideaTagsInput,
		ideaTitle,
		ideaType,
		isLibraryOpen,
		isIdeaEditorModalOpen,
		isRightRailOpen,
		isSavingIdea,
		ideaEditorModalTitle,
		leftColumnClass,
		libraryTagFilter,
		libraryTypeFilter,
		closeIdeaEditorModal,
		loadBoardData,
		loadingBoard,
		mergeBoardItem,
		nextZIndex,
		openIdeaEditorModalFromBoardItem,
		pageError,
		populateIdeaForm,
		removeIdeaImage,
		resetIdeaForm,
		saveBoardItemPosition,
		selectBoardItems,
		selectConcept,
		selectedBoardItems,
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
	};
}
