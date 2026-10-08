import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from './api/ApiError';
import { App } from './App';
import { createSavedGameRepository } from './services/savedGame';
import { makeEntry, makeView } from './test/factories';
import { FakeGameApi } from './test/fakeGameApi';
import { renderWithApi } from './test/renderWithApi';
import { settle } from './test/settle';
import { hasTextContent } from './test/textContent';

async function renderReadyApp() {
  const api = new FakeGameApi();
  const user = userEvent.setup();
  renderWithApi(<App />, api);
  await user.click(screen.getByRole('button', { name: 'Começar' }));
  await settle(() => {
    api.lastState().resolve(makeView());
  });
  return { api, user };
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('lets the player choose the first game instead of starting one on its own', async () => {
    const api = new FakeGameApi();
    const user = userEvent.setup();
    renderWithApi(<App />, api);

    const setup = screen.getByRole('region', { name: 'Monte sua caverna' });
    expect(api.stateCalls).toHaveLength(0);
    expect(within(setup).getByLabelText('Mapa dos slides')).toBeChecked();
    expect(within(setup).queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Novo jogo' })).not.toBeInTheDocument();

    await user.click(within(setup).getByLabelText('Aleatório'));
    await user.selectOptions(within(setup).getByLabelText('Tamanho'), '8');
    await user.click(within(setup).getByLabelText(/Brisa com intensidade/));
    await user.type(within(setup).getByLabelText(/Código do mapa/), '5');
    await user.click(within(setup).getByRole('button', { name: 'Começar' }));

    expect(api.lastState().request).toEqual({
      config: { size: 8, seed: 5, pitProbability: 0.2, breezeMode: 'intensity', preset: 'random' },
      actions: [],
    });
  });

  it('shows a loading state until the first world arrives', async () => {
    const api = new FakeGameApi();
    const user = userEvent.setup();
    renderWithApi(<App />, api);
    await user.click(screen.getByRole('button', { name: 'Começar' }));

    expect(screen.getByRole('status')).toHaveTextContent('Gerando a caverna...');
    expect(screen.queryByRole('group', { name: 'Tabuleiro da caverna' })).not.toBeInTheDocument();

    await settle(() => {
      api.lastState().resolve(makeView());
    });

    expect(screen.getByRole('group', { name: 'Tabuleiro da caverna' })).toBeInTheDocument();
    expect(screen.getByText('4×4 · Mapa dos slides · Brisa clássica')).toBeInTheDocument();
  });

  it('plays an action and shows feedback while it is processed', async () => {
    const { api, user } = await renderReadyApp();

    await user.click(screen.getByRole('button', { name: /Avançar/ }));

    expect(api.lastState().request.actions).toEqual(['forward']);
    expect(screen.getByText('Executando a ação...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Avançar/ })).toBeDisabled();

    await settle(() => {
      api.lastState().resolve(
        makeView({
          step: 1,
          score: -1,
          events: ['moved'],
          agent: { position: { x: 2, y: 1 }, orientation: 'east', hasGold: false, hasArrow: true },
          knowledgeBase: {
            entries: [
              makeEntry(),
              makeEntry({ id: 'R2', text: 'B[2,1]', origin: 'percept', step: 1 }),
            ],
            stats: { sentences: 2, clauses: 2, symbols: 2 },
          },
        }),
      );
    });

    expect(screen.getByText('Você avançou para [2,1].')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Passo 1 · Avançarnovo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Avançar/ })).toBeEnabled();
  });

  it('keeps the board and offers a retry when an action fails', async () => {
    const { api, user } = await renderReadyApp();

    await user.click(screen.getByRole('button', { name: /Girar à direita/ }));
    await settle(() => {
      api.lastState().reject(new ApiError('Falha de rede', { kind: 'network' }));
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/servidor/);
    expect(screen.getByRole('group', { name: 'Tabuleiro da caverna' })).toBeInTheDocument();

    await user.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));
    expect(api.lastState().request.actions).toEqual(['turn_right']);
  });

  it('tells the player when the saved game could not be restored', async () => {
    createSavedGameRepository().save({
      config: { size: 5, seed: 1, pitProbability: 0.2, breezeMode: 'classic', preset: 'random' },
      actions: ['forward'],
    });
    const api = new FakeGameApi();
    renderWithApi(<App />, api);

    expect(screen.getByRole('status')).toHaveTextContent('Restaurando a partida salva...');
    await settle(() => {
      api.lastState().reject(new ApiError('Partida inválida', { kind: 'http', status: 422 }));
    });

    expect(screen.getByText(/Não foi possível restaurar a partida salva/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Monte sua caverna' })).toBeInTheDocument();
    expect(api.stateCalls).toHaveLength(1);
  });

  it('goes back to the setup when the first game cannot be created', async () => {
    const api = new FakeGameApi();
    const user = userEvent.setup();
    renderWithApi(<App />, api);
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await settle(() => {
      api.lastState().reject(new ApiError('Falha de rede', { kind: 'network' }));
    });

    const alert = screen.getByRole('alert');
    await user.click(within(alert).getByRole('button', { name: 'Mudar configurações' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Monte sua caverna' })).toBeInTheDocument();
  });

  it('starts a new game from the dialog', async () => {
    const { api, user } = await renderReadyApp();

    await user.click(screen.getByRole('button', { name: 'Novo jogo' }));
    const dialog = screen.getByRole('dialog', { name: 'Novo jogo' });
    await user.click(within(dialog).getByLabelText('Aleatório'));
    await user.selectOptions(within(dialog).getByLabelText('Tamanho'), '6');
    await user.type(within(dialog).getByLabelText(/Código do mapa/), '9');
    await user.click(within(dialog).getByRole('button', { name: 'Começar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.lastState().request).toEqual({
      config: { size: 6, seed: 9, pitProbability: 0.2, breezeMode: 'classic', preset: 'random' },
      actions: [],
    });
  });

  it('lets the agent take a step and explains the decision', async () => {
    const { api, user } = await renderReadyApp();

    await user.click(screen.getByRole('button', { name: 'Próximo passo' }));
    expect(screen.getByText('O agente está pensando...')).toBeInTheDocument();

    await settle(() => {
      api.lastDecide().resolve({
        decision: {
          action: 'forward',
          explanation: 'Indo para [2,1], que é segura: KB ⊨ ¬P[2,1] ∧ ¬W[2,1].',
          plan: ['forward'],
        },
        view: makeView({ step: 1 }),
      });
    });

    expect(screen.getByText(hasTextContent(/KB ⊨ ¬P\[2,1\] ∧ ¬W\[2,1\]/))).toBeInTheDocument();
  });
});
