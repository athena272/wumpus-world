import type { PitModels, Position } from '../../api/types';
import { Formula } from '../../components/Formula/Formula';
import { Panel } from '../../components/Panel/Panel';
import { Sprite } from '../../components/Sprite/Sprite';
import { formatPosition } from '../game/labels';
import styles from './Inference.module.css';

interface ModelsViewProps {
  readonly pitModels: PitModels;
  readonly selected: Position | null;
}

export function ModelsView({ pitModels, selected }: ModelsViewProps) {
  const { symbols, models } = pitModels;
  const highlighted = selected ? `P${formatPosition(selected)}` : null;

  return (
    <Panel
      title="Modelos dos poços"
      subtitle="Verificação de modelos (TT-Entails) restrita aos poços da fronteira, como nos slides."
      icon={<Sprite name="pit" />}
      tone="danger"
    >
      {pitModels.skipped ? (
        <p className={styles.muted}>
          A fronteira tem {symbols.length} casas; enumerar 2^{symbols.length} atribuições seria caro
          demais. A inferência continua sendo feita pelo DPLL.
        </p>
      ) : symbols.length === 0 ? (
        <p className={styles.muted}>Não há poços desconhecidos na fronteira.</p>
      ) : (
        <>
          <p className={styles.summary}>
            <strong>{pitModels.modelCount}</strong> de {pitModels.totalAssignments} atribuições são
            modelos da KB.
            {pitModels.truncated && ` Mostrando os primeiros ${models.length}.`}
          </p>
          <div className={styles.tableWrapper} tabIndex={0} aria-label="Tabela de modelos">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {symbols.map((symbol) => (
                    <th
                      key={symbol}
                      scope="col"
                      className={symbol === highlighted ? styles.highlight : undefined}
                    >
                      <Formula text={symbol} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map((model, index) => (
                  <tr key={index}>
                    <th scope="row">{index + 1}</th>
                    {symbols.map((symbol) => (
                      <td
                        key={symbol}
                        className={symbol === highlighted ? styles.highlight : undefined}
                      >
                        <span className={model[symbol] ? styles.true : styles.false}>
                          {model[symbol] ? 'V' : 'F'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {!pitModels.truncated && (
                <tfoot>
                  <tr>
                    <th scope="row">Poço em</th>
                    {symbols.map((symbol) => (
                      <td
                        key={symbol}
                        className={symbol === highlighted ? styles.highlight : undefined}
                      >
                        {models.filter((model) => model[symbol]).length}/{models.length}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}
