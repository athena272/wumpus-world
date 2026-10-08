import type { ReactNode } from 'react';
import type { GameApi } from './gameApi';
import { GameApiContext } from './gameApiContext';

interface GameApiProviderProps {
  readonly api: GameApi;
  readonly children: ReactNode;
}

export function GameApiProvider({ api, children }: GameApiProviderProps) {
  return <GameApiContext value={api}>{children}</GameApiContext>;
}
