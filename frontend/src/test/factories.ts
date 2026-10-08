import type {
  CellView,
  GameConfig,
  GameView,
  KbEntry,
  Percept,
  PitModels,
  Position,
} from '../api/types';

export const SLIDES_CONFIG: GameConfig = {
  size: 4,
  seed: 0,
  pitProbability: 0.2,
  breezeMode: 'classic',
  preset: 'slides',
};

export const NO_PERCEPT: Percept = {
  stench: false,
  breeze: 0,
  glitter: false,
  bump: false,
  scream: false,
};

export function makeCell(position: Position, overrides: Partial<CellView> = {}): CellView {
  return {
    position,
    visited: false,
    pit: 'unknown',
    wumpus: 'unknown',
    safe: false,
    percept: null,
    ...overrides,
  };
}

export function makeEntry(overrides: Partial<KbEntry> = {}): KbEntry {
  return {
    id: 'R1',
    text: '¬P[1,1]',
    description: 'Não há poço na casa inicial.',
    origin: 'rule',
    step: 0,
    clauseCount: 1,
    ...overrides,
  };
}

const EMPTY_MODELS: PitModels = {
  symbols: [],
  totalAssignments: 1,
  modelCount: 1,
  models: [{}],
  truncated: false,
  skipped: false,
};

/** Initial view of the slides map: agent in [1,1], neighbors proven safe. */
export function makeView(overrides: Partial<GameView> = {}): GameView {
  const config = overrides.config ?? SLIDES_CONFIG;
  const cells: CellView[] = [];
  for (let y = 1; y <= config.size; y += 1) {
    for (let x = 1; x <= config.size; x += 1) {
      const isStart = x === 1 && y === 1;
      const isNeighbor = (x === 2 && y === 1) || (x === 1 && y === 2);
      cells.push(
        makeCell(
          { x, y },
          isStart
            ? { visited: true, pit: 'no', wumpus: 'no', safe: true, percept: NO_PERCEPT }
            : isNeighbor
              ? { pit: 'no', wumpus: 'no', safe: true }
              : {},
        ),
      );
    }
  }
  return {
    config,
    status: 'playing',
    score: 0,
    step: 0,
    agent: { position: { x: 1, y: 1 }, orientation: 'east', hasGold: false, hasArrow: true },
    percept: NO_PERCEPT,
    events: [],
    wumpusDeadKnown: false,
    cells,
    knowledgeBase: {
      entries: [
        makeEntry(),
        makeEntry({ id: 'R2', text: '¬W[1,1]', description: 'Não há Wumpus na casa inicial.' }),
      ],
      stats: { sentences: 2, clauses: 2, symbols: 2 },
    },
    queries: [],
    pitModels: EMPTY_MODELS,
    world: null,
    ...overrides,
  };
}

export function withCell(
  view: GameView,
  position: Position,
  overrides: Partial<CellView>,
): GameView {
  return {
    ...view,
    cells: view.cells.map((cell) =>
      cell.position.x === position.x && cell.position.y === position.y
        ? { ...cell, ...overrides }
        : cell,
    ),
  };
}
