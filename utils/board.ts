import type { BoardItemStyle, IdeaType } from '~/types/board';

export const IDEA_TYPE_OPTIONS = [
	{ value: 'technique', label: 'Technique' },
	{ value: 'component', label: 'Component' },
	{ value: 'finished_product', label: 'Finished Product' },
	{ value: 'decoration', label: 'Decoration' },
	{ value: 'flavor', label: 'Flavor' },
	{ value: 'constraint', label: 'Constraint' },
	{ value: 'reference', label: 'Reference' },
] as const satisfies Array<{ value: IdeaType; label: string }>;

export const CARD_BACKGROUND_OPTIONS = [
	{ value: 'paper', label: 'Paper' },
	{ value: 'sage', label: 'Sage' },
	{ value: 'cream', label: 'Cream' },
	{ value: 'blush', label: 'Blush' },
	{ value: 'sky', label: 'Sky' },
] as const;

export const BOARD_RELATION_KIND_OPTIONS = [
	{ value: 'related', label: 'Related' },
	{ value: 'builds_on', label: 'Builds On' },
	{ value: 'inspired_by', label: 'Inspired By' },
	{ value: 'contrast', label: 'Contrast' },
] as const;

export type BoardCardBackground = (typeof CARD_BACKGROUND_OPTIONS)[number]['value'];
export type BoardRelationKind = (typeof BOARD_RELATION_KIND_OPTIONS)[number]['value'];

export const DEFAULT_BOARD_CARD_BACKGROUND: BoardCardBackground = 'paper';
export const DEFAULT_BOARD_RELATION_KIND: BoardRelationKind = 'related';

export function parseBoardTags(value: string) {
	return value
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

export function formatIdeaTypeLabel(value: string) {
	return value.replace(/_/g, ' ');
}

export function formatBoardRelationKindLabel(value: string) {
	return value.replace(/_/g, ' ');
}

export function getBoardItemCardClasses(style?: BoardItemStyle) {
	const backgroundMap = {
		paper: 'bg-white/95',
		sage: 'bg-green-50',
		cream: 'bg-amber-50',
		blush: 'bg-rose-50',
		sky: 'bg-sky-50',
	};

	const borderMap = {
		green: 'border-green-600',
		gold: 'border-amber-500',
		rose: 'border-rose-400',
		blue: 'border-sky-500',
	};

	return [
		backgroundMap[style?.background ?? DEFAULT_BOARD_CARD_BACKGROUND],
		borderMap[style?.borderAccent ?? 'green'],
	];
}
