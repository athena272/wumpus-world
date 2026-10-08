import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeEntry, makeView } from '../../test/factories';
import { hasTextContent } from '../../test/textContent';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';

const VIEW = makeView({
  step: 1,
  knowledgeBase: {
    entries: [
      makeEntry({ id: 'R1', text: '¬P[1,1]', step: 0 }),
      makeEntry({ id: 'R2', text: 'B[2,1] ⇔ (P[1,1] ∨ P[2,2] ∨ P[3,1])', step: 1, clauseCount: 4 }),
      makeEntry({ id: 'R3', text: 'B[2,1]', origin: 'percept', step: 1 }),
    ],
    stats: { sentences: 3, clauses: 6, symbols: 4 },
  },
});

describe('KnowledgeBasePanel', () => {
  it('shows the stats and every sentence, newest step first and marked as new', () => {
    render(<KnowledgeBasePanel view={VIEW} actions={['forward']} />);

    expect(screen.getByText('Sentenças').nextSibling).toHaveTextContent('3');
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'Passo 1 · Avançarnovo',
      'Conhecimento inicial',
    ]);
    expect(
      screen.getByText(hasTextContent('B[2,1] ⇔ (P[1,1] ∨ P[2,2] ∨ P[3,1])')),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /cresceu de 1 para 3 sentenças em 1 passos/ }),
    ).toBeInTheDocument();
  });

  it('filters the sentences by origin', async () => {
    const user = userEvent.setup();
    render(<KnowledgeBasePanel view={VIEW} actions={['forward']} />);

    await user.click(screen.getByRole('button', { name: 'Percepções' }));

    const list = screen.getByLabelText('Sentenças da KB');
    const formulas = [...list.querySelectorAll('code')].map((code) => code.textContent);
    expect(formulas).toEqual(['B[2,1]']);
    expect(screen.getByRole('button', { name: 'Percepções' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
