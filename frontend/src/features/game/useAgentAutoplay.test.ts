import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '../../api/types';
import { makeView } from '../../test/factories';
import { AUTOPLAY_DELAYS_MS, useAgentAutoplay } from './useAgentAutoplay';

interface Props {
  readonly canAct: boolean;
  readonly step: number;
  readonly agentStep: () => Promise<GameView | null>;
}

describe('useAgentAutoplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks the agent for one step after the configured delay', async () => {
    const agentStep = vi.fn().mockResolvedValue(makeView({ step: 1 }));
    const { result } = renderHook(() => useAgentAutoplay({ canAct: true, step: 0, agentStep }));

    act(() => {
      result.current.play();
    });
    expect(agentStep).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOPLAY_DELAYS_MS.normal);
    });
    expect(agentStep).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(true);
  });

  it('schedules the next step only after the previous one is confirmed', async () => {
    const agentStep = vi.fn().mockResolvedValue(makeView({ step: 1 }));
    const { result, rerender } = renderHook((props: Props) => useAgentAutoplay(props), {
      initialProps: { canAct: true, step: 0, agentStep },
    });

    act(() => {
      result.current.setSpeed('fast');
      result.current.play();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOPLAY_DELAYS_MS.fast);
    });
    rerender({ canAct: false, step: 0, agentStep });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOPLAY_DELAYS_MS.fast * 3);
    });
    expect(agentStep).toHaveBeenCalledTimes(1);

    rerender({ canAct: true, step: 1, agentStep });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOPLAY_DELAYS_MS.fast);
    });
    expect(agentStep).toHaveBeenCalledTimes(2);
  });

  it('stops when the game ends or a step fails', async () => {
    const agentStep = vi.fn().mockResolvedValue(makeView({ status: 'won' }));
    const { result } = renderHook(() => useAgentAutoplay({ canAct: true, step: 0, agentStep }));

    act(() => {
      result.current.play();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOPLAY_DELAYS_MS.normal);
    });
    expect(result.current.isPlaying).toBe(false);

    agentStep.mockResolvedValue(null);
    act(() => {
      result.current.play();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOPLAY_DELAYS_MS.normal);
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it('does not start when the agent cannot act, and can be paused', async () => {
    const agentStep = vi.fn().mockResolvedValue(makeView());
    const { result, rerender } = renderHook((props: Props) => useAgentAutoplay(props), {
      initialProps: { canAct: false, step: 0, agentStep },
    });

    act(() => {
      result.current.play();
    });
    expect(result.current.isPlaying).toBe(false);

    rerender({ canAct: true, step: 0, agentStep });
    act(() => {
      result.current.play();
      result.current.pause();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOPLAY_DELAYS_MS.slow);
    });
    expect(agentStep).not.toHaveBeenCalled();
  });
});
