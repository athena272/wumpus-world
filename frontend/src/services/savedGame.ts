import type { Action, GameConfig, GameRequest } from '../api/types';
import {
  ACTIONS,
  BREEZE_MODES,
  MAX_ACTIONS,
  MAX_BOARD_SIZE,
  MAX_PIT_PROBABILITY,
  MAX_SEED,
  MIN_BOARD_SIZE,
  MIN_PIT_PROBABILITY,
  PRESETS,
} from '../features/game/constants';
import { createSafeStore, type KeyValueStore } from './storage';

export const SAVED_GAME_KEY = 'wumpus-world:saved-game';
const SAVED_GAME_VERSION = 1;

/** Only config and actions are stored: the server rebuilds everything else from them. */
export interface SavedGameRepository {
  load(): GameRequest | null;
  save(game: GameRequest): void;
  clear(): void;
}

export function createSavedGameRepository(
  store: KeyValueStore = createSafeStore(),
): SavedGameRepository {
  return {
    load() {
      const raw = store.read(SAVED_GAME_KEY);
      if (raw === null) return null;
      const game = parseSavedGame(raw);
      if (!game) store.remove(SAVED_GAME_KEY);
      return game;
    },
    save({ config, actions }) {
      store.write(
        SAVED_GAME_KEY,
        JSON.stringify({ version: SAVED_GAME_VERSION, config, actions: [...actions] }),
      );
    },
    clear() {
      store.remove(SAVED_GAME_KEY);
    },
  };
}

export const savedGameRepository = createSavedGameRepository();

function parseSavedGame(raw: string): GameRequest | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== SAVED_GAME_VERSION) return null;
  const { config, actions } = data;
  if (!isGameConfig(config) || !isActionList(actions)) return null;
  const { size, seed, pitProbability, breezeMode, preset } = config;
  // Rebuilt field by field so nothing else stored under the key reaches the API.
  return { config: { size, seed, pitProbability, breezeMode, preset }, actions: [...actions] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isGameConfig(value: unknown): value is GameConfig {
  if (!isRecord(value)) return false;
  const { size, seed, pitProbability, breezeMode, preset } = value;
  return (
    isIntegerBetween(size, MIN_BOARD_SIZE, MAX_BOARD_SIZE) &&
    isIntegerBetween(seed, 0, MAX_SEED) &&
    typeof pitProbability === 'number' &&
    Number.isFinite(pitProbability) &&
    pitProbability >= MIN_PIT_PROBABILITY &&
    pitProbability <= MAX_PIT_PROBABILITY &&
    isOneOf(breezeMode, BREEZE_MODES) &&
    isOneOf(preset, PRESETS)
  );
}

function isIntegerBetween(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isActionList(value: unknown): value is Action[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_ACTIONS &&
    value.every((action) => isOneOf(action, ACTIONS))
  );
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}
