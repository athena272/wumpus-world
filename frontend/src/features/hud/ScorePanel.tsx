import type { GameView } from '../../api/types';
import { Panel } from '../../components/Panel/Panel';
import { Sprite } from '../../components/Sprite/Sprite';
import { StatGrid } from '../../components/StatGrid/StatGrid';
import { formatPosition, ORIENTATION_LABELS, STATUS_LABELS } from '../game/labels';
import styles from './Hud.module.css';

interface ScorePanelProps {
  readonly view: GameView;
}

export function ScorePanel({ view }: ScorePanelProps) {
  const { agent } = view;
  return (
    <Panel
      title="Situação"
      icon={<Sprite name="gold" />}
      tone="gold"
      actions={
        <span className={`${styles.status} ${styles[view.status]}`}>
          {STATUS_LABELS[view.status]}
        </span>
      }
    >
      <StatGrid
        stats={[
          { label: 'Pontos', value: view.score, highlight: true },
          { label: 'Passos', value: view.step },
          {
            label: 'Posição',
            value: `${formatPosition(agent.position)} · ${ORIENTATION_LABELS[agent.orientation]}`,
          },
          { label: 'Flecha', value: agent.hasArrow ? '1 flecha' : 'Usada' },
          { label: 'Ouro', value: agent.hasGold ? 'Com você' : 'Não' },
          { label: 'Wumpus', value: view.wumpusDeadKnown ? 'Morto' : 'Vivo' },
        ]}
      />
    </Panel>
  );
}
