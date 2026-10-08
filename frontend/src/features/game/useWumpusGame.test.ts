import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/ApiError';
import type { GameRequest } from '../../api/types';
import { SLOW_REQUEST_MS } from '../../config';
import { SAVED_GAME_KEY, createSavedGameRepository } from '../../services/savedGame';
import { makeView, SLIDES_CONFIG } from '../../test/factories';
import { FakeGameApi } from '../../test/fakeGameApi';
import { renderHookWithApi } from '../../test/renderWithApi';
import { settle } from '../../test/settle';
import { RESTORE_FAILED_NOTICE, useWumpusGame } from './useWumpusGame';

const SAVED: GameRequest = {
  config: { size: 5, seed: 7, pitProbability: 0.2, breezeMode: 'intensity', preset: 'random' },
  actions: ['forward', 'turn_left'],
};

function savedActions(): unknown {
  return (
    JSON.parse(window.localStorage.getItem(SAVED_GAME_KEY) ?? 'null') as {
      actions?: unknown;
    } | null
  )?.actions;
}

function setup() {
  const api = new FakeGameApi();
  const rendered = renderHookWithApi(() => useWumpusGame(), api);
  return { api, ...rendered };
}

function setupStarting() {
  const context = setup();
  act(() => {
    void context.result.current.newGame(SLIDES_CONFIG);
  });
  return context;
}

async function startReadyGame() {
  const context = setupStarting();
  await settle(() => {
    context.api.lastState().resolve(makeView());
  });
  return context;
}

describe('useWumpusGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for the player to choose the config when there is no saved game', () => {
    const { api, result } = setup();

    expect(result.current.phase).toBe('idle');
    expect(result.current.pending).toBeNull();
    expect(api.stateCalls).toHaveLength(0);
  });

  it('starts the chosen game and saves it once the server confirms', async () => {
    const { api, result } = setupStarting();

    expect(result.current.phase).toBe('loading');
    expect(result.current.pending).toBe('starting');
    expect(api.lastState().request).toEqual({ config: SLIDES_CONFIG, actions: [] });
    expect(window.localStorage.getItem(SAVED_GAME_KEY)).toBeNull();

    await settle(() => {
      api.lastState().resolve(makeView());
    });

    expect(result.current.phase).toBe('ready');
    expect(result.current.canAct).toBe(true);
    expect(savedActions()).toEqual([]);
  });

  it('warns that the server may be waking up when the request is slow', async () => {
    vi.useFakeTimers();
    const { api, result } = setupStarting();

    expect(result.current.isSlow).toBe(false);
    act(() => {
      vi.advanceTimersByTime(SLOW_REQUEST_MS);
    });
    expect(result.current.isSlow).toBe(true);

    await settle(() => {
      api.lastState().resolve(makeView());
    });
    expect(result.current.isSlow).toBe(false);
  });

  it('restores the saved game after a reload', async () => {
    createSavedGameRepository().save(SAVED);
    const { api, result } = setup();

    expect(result.current.pending).toBe('restoring');
    expect(api.lastState().request).toEqual(SAVED);

    await settle(() => {
      api.lastState().resolve(makeView({ step: 2 }));
    });
    expect(result.current.actions).toEqual(SAVED.actions);
  });

  it('discards a saved game rejected by the server and lets the player choose a new one', async () => {
    createSavedGameRepository().save(SAVED);
    const { api, result } = setup();

    await settle(() => {
      api.lastState().reject(new ApiError('A partida já terminou.', { kind: 'http', status: 409 }));
    });

    expect(result.current.notice).toBe(RESTORE_FAILED_NOTICE);
    expect(result.current.error).toBeNull();
    expect(window.localStorage.getItem(SAVED_GAME_KEY)).toBeNull();
    expect(api.stateCalls).toHaveLength(1);
    expect(result.current.pending).toBeNull();
    expect(result.current.phase).toBe('idle');
  });

  it('shows an error with retry when the first load fails for other reasons', async () => {
    const { api, result } = setupStarting();

    await settle(() => {
      api.lastState().reject(new ApiError('Falha de rede', { kind: 'network' }));
    });
    expect(result.current.phase).toBe('error');
    expect(result.current.error).toMatch(/servidor/);

    act(() => {
      result.current.retry();
    });
    expect(api.stateCalls).toHaveLength(2);
    expect(result.current.phase).toBe('loading');
  });

  it('sends the confirmed actions plus the new one, and ignores double clicks', async () => {
    const { api, result } = await startReadyGame();

    act(() => {
      void result.current.act('forward');
      void result.current.act('forward');
    });

    expect(api.stateCalls).toHaveLength(2);
    expect(api.lastState().request.actions).toEqual(['forward']);
    expect(result.current.phase).toBe('submitting');
    expect(result.current.canAct).toBe(false);

    await settle(() => {
      api.lastState().resolve(makeView({ step: 1 }));
    });
    expect(result.current.actions).toEqual(['forward']);
    expect(savedActions()).toEqual(['forward']);
  });

  it('keeps the previous view when an action fails and retries the same request', async () => {
    const { api, result } = await startReadyGame();

    act(() => {
      void result.current.act('turn_left');
    });
    await settle(() => {
      api.lastState().reject(new ApiError('boom', { kind: 'http', status: 500 }));
    });

    expect(result.current.view?.step).toBe(0);
    expect(result.current.error).toBe('O servidor encontrou um erro inesperado.');
    expect(savedActions()).toEqual([]);

    act(() => {
      result.current.retry();
    });
    expect(api.lastState().request.actions).toEqual(['turn_left']);
  });

  it('applies the action chosen by the agent and keeps its explanation', async () => {
    const { api, result } = await startReadyGame();

    act(() => {
      void result.current.agentStep();
    });
    expect(result.current.pending).toBe('thinking');
    expect(api.lastDecide().request.actions).toEqual([]);

    const decision = {
      action: 'forward' as const,
      explanation: 'KB ⊨ ¬P[2,1]',
      plan: ['forward' as const],
    };
    await settle(() => {
      api.lastDecide().resolve({ decision, view: makeView({ step: 1 }) });
    });

    expect(result.current.lastDecision).toEqual(decision);
    expect(result.current.actions).toEqual(['forward']);
    expect(savedActions()).toEqual(['forward']);
  });

  it('starting a new game cancels the request in flight and ignores its answer', async () => {
    const { api, result } = await startReadyGame();
    const newConfig = { ...SLIDES_CONFIG, preset: 'random' as const, size: 6, seed: 3 };

    act(() => {
      void result.current.act('forward');
    });
    const stale = api.lastState();
    act(() => {
      void result.current.newGame(newConfig);
    });

    expect(stale.signal?.aborted).toBe(true);
    await settle(() => {
      stale.resolve(makeView({ step: 99 }));
      api.lastState().resolve(makeView({ config: newConfig }));
    });
    await waitFor(() => {
      expect(result.current.view?.config).toEqual(newConfig);
    });
    expect(result.current.actions).toEqual([]);
  });

  it('does not act after the game is over', async () => {
    const { api, result } = setupStarting();
    await settle(() => {
      api.lastState().resolve(makeView({ status: 'won' }));
    });

    let outcome: unknown = 'not called';
    await act(async () => {
      outcome = await result.current.act('forward');
    });
    expect(outcome).toBeNull();
    expect(api.stateCalls).toHaveLength(1);
    expect(result.current.canAct).toBe(false);
  });
});
