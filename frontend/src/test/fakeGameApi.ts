import { vi } from 'vitest';
import type { GameApi } from '../api/gameApi';
import type { AgentDecisionResponse, GameRequest, GameView } from '../api/types';

interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export interface PendingCall<T> extends Deferred<T> {
  readonly request: GameRequest;
  readonly signal: AbortSignal | undefined;
}

/** GameApi whose responses are settled manually by each test. */
export class FakeGameApi implements GameApi {
  readonly stateCalls: PendingCall<GameView>[] = [];
  readonly decideCalls: PendingCall<AgentDecisionResponse>[] = [];

  readonly getState = vi.fn((request: GameRequest, signal?: AbortSignal) => {
    const call = { ...deferred<GameView>(), request, signal };
    this.stateCalls.push(call);
    return call.promise;
  });

  readonly decide = vi.fn((request: GameRequest, signal?: AbortSignal) => {
    const call = { ...deferred<AgentDecisionResponse>(), request, signal };
    this.decideCalls.push(call);
    return call.promise;
  });

  lastState(): PendingCall<GameView> {
    const call = this.stateCalls.at(-1);
    if (!call) throw new Error('getState was not called');
    return call;
  }

  lastDecide(): PendingCall<AgentDecisionResponse> {
    const call = this.decideCalls.at(-1);
    if (!call) throw new Error('decide was not called');
    return call;
  }
}
