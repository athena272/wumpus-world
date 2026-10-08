import type { Decision } from '../../api/types';
import { Button } from '../../components/Button/Button';
import { Formula } from '../../components/Formula/Formula';
import { Panel } from '../../components/Panel/Panel';
import { ACTION_LABELS } from '../game/labels';
import type { AutoplaySpeed } from '../game/useAgentAutoplay';
import styles from './Controls.module.css';

const SPEED_LABELS: Record<AutoplaySpeed, string> = {
  slow: 'Lenta',
  normal: 'Normal',
  fast: 'Rápida',
};

interface AgentControlsProps {
  readonly canAct: boolean;
  readonly isPlaying: boolean;
  readonly speed: AutoplaySpeed;
  readonly decision: Decision | null;
  readonly onStep: () => void;
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onSpeedChange: (speed: AutoplaySpeed) => void;
}

export function AgentControls({
  canAct,
  isPlaying,
  speed,
  decision,
  onStep,
  onPlay,
  onPause,
  onSpeedChange,
}: AgentControlsProps) {
  return (
    <Panel
      title="Agente lógico"
      subtitle="Agente híbrido: só entra em casas que a KB prova serem seguras."
      icon="⇒"
      tone="violet"
    >
      <div className={styles.agentRow}>
        <Button variant="secondary" disabled={!canAct || isPlaying} onClick={onStep}>
          Próximo passo
        </Button>
        {isPlaying ? (
          <Button onClick={onPause}>Pausar</Button>
        ) : (
          <Button disabled={!canAct} onClick={onPlay}>
            Jogar sozinho
          </Button>
        )}
        <label className={styles.speed}>
          <span>Velocidade</span>
          <select
            value={speed}
            onChange={(event) => {
              onSpeedChange(event.target.value as AutoplaySpeed);
            }}
          >
            {(Object.keys(SPEED_LABELS) as AutoplaySpeed[]).map((option) => (
              <option key={option} value={option}>
                {SPEED_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.decision} aria-live="polite">
        {decision ? (
          <>
            <p className={styles.decisionAction}>
              <span className={styles.decisionLabel}>Decidiu</span>
              <strong className={styles.decisionChoice}>{ACTION_LABELS[decision.action]}</strong>
            </p>
            <p className={styles.explanation}>
              <Formula variant="prose" text={decision.explanation} />
            </p>
            {decision.plan.length > 1 && (
              <ol className={styles.plan} aria-label="Plano">
                {decision.plan.map((action, index) => (
                  <li key={index}>{ACTION_LABELS[action]}</li>
                ))}
              </ol>
            )}
          </>
        ) : (
          <p className={styles.explanation}>Peça um passo ao agente para ver o raciocínio dele.</p>
        )}
      </div>
    </Panel>
  );
}
