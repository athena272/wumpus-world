import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeView, withCell } from '../../test/factories';
import { Board } from './Board';

describe('Board', () => {
  it('renders one square per position, with the agent on [1,1]', () => {
    render(<Board view={makeView()} selected={null} onSelect={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(16);
    expect(screen.getByRole('button', { name: /Casa \[1,1\], agente aqui/ })).toBeInTheDocument();
  });

  it('shows the breeze intensity badge when two pits are adjacent', () => {
    const view = withCell(
      makeView({ config: { ...makeView().config, breezeMode: 'intensity' } }),
      { x: 1, y: 1 },
      {
        percept: { stench: false, breeze: 2, glitter: false, bump: false, scream: false },
      },
    );
    render(<Board view={view} selected={null} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /brisa ×2/ })).toHaveTextContent('×2');
  });

  it('selects a square and clears the selection on a second click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = render(<Board view={makeView()} selected={null} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /Casa \[2,1\]/ }));
    expect(onSelect).toHaveBeenLastCalledWith({ x: 2, y: 1 });

    rerender(<Board view={makeView()} selected={{ x: 2, y: 1 }} onSelect={onSelect} />);
    const selected = screen.getByRole('button', { name: /Casa \[2,1\]/ });
    expect(selected).toHaveAttribute('aria-pressed', 'true');
    await user.click(selected);
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
