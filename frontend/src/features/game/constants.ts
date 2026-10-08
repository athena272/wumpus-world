import type { Action, BreezeMode, GameConfig, Orientation, Preset } from '../../api/types';

export const ACTIONS = [
  'turn_left',
  'turn_right',
  'forward',
  'grab',
  'shoot',
  'climb',
] as const satisfies readonly Action[];

export const BREEZE_MODES = ['classic', 'intensity'] as const satisfies readonly BreezeMode[];

export const PRESETS = ['random', 'slides'] as const satisfies readonly Preset[];

export const ORIENTATIONS = [
  'north',
  'east',
  'south',
  'west',
] as const satisfies readonly Orientation[];

export const MIN_BOARD_SIZE = 4;
export const MAX_BOARD_SIZE = 8;
export const SLIDES_BOARD_SIZE = 4;
/** Limits mirrored from the API schema (`backend/wumpus/api/schemas.py`). */
export const MAX_SEED = 2 ** 31 - 1;
export const MAX_SEED_DIGITS = String(MAX_SEED).length;
export const MIN_PIT_PROBABILITY = 0.05;
export const MAX_PIT_PROBABILITY = 0.4;
export const MAX_ACTIONS = 1000;
export const PIT_PROBABILITIES = [0.1, 0.15, 0.2, 0.25, 0.3] as const;

export function randomSeed(): number {
  return Math.floor(Math.random() * MAX_SEED);
}

/** Choices preselected in the setup form: the map of the slides, familiar from class. */
export function createDefaultGameConfig(): GameConfig {
  return {
    size: SLIDES_BOARD_SIZE,
    seed: 0,
    pitProbability: 0.2,
    breezeMode: 'classic',
    preset: 'slides',
  };
}
