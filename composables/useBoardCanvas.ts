import { onBeforeUnmount, onMounted, ref, type ComputedRef, type Ref } from 'vue';
import type { BoardItemWithIdea } from '~/types/board';

type DragState = {
	itemId: string;
	pointerId: number;
	startClientX: number;
	startClientY: number;
	startPositionX: number;
	startPositionY: number;
	zIndex: number;
};

type UseBoardCanvasOptions = {
	boardItems: Ref<BoardItemWithIdea[]>;
	selectedItemIds: Ref<string[]>;
	nextZIndex: ComputedRef<number>;
	mergeBoardItem: (item: BoardItemWithIdea) => void;
	selectBoardItems: (ids: string[]) => void;
	toggleSelection: (boardItemId: string, append: boolean) => void;
	saveBoardItemPosition: (
		boardItemId: string,
		input: { positionX: number; positionY: number; zIndex?: number }
	) => Promise<BoardItemWithIdea>;
	setPageError: (message: string) => void;
};

export function useBoardCanvas({
	boardItems,
	selectedItemIds,
	nextZIndex,
	mergeBoardItem,
	selectBoardItems,
	toggleSelection,
	saveBoardItemPosition,
	setPageError,
}: UseBoardCanvasOptions) {
	const dragState = ref<DragState | null>(null);

	const handleCanvasCardPointerDown = (event: PointerEvent, item: BoardItemWithIdea) => {
		if (event.button !== 0) {
			return;
		}

		if (event.shiftKey) {
			toggleSelection(item.id, true);
			return;
		}

		if (!selectedItemIds.value.includes(item.id)) {
			selectBoardItems([item.id]);
		}

		const zIndex = nextZIndex.value;
		mergeBoardItem({ ...item, z_index: zIndex });

		dragState.value = {
			itemId: item.id,
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startPositionX: item.position_x,
			startPositionY: item.position_y,
			zIndex,
		};

		event.preventDefault();
	};

	const handleWindowPointerMove = (event: PointerEvent) => {
		if (!dragState.value || event.pointerId !== dragState.value.pointerId) {
			return;
		}

		const activeItem = boardItems.value.find((item) => item.id === dragState.value?.itemId);

		if (!activeItem) {
			return;
		}

		const deltaX = event.clientX - dragState.value.startClientX;
		const deltaY = event.clientY - dragState.value.startClientY;
		const nextPositionX = Math.max(0, dragState.value.startPositionX + deltaX);
		const nextPositionY = Math.max(0, dragState.value.startPositionY + deltaY);

		mergeBoardItem({
			...activeItem,
			position_x: nextPositionX,
			position_y: nextPositionY,
			z_index: dragState.value.zIndex,
		});
	};

	const handleWindowPointerUp = async (event: PointerEvent) => {
		if (!dragState.value || event.pointerId !== dragState.value.pointerId) {
			return;
		}

		const activeDrag = dragState.value;
		dragState.value = null;

		const finalItem = boardItems.value.find((item) => item.id === activeDrag.itemId);

		if (!finalItem) {
			return;
		}

		try {
			const savedItem = await saveBoardItemPosition(activeDrag.itemId, {
				positionX: finalItem.position_x,
				positionY: finalItem.position_y,
				zIndex: finalItem.z_index,
			});

			mergeBoardItem(savedItem);
		} catch (error) {
			setPageError(error instanceof Error ? error.message : 'Unable to save that card position right now.');
		}
	};

	onMounted(() => {
		window.addEventListener('pointermove', handleWindowPointerMove);
		window.addEventListener('pointerup', handleWindowPointerUp);
	});

	onBeforeUnmount(() => {
		window.removeEventListener('pointermove', handleWindowPointerMove);
		window.removeEventListener('pointerup', handleWindowPointerUp);
	});

	return {
		handleCanvasCardPointerDown,
	};
}
