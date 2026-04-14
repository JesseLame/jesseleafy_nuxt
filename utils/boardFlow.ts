import { MarkerType, Position, type Connection, type Edge, type Node } from '@vue-flow/core';
import type { BoardItemWithIdea, BoardRelation } from '~/types/board';
import { DEFAULT_BOARD_RELATION_KIND } from '~/utils/board';

export interface BoardFlowNodeData {
	item: BoardItemWithIdea;
}

export interface BoardFlowEdgeData {
	relation: BoardRelation;
}

export type BoardFlowNode = Node<BoardFlowNodeData>;
export type BoardFlowEdge = Edge<BoardFlowEdgeData>;

export function boardItemToFlowNode(item: BoardItemWithIdea, selected = false): BoardFlowNode {
	return {
		id: item.id,
		type: 'board-card',
		position: {
			x: item.position_x,
			y: item.position_y,
		},
		selected,
		draggable: true,
		connectable: true,
		selectable: true,
		dragHandle: '.board-flow-card-drag',
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
		data: {
			item,
		},
		style: {
			width: `${item.width}px`,
			height: `${item.height}px`,
			zIndex: String(item.z_index),
		},
	};
}

export function boardRelationToFlowEdge(relation: BoardRelation, selected = false): BoardFlowEdge {
	const kind = relation.kind?.trim() || DEFAULT_BOARD_RELATION_KIND;

	return {
		id: relation.id,
		type: 'smoothstep',
		source: relation.source_board_item_id,
		target: relation.target_board_item_id,
		label: relation.label?.trim() || undefined,
		selected,
		selectable: true,
		updatable: false,
		markerEnd: MarkerType.ArrowClosed,
		labelShowBg: true,
		labelBgPadding: [8, 4],
		labelBgBorderRadius: 999,
		style: {
			stroke: kind === 'contrast' ? '#dc2626' : '#166534',
			strokeWidth: 2,
		},
		labelStyle: {
			fill: '#14532d',
			fontSize: '12px',
			fontWeight: 600,
		},
		labelBgStyle: {
			fill: '#f0fdf4',
			stroke: '#bbf7d0',
			strokeWidth: 1,
		},
		data: {
			relation,
		},
	};
}

export function connectionToBoardRelationInput(connection: Connection) {
	return {
		source_board_item_id: connection.source,
		target_board_item_id: connection.target,
	};
}
