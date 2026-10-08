import type { Action } from '../../api/types';
import { Button } from '../../components/Button/Button';
import { Panel } from '../../components/Panel/Panel';
import { Sprite } from '../../components/Sprite/Sprite';
import { ACTION_LABELS } from '../game/labels';
import styles from './Controls.module.css';
import { useActionShortcuts } from './useActionShortcuts';

interface ActionButton {
  readonly action: Action;
  readonly icon: string;
  readonly keys: string;
}

const BUTTONS: readonly ActionButton[] = [
  { action: 'turn_left', icon: '⟲', keys: 'A / ←' },
  { action: 'forward', icon: '↑', keys: 'W / ↑' },
  { action: 'turn_right', icon: '⟳', keys: 'D / →' },
  { action: 'grab', icon: '✋', keys: 'G' },
  { action: 'shoot', icon: '➶', keys: 'F' },
  { action: 'climb', icon: '⇧', keys: 'C' },
];

interface ActionControlsProps {
  readonly canAct: boolean;
  readonly hasArrow: boolean;
  readonly shortcutsEnabled: boolean;
  readonly onAction: (action: Action) => void;
}

export function ActionControls({
  canAct,
  hasArrow,
  shortcutsEnabled,
  onAction,
}: ActionControlsProps) {
  useActionShortcuts(shortcutsEnabled && canAct, onAction);

  return (
    <Panel
      title="Suas ações"
      subtitle="Jogue você mesmo; a KB mostra o que dá para deduzir a cada passo."
      icon={<Sprite name="agent" />}
      tone="info"
    >
      <div className={styles.actions}>
        {BUTTONS.map(({ action, icon, keys }) => (
          <Button
            key={action}
            variant="secondary"
            className={styles.actionButton}
            disabled={!canAct || (action === 'shoot' && !hasArrow)}
            aria-keyshortcuts={keys.replaceAll(' ', '').replace('/', ' ')}
            onClick={() => {
              onAction(action);
            }}
          >
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
            <span className={styles.actionLabel}>{ACTION_LABELS[action]}</span>
            <kbd className={styles.kbd}>{keys}</kbd>
          </Button>
        ))}
      </div>
    </Panel>
  );
}
