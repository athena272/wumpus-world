import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Formula } from './Formula';

function tokens(container: HTMLElement) {
  return [...container.querySelectorAll('span')].map((span) => [span.textContent, span.className]);
}

describe('Formula', () => {
  it('keeps the text and colors each symbol by its kind', () => {
    const { container } = render(<Formula text="B[2,1] ⇔ (P[2,2] ∨ W[3,1])" />);

    expect(container.textContent).toBe('B[2,1] ⇔ (P[2,2] ∨ W[3,1])');
    expect(tokens(container)).toEqual([
      ['B[2,1]', expect.stringMatching(/breeze/)],
      ['⇔', expect.stringMatching(/operator/)],
      ['P[2,2]', expect.stringMatching(/pit/)],
      ['∨', expect.stringMatching(/operator/)],
      ['W[3,1]', expect.stringMatching(/wumpus/)],
    ]);
  });

  it('distinguishes entailment from non-entailment', () => {
    const { container } = render(<Formula text="KB ⊨ ¬S[1,2], KB ⊭ G[4,4], ¬WumpusVivo" />);

    expect(tokens(container)).toEqual([
      ['⊨', expect.stringMatching(/entails/)],
      ['¬', expect.stringMatching(/operator/)],
      ['S[1,2]', expect.stringMatching(/stench/)],
      ['⊭', expect.stringMatching(/notEntails/)],
      ['G[4,4]', expect.stringMatching(/glitter/)],
      ['¬', expect.stringMatching(/operator/)],
      ['WumpusVivo', expect.stringMatching(/wumpus/)],
    ]);
  });

  it('highlights formulas inside a sentence without turning it into code', () => {
    const { container } = render(
      <Formula variant="prose" text="Indo para [1,2], que é segura: KB ⊨ ¬P[1,2]." />,
    );

    expect(container.querySelector('code')).toBeNull();
    expect(container.textContent).toBe('Indo para [1,2], que é segura: KB ⊨ ¬P[1,2].');
  });
});
