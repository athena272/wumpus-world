import type { GameStatus, Orientation } from '../../api/types';
import { Sprite } from '../../components/Sprite/Sprite';
import { formatPosition } from '../game/labels';
import { describeCell, type BoardCell, type Marker } from './boardModel';
import styles from './Board.module.css';

const MARKER_TEXT: Record<Marker, string> = {
  safe: 'OK',
  pit: 'P!',
  wumpus: 'W!',
  maybe_pit: 'P?',
  maybe_wumpus: 'W?',
};

const ARROW_ROTATION: Record<Orientation, number> = {
  east: 0,
  south: 90,
  west: 180,
  north: 270,
};

interface CellProps {
  readonly cell: BoardCell;
  readonly orientation: Orientation;
  readonly status: GameStatus;
  readonly selected: boolean;
  readonly onSelect: (cell: BoardCell) => void;
}

export function Cell({ cell, orientation, status, selected, onSelect }: CellProps) {
  const { percept } = cell;
  const tone = cell.visited
    ? styles.visited
    : cell.markers.includes('safe')
      ? styles.safe
      : cell.markers.some((marker) => marker === 'pit' || marker === 'wumpus')
        ? styles.danger
        : cell.frontier
          ? styles.frontier
          : styles.fog;

  return (
    <button
      type="button"
      className={[styles.cell, tone, selected && styles.selected].filter(Boolean).join(' ')}
      aria-label={describeCell(cell)}
      aria-pressed={selected}
      onClick={() => {
        onSelect(cell);
      }}
    >
      <span className={styles.coords} aria-hidden="true">
        {formatPosition(cell.position)}
      </span>

      {cell.markers.length > 0 && (
        <span className={styles.markers} aria-hidden="true">
          {cell.markers.map((marker) => (
            <span key={marker} className={`${styles.marker} ${styles[`marker_${marker}`]}`}>
              {MARKER_TEXT[marker]}
            </span>
          ))}
        </span>
      )}

      <span className={styles.stage} aria-hidden="true">
        {cell.revealed.map((item) => (
          <Sprite
            key={item}
            name={item === 'dead_wumpus' ? 'wumpus' : item}
            className={[styles.revealed, item === 'dead_wumpus' && styles.dead]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
        {cell.hasAgent && (
          <span
            className={[styles.agent, status === 'dead' && styles.dead].filter(Boolean).join(' ')}
          >
            <Sprite name="agent" className={orientation === 'west' ? styles.flipped : undefined} />
            <span
              className={styles.heading}
              style={{ transform: `rotate(${ARROW_ROTATION[orientation]}deg)` }}
            >
              ➜
            </span>
          </span>
        )}
      </span>

      {percept && (percept.stench || percept.breeze > 0 || percept.glitter) && (
        <span className={styles.percepts} aria-hidden="true">
          {percept.stench && (
            <span className={styles.perceptIcon}>
              <Sprite name="stench" />
            </span>
          )}
          {percept.breeze > 0 && (
            <span className={styles.perceptIcon}>
              <Sprite name="breeze" />
              {percept.breeze > 1 && <span className={styles.badge}>×{percept.breeze}</span>}
            </span>
          )}
          {percept.glitter && <span className={styles.glitter}>✦</span>}
        </span>
      )}
    </button>
  );
}
