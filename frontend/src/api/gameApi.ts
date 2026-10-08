import type { HttpClient } from './httpClient';
import type { AgentDecisionResponse, GameRequest, GameView } from './types';

/** Operations the UI needs. Tests inject a fake implementation through context. */
export interface GameApi {
  getState(request: GameRequest, signal?: AbortSignal): Promise<GameView>;
  decide(request: GameRequest, signal?: AbortSignal): Promise<AgentDecisionResponse>;
}

export function createHttpGameApi(client: HttpClient): GameApi {
  return {
    getState: (request, signal) => client.postJson<GameView>('/api/games/state', request, signal),
    decide: (request, signal) =>
      client.postJson<AgentDecisionResponse>('/api/agent/decide', request, signal),
  };
}
