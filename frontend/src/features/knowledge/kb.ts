import type { Action, KbEntry, Origin } from '../../api/types';
import { ACTION_LABELS } from '../game/labels';

export type OriginFilter = Origin | 'all';

export interface KbGroup {
  readonly step: number;
  readonly title: string;
  readonly entries: readonly KbEntry[];
}

export interface GrowthPoint {
  readonly step: number;
  readonly sentences: number;
  readonly clauses: number;
}

function groupTitle(step: number, actions: readonly Action[]): string {
  if (step === 0) return 'Conhecimento inicial';
  const action = actions[step - 1];
  return action ? `Passo ${step} · ${ACTION_LABELS[action]}` : `Passo ${step}`;
}

/** Entries grouped by the step that added them, newest step first. */
export function groupEntries(
  entries: readonly KbEntry[],
  actions: readonly Action[],
  filter: OriginFilter,
): KbGroup[] {
  const byStep = new Map<number, KbEntry[]>();
  for (const entry of entries) {
    if (filter !== 'all' && entry.origin !== filter) continue;
    const group = byStep.get(entry.step);
    if (group) group.push(entry);
    else byStep.set(entry.step, [entry]);
  }
  return [...byStep.entries()]
    .sort(([a], [b]) => b - a)
    .map(([step, items]) => ({ step, title: groupTitle(step, actions), entries: items }));
}

/** Cumulative size of the KB after each step, from 0 to `lastStep`. */
export function growthSeries(entries: readonly KbEntry[], lastStep: number): GrowthPoint[] {
  const points: GrowthPoint[] = [];
  let sentences = 0;
  let clauses = 0;
  const sorted = [...entries].sort((a, b) => a.step - b.step);
  let index = 0;
  for (let step = 0; step <= lastStep; step += 1) {
    while (index < sorted.length && (sorted[index]?.step ?? Infinity) <= step) {
      sentences += 1;
      clauses += sorted[index]?.clauseCount ?? 0;
      index += 1;
    }
    points.push({ step, sentences, clauses });
  }
  return points;
}
