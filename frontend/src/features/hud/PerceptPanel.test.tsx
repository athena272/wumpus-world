import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeView, SLIDES_CONFIG } from '../../test/factories';
import { PerceptPanel } from './PerceptPanel';
import { ScorePanel } from './ScorePanel';

describe('PerceptPanel', () => {
  it('shows the percept vector in the format used in class', () => {
    const view = makeView({
      percept: { stench: true, breeze: 1, glitter: false, bump: false, scream: false },
    });
    render(<PerceptPanel view={view} />);

    expect(screen.getByLabelText('[Fedor, Brisa, Nada, Nada, Nada]')).toHaveTextContent(
      '[Fedor, Brisa, Nada, Nada, Nada]',
    );
  });

  it('explains a doubled breeze in intensity mode', () => {
    const view = makeView({
      config: { ...SLIDES_CONFIG, preset: 'random', breezeMode: 'intensity' },
      percept: { stench: false, breeze: 2, glitter: false, bump: false, scream: false },
    });
    render(<PerceptPanel view={view} />);

    expect(screen.getByLabelText('[Nada, Brisa ×2, Nada, Nada, Nada]')).toHaveTextContent(
      '[Nada, Brisa ×2, Nada, Nada, Nada]',
    );
    expect(screen.getByText(/exatamente 2 poços/)).toBeInTheDocument();
  });

  it('describes what happened in the last action', () => {
    const view = makeView({ events: ['bumped'] });
    render(<PerceptPanel view={view} />);

    expect(screen.getByText('Tum! Você bateu na parede.')).toBeInTheDocument();
  });
});

describe('ScorePanel', () => {
  it('shows the score and the game status', () => {
    render(<ScorePanel view={makeView({ score: -12, status: 'dead' })} />);

    expect(screen.getByText('-12')).toBeInTheDocument();
    expect(screen.getByText('Morreu')).toBeInTheDocument();
  });
});
