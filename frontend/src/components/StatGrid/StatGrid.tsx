import type { ReactNode } from 'react';
import styles from './StatGrid.module.css';

export interface Stat {
  readonly label: string;
  readonly value: ReactNode;
  readonly highlight?: boolean;
}

interface StatGridProps {
  readonly stats: readonly Stat[];
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <dl className={styles.grid}>
      {stats.map((stat) => (
        <div key={stat.label} className={stat.highlight ? styles.highlight : styles.tile}>
          <dt className={styles.label}>{stat.label}</dt>
          <dd className={styles.value}>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
