import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { describeApiError, toApiError } from '../../api/ApiError';
import { useGameApi } from '../../api/gameApiContext';
import type { Action, Decision, GameConfig, GameRequest, GameView } from '../../api/types';
import { SLOW_REQUEST_MS } from '../../config';
import { savedGameRepository, type SavedGameRepository } from '../../services/savedGame';
import {
  gameReducer,
  initialGameState,
  selectCanAct,
  selectPhase,
  type GamePhase,
  type PendingKind,
} from './gameReducer';

export const RESTORE_FAILED_NOTICE =
  'Não foi possível restaurar a partida salva. Escolha as configurações de um jogo novo.';

interface Job {
  readonly kind: PendingKind;
  readonly call: 'state' | 'decide';
  readonly request: GameRequest;
  /** Called instead of showing an error when the server rejects the game (409/422). */
  readonly onRejected?: () => void;
}

export interface UseWumpusGameOptions {
  readonly repository?: SavedGameRepository;
}

export interface WumpusGame {
  readonly phase: GamePhase;
  readonly view: GameView | null;
  readonly actions: readonly Action[];
  readonly pending: PendingKind | null;
  readonly isSlow: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly lastDecision: Decision | null;
  readonly canAct: boolean;
  readonly newGame: (config: GameConfig) => Promise<GameView | null>;
  readonly act: (action: Action) => Promise<GameView | null>;
  readonly agentStep: () => Promise<GameView | null>;
  readonly retry: () => void;
  readonly dismissError: () => void;
  readonly dismissNotice: () => void;
}

/**
 * Owns the game session on the client: the confirmed config and actions, the latest view
 * from the server and every loading or error state. Only one request runs at a time.
 */
export function useWumpusGame(options: UseWumpusGameOptions = {}): WumpusGame {
  const api = useGameApi();
  const [repository] = useState(() => options.repository ?? savedGameRepository);
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const controllerRef = useRef<AbortController | null>(null);
  const lastJobRef = useRef<Job | null>(null);

  const execute = useCallback(
    (job: Job): Promise<GameView | null> => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      lastJobRef.current = job;
      dispatch({ type: 'request_started', kind: job.kind });
      const slowTimer = window.setTimeout(() => {
        dispatch({ type: 'request_slow' });
      }, SLOW_REQUEST_MS);

      const call =
        job.call === 'decide'
          ? api.decide(job.request, controller.signal)
          : api.getState(job.request, controller.signal).then((view) => ({ view, decision: null }));

      return call
        .then(
          ({ view, decision }) => {
            if (controller.signal.aborted) return null;
            const actions = decision
              ? [...job.request.actions, decision.action]
              : job.request.actions;
            const request = { config: job.request.config, actions };
            repository.save(request);
            dispatch({ type: 'request_succeeded', request, view, decision });
            return view;
          },
          (error: unknown) => {
            if (controller.signal.aborted) return null;
            const apiError = toApiError(error);
            if (job.onRejected && apiError.isRejectedGame) {
              job.onRejected();
              return null;
            }
            dispatch({ type: 'request_failed', message: describeApiError(apiError) });
            return null;
          },
        )
        .finally(() => {
          window.clearTimeout(slowTimer);
          if (controllerRef.current === controller) controllerRef.current = null;
        });
    },
    [api, repository],
  );

  useEffect(() => {
    const saved = repository.load();
    if (saved) {
      void execute({
        kind: 'restoring',
        call: 'state',
        request: saved,
        onRejected: () => {
          repository.clear();
          dispatch({ type: 'restore_rejected', message: RESTORE_FAILED_NOTICE });
        },
      });
    }
    return () => {
      controllerRef.current?.abort();
    };
  }, [execute, repository]);

  const { request, view } = state;

  const newGame = useCallback(
    (config: GameConfig) =>
      execute({ kind: 'starting', call: 'state', request: { config, actions: [] } }),
    [execute],
  );

  const act = useCallback(
    (action: Action) => {
      if (!request || view?.status !== 'playing' || controllerRef.current) {
        return Promise.resolve(null);
      }
      const next = { config: request.config, actions: [...request.actions, action] };
      return execute({ kind: 'acting', call: 'state', request: next });
    },
    [execute, request, view],
  );

  const agentStep = useCallback(() => {
    if (!request || view?.status !== 'playing' || controllerRef.current) {
      return Promise.resolve(null);
    }
    return execute({ kind: 'thinking', call: 'decide', request });
  }, [execute, request, view]);

  const retry = useCallback(() => {
    if (lastJobRef.current) void execute(lastJobRef.current);
  }, [execute]);

  const dismissError = useCallback(() => {
    dispatch({ type: 'error_dismissed' });
  }, []);

  const dismissNotice = useCallback(() => {
    dispatch({ type: 'notice_dismissed' });
  }, []);

  return {
    phase: selectPhase(state),
    view,
    actions: request?.actions ?? [],
    pending: state.pending,
    isSlow: state.slow,
    error: state.error,
    notice: state.notice,
    lastDecision: state.lastDecision,
    canAct: selectCanAct(state),
    newGame,
    act,
    agentStep,
    retry,
    dismissError,
    dismissNotice,
  };
}
