import { describe, expect, it } from 'vitest';
import { makeView, withCell } from '../../test/factories';
import { buildBoard, describeCell, type BoardCell } from './boardModel';

function cellAt(rows: BoardCell[][], x: number, y: number): BoardCell {
  const cell = rows.flat().find((item) => item.position.x === x && item.position.y === y);
  if (!cell) throw new Error(`missing [${x},${y}]`);
  return cell;
}

describe('buildBoard', () => {
  it('orders rows from the top row down to y = 1', () => {
    const rows = buildBoard(makeView());

    expect(rows).toHaveLength(4);
    expect(rows[0]?.map((cell) => cell.key)).toEqual(['1,4', '2,4', '3,4', '4,4']);
    expect(rows[3]?.map((cell) => cell.key)).toEqual(['1,1', '2,1', '3,1', '4,1']);
  });

  it('marks proven squares as OK and puts the agent on its square', () => {
    const rows = buildBoard(makeView());

    expect(cellAt(rows, 1, 1)).toMatchObject({ hasAgent: true, visited: true, markers: ['safe'] });
    expect(cellAt(rows, 2, 1)).toMatchObject({ frontier: true, markers: ['safe'] });
    expect(cellAt(rows, 3, 3).markers).toEqual([]);
  });

  it('shows doubts only on the frontier', () => {
    let view = makeView();
    view = withCell(view, { x: 2, y: 1 }, { visited: true });
    view = withCell(view, { x: 3, y: 1 }, { pit: 'unknown', wumpus: 'unknown' });
    const rows = buildBoard(view);

    expect(cellAt(rows, 3, 1).markers).toEqual(['maybe_pit', 'maybe_wumpus']);
    expect(cellAt(rows, 4, 1).markers).toEqual([]);
  });

  it('shows proven hazards anywhere on the board', () => {
    const view = withCell(makeView(), { x: 4, y: 4 }, { pit: 'yes', wumpus: 'yes' });

    expect(cellAt(buildBoard(view), 4, 4).markers).toEqual(['pit', 'wumpus']);
  });

  it('stops warning about the Wumpus once the KB proves it is dead', () => {
    let view = makeView({ wumpusDeadKnown: true });
    view = withCell(view, { x: 1, y: 3 }, { wumpus: 'yes', pit: 'unknown' });
    view = withCell(view, { x: 1, y: 2 }, { visited: true });

    expect(cellAt(buildBoard(view), 1, 3).markers).toEqual(['maybe_pit']);
  });

  it('reveals the hidden world when the game ends', () => {
    const view = makeView({
      status: 'dead',
      world: {
        wumpus: { x: 1, y: 3 },
        gold: { x: 2, y: 3 },
        pits: [{ x: 3, y: 1 }],
        wumpusAlive: false,
      },
    });
    const rows = buildBoard(view);

    expect(cellAt(rows, 1, 3).revealed).toEqual(['dead_wumpus']);
    expect(cellAt(rows, 2, 3).revealed).toEqual(['gold']);
    expect(cellAt(rows, 3, 1).revealed).toEqual(['pit']);
  });

  it('does not reveal the gold the agent is carrying', () => {
    const base = makeView();
    const view = makeView({
      agent: { ...base.agent, hasGold: true },
      world: { wumpus: { x: 1, y: 3 }, gold: { x: 1, y: 1 }, pits: [], wumpusAlive: true },
    });

    expect(cellAt(buildBoard(view), 1, 1).revealed).toEqual([]);
  });
});

describe('describeCell', () => {
  it('describes the square for screen readers', () => {
    const view = withCell(
      makeView(),
      { x: 1, y: 1 },
      {
        percept: { stench: true, breeze: 2, glitter: false, bump: false, scream: false },
      },
    );

    expect(describeCell(cellAt(buildBoard(view), 1, 1))).toBe(
      'Casa [1,1], agente aqui, visitada, segura (OK), fedor, brisa ×2',
    );
  });
});
