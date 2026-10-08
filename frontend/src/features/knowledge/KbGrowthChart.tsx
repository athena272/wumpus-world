import type { GrowthPoint } from './kb';
import styles from './KnowledgeBase.module.css';

const WIDTH = 100;
const HEIGHT = 32;
const PADDING = 2;

interface KbGrowthChartProps {
  readonly points: readonly GrowthPoint[];
}

export function KbGrowthChart({ points }: KbGrowthChartProps) {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return null;

  const max = Math.max(last.sentences, 1);
  const yOf = (sentences: number) => HEIGHT - PADDING - (sentences / max) * (HEIGHT - PADDING * 2);
  // A single point is drawn as a flat line across the chart.
  const series = points.length === 1 ? [first, first] : points;
  const span = series.length - 1;
  const line = series
    .map((point, index) => {
      const x = PADDING + (index / span) * (WIDTH - PADDING * 2);
      return `${x.toFixed(2)},${yOf(point.sentences).toFixed(2)}`;
    })
    .join(' ');
  const area = `${PADDING},${HEIGHT - PADDING} ${line} ${WIDTH - PADDING},${HEIGHT - PADDING}`;
  const summary = `A KB cresceu de ${first.sentences} para ${last.sentences} sentenças em ${last.step} passos.`;

  return (
    <figure className={styles.chart}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={summary}
      >
        <polygon points={area} className={styles.chartArea} />
        <polyline points={line} className={styles.chartLine} vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className={styles.chartCaption}>
        Sentenças por passo: {first.sentences} → {last.sentences}
      </figcaption>
    </figure>
  );
}
