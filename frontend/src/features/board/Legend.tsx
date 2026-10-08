import { useId } from 'react';
import { Sprite, type SpriteName } from '../../components/Sprite/Sprite';
import styles from './Legend.module.css';

const SPRITES: readonly { readonly name: SpriteName; readonly label: string }[] = [
  { name: 'agent', label: 'Agente' },
  { name: 'wumpus', label: 'Wumpus' },
  { name: 'pit', label: 'Poço' },
  { name: 'gold', label: 'Ouro' },
  { name: 'stench', label: 'Fedor' },
  { name: 'breeze', label: 'Brisa (×k = k poços)' },
];

const MARKERS: readonly { readonly text: string; readonly label: string; readonly tone: string }[] =
  [
    { text: 'OK', label: 'KB prova que é segura', tone: 'safe' },
    { text: 'P!', label: 'KB prova poço', tone: 'danger' },
    { text: 'W!', label: 'KB prova Wumpus', tone: 'danger' },
    { text: 'P?', label: 'poço possível', tone: 'warning' },
    { text: 'W?', label: 'Wumpus possível', tone: 'warning' },
  ];

export function Legend() {
  const titleId = useId();
  return (
    <section className={styles.legend} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Legenda
      </h2>
      <ul className={styles.list}>
        {SPRITES.map((item) => (
          <li key={item.name}>
            <span className={styles.icon}>
              <Sprite name={item.name} />
            </span>
            {item.label}
          </li>
        ))}
        {MARKERS.map((item) => (
          <li key={item.text}>
            <span className={`${styles.marker} ${styles[item.tone]}`}>{item.text}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
