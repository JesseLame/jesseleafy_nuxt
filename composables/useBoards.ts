import type { SupabaseClient, User } from '@supabase/supabase-js';
import type {
	Board,
	BoardInput,
	BoardItemStyle,
	BoardItemWithIdea,
	BoardRelation,
	BoardRelationInput,
	BoardSnapshot,
	Concept,
	Idea,
	IdeaInput,
} from '~/types/board';

type RawBoardItemRecord = Omit<BoardItemWithIdea, 'idea'> & {
	idea: Idea | Idea[] | null;
};

const DEFAULT_CARD_STYLE: BoardItemStyle = {
	background: 'paper',
	borderAccent: 'green',
};

const DEFAULT_RELATION_KIND = 'related';

export function useBoards() {
	const { user } = useAuth();
	const supabase = import.meta.client ? (useNuxtApp().$supabase as SupabaseClient | null) : null;

	const requireSupabase = () => {
		if (!supabase) {
			throw new Error('Boards are unavailable because Supabase is not configured.');
		}

		return supabase;
	};

	const requireUser = (): User => {
		if (!user.value) {
			throw new Error('You need to be logged in to use boards.');
		}

		return user.value;
	};

	const normalizeIdea = (idea: Idea): Idea => ({
		...idea,
		reference_url: idea.reference_url?.trim() || null,
		tags: Array.isArray(idea.tags) ? idea.tags.filter(Boolean) : [],
		metadata: idea.metadata ?? {},
	});

	const normalizeBoardItem = (record: RawBoardItemRecord): BoardItemWithIdea => {
		const relatedIdea = Array.isArray(record.idea) ? record.idea[0] ?? null : record.idea;

		return {
			...record,
			position_x: Number(record.position_x ?? 0),
			position_y: Number(record.position_y ?? 0),
			width: Number(record.width ?? 260),
			height: Number(record.height ?? 160),
			z_index: Number(record.z_index ?? 1),
			style: record.style ?? DEFAULT_CARD_STYLE,
			idea: relatedIdea ? normalizeIdea(relatedIdea) : null,
		};
	};

	const normalizeBoardRelation = (relation: BoardRelation): BoardRelation => ({
		...relation,
		label: relation.label?.trim() || null,
		kind: relation.kind?.trim() || DEFAULT_RELATION_KIND,
		metadata: relation.metadata ?? {},
	});

	const listBoards = async (): Promise<Board[]> => {
		const client = requireSupabase();

		const { data, error } = await client
			.from('boards')
			.select('*')
			.order('updated_at', { ascending: false });

		if (error) {
			throw error;
		}

		return (data ?? []) as Board[];
	};

	const getBoard = async (boardId: string): Promise<Board | null> => {
		const client = requireSupabase();

		const { data, error } = await client
			.from('boards')
			.select('*')
			.eq('id', boardId)
			.maybeSingle();

		if (error) {
			throw error;
		}

		return (data as Board | null) ?? null;
	};

	const createBoard = async (input: BoardInput): Promise<Board> => {
		const client = requireSupabase();
		const currentUser = requireUser();

		const { data, error } = await client
			.from('boards')
			.insert([
				{
					owner_user_id: currentUser.id,
					title: input.title.trim(),
					description: input.description?.trim() || null,
				},
			])
			.select('*')
			.single();

		if (error) {
			throw error;
		}

		return data as Board;
	};

	const listIdeas = async (): Promise<Idea[]> => {
		const client = requireSupabase();

		const { data, error } = await client
			.from('ideas')
			.select('*')
			.order('updated_at', { ascending: false });

		if (error) {
			throw error;
		}

		return ((data ?? []) as Idea[]).map(normalizeIdea);
	};

	const createIdea = async (input: IdeaInput): Promise<Idea> => {
		const client = requireSupabase();
		const currentUser = requireUser();

		const { data, error } = await client
			.from('ideas')
			.insert([
				{
					owner_user_id: currentUser.id,
					title: input.title.trim(),
					type: input.type,
					description: input.description?.trim() || null,
					image_url: input.image_url?.trim() || null,
					reference_url: input.reference_url?.trim() || null,
					notes: input.notes?.trim() || null,
					tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
					metadata: input.metadata ?? {},
				},
			])
			.select('*')
			.single();

		if (error) {
			throw error;
		}

		return normalizeIdea(data as Idea);
	};

	const updateIdea = async (ideaId: string, input: IdeaInput): Promise<Idea> => {
		const client = requireSupabase();

		const { data, error } = await client
			.from('ideas')
			.update({
				title: input.title.trim(),
				type: input.type,
				description: input.description?.trim() || null,
				image_url: input.image_url?.trim() || null,
				reference_url: input.reference_url?.trim() || null,
				notes: input.notes?.trim() || null,
				tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
				metadata: input.metadata ?? {},
				updated_at: new Date().toISOString(),
			})
			.eq('id', ideaId)
			.select('*')
			.single();

		if (error) {
			throw error;
		}

		return normalizeIdea(data as Idea);
	};

	const deleteIdea = async (ideaId: string) => {
		const client = requireSupabase();

		const { error } = await client
			.from('ideas')
			.delete()
			.eq('id', ideaId);

		if (error) {
			throw error;
		}
	};

	const listBoardItems = async (boardId: string): Promise<BoardItemWithIdea[]> => {
		const client = requireSupabase();

		const { data, error } = await client
			.from('board_items')
			.select('*, idea:ideas(*)')
			.eq('board_id', boardId)
			.order('z_index', { ascending: true })
			.order('created_at', { ascending: true });

		if (error) {
			throw error;
		}

		return ((data ?? []) as RawBoardItemRecord[]).map(normalizeBoardItem);
	};

	const addIdeaToBoard = async (
		boardId: string,
		ideaId: string,
		options?: {
			positionX?: number;
			positionY?: number;
			width?: number;
			height?: number;
			style?: BoardItemStyle;
			zIndex?: number;
		}
	): Promise<BoardItemWithIdea> => {
		const client = requireSupabase();
		const currentUser = requireUser();

		const { data, error } = await client
			.from('board_items')
			.insert([
				{
					owner_user_id: currentUser.id,
					board_id: boardId,
					idea_id: ideaId,
					position_x: options?.positionX ?? 80,
					position_y: options?.positionY ?? 80,
					width: options?.width ?? 260,
					height: options?.height ?? 160,
					z_index: options?.zIndex ?? Date.now(),
					style: options?.style ?? DEFAULT_CARD_STYLE,
				},
			])
			.select('*, idea:ideas(*)')
			.single();

		if (error) {
			throw error;
		}

		return normalizeBoardItem(data as RawBoardItemRecord);
	};

	const updateBoardItemPosition = async (
		boardItemId: string,
		input: { positionX: number; positionY: number; width?: number; height?: number; zIndex?: number }
	): Promise<BoardItemWithIdea> => {
		const client = requireSupabase();
		const updateInput: Record<string, number | string> = {
			position_x: input.positionX,
			position_y: input.positionY,
			updated_at: new Date().toISOString(),
		};

		if (typeof input.width === 'number') {
			updateInput.width = input.width;
		}

		if (typeof input.height === 'number') {
			updateInput.height = input.height;
		}

		if (typeof input.zIndex === 'number') {
			updateInput.z_index = input.zIndex;
		}

		const { data, error } = await client
			.from('board_items')
			.update(updateInput)
			.eq('id', boardItemId)
			.select('*, idea:ideas(*)')
			.single();

		if (error) {
			throw error;
		}

		return normalizeBoardItem(data as RawBoardItemRecord);
	};

	const listBoardRelations = async (boardId: string): Promise<BoardRelation[]> => {
		const client = requireSupabase();

		const { data, error } = await client
			.from('board_relations')
			.select('*')
			.eq('board_id', boardId)
			.order('created_at', { ascending: true });

		if (error) {
			throw error;
		}

		return ((data ?? []) as BoardRelation[]).map(normalizeBoardRelation);
	};

	const createBoardRelation = async (boardId: string, input: BoardRelationInput): Promise<BoardRelation> => {
		const client = requireSupabase();
		const currentUser = requireUser();

		const { data, error } = await client
			.from('board_relations')
			.insert([
				{
					owner_user_id: currentUser.id,
					board_id: boardId,
					source_board_item_id: input.source_board_item_id,
					target_board_item_id: input.target_board_item_id,
					label: input.label?.trim() || null,
					kind: input.kind?.trim() || DEFAULT_RELATION_KIND,
					metadata: input.metadata ?? {},
				},
			])
			.select('*')
			.single();

		if (error) {
			throw error;
		}

		return normalizeBoardRelation(data as BoardRelation);
	};

	const updateBoardRelation = async (relationId: string, input: Pick<BoardRelationInput, 'label' | 'kind' | 'metadata'>): Promise<BoardRelation> => {
		const client = requireSupabase();

		const { data, error } = await client
			.from('board_relations')
			.update({
				label: input.label?.trim() || null,
				kind: input.kind?.trim() || DEFAULT_RELATION_KIND,
				metadata: input.metadata ?? {},
				updated_at: new Date().toISOString(),
			})
			.eq('id', relationId)
			.select('*')
			.single();

		if (error) {
			throw error;
		}

		return normalizeBoardRelation(data as BoardRelation);
	};

	const deleteBoardRelation = async (relationId: string) => {
		const client = requireSupabase();

		const { error } = await client
			.from('board_relations')
			.delete()
			.eq('id', relationId);

		if (error) {
			throw error;
		}
	};

	const deleteBoardItems = async (boardItemIds: string[]) => {
		if (!boardItemIds.length) {
			return;
		}

		const client = requireSupabase();

		const { error } = await client
			.from('board_items')
			.delete()
			.in('id', boardItemIds);

		if (error) {
			throw error;
		}
	};

	const removeBoardItemsFromConcept = async (boardItemIds: string[]): Promise<BoardItemWithIdea[]> => {
		if (!boardItemIds.length) {
			return [];
		}

		const client = requireSupabase();

		const { data, error } = await client
			.from('board_items')
			.update({
				concept_id: null,
				updated_at: new Date().toISOString(),
			})
			.in('id', boardItemIds)
			.select('*, idea:ideas(*)');

		if (error) {
			throw error;
		}

		return ((data ?? []) as RawBoardItemRecord[]).map(normalizeBoardItem);
	};

	const listConcepts = async (boardId: string): Promise<Concept[]> => {
		const client = requireSupabase();

		const { data, error } = await client
			.from('concepts')
			.select('*')
			.eq('board_id', boardId)
			.order('created_at', { ascending: false });

		if (error) {
			throw error;
		}

		return (data ?? []) as Concept[];
	};

	const createConceptFromBoardItems = async (
		boardId: string,
		title: string,
		boardItemIds: string[],
		notes?: string | null
	): Promise<Concept> => {
		if (!boardItemIds.length) {
			throw new Error('Select at least one card to create a concept.');
		}

		const client = requireSupabase();
		const currentUser = requireUser();

		const { data: concept, error: conceptError } = await client
			.from('concepts')
			.insert([
				{
					owner_user_id: currentUser.id,
					board_id: boardId,
					title: title.trim(),
					notes: notes?.trim() || null,
				},
			])
			.select('*')
			.single();

		if (conceptError) {
			throw conceptError;
		}

		const { error: boardItemError } = await client
			.from('board_items')
			.update({
				concept_id: concept.id,
				updated_at: new Date().toISOString(),
			})
			.in('id', boardItemIds);

		if (boardItemError) {
			await client.from('concepts').delete().eq('id', concept.id);
			throw boardItemError;
		}

		return concept as Concept;
	};

	const duplicateConcept = async (conceptId: string): Promise<{ concept: Concept; boardItems: BoardItemWithIdea[] }> => {
		const client = requireSupabase();
		const currentUser = requireUser();

		const { data: sourceConcept, error: conceptError } = await client
			.from('concepts')
			.select('*')
			.eq('id', conceptId)
			.single();

		if (conceptError) {
			throw conceptError;
		}

		const { data: sourceBoardItems, error: boardItemsError } = await client
			.from('board_items')
			.select('*, idea:ideas(*)')
			.eq('concept_id', conceptId)
			.order('created_at', { ascending: true });

		if (boardItemsError) {
			throw boardItemsError;
		}

		const sourceItems = ((sourceBoardItems ?? []) as RawBoardItemRecord[]).map(normalizeBoardItem);

		if (!sourceItems.length) {
			throw new Error('This concept does not have any cards to duplicate.');
		}

		const { data: nextConcept, error: nextConceptError } = await client
			.from('concepts')
			.insert([
				{
					owner_user_id: currentUser.id,
					board_id: sourceConcept.board_id,
					title: sourceConcept.title,
					version: Number(sourceConcept.version ?? 1) + 1,
					parent_concept_id: sourceConcept.id,
					notes: sourceConcept.notes,
				},
			])
			.select('*')
			.single();

		if (nextConceptError) {
			throw nextConceptError;
		}

		const clonedItems = sourceItems.map((item, index) => ({
			owner_user_id: currentUser.id,
			board_id: item.board_id,
			idea_id: item.idea_id,
			concept_id: nextConcept.id,
			position_x: item.position_x + 40,
			position_y: item.position_y + 40,
			width: item.width,
			height: item.height,
			z_index: Date.now() + index,
			style: item.style ?? DEFAULT_CARD_STYLE,
		}));

		const { data: insertedItems, error: insertItemsError } = await client
			.from('board_items')
			.insert(clonedItems)
			.select('*, idea:ideas(*)');

		if (insertItemsError) {
			await client.from('concepts').delete().eq('id', nextConcept.id);
			throw insertItemsError;
		}

		return {
			concept: nextConcept as Concept,
			boardItems: ((insertedItems ?? []) as RawBoardItemRecord[]).map(normalizeBoardItem),
		};
	};

	const loadBoardSnapshot = async (boardId: string): Promise<BoardSnapshot> => {
		const [board, ideas, boardItems, boardRelations, concepts] = await Promise.all([
			getBoard(boardId),
			listIdeas(),
			listBoardItems(boardId),
			listBoardRelations(boardId),
			listConcepts(boardId),
		]);

		return {
			board,
			ideas,
			boardItems,
			boardRelations,
			concepts,
		};
	};

	return {
		listBoards,
		getBoard,
		createBoard,
		listIdeas,
		createIdea,
		updateIdea,
		deleteIdea,
		listBoardItems,
		addIdeaToBoard,
		updateBoardItemPosition,
		listBoardRelations,
		createBoardRelation,
		updateBoardRelation,
		deleteBoardRelation,
		deleteBoardItems,
		removeBoardItemsFromConcept,
		listConcepts,
		createConceptFromBoardItems,
		duplicateConcept,
		loadBoardSnapshot,
	};
}
