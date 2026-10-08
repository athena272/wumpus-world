import type { ReactNode } from 'react';
import type { GameEvent, GameView } from '../../api/types';
import { Panel } from '../../components/Panel/Panel';
import { Sprite } from '../../components/Sprite/Sprite';
import { describeEvent, formatPerceptVector } from '../game/labels';
import styles from './Hud.module.css';

const FATAL_EVENTS: readonly GameEvent[] = ['fell_into_pit', 'eaten_by_wumpus'];
const GOOD_EVENTS: readonly GameEvent[] = ['grabbed_gold', 'shot_hit', 'climbed_with_gold'];

interface Sensor {
  readonly label: string;
  readonly active: boolean;
  readonly tone: string | undefined;
  readonly icon: ReactNode;
}

interface PerceptPanelProps {
  readonly view: GameView;
}

export function PerceptPanel({ view }: PerceptPanelProps) {
  const { percept, events } = view;
  const sensors: readonly Sensor[] = [
    { label: 'Fedor', active: percept.stench, tone: styles.stench, icon: <Sprite name="stench" /> },
    {
      label: percept.breeze > 1 ? `Brisa ×${percept.breeze}` : 'Brisa',
      active: percept.breeze > 0,
      tone: styles.breeze,
      icon: <Sprite name="breeze" />,
    },
    { label: 'Resplendor', active: percept.glitter, tone: styles.glitter, icon: '✦' },
    { label: 'Impacto', active: percept.bump, tone: styles.bump, icon: '⇥' },
    { label: 'Grito', active: percept.scream, tone: styles.scream, icon: '‼' },
  ];
  const eventTone = events.some((event) => FATAL_EVENTS.includes(event))
    ? styles.fatal
    : events.some((event) => GOOD_EVENTS.includes(event))
      ? styles.good
      : styles.neutral;

  return (
    <Panel
      title="Percepção"
      subtitle="O que os sensores do agente captam na casa atual."
      icon={<Sprite name="breeze" />}
      tone="breeze"
    >
      <p className={styles.vector} aria-label={formatPerceptVector(percept)}>
        <span aria-hidden="true">
          [
          {sensors.map((sensor, index) => (
            <span key={sensor.label}>
              <span className={sensor.active ? sensor.tone : styles.nothing}>
                {sensor.active ? sensor.label : 'Nada'}
              </span>
              {index < sensors.length - 1 && ', '}
            </span>
          ))}
          ]
        </span>
      </p>

      <ul className={styles.chips} aria-label="Sensores">
        {sensors.map((sensor) => (
          <li
            key={sensor.label}
            className={[styles.chip, sensor.active && sensor.tone, sensor.active && styles.active]
              .filter(Boolean)
              .join(' ')}
          >
            <span className={styles.chipIcon} aria-hidden="true">
              {sensor.icon}
            </span>
            {sensor.label}
            <span className="visually-hidden">{sensor.active ? ': sim' : ': não'}</span>
          </li>
        ))}
      </ul>

      {view.config.breezeMode === 'intensity' && percept.breeze > 1 && (
        <p className={styles.hint}>
          Brisa ×{percept.breeze}: há exatamente {percept.breeze} poços nas casas vizinhas.
        </p>
      )}
      {events.length > 0 && (
        <ul className={`${styles.events} ${eventTone}`} aria-live="polite">
          {events.map((event) => (
            <li key={event}>{describeEvent(event, view)}</li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
