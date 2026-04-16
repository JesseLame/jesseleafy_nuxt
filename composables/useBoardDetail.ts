import { computed, onBeforeUnmount, ref, shallowRef, watch, type Ref } from 'vue';
import type {
	Board,
	BoardItemWithIdea,
	BoardIdeaUploadImage,
	BoardIdeaVideoReference,
	BoardRelation,
	Concept,
	Idea,
	IdeaMediaSource,
	IdeaType,
} from '~/types/board';
import { useBoardIdeaImages } from '~/composables/useBoardIdeaImages';
import { useBoardIdeaVideos } from '~/composables/useBoardIdeaVideos';
import {
	BOARD_IDEA_IMAGE_MAX_BYTES,
	BOARD_IMAGE_CARD_HEIGHT,
	BOARD_IMAGE_CARD_WIDTH,
	getBoardIdeaUploadFileName,
	getBoardIdeaUploadImage,
	ideaHasImage,
	ideaHasVisualMedia,
	withBoardIdeaUploadImage,
} from '~/utils/boardIdeaImages';
import {
	getBoardIdeaVideoReference,
	parseBoardIdeaVideoReferenceUrl,
	withBoardIdeaVideoReference,
} from '~/utils/boardIdeaVideos';
import {
	DEFAULT_BOARD_CARD_BACKGROUND,
	DEFAULT_BOARD_RELATION_KIND,
	type BoardCardBackground,
	isPromotedConceptIdea,
	parseBoardTags,
} from '~/utils/board';

type BoardWorkspaceSection = 'library' | 'selection' | 'links' | 'concepts';

