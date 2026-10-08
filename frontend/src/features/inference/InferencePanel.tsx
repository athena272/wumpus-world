import type { AskResult, CellView, GameView, Position, Truth } from '../../api/types';
import { Formula } from '../../components/Formula/Formula';
import { Panel } from '../../components/Panel/Panel';
import { formatPosition, positionKey, samePosition } from '../game/labels';
import styles from './Inference.module.css';

const TRUTH_TEXT: Record<Truth, string> = {
  yes: 'sim (provado)',
  no: 'não (provado)',
  unknown: 'desconhecido',
};

interface InferencePanelProps {
  readonly view: GameView;
  readonly selected: Position | null;
}

function groupByPosition(queries: readonly AskResult[]): Map<string, AskResult[]> {
  const groups = new Map<string, AskResult[]>();
  for (const query of queries) {
    const key = positionKey(query.position);
    const group = groups.get(key);
    if (group) group.push(query);
    else groups.set(key, [query]);
  }
  return groups;
}

function QueryList({ queries }: { readonly queries: readonly AskResult[] }) {
  return (
    <ul className={styles.queries}>
      {queries.map((query) => (
        <li key={query.query} className={query.entailed ? styles.entailed : styles.notEntailed}>
          <Formula text={`KB ${query.entailed ? '⊨' : '⊭'} ${query.query}`} />
          <span className={styles.verdict} aria-hidden="true">
            {query.entailed ? '✓' : '·'}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CellDetails({
  cell,
  queries,
}: {
  readonly cell: CellView;
  readonly queries: readonly AskResult[];
}) {
  return (
    <div className={styles.details}>
      <h3 className={styles.cellTitle}>Casa {formatPosition(cell.position)}</h3>
      <dl className={styles.truths}>
        <div>
          <dt>Poço</dt>
          <dd className={styles[cell.pit]}>{TRUTH_TEXT[cell.pit]}</dd>
        </div>
        <div>
          <dt>Wumpus</dt>
          <dd className={styles[cell.wumpus]}>{TRUTH_TEXT[cell.wumpus]}</dd>
        </div>
        <div>
          <dt>Segura</dt>
          <dd className={cell.safe ? styles.no : styles.unknown}>
            {cell.safe ? 'sim' : 'não provado'}
          </dd>
        </div>
      </dl>
      {queries.length > 0 ? (
        <QueryList queries={queries} />
      ) : (
        <p className={styles.muted}>
          {cell.visited
            ? 'Casa visitada: o agente esteve aqui, então ela é segura.'
            : 'Fora da fronteira: nenhuma casa vizinha foi visitada, então não há consultas locais.'}
        </p>
      )}
    </div>
  );
}

export function InferencePanel({ view, selected }: InferencePanelProps) {
  const safeUnvisited = view.cells.filter((cell) => cell.safe && !cell.visited);
  const groups = groupByPosition(view.queries);
  const selectedCell = selected
    ? view.cells.find((cell) => samePosition(cell.position, selected))
    : undefined;

  return (
    <Panel
      title="Inferência (ASK)"
      subtitle={
        <Formula
          variant="prose"
          text="Consultas feitas por refutação com DPLL: KB ⊨ α se KB ∧ ¬α é insatisfatível."
        />
      }
      icon="⊨"
      tone="safe"
    >
      <div className={styles.summary}>
        <span className={styles.summaryLabel}>Seguras e não visitadas:</span>
        {safeUnvisited.length > 0 ? (
          <ul className={styles.positions} aria-label="Casas seguras e não visitadas">
            {safeUnvisited.map((cell) => (
              <li key={positionKey(cell.position)}>{formatPosition(cell.position)}</li>
            ))}
          </ul>
        ) : (
          <span className={styles.muted}>nenhuma</span>
        )}
      </div>

      {selectedCell ? (
        <CellDetails
          cell={selectedCell}
          queries={groups.get(positionKey(selectedCell.position)) ?? []}
        />
      ) : groups.size === 0 ? (
        <p className={styles.muted}>Não há casas na fronteira para consultar.</p>
      ) : (
        <>
          <p className={styles.muted}>Clique em uma casa do tabuleiro para ver os detalhes.</p>
          <div className={styles.grid}>
            {[...groups.values()].map((queries) => {
              const position = queries[0]?.position;
              if (!position) return null;
              return (
                <div key={positionKey(position)} className={styles.group}>
                  <h3 className={styles.cellTitle}>{formatPosition(position)}</h3>
                  <QueryList queries={queries} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}
