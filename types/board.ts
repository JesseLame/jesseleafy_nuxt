export type IdeaType =
	| 'technique'
	| 'component'
	| 'finished_product'
	| 'decoration'
	| 'flavor'
	| 'constraint'
	| 'reference';

export interface BoardIdeaUploadImage {
	source: 'upload';
	bucket: string;
	path: string;
}

export type BoardIdeaVideoProvider = 'youtube' | 'vimeo';

export interface BoardIdeaVideoReference {
	provider: BoardIdeaVideoProvider;
	videoId: string;
	embedUrl: string;
	thumbnailUrl: string;
	title?: string;
	aspectRatio?: number;
}

export interface IdeaMetadata extends Record<string, unknown> {
	boardImage?: BoardIdeaUploadImage | null;
	videoReference?: BoardIdeaVideoReference | null;
}

export interface IdeaMediaSource {
	title: string;
	image_url: string | null;
	reference_url: string | null;
	metadata: IdeaMetadata;
}

export interface Idea extends IdeaMediaSource {
	id: string;
	owner_user_id: string;
	type: IdeaType;
	description: string | null;
	notes: string | null;
	tags: string[];
	created_at: string;
	updated_at: string;
}

export interface Board {
	id: string;
	owner_user_id: string;
	title: string;
	description: string | null;
	created_at: string;
	updated_at: string;
}

export interface BoardRelationMetadata extends Record<string, unknown> {}

export interface BoardRelation {
	id: string;
	owner_user_id: string;
	board_id: string;
	source_board_item_id: string;
	target_board_item_id: string;
	label: string | null;
	kind: string;
	metadata: BoardRelationMetadata;
	created_at: string;
	updated_at: string;
}

export interface Concept {
	id: string;
	owner_user_id: string;
	board_id: string;
	title: string;
	version: number;
	parent_concept_id: string | null;
	notes: string | null;
	created_at: string;
}

export interface BoardItemStyle {
	background?: 'paper' | 'sage' | 'cream' | 'blush' | 'sky';
	borderAccent?: 'green' | 'gold' | 'rose' | 'blue';
}

export interface BoardItem {
	id: string;
	owner_user_id: string;
	board_id: string;
	idea_id: string;
	concept_id: string | null;
	position_x: number;
	position_y: number;
	width: number;
	height: number;
	z_index: number;
	style: BoardItemStyle;
	created_at: string;
	updated_at: string;
}

export interface BoardItemWithIdea extends BoardItem {
	idea: Idea | null;
}

export interface BoardSnapshot {
	board: Board | null;
	ideas: Idea[];
	boardItems: BoardItemWithIdea[];
	boardRelations: BoardRelation[];
	concepts: Concept[];
}

export interface IdeaInput {
	title: string;
	type: IdeaType;
	description?: string | null;
	image_url?: string | null;
	reference_url?: string | null;
	notes?: string | null;
	tags?: string[];
	metadata?: IdeaMetadata;
}

export interface BoardInput {
	title: string;
	description?: string | null;
}

export interface BoardRelationInput {
	source_board_item_id: string;
	target_board_item_id: string;
	label?: string | null;
	kind?: string;
	metadata?: BoardRelationMetadata;
}
