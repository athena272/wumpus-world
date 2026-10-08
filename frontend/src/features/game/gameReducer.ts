import type { Decision, GameRequest, GameView } from '../../api/types';

/** What the UI is waiting for, so every loading message can be specific. */
export type PendingKind = 'starting' | 'restoring' | 'acting' | 'thinking';

export type GamePhase = 'idle' | 'loading' | 'ready' | 'submitting' | 'error';

export interface GameState {
  /** Config and actions confirmed by the server; this is what gets saved. */
  readonly request: GameRequest | null;
  readonly view: GameView | null;
  readonly pending: PendingKind | null;
  readonly slow: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly lastDecision: Decision | null;
}

export type GameStateEvent =
  | { readonly type: 'request_started'; readonly kind: PendingKind }
  | { readonly type: 'request_slow' }
  | {
      readonly type: 'request_succeeded';
      readonly request: GameRequest;
      readonly view: GameView;
      readonly decision: Decision | null;
    }
  | { readonly type: 'request_failed'; readonly message: string }
  | { readonly type: 'restore_rejected'; readonly message: string }
  | { readonly type: 'notice_shown'; readonly message: string }
  | { readonly type: 'notice_dismissed' }
  | { readonly type: 'error_dismissed' };

export const initialGameState: GameState = {
  request: null,
  view: null,
  pending: null,
  slow: false,
  error: null,
  notice: null,
  lastDecision: null,
};

export function gameReducer(state: GameState, event: GameStateEvent): GameState {
  switch (event.type) {
    case 'request_started':
      return { ...state, pending: event.kind, slow: false, error: null };
    case 'request_slow':
      return state.pending ? { ...state, slow: true } : state;
    case 'request_succeeded':
      return {
        ...state,
        request: event.request,
        view: event.view,
        lastDecision: event.decision,
        pending: null,
        slow: false,
        error: null,
      };
    case 'request_failed':
      return { ...state, pending: null, slow: false, error: event.message };
    case 'restore_rejected':
      return { ...state, pending: null, slow: false, notice: event.message };
    case 'notice_shown':
      return { ...state, notice: event.message };
    case 'notice_dismissed':
      return { ...state, notice: null };
    case 'error_dismissed':
      return { ...state, error: null };
  }
}

export function selectPhase(state: GameState): GamePhase {
  if (state.view) return state.pending ? 'submitting' : 'ready';
  if (state.pending) return 'loading';
  return state.error ? 'error' : 'idle';
}

export function selectCanAct(state: GameState): boolean {
  return state.view?.status === 'playing' && state.pending === null;
}
