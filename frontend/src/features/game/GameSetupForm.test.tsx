import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SLIDES_CONFIG } from '../../test/factories';
import { GameSetupForm } from './GameSetupForm';

async function submitSeed(text: string) {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<GameSetupForm initial={{ ...SLIDES_CONFIG, preset: 'random' }} onSubmit={onSubmit} />);
  await user.type(screen.getByLabelText(/Código do mapa/), text);
  await user.click(screen.getByRole('button', { name: 'Começar' }));
  return onSubmit;
}

describe('GameSetupForm seed validation', () => {
  it.each([
    ['0', 0],
    ['2147483647', 2147483647],
    ['  42  ', 42],
    ['007', 7],
  ])('accepts %j', async (text, seed) => {
    const onSubmit = await submitSeed(text);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ seed }));
  });

  it('rejects a number above the limit, saying the allowed range', async () => {
    const onSubmit = await submitSeed('2147483648');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'O código deve ser um número inteiro de 0 a 2.147.483.647.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(['-3', '4.5', '4,5', '1e3', '+7', '4 2', '０４２', 'abc', '99999999999999999999999'])(
    'rejects %j without submitting',
    async (text) => {
      const onSubmit = await submitSeed(text);
      expect(screen.getByRole('alert')).toHaveTextContent(/número inteiro de 0 a 2\.147\.483\.647/);
      expect(screen.getByLabelText(/Código do mapa/)).toHaveAttribute('aria-invalid', 'true');
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );
});
