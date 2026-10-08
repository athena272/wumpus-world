import { act } from '@testing-library/react';

/** Runs `callback` inside act and lets pending promise callbacks (fake API answers) finish. */
export async function settle(callback: () => void): Promise<void> {
  await act(async () => {
    callback();
    await Promise.resolve();
  });
}
