import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SLIDES_CONFIG } from '../../test/factories';
import { NewGameDialog } from './NewGameDialog';

function setup() {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(<NewGameDialog current={SLIDES_CONFIG} onSubmit={onSubmit} onCancel={onCancel} />);
  return { user: userEvent.setup(), onSubmit, onCancel };
}

describe('NewGameDialog', () => {
  it('keeps the slides map fixed at 4×4', async () => {
    const { user, onSubmit } = setup();

    expect(screen.getByLabelText('Tamanho')).toBeDisabled();
    await user.click(screen.getByLabelText(/Brisa com intensidade/));
    await user.click(screen.getByRole('button', { name: 'Começar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      size: 4,
      seed: 0,
      pitProbability: 0.2,
      breezeMode: 'intensity',
      preset: 'slides',
    });
  });

  it('creates a random map with the chosen size and seed', async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByLabelText('Aleatório'));
    await user.selectOptions(screen.getByLabelText('Tamanho'), '7');
    await user.selectOptions(screen.getByLabelText('Chance de poço'), '0.3');
    await user.type(screen.getByLabelText(/Código do mapa/), '42');
    await user.click(screen.getByRole('button', { name: 'Começar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      size: 7,
      seed: 42,
      pitProbability: 0.3,
      breezeMode: 'classic',
      preset: 'random',
    });
  });

  it('draws a random seed when the field is blank', async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByLabelText('Aleatório'));
    expect(screen.getByLabelText(/Código do mapa/)).toHaveAccessibleDescription(
      'Número inteiro de 0 a 2.147.483.647. Use o mesmo código para repetir uma caverna; vazio = sorteado.',
    );
    await user.click(screen.getByRole('button', { name: 'Começar' }));

    const config = onSubmit.mock.calls[0]?.[0] as { seed: number };
    expect(Number.isInteger(config.seed)).toBe(true);
  });

  it('rejects an invalid seed without submitting', async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByLabelText('Aleatório'));
    await user.type(screen.getByLabelText(/Código do mapa/), '-3');
    await user.click(screen.getByRole('button', { name: 'Começar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('número inteiro');
    expect(screen.getByLabelText(/Código do mapa/)).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('closes with Escape or Cancel', async () => {
    const { user, onCancel } = setup();

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
