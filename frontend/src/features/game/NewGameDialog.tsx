import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import type { GameConfig } from '../../api/types';
import { GameSetupForm } from './GameSetupForm';
import styles from './NewGameDialog.module.css';

interface NewGameDialogProps {
  readonly current: GameConfig;
  readonly onSubmit: (config: GameConfig) => void;
  readonly onCancel: () => void;
}

export function NewGameDialog({ current, onSubmit, onCancel }: NewGameDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.querySelector<HTMLElement>('input, select, button')?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = [
      ...dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not(:disabled), select:not(:disabled), button:not(:disabled)',
      ),
    ];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          Novo jogo
        </h2>
        <GameSetupForm initial={current} onSubmit={onSubmit} onCancel={onCancel} />
      </div>
    </div>
  );
}
