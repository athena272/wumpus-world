import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { hasTextContent } from '../../test/textContent';
import { ActionControls } from './ActionControls';
import { AgentControls } from './AgentControls';

function renderActions(overrides: Partial<Parameters<typeof ActionControls>[0]> = {}) {
  const onAction = vi.fn();
  render(<ActionControls canAct hasArrow shortcutsEnabled onAction={onAction} {...overrides} />);
  return onAction;
}

describe('ActionControls', () => {
  it('sends the clicked action', async () => {
    const user = userEvent.setup();
    const onAction = renderActions();

    await user.click(screen.getByRole('button', { name: /Avançar/ }));
    expect(onAction).toHaveBeenCalledWith('forward');
  });

  it('keeps the goal and the scoring in sight while playing', () => {
    renderActions();

    expect(
      screen.getByText(hasTextContent('Como vencer: Pegue o ouro, volte para [1,1] e use Sair.')),
    ).toBeInTheDocument();
    expect(screen.getByText(/\+1000 ao sair com o ouro/)).toBeInTheDocument();
  });

  it('maps the keyboard shortcuts to actions', () => {
    const onAction = renderActions();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'D' });
    fireEvent.keyDown(window, { key: 'f' });
    expect(onAction.mock.calls).toEqual([['turn_left'], ['turn_right'], ['shoot']]);
  });

  it('ignores shortcuts while typing, with modifiers or when disabled', () => {
    const onAction = renderActions();
    const input = document.createElement('input');
    document.body.append(input);

    fireEvent.keyDown(input, { key: 'w' });
    fireEvent.keyDown(window, { key: 'w', ctrlKey: true });
    expect(onAction).not.toHaveBeenCalled();
    input.remove();
  });

  it('disables shooting once the arrow is gone', () => {
    renderActions({ canAct: true, hasArrow: false });
    expect(screen.getByRole('button', { name: /Atirar/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Pegar/ })).toBeEnabled();
  });

  it('does not react to shortcuts when it cannot act', () => {
    const onAction = renderActions({ canAct: false });

    fireEvent.keyDown(window, { key: 'w' });
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Avançar/ })).toBeDisabled();
  });
});

describe('AgentControls', () => {
  const handlers = {
    onStep: vi.fn(),
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onSpeedChange: vi.fn(),
  };

  it('shows the explanation and the plan of the last decision', () => {
    render(
      <AgentControls
        canAct
        isPlaying={false}
        speed="normal"
        decision={{
          action: 'turn_left',
          explanation: 'Indo para [1,2], que é segura: KB ⊨ ¬P[1,2] ∧ ¬W[1,2].',
          plan: ['turn_left', 'forward'],
        }}
        {...handlers}
      />,
    );

    expect(screen.getByText(hasTextContent(/KB ⊨ ¬P\[1,2\]/))).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Plano' })).toHaveTextContent(
      'Girar à esquerdaAvançar',
    );
  });

  it('switches between play and pause', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AgentControls canAct isPlaying={false} speed="normal" decision={null} {...handlers} />,
    );

    await user.click(screen.getByRole('button', { name: 'Jogar sozinho' }));
    expect(handlers.onPlay).toHaveBeenCalled();

    rerender(<AgentControls canAct isPlaying speed="normal" decision={null} {...handlers} />);
    expect(screen.getByRole('button', { name: 'Próximo passo' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(handlers.onPause).toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText('Velocidade'), 'fast');
    expect(handlers.onSpeedChange).toHaveBeenCalledWith('fast');
  });
});
