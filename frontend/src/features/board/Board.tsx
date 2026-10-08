import { useMemo, type CSSProperties } from 'react';
import type { GameView, Position } from '../../api/types';
import { samePosition } from '../game/labels';
import { buildBoard } from './boardModel';
import { Cell } from './Cell';
import styles from './Board.module.css';

interface BoardProps {
  readonly view: GameView;
  readonly selected: Position | null;
  readonly onSelect: (position: Position | null) => void;
}

export function Board({ view, selected, onSelect }: BoardProps) {
  const cells = useMemo(() => buildBoard(view).flat(), [view]);
  const style = { '--board-size': view.config.size } as CSSProperties;

  return (
    <div className={styles.frame}>
      <div className={styles.board} style={style} role="group" aria-label="Tabuleiro da caverna">
        {cells.map((cell) => (
          <Cell
            key={cell.key}
            cell={cell}
            orientation={view.agent.orientation}
            status={view.status}
            selected={samePosition(cell.position, selected)}
            onSelect={(clicked) => {
              onSelect(samePosition(clicked.position, selected) ? null : clicked.position);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function BoardSkeleton({ size = 4 }: { readonly size?: number }) {
  const style = { '--board-size': size } as CSSProperties;
  return (
    <div className={styles.frame} aria-hidden="true">
      <div className={`${styles.board} ${styles.skeleton}`} style={style}>
        {Array.from({ length: size * size }, (_, index) => (
          <div key={index} className={styles.skeletonCell} />
        ))}
      </div>
    </div>
  );
}
