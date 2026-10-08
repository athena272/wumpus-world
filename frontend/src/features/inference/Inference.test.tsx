import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PitModels } from '../../api/types';
import { makeView, withCell } from '../../test/factories';
import { hasTextContent } from '../../test/textContent';
import { InferencePanel } from './InferencePanel';
import { ModelsView } from './ModelsView';

const SLIDES_MODELS: PitModels = {
  symbols: ['P[1,2]', 'P[2,2]', 'P[3,1]'],
  totalAssignments: 8,
  modelCount: 3,
  models: [
    { 'P[1,2]': false, 'P[2,2]': false, 'P[3,1]': true },
    { 'P[1,2]': false, 'P[2,2]': true, 'P[3,1]': false },
    { 'P[1,2]': false, 'P[2,2]': true, 'P[3,1]': true },
  ],
  truncated: false,
  skipped: false,
};

describe('InferencePanel', () => {
  const view = withCell(
    makeView({
      queries: [
        { position: { x: 2, y: 2 }, query: '¬P[2,2]', entailed: false },
        { position: { x: 2, y: 2 }, query: '¬W[2,2]', entailed: true },
      ],
    }),
    { x: 2, y: 2 },
    { pit: 'unknown', wumpus: 'no' },
  );

  it('lists the safe squares and the ASK results of the frontier', () => {
    render(<InferencePanel view={view} selected={null} />);

    const safeList = screen.getByRole('list', { name: 'Casas seguras e não visitadas' });
    expect(
      within(safeList)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['[2,1]', '[1,2]']);
    expect(screen.getByText(hasTextContent('KB ⊨ ¬W[2,2]'))).toBeInTheDocument();
    expect(screen.getByText(hasTextContent('KB ⊭ ¬P[2,2]'))).toBeInTheDocument();
  });

  it('details the selected square', () => {
    render(<InferencePanel view={view} selected={{ x: 2, y: 2 }} />);

    expect(screen.getByRole('heading', { name: 'Casa [2,2]' })).toBeInTheDocument();
    expect(screen.getByText('Poço').nextSibling).toHaveTextContent('desconhecido');
    expect(screen.getByText('Wumpus').nextSibling).toHaveTextContent('não (provado)');
  });
});

describe('ModelsView', () => {
  it('reproduces the slides table: 3 models out of 8 assignments', () => {
    render(<ModelsView pitModels={SLIDES_MODELS} selected={{ x: 1, y: 2 }} />);

    expect(screen.getByText(/de 8 atribuições são modelos da KB/)).toHaveTextContent('3 de 8');
    expect(screen.getAllByRole('row')).toHaveLength(5);
    expect(screen.getByRole('columnheader', { name: 'P[1,2]' })).toHaveClass(/highlight/);
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('explains when the frontier is too large to enumerate', () => {
    render(
      <ModelsView
        pitModels={{ ...SLIDES_MODELS, skipped: true, models: [], modelCount: 0 }}
        selected={null}
      />,
    );

    expect(screen.getByText(/caro demais/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