export function useBoardDetail(boardId: Ref<string>) {
	const { user } = useAuth();
	const {
		addIdeaToBoard,
		createBoardRelation,
		createConceptFromBoardItems,
		createIdea,
		deleteBoardRelations,
		deleteBoardItems,
		deleteBoardRelation,
		deleteIdea,
		duplicateConcept,
		loadBoardSnapshot,
		removeBoardItemsFromConcept,
		updateBoardItemPosition,
		updateBoardRelation,
		updateIdea,
	} = useBoards();
	const { deleteIdeaImageUpload, importIdeaImageUrl, resolveIdeaImageUrl, uploadIdeaImage } = useBoardIdeaImages();
	const { clearResolvedIdeaVideoReference, resolveIdeaVideoReference } = useBoardIdeaVideos();

	const board = ref<Board | null>(null);
	const ideas = ref<Idea[]>([]);
	const boardItems = ref<BoardItemWithIdea[]>([]);
	const boardRelations = ref<BoardRelation[]>([]);
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
	const ideaVideoPreview = ref<BoardIdeaVideoReference | null>(null);
	const ideaNotes = ref('');
	const ideaTagsInput = ref('');
	const editingIdeaId = ref<string | null>(null);
	const editingBoardItemId = ref<string | null>(null);
	const isIdeaEditorModalOpen = ref(false);

	const ideaSelectedImageFile = shallowRef<File | null>(null);
	const ideaExistingUploadImage = ref<BoardIdeaUploadImage | null>(null);
	const ideaPreviewObjectUrl = ref<string | null>(null);
	const ideaVideoPreviewRequestId = ref(0);
	let ideaVideoPreviewTimer: ReturnType<typeof setTimeout> | null = null;

	const libraryTypeFilter = ref<'all' | IdeaType>('all');
	const libraryTagFilter = ref('');
	const conceptTitle = ref('');
	const conceptNotes = ref('');
	const relationLabel = ref('');
	const relationKind = ref(DEFAULT_BOARD_RELATION_KIND);
	const selectedItemIds = ref<string[]>([]);
	const selectedRelationIds = ref<string[]>([]);
	const selectedCardTone = ref<BoardCardBackground>(DEFAULT_BOARD_CARD_BACKGROUND);
	const isWorkspaceOpen = ref(true);
	const activeWorkspaceSection = ref<BoardWorkspaceSection>('library');
	const processedBoardUrlIdeaIds = new Set<string>();
	const migratingBoardUrlIdeaIds = new Set<string>();
	const processedBoardVideoIdeaIds = new Set<string>();
	const syncingBoardVideoIdeaIds = new Set<string>();

	const sortedBoardItems = computed(() =>
		[...boardItems.value].sort((left, right) => left.z_index - right.z_index)
	);

	const selectedBoardItems = computed(() =>
		boardItems.value.filter((item) => selectedItemIds.value.includes(item.id))
	);

	const selectedBoardRelation = computed(() => {
		if (selectedRelationIds.value.length !== 1) {
			return null;
		}

		return boardRelations.value.find((relation) => relation.id === selectedRelationIds.value[0]) ?? null;
	});

	const selectedItemCount = computed(() => selectedItemIds.value.length);

	const conceptItemCounts = computed(() => {
		return boardItems.value.reduce<Record<string, number>>((counts, item) => {
			if (item.concept_id && !isPromotedConceptIdea(item.idea)) {
				counts[item.concept_id] = (counts[item.concept_id] ?? 0) + 1;
			}

			return counts;
		}, {});
	});

	const visibleConcepts = computed(() =>
		concepts.value.filter((concept) => (conceptItemCounts.value[concept.id] ?? 0) > 0)
	);

	const relationSummary = computed(() => {
		const relation = selectedBoardRelation.value;

		if (!relation) {
			return '';
		}

		const sourceTitle = boardItems.value.find((item) => item.id === relation.source_board_item_id)?.idea?.title ?? 'Untitled card';
		const targetTitle = boardItems.value.find((item) => item.id === relation.target_board_item_id)?.idea?.title ?? 'Untitled card';

		return `${sourceTitle} -> ${targetTitle}`;
	});

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
	const canRemoveIdeaImage = computed(() => {
		if (ideaImageMode.value === 'url') {
			return Boolean(ideaImageUrl.value.trim());
		}

		return Boolean(ideaSelectedImageFile.value || ideaExistingUploadImage.value);
	});

	const ideaPreviewMedia = computed<IdeaMediaSource | null>(() => {
		const referenceUrl = ideaReferenceUrl.value.trim() || null;
		const previewImageUrl = ideaImageMode.value === 'url'
			? ideaImagePreviewUrl.value.trim() || ideaImageUrl.value.trim() || null
			: ideaSelectedImageFile.value
				? ideaImagePreviewUrl.value.trim() || null
				: null;
		const previewUploadImage = ideaImageMode.value === 'upload' && !ideaSelectedImageFile.value
			? ideaExistingUploadImage.value
			: null;
		const metadata = withBoardIdeaVideoReference(
			withBoardIdeaUploadImage({}, previewUploadImage),
			ideaVideoPreview.value
		);

		if (!previewImageUrl && !previewUploadImage && !referenceUrl && !ideaVideoPreview.value) {
			return null;
		}

		return {
			title: ideaTitle.value.trim() || 'Idea preview',
			image_url: previewImageUrl,
			reference_url: referenceUrl,
			metadata,
		};
	});

	const ideaEditorModalTitle = computed(() => {
		if (editingIdeaId.value) {
			return ideaTitle.value.trim() ? `Edit "${ideaTitle.value.trim()}"` : 'Edit idea';
		}

		return 'Edit idea';
	});

	const revokeIdeaPreviewObjectUrl = () => {
		if (ideaPreviewObjectUrl.value?.startsWith('blob:')) {
			URL.revokeObjectURL(ideaPreviewObjectUrl.value);
		}

		ideaPreviewObjectUrl.value = null;
	};

	const clearIdeaVideoPreviewTimer = () => {
		if (!ideaVideoPreviewTimer) {
			return;
		}

		clearTimeout(ideaVideoPreviewTimer);
		ideaVideoPreviewTimer = null;
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

	const syncIdeaVideoPreview = async (referenceUrl: string) => {
		const trimmedReferenceUrl = referenceUrl.trim();
		const parsedReference = parseBoardIdeaVideoReferenceUrl(trimmedReferenceUrl);

		ideaVideoPreviewRequestId.value += 1;
		const activeRequestId = ideaVideoPreviewRequestId.value;

		if (!parsedReference) {
			ideaVideoPreview.value = null;
			return;
		}

		try {
			const resolvedVideoReference = await resolveIdeaVideoReference(trimmedReferenceUrl);

			if (activeRequestId !== ideaVideoPreviewRequestId.value) {
				return;
			}

			ideaVideoPreview.value = resolvedVideoReference;
		} catch {
			if (activeRequestId !== ideaVideoPreviewRequestId.value) {
				return;
			}

			clearResolvedIdeaVideoReference(trimmedReferenceUrl);
			ideaVideoPreview.value = null;
		}
	};

	const queueIdeaVideoPreviewSync = () => {
		clearIdeaVideoPreviewTimer();

		const trimmedReferenceUrl = ideaReferenceUrl.value.trim();

		if (!trimmedReferenceUrl || !parseBoardIdeaVideoReferenceUrl(trimmedReferenceUrl)) {
			ideaVideoPreview.value = null;
			return;
		}

		ideaVideoPreviewTimer = setTimeout(() => {
			void syncIdeaVideoPreview(trimmedReferenceUrl);
		}, 250);
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
		ideaVideoPreview.value = null;
		ideaNotes.value = '';
		ideaTagsInput.value = '';
		ideaSelectedImageFile.value = null;
		ideaExistingUploadImage.value = null;
		clearIdeaVideoPreviewTimer();
		revokeIdeaPreviewObjectUrl();
	};

	const setActiveWorkspaceSection = (section: BoardWorkspaceSection) => {
		activeWorkspaceSection.value = section;
	};

	const openWorkspace = () => {
		isWorkspaceOpen.value = true;
	};

	const toggleWorkspace = () => {
		isWorkspaceOpen.value = !isWorkspaceOpen.value;
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
		ideaVideoPreview.value = getBoardIdeaVideoReference(idea.metadata);
		ideaSelectedImageFile.value = null;
		ideaExistingUploadImage.value = getBoardIdeaUploadImage(idea.metadata);
		ideaImageMode.value = ideaExistingUploadImage.value ? 'upload' : 'url';
		openWorkspace();
		setActiveWorkspaceSection('library');
		void syncIdeaImagePreview();
		queueIdeaVideoPreviewSync();
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
			queueIdeaVideoPreviewSync();
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
		queueIdeaVideoPreviewSync();
	};

	const removeIdeaImage = () => {
		ideaImageError.value = '';

		if (ideaImageMode.value === 'url') {
			ideaImageUrl.value = '';
			ideaImagePreviewUrl.value = '';
			queueIdeaVideoPreviewSync();
			return;
		}

		ideaSelectedImageFile.value = null;
		ideaExistingUploadImage.value = null;
		ideaImagePreviewUrl.value = '';
		ideaImageFileName.value = '';
		revokeIdeaPreviewObjectUrl();
		queueIdeaVideoPreviewSync();
	};

	const setPageError = (message: string) => {
		pageError.value = message;
	};

	const syncIdeaAcrossState = (nextIdea: Idea) => {
		ideas.value = ideas.value.map((idea) => (idea.id === nextIdea.id ? nextIdea : idea));
		boardItems.value = boardItems.value.map((item) =>
			item.idea_id === nextIdea.id ? { ...item, idea: nextIdea } : item
		);
	};

	const saveIdeaWithImportedImage = async (idea: Idea, boardImage: BoardIdeaUploadImage) => {
		const updatedIdea = await updateIdea(idea.id, {
			title: idea.title,
			type: idea.type,
			description: idea.description,
			image_url: null,
			reference_url: idea.reference_url,
			metadata: withBoardIdeaUploadImage(idea.metadata, boardImage),
			notes: idea.notes,
			tags: idea.tags,
		});

		syncIdeaAcrossState(updatedIdea);
		return updatedIdea;
	};

	const syncIdeaVideoReferenceAcrossState = (nextIdea: Idea) => {
		syncIdeaAcrossState(nextIdea);
		processedBoardVideoIdeaIds.add(nextIdea.id);
	};

	const autoSyncBoardIdeaVideoReferences = async () => {
		for (const idea of ideas.value) {
			const trimmedReferenceUrl = idea.reference_url?.trim();

			if (!trimmedReferenceUrl || ideaHasImage(idea)) {
				continue;
			}

			const parsedReference = parseBoardIdeaVideoReferenceUrl(trimmedReferenceUrl);

			if (!parsedReference) {
				continue;
			}

			const storedVideoReference = getBoardIdeaVideoReference(idea.metadata);

			if (
				storedVideoReference
				&& storedVideoReference.provider === parsedReference.provider
				&& storedVideoReference.videoId === parsedReference.videoId
			) {
				processedBoardVideoIdeaIds.add(idea.id);
				continue;
			}

			if (processedBoardVideoIdeaIds.has(idea.id) || syncingBoardVideoIdeaIds.has(idea.id)) {
				continue;
			}

			syncingBoardVideoIdeaIds.add(idea.id);

			try {
				const resolvedVideoReference = await resolveIdeaVideoReference(trimmedReferenceUrl);

				if (!resolvedVideoReference) {
					processedBoardVideoIdeaIds.add(idea.id);
					continue;
				}

				const updatedIdea = await updateIdea(idea.id, {
					title: idea.title,
					type: idea.type,
					description: idea.description,
					image_url: idea.image_url,
					reference_url: idea.reference_url,
					metadata: withBoardIdeaVideoReference(idea.metadata, resolvedVideoReference),
					notes: idea.notes,
					tags: idea.tags,
				});

				syncIdeaVideoReferenceAcrossState(updatedIdea);
			} catch {
				processedBoardVideoIdeaIds.add(idea.id);
			} finally {
				syncingBoardVideoIdeaIds.delete(idea.id);
			}
		}
	};

	const autoMigrateBoardIdeaImages = async () => {
		const uniqueIdeas = [...new Map(
			boardItems.value
				.map((item) => item.idea)
				.filter((idea): idea is Idea => Boolean(idea))
				.map((idea) => [idea.id, idea])
		).values()];

		for (const idea of uniqueIdeas) {
			const directUrl = idea.image_url?.trim();

			if (!directUrl || getBoardIdeaUploadImage(idea.metadata)) {
				continue;
			}

			if (processedBoardUrlIdeaIds.has(idea.id) || migratingBoardUrlIdeaIds.has(idea.id)) {
				continue;
			}

			migratingBoardUrlIdeaIds.add(idea.id);

			try {
				const boardImage = await importIdeaImageUrl(directUrl);
				try {
					await saveIdeaWithImportedImage(idea, boardImage);
				} catch {
					try {
						await deleteIdeaImageUpload(boardImage);
					} catch {
						// Keep the current direct URL if cleanup fails.
					}

					throw new Error('Unable to migrate that idea image right now.');
				}
			} catch {
				// Leave the direct URL in place if background migration fails.
			} finally {
				migratingBoardUrlIdeaIds.delete(idea.id);
				processedBoardUrlIdeaIds.add(idea.id);
			}
		}
	};

	const mergeBoardItem = (nextItem: BoardItemWithIdea) => {
		const index = boardItems.value.findIndex((item) => item.id === nextItem.id);

		if (index === -1) {
			boardItems.value = [...boardItems.value, nextItem];
			return;
		}

		boardItems.value = boardItems.value.map((item) => (item.id === nextItem.id ? nextItem : item));
	};

	const mergeBoardRelation = (nextRelation: BoardRelation) => {
		const index = boardRelations.value.findIndex((relation) => relation.id === nextRelation.id);

		if (index === -1) {
			boardRelations.value = [...boardRelations.value, nextRelation];
			return;
		}

		boardRelations.value = boardRelations.value.map((relation) =>
			relation.id === nextRelation.id ? nextRelation : relation
		);
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
			boardRelations.value = snapshot.boardRelations;
			concepts.value = snapshot.concepts;
			selectedItemIds.value = selectedItemIds.value.filter((id) => snapshot.boardItems.some((item) => item.id === id));
			selectedRelationIds.value = selectedRelationIds.value.filter((id) =>
				snapshot.boardRelations.some((relation) => relation.id === id)
			);
			void autoMigrateBoardIdeaImages();
			void autoSyncBoardIdeaVideoReferences();
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
		let nextVideoReference: BoardIdeaVideoReference | null = null;

		try {
			if (ideaImageMode.value === 'url') {
				const directImageUrl = ideaImageUrl.value.trim();

				if (directImageUrl) {
					const importedImage = await importIdeaImageUrl(directImageUrl);
					uploadedImageForRollback = importedImage;
					nextImageUrl = null;
					nextMetadata = withBoardIdeaUploadImage(existingIdea?.metadata, importedImage);
					nextUploadImage = importedImage;
					uploadImageToDelete = previousUploadImage;
				} else {
					nextImageUrl = null;
					nextMetadata = withBoardIdeaUploadImage(existingIdea?.metadata, null);
					nextUploadImage = null;
					uploadImageToDelete = previousUploadImage;
				}
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

			const trimmedReferenceUrl = ideaReferenceUrl.value.trim();
			const parsedVideoReference = parseBoardIdeaVideoReferenceUrl(trimmedReferenceUrl);

			if (parsedVideoReference) {
				if (
					ideaVideoPreview.value
					&& ideaVideoPreview.value.provider === parsedVideoReference.provider
					&& ideaVideoPreview.value.videoId === parsedVideoReference.videoId
				) {
					nextVideoReference = ideaVideoPreview.value;
				} else {
					try {
						nextVideoReference = await resolveIdeaVideoReference(trimmedReferenceUrl);
					} catch {
						clearResolvedIdeaVideoReference(trimmedReferenceUrl);
						nextVideoReference = null;
					}
				}
			}

			nextMetadata = withBoardIdeaVideoReference(nextMetadata, nextVideoReference);

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

				syncIdeaAcrossState(updatedIdea);
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
			const removedBoardItemIds = boardItems.value
				.filter((item) => item.idea_id === idea.id)
				.map((item) => item.id);
			ideas.value = ideas.value.filter((entry) => entry.id !== idea.id);
			boardItems.value = boardItems.value.filter((item) => item.idea_id !== idea.id);
			boardRelations.value = boardRelations.value.filter(
				(relation) =>
					!removedBoardItemIds.includes(relation.source_board_item_id)
					&& !removedBoardItemIds.includes(relation.target_board_item_id)
			);
			selectedItemIds.value = selectedItemIds.value.filter((id) => boardItems.value.some((item) => item.id === id));
			selectedRelationIds.value = selectedRelationIds.value.filter((id) =>
				boardRelations.value.some((relation) => relation.id === id)
			);

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

	const handleRemoveEditingBoardItem = async () => {
		if (!editingBoardItemId.value) {
			pageError.value = 'Select a card before removing it from the board.';
			return;
		}

		const currentBoardItem = boardItems.value.find((item) => item.id === editingBoardItemId.value);
		const ideaTitle = currentBoardItem?.idea?.title || 'this idea';
		const confirmed = window.confirm(`Remove "${ideaTitle}" from this board? The idea will stay in your library.`);

		if (!confirmed) {
			return;
		}

		pageError.value = '';

		try {
			const removedBoardItemId = editingBoardItemId.value;
			await deleteBoardItems([removedBoardItemId]);
			boardItems.value = boardItems.value.filter((item) => item.id !== removedBoardItemId);
			boardRelations.value = boardRelations.value.filter(
				(relation) =>
					relation.source_board_item_id !== removedBoardItemId
					&& relation.target_board_item_id !== removedBoardItemId
			);
			selectedItemIds.value = selectedItemIds.value.filter((id) => id !== removedBoardItemId);
			selectedRelationIds.value = selectedRelationIds.value.filter((id) =>
				boardRelations.value.some((relation) => relation.id === id)
			);
			closeIdeaEditorModal();
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to remove that card from the board right now.';
		}
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
				height: ideaHasVisualMedia(idea) ? BOARD_IMAGE_CARD_HEIGHT : undefined,
				width: ideaHasVisualMedia(idea) ? BOARD_IMAGE_CARD_WIDTH : undefined,
				positionX: 80 + offset * 36,
				positionY: 80 + offset * 28,
				zIndex: nextZIndex.value,
			});

			boardItems.value = [...boardItems.value, createdItem];
			selectedItemIds.value = [createdItem.id];
			selectedRelationIds.value = [];
			selectedCardTone.value = createdItem.style?.background ?? DEFAULT_BOARD_CARD_BACKGROUND;
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to place that idea on the board right now.';
		}
	};

	const selectBoardItems = (ids: string[]) => {
		selectedItemIds.value = ids;
		selectedRelationIds.value = [];

		if (ids.length) {
			const firstItem = boardItems.value.find((item) => item.id === ids[0]);
			selectedCardTone.value = firstItem?.style?.background ?? DEFAULT_BOARD_CARD_BACKGROUND;
		}
	};

	const selectBoardRelations = (ids: string[]) => {
		selectedRelationIds.value = ids;

		if (ids.length) {
			selectedItemIds.value = [];
		}
	};

	const syncSelectedRelationDraft = (relation: BoardRelation | null) => {
		relationLabel.value = relation?.label ?? '';
		relationKind.value = relation?.kind ?? DEFAULT_BOARD_RELATION_KIND;
	};

	const beginRelationEditing = (relationId: string) => {
		const relation = boardRelations.value.find((candidate) => candidate.id === relationId) ?? null;

		if (!relation) {
			return;
		}

		selectBoardRelations([relation.id]);
		syncSelectedRelationDraft(relation);
		openWorkspace();
		setActiveWorkspaceSection('links');
	};

	const resetSelectedRelationDraft = () => {
		syncSelectedRelationDraft(selectedBoardRelation.value);
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
			setActiveWorkspaceSection('concepts');
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
			setActiveWorkspaceSection('concepts');
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to duplicate that concept right now.';
		} finally {
			conceptBusyId.value = null;
		}
	};

	const handleUngroupSelection = async () => {
		pageError.value = '';

		if (!selectedItemIds.value.length || !selectionConceptId.value) {
			pageError.value = 'Select at least one card to ungroup.';
			return;
		}

		try {
			const summaryBoardItemIds = boardItems.value
				.filter((item) => item.concept_id === selectionConceptId.value && isPromotedConceptIdea(item.idea))
				.map((item) => item.id);
			const boardItemIdsToUngroup = [...new Set([...selectedItemIds.value, ...summaryBoardItemIds])];
			const relationIdsToDelete = boardRelations.value
				.filter((relation) =>
					relation.kind === 'groups'
					&& relation.metadata?.generatedBy === 'concept-summary'
					&& relation.metadata?.conceptId === selectionConceptId.value
				)
				.map((relation) => relation.id);
			const updatedItems = await removeBoardItemsFromConcept(boardItemIdsToUngroup);

			if (relationIdsToDelete.length) {
				await deleteBoardRelations(relationIdsToDelete);
				boardRelations.value = boardRelations.value.filter((relation) => !relationIdsToDelete.includes(relation.id));
			}

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
			const removedItemIds = [...selectedItemIds.value];
			boardItems.value = boardItems.value.filter((item) => !selectedItemIds.value.includes(item.id));
			boardRelations.value = boardRelations.value.filter(
				(relation) =>
					!removedItemIds.includes(relation.source_board_item_id)
					&& !removedItemIds.includes(relation.target_board_item_id)
			);
			selectedItemIds.value = [];
			selectedRelationIds.value = selectedRelationIds.value.filter((id) =>
				boardRelations.value.some((relation) => relation.id === id)
			);
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to delete the selected cards right now.';
		}
	};

	const saveBoardItemPosition = async (
		boardItemId: string,
		input: { positionX: number; positionY: number; width?: number; height?: number; zIndex?: number }
	) => {
		return updateBoardItemPosition(boardItemId, input);
	};

	const handleCanvasSelectionChange = (payload: { itemIds: string[]; relationIds: string[] }) => {
		if (payload.relationIds.length) {
			selectBoardRelations(payload.relationIds);
			return;
		}

		selectedRelationIds.value = [];
		selectedItemIds.value = payload.itemIds;

		if (payload.itemIds.length) {
			const firstItem = boardItems.value.find((item) => item.id === payload.itemIds[0]);
			selectedCardTone.value = firstItem?.style?.background ?? DEFAULT_BOARD_CARD_BACKGROUND;
		}
	};

	const handleBoardItemsMoved = async (payload: Array<{ itemId: string; positionX: number; positionY: number }>) => {
		pageError.value = '';

		const uniquePayload = payload.filter(
			(entry, index, allEntries) => allEntries.findIndex((candidate) => candidate.itemId === entry.itemId) === index
		);

		for (const entry of uniquePayload) {
			const currentItem = boardItems.value.find((item) => item.id === entry.itemId);

			if (!currentItem) {
				continue;
			}

			mergeBoardItem({
				...currentItem,
				position_x: entry.positionX,
				position_y: entry.positionY,
			});
		}

		try {
			const updatedItems = await Promise.all(
				uniquePayload.map((entry) =>
					saveBoardItemPosition(entry.itemId, {
						positionX: entry.positionX,
						positionY: entry.positionY,
					})
				)
			);

			updatedItems.forEach(mergeBoardItem);
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to save those card positions right now.';
			await loadBoardData();
		}
	};

	const handleBoardItemResizeEnd = async (payload: { itemId: string; width: number; height: number }) => {
		pageError.value = '';

		const currentItem = boardItems.value.find((item) => item.id === payload.itemId);

		if (!currentItem) {
			return;
		}

		mergeBoardItem({
			...currentItem,
			width: payload.width,
			height: payload.height,
		});

		try {
			const updatedItem = await saveBoardItemPosition(payload.itemId, {
				positionX: currentItem.position_x,
				positionY: currentItem.position_y,
				width: payload.width,
				height: payload.height,
			});

			mergeBoardItem(updatedItem);
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to save that card size right now.';
			await loadBoardData();
		}
	};

	const handleCreateRelationFromCanvas = async (input: { source: string | null; target: string | null }) => {
		pageError.value = '';

		if (!boardId.value) {
			pageError.value = 'Unable to create a relation because this board is unavailable.';
			return;
		}

		if (!input.source || !input.target) {
			pageError.value = 'Choose both cards before creating a relation.';
			return;
		}

		if (input.source === input.target) {
			pageError.value = 'A card cannot link to itself.';
			return;
		}

		const existingRelation = boardRelations.value.find(
			(relation) =>
				relation.source_board_item_id === input.source && relation.target_board_item_id === input.target
		);

		if (existingRelation) {
			selectBoardRelations([existingRelation.id]);
			return;
		}

		try {
			const createdRelation = await createBoardRelation(boardId.value, {
				source_board_item_id: input.source,
				target_board_item_id: input.target,
				kind: relationKind.value,
				label: relationLabel.value,
			});

			mergeBoardRelation(createdRelation);
			selectBoardRelations([createdRelation.id]);
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to create that relation right now.';
		}
	};

	const handleSaveSelectedRelation = async () => {
		pageError.value = '';

		if (!selectedBoardRelation.value) {
			pageError.value = 'Select a relation before saving it.';
			return;
		}

		try {
			const updatedRelation = await updateBoardRelation(selectedBoardRelation.value.id, {
				label: relationLabel.value,
				kind: relationKind.value,
				metadata: selectedBoardRelation.value.metadata,
			});

			mergeBoardRelation(updatedRelation);
			selectBoardRelations([updatedRelation.id]);
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to save that relation right now.';
		}
	};

	const handleDeleteSelectedRelation = async () => {
		pageError.value = '';

		if (!selectedBoardRelation.value) {
			return;
		}

		try {
			await deleteBoardRelation(selectedBoardRelation.value.id);
			boardRelations.value = boardRelations.value.filter((relation) => relation.id !== selectedBoardRelation.value?.id);
			selectedRelationIds.value = [];
		} catch (error) {
			pageError.value = error instanceof Error ? error.message : 'Unable to delete that relation right now.';
		}
	};

	watch(ideaImageMode, () => {
		ideaImageError.value = '';
		void syncIdeaImagePreview();
		queueIdeaVideoPreviewSync();
	});

	watch(ideaImageUrl, () => {
		if (ideaImageMode.value === 'url') {
			ideaImagePreviewUrl.value = ideaImageUrl.value.trim();
		}

		queueIdeaVideoPreviewSync();
	});

	watch(ideaReferenceUrl, () => {
		queueIdeaVideoPreviewSync();
	});

	watch(
		selectedItemIds,
		(ids) => {
			if (ids.length) {
				openWorkspace();

				if (!selectedBoardRelation.value) {
					setActiveWorkspaceSection('selection');
				}

				return;
			}

			if (!selectedBoardRelation.value && activeWorkspaceSection.value === 'selection') {
				setActiveWorkspaceSection('library');
			}
		},
		{ deep: true }
	);

	watch(
		selectedBoardRelation,
		(relation) => {
			syncSelectedRelationDraft(relation);

			if (relation) {
				openWorkspace();
				setActiveWorkspaceSection('links');
				return;
			}

			if (!selectedItemIds.value.length && activeWorkspaceSection.value === 'links') {
				setActiveWorkspaceSection('library');
			}
		},
		{ immediate: true }
	);

	onBeforeUnmount(() => {
		clearIdeaVideoPreviewTimer();
		revokeIdeaPreviewObjectUrl();
	});

	return {
		allTags,
		board,
		boardItems,
		boardRelations,
		boardReady,
		beginRelationEditing,
		conceptBusyId,
		conceptItemCounts,
		conceptNotes,
		conceptTitle,
		editingIdeaId,
		editingBoardItemId,
		filteredIdeas,
		handleBoardItemResizeEnd,
		handleBoardItemsMoved,
		handleCanvasSelectionChange,
		handleCreateRelationFromCanvas,
		handleCreateConcept,
		handleDeleteIdea,
		handleDeleteEditingIdea,
		handleRemoveEditingBoardItem,
		handleDeleteSelection,
		handleDeleteSelectedRelation,
		handleDuplicateConcept,
		handleIdeaImageFileSelected,
		handlePlaceIdea,
		handleSaveIdea,
		handleSaveSelectedRelation,
		handleUngroupSelection,
		canRemoveIdeaImage,
		ideaDescription,
		ideaImageError,
		ideaImageFileName,
		ideaImageMode,
		ideaImagePreviewUrl,
		ideaImageUrl,
		ideaPreviewMedia,
		ideaReferenceUrl,
		ideaNotes,
		ideaTagsInput,
		ideaTitle,
		ideaType,
		isIdeaEditorModalOpen,
		isWorkspaceOpen,
		isSavingIdea,
		ideaEditorModalTitle,
		activeWorkspaceSection,
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
		relationKind,
		relationLabel,
		relationSummary,
		resetSelectedRelationDraft,
		resetIdeaForm,
		saveBoardItemPosition,
		setActiveWorkspaceSection,
		selectBoardItems,
		selectBoardRelations,
		selectConcept,
		selectedBoardItems,
		selectedCardTone,
		selectedItemCount,
		selectedItemIds,
		selectedBoardRelation,
		selectedRelationIds,
		selectionConceptId,
		setPageError,
		sortedBoardItems,
		openWorkspace,
		toggleWorkspace,
		toggleSelection,
		visibleConcepts,
	};
}
