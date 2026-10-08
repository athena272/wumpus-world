import type { CellView, GameView, Percept, Position } from '../../api/types';
import { formatPosition, positionKey } from '../game/labels';

export type Marker = 'safe' | 'pit' | 'wumpus' | 'maybe_pit' | 'maybe_wumpus';
export type RevealedItem = 'pit' | 'wumpus' | 'dead_wumpus' | 'gold';

export interface BoardCell {
  readonly key: string;
  readonly position: Position;
  readonly visited: boolean;
  /** Unvisited square next to a visited one: the only place where doubts are shown. */
  readonly frontier: boolean;
  readonly markers: readonly Marker[];
  readonly percept: Percept | null;
  readonly hasAgent: boolean;
  readonly revealed: readonly RevealedItem[];
}

const MARKER_DESCRIPTIONS: Record<Marker, string> = {
  safe: 'segura (OK)',
  pit: 'tem poço (P!)',
  wumpus: 'tem Wumpus (W!)',
  maybe_pit: 'talvez poço (P?)',
  maybe_wumpus: 'talvez Wumpus (W?)',
};

const REVEALED_DESCRIPTIONS: Record<RevealedItem, string> = {
  pit: 'poço',
  wumpus: 'Wumpus',
  dead_wumpus: 'Wumpus morto',
  gold: 'ouro',
};

function markersFor(cell: CellView, frontier: boolean, wumpusDeadKnown: boolean): Marker[] {
  if (cell.safe) return ['safe'];
  const markers: Marker[] = [];
  const wumpusMatters = !wumpusDeadKnown;
  if (cell.pit === 'yes') markers.push('pit');
  if (cell.wumpus === 'yes' && wumpusMatters) markers.push('wumpus');
  if (frontier && cell.pit === 'unknown') markers.push('maybe_pit');
  if (frontier && cell.wumpus === 'unknown' && wumpusMatters) markers.push('maybe_wumpus');
  return markers;
}

function revealedAt(view: GameView, position: Position): RevealedItem[] {
  const { world } = view;
  if (!world) return [];
  const key = positionKey(position);
  const items: RevealedItem[] = [];
  if (world.pits.some((pit) => positionKey(pit) === key)) items.push('pit');
  if (positionKey(world.wumpus) === key) items.push(world.wumpusAlive ? 'wumpus' : 'dead_wumpus');
  if (positionKey(world.gold) === key && !view.agent.hasGold) items.push('gold');
  return items;
}

function isNeighbor(a: Position, b: Position): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

/** Rows ordered from the top (y = N) to the bottom (y = 1), like the board in the slides. */
export function buildBoard(view: GameView): BoardCell[][] {
  const visited = view.cells.filter((cell) => cell.visited).map((cell) => cell.position);
  const byKey = new Map(view.cells.map((cell) => [positionKey(cell.position), cell]));
  const agentKey = positionKey(view.agent.position);
  const size = view.config.size;

  const rows: BoardCell[][] = [];
  for (let y = size; y >= 1; y -= 1) {
    const row: BoardCell[] = [];
    for (let x = 1; x <= size; x += 1) {
      const position = { x, y };
      const key = positionKey(position);
      const cell = byKey.get(key);
      if (!cell) throw new Error(`Casa ${formatPosition(position)} ausente na resposta`);
      const frontier = !cell.visited && visited.some((other) => isNeighbor(other, position));
      row.push({
        key,
        position,
        visited: cell.visited,
        frontier,
        markers: markersFor(cell, frontier, view.wumpusDeadKnown),
        percept: cell.percept,
        hasAgent: key === agentKey,
        revealed: revealedAt(view, position),
      });
    }
    rows.push(row);
  }
  return rows;
}

export function describeCell(cell: BoardCell): string {
  const parts = [`Casa ${formatPosition(cell.position)}`];
  if (cell.hasAgent) parts.push('agente aqui');
  parts.push(cell.visited ? 'visitada' : 'não visitada');
  parts.push(...cell.markers.map((marker) => MARKER_DESCRIPTIONS[marker]));
  if (cell.percept?.stench) parts.push('fedor');
  if (cell.percept && cell.percept.breeze > 0) {
    parts.push(cell.percept.breeze > 1 ? `brisa ×${cell.percept.breeze}` : 'brisa');
  }
  if (cell.percept?.glitter) parts.push('resplendor');
  parts.push(...cell.revealed.map((item) => REVEALED_DESCRIPTIONS[item]));
  return parts.join(', ');
}
