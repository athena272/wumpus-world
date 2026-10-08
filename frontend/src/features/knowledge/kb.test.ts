import { describe, expect, it } from 'vitest';
import { makeEntry } from '../../test/factories';
import { groupEntries, growthSeries } from './kb';

const ENTRIES = [
  makeEntry({ id: 'R1', step: 0, origin: 'rule', clauseCount: 1 }),
  makeEntry({ id: 'R2', step: 0, origin: 'rule', clauseCount: 15 }),
  makeEntry({ id: 'R3', step: 0, origin: 'percept', clauseCount: 1 }),
  makeEntry({ id: 'R4', step: 2, origin: 'rule', clauseCount: 4 }),
  makeEntry({ id: 'R5', step: 2, origin: 'percept', clauseCount: 1 }),
];

describe('groupEntries', () => {
  it('groups by step, newest first, naming the action that caused it', () => {
    const groups = groupEntries(ENTRIES, ['turn_left', 'forward'], 'all');

    expect(groups.map((group) => group.title)).toEqual([
      'Passo 2 · Avançar',
      'Conhecimento inicial',
    ]);
    expect(groups[1]?.entries.map((entry) => entry.id)).toEqual(['R1', 'R2', 'R3']);
  });

  it('filters by origin and drops empty groups', () => {
    const groups = groupEntries(ENTRIES, ['turn_left', 'forward'], 'percept');

    expect(groups.map((group) => group.entries.map((entry) => entry.id))).toEqual([['R5'], ['R3']]);
    expect(groupEntries(ENTRIES, [], 'action')).toEqual([]);
  });
});

describe('growthSeries', () => {
  it('accumulates sentences and clauses for every step, even steps without news', () => {
    expect(growthSeries(ENTRIES, 3)).toEqual([
      { step: 0, sentences: 3, clauses: 17 },
      { step: 1, sentences: 3, clauses: 17 },
      { step: 2, sentences: 5, clauses: 22 },
      { step: 3, sentences: 5, clauses: 22 },
    ]);
  });
});
