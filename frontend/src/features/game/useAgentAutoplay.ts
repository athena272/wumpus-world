import { useCallback, useEffect, useState } from 'react';
import type { GameView } from '../../api/types';

export const AUTOPLAY_DELAYS_MS = { slow: 1200, normal: 600, fast: 200 } as const;
export type AutoplaySpeed = keyof typeof AUTOPLAY_DELAYS_MS;

interface AutoplayTarget {
  readonly canAct: boolean;
  /** Changes after every confirmed step, so the next one is scheduled. */
  readonly step: number;
  readonly agentStep: () => Promise<GameView | null>;
}

export interface AgentAutoplay {
  readonly isPlaying: boolean;
  readonly speed: AutoplaySpeed;
  readonly play: () => void;
  readonly pause: () => void;
  readonly setSpeed: (speed: AutoplaySpeed) => void;
}

/** Lets the logical agent play by itself, one request at a time, until the game ends. */
export function useAgentAutoplay({ canAct, step, agentStep }: AutoplayTarget): AgentAutoplay {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<AutoplaySpeed>('normal');

  useEffect(() => {
    if (!isPlaying || !canAct) return;
    const timer = window.setTimeout(() => {
      void agentStep().then((view) => {
        if (view?.status !== 'playing') setIsPlaying(false);
      });
    }, AUTOPLAY_DELAYS_MS[speed]);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isPlaying, canAct, agentStep, speed, step]);

  const play = useCallback(() => {
    if (canAct) setIsPlaying(true);
  }, [canAct]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return { isPlaying, speed, play, pause, setSpeed };
}
