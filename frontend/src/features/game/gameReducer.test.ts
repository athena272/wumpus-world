import { describe, expect, it } from 'vitest';
import { makeView, SLIDES_CONFIG } from '../../test/factories';
import { gameReducer, initialGameState, selectCanAct, selectPhase } from './gameReducer';

describe('gameReducer', () => {
  it('moves from idle to loading to ready', () => {
    expect(selectPhase(initialGameState)).toBe('idle');
    const loading = gameReducer(initialGameState, { type: 'request_started', kind: 'starting' });
    expect(selectPhase(loading)).toBe('loading');
    const ready = gameReducer(loading, {
      type: 'request_succeeded',
      request: { config: SLIDES_CONFIG, actions: [] },
      view: makeView(),
      decision: null,
    });
    expect(selectPhase(ready)).toBe('ready');
    expect(selectCanAct(ready)).toBe(true);
  });

  it('ignores a slow signal when nothing is pending', () => {
    expect(gameReducer(initialGameState, { type: 'request_slow' })).toBe(initialGameState);
  });

  it('clears the previous error when a new request starts', () => {
    const failed = gameReducer(initialGameState, { type: 'request_failed', message: 'x' });
    expect(selectPhase(failed)).toBe('error');
    const retried = gameReducer(failed, { type: 'request_started', kind: 'starting' });
    expect(retried.error).toBeNull();
  });

  it('goes back to idle with a notice when the saved game is rejected', () => {
    const restoring = gameReducer(initialGameState, { type: 'request_started', kind: 'restoring' });
    const rejected = gameReducer(restoring, { type: 'restore_rejected', message: 'aviso' });
    expect(selectPhase(rejected)).toBe('idle');
    expect(rejected.notice).toBe('aviso');
    expect(rejected.error).toBeNull();
  });

  it('cannot act while submitting or after the end', () => {
    const ready = { ...initialGameState, view: makeView() };
    expect(selectCanAct({ ...ready, pending: 'acting' })).toBe(false);
    expect(selectCanAct({ ...ready, view: makeView({ status: 'dead' }) })).toBe(false);
  });
});
