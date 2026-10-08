import type { components } from './schema';

type Schemas = components['schemas'];

export type Action = Schemas['Action'];
export type AgentDecisionResponse = Schemas['AgentDecisionResponse'];
export type AskResult = Schemas['AskResultOut'];
export type BreezeMode = Schemas['BreezeMode'];
export type CellView = Schemas['CellOut'];
export type Decision = Schemas['DecisionOut'];
export type ErrorResponse = Schemas['ErrorResponse'];
export type GameConfig = Schemas['GameConfigIn'];
export type GameEvent = Schemas['GameEvent'];
export type GameStatus = Schemas['GameStatus'];
export type GameView = Schemas['GameView'];
export type KbEntry = Schemas['KbEntryOut'];
export type Orientation = Schemas['Orientation'];
export type Origin = Schemas['Origin'];
export type Percept = Schemas['PerceptOut'];
export type PitModels = Schemas['PitModelsOut'];
export type Position = Schemas['PositionOut'];
export type Preset = Schemas['Preset'];
export type Truth = Schemas['Truth'];

export interface GameRequest {
  readonly config: GameConfig;
  readonly actions: readonly Action[];
}
