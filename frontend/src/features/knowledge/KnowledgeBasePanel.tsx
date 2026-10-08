import { useMemo, useState } from 'react';
import type { Action, GameView } from '../../api/types';
import { Formula } from '../../components/Formula/Formula';
import { Panel } from '../../components/Panel/Panel';
import { StatGrid } from '../../components/StatGrid/StatGrid';
import { ORIGIN_LABELS } from '../game/labels';
import { groupEntries, growthSeries, type OriginFilter } from './kb';
import { KbGrowthChart } from './KbGrowthChart';
import styles from './KnowledgeBase.module.css';

const FILTERS: readonly { readonly value: OriginFilter; readonly label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'rule', label: 'Regras' },
  { value: 'percept', label: 'Percepções' },
  { value: 'action', label: 'Ações' },
];

interface KnowledgeBasePanelProps {
  readonly view: GameView;
  readonly actions: readonly Action[];
}

export function KnowledgeBasePanel({ view, actions }: KnowledgeBasePanelProps) {
  const [filter, setFilter] = useState<OriginFilter>('all');
  const { entries, stats } = view.knowledgeBase;
  const groups = useMemo(() => groupEntries(entries, actions, filter), [entries, actions, filter]);
  const growth = useMemo(() => growthSeries(entries, view.step), [entries, view.step]);

  return (
    <Panel
      title="Base de conhecimento (KB)"
      subtitle="Tudo o que o agente sabe. Cada passo acrescenta regras e percepções da casa visitada."
      icon="KB"
      tone="gold"
    >
      <StatGrid
        stats={[
          { label: 'Sentenças', value: stats.sentences },
          { label: 'Cláusulas (FNC)', value: stats.clauses },
          { label: 'Símbolos', value: stats.symbols },
        ]}
      />

      <KbGrowthChart points={growth} />

      <div className={styles.filters} role="group" aria-label="Filtrar por origem">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.filter}
            aria-pressed={filter === option.value}
            onClick={() => {
              setFilter(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.list} tabIndex={0} aria-label="Sentenças da KB">
        {groups.length === 0 && (
          <p className={styles.empty}>Nenhuma sentença com essa origem ainda.</p>
        )}
        {groups.map((group) => {
          const isNew = group.step === view.step && view.step > 0;
          return (
            <section key={group.step} className={styles.group}>
              <h3 className={styles.groupTitle}>
                {group.title}
                {isNew && <span className={styles.newBadge}>novo</span>}
              </h3>
              <ol className={styles.entries}>
                {group.entries.map((entry) => (
                  <li key={entry.id} className={`${styles.entry} ${isNew ? styles.fresh : ''}`}>
                    <span className={styles.entryId}>{entry.id}</span>
                    <div className={styles.entryBody}>
                      <Formula text={entry.text} className={styles.formula} />
                      <span className={styles.description}>{entry.description}</span>
                    </div>
                    <span className={styles.meta}>
                      <span className={`${styles.origin} ${styles[entry.origin]}`}>
                        {ORIGIN_LABELS[entry.origin]}
                      </span>
                      <span>
                        {entry.clauseCount} {entry.clauseCount === 1 ? 'cláusula' : 'cláusulas'}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </Panel>
  );
}
