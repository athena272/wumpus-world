import { createContext, useContext } from 'react';
import type { GameApi } from './gameApi';

export const GameApiContext = createContext<GameApi | null>(null);

export function useGameApi(): GameApi {
  const api = useContext(GameApiContext);
  if (!api) throw new Error('useGameApi must be used inside <GameApiProvider>');
  return api;
}
