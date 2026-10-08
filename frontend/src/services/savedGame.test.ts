import { describe, expect, it } from 'vitest';
import type { GameRequest } from '../api/types';
import { SAVED_GAME_KEY, createSavedGameRepository } from './savedGame';
import { createSafeStore } from './storage';

const GAME: GameRequest = {
  config: { size: 6, seed: 42, pitProbability: 0.2, breezeMode: 'intensity', preset: 'random' },
  actions: ['forward', 'turn_left', 'shoot'],
};

function storeRaw(value: unknown): void {
  window.localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(value));
}

describe('savedGameRepository', () => {
  it('round-trips config and actions with a version tag', () => {
    const repository = createSavedGameRepository();
    repository.save(GAME);

    expect(JSON.parse(window.localStorage.getItem(SAVED_GAME_KEY) ?? '')).toMatchObject({
      version: 1,
    });
    expect(repository.load()).toEqual(GAME);
  });

  it('returns null when nothing was saved', () => {
    expect(createSavedGameRepository().load()).toBeNull();
  });

  it('clears the saved game', () => {
    const repository = createSavedGameRepository();
    repository.save(GAME);
    repository.clear();
    expect(repository.load()).toBeNull();
  });

  it.each([
    ['corrupted JSON', '{not json'],
    ['an old version', JSON.stringify({ version: 0, ...GAME })],
    ['an unknown action', JSON.stringify({ version: 1, config: GAME.config, actions: ['fly'] })],
    [
      'a board too large',
      JSON.stringify({ version: 1, config: { ...GAME.config, size: 20 }, actions: [] }),
    ],
    [
      'an unknown breeze mode',
      JSON.stringify({ version: 1, config: { ...GAME.config, breezeMode: 'storm' }, actions: [] }),
    ],
    ['an array', JSON.stringify([GAME])],
    [
      'a seed out of range',
      JSON.stringify({ version: 1, config: { ...GAME.config, seed: 2 ** 31 }, actions: [] }),
    ],
    [
      'a seed stored as text',
      JSON.stringify({ version: 1, config: { ...GAME.config, seed: '42' }, actions: [] }),
    ],
    [
      'a pit probability out of range',
      JSON.stringify({ version: 1, config: { ...GAME.config, pitProbability: 5 }, actions: [] }),
    ],
    [
      'more actions than the server accepts',
      JSON.stringify({ version: 1, config: GAME.config, actions: Array(1001).fill('turn_left') }),
    ],
  ])('discards %s without throwing', (_label, raw) => {
    window.localStorage.setItem(SAVED_GAME_KEY, raw);
    const repository = createSavedGameRepository();

    expect(repository.load()).toBeNull();
    expect(window.localStorage.getItem(SAVED_GAME_KEY)).toBeNull();
  });

  it('works when localStorage is unavailable', () => {
    const repository = createSavedGameRepository(createSafeStore(() => null));
    repository.save(GAME);
    expect(repository.load()).toEqual(GAME);
  });

  it('drops unknown fields stored next to the config', () => {
    storeRaw({ version: 1, config: { ...GAME.config, admin: true }, actions: GAME.actions });
    expect(createSavedGameRepository().load()).toEqual(GAME);
  });

  it('accepts a fractional pit probability and the slides preset', () => {
    storeRaw({
      version: 1,
      config: { size: 4, seed: 0, pitProbability: 0.15, breezeMode: 'classic', preset: 'slides' },
      actions: [],
    });
    expect(createSavedGameRepository().load()?.config.preset).toBe('slides');
  });
});
