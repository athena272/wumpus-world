import type {
  Action,
  BreezeMode,
  GameConfig,
  GameEvent,
  GameStatus,
  GameView,
  Orientation,
  Origin,
  Percept,
  Position,
  Preset,
} from '../../api/types';
import type { PendingKind } from './gameReducer';

export function formatPosition({ x, y }: Position): string {
  return `[${x},${y}]`;
}

export function positionKey({ x, y }: Position): string {
  return `${x},${y}`;
}

export function samePosition(a: Position | null, b: Position | null): boolean {
  return a !== null && b !== null && a.x === b.x && a.y === b.y;
}

export const ACTION_LABELS: Record<Action, string> = {
  turn_left: 'Girar à esquerda',
  turn_right: 'Girar à direita',
  forward: 'Avançar',
  grab: 'Pegar',
  shoot: 'Atirar',
  climb: 'Sair',
};

export const WIN_GOAL = 'Pegue o ouro, volte para [1,1] e use Sair.';

/** Mirrors the scores in `backend/wumpus/domain/game.py`. */
export const SCORING_RULES =
  '+1000 ao sair com o ouro, −1 por ação, −10 pela flecha e −1000 se morrer.';

export const ORIENTATION_LABELS: Record<Orientation, string> = {
  north: 'norte',
  east: 'leste',
  south: 'sul',
  west: 'oeste',
};

export const STATUS_LABELS: Record<GameStatus, string> = {
  playing: 'Em jogo',
  won: 'Vitória',
  escaped: 'Saiu sem o ouro',
  dead: 'Morreu',
};

export const ORIGIN_LABELS: Record<Origin, string> = {
  rule: 'Regra',
  percept: 'Percepção',
  action: 'Ação',
};

export const PRESET_LABELS: Record<Preset, string> = {
  random: 'Aleatório',
  slides: 'Mapa dos slides',
};

export const BREEZE_MODE_LABELS: Record<BreezeMode, string> = {
  classic: 'Brisa clássica',
  intensity: 'Brisa com intensidade',
};

export const PENDING_LABELS: Record<PendingKind, string> = {
  starting: 'Gerando a caverna...',
  restoring: 'Restaurando a partida salva...',
  acting: 'Executando a ação...',
  thinking: 'O agente está pensando...',
};

export const SLOW_REQUEST_HINT =
  'Acordando o servidor... a primeira resposta pode levar alguns segundos.';

export function describeConfig(config: GameConfig): string {
  const parts = [
    `${config.size}×${config.size}`,
    PRESET_LABELS[config.preset],
    BREEZE_MODE_LABELS[config.breezeMode],
  ];
  if (config.preset === 'random') parts.push(`código ${config.seed}`);
  return parts.join(' · ');
}

/** Percept vector in the order used in class: [Fedor, Brisa, Resplendor, Impacto, Grito]. */
export function formatPerceptVector(percept: Percept): string {
  const breeze =
    percept.breeze === 0 ? 'Nada' : percept.breeze === 1 ? 'Brisa' : `Brisa ×${percept.breeze}`;
  return `[${[
    percept.stench ? 'Fedor' : 'Nada',
    breeze,
    percept.glitter ? 'Resplendor' : 'Nada',
    percept.bump ? 'Impacto' : 'Nada',
    percept.scream ? 'Grito' : 'Nada',
  ].join(', ')}]`;
}

export function describeEvent(event: GameEvent, view: GameView): string {
  switch (event) {
    case 'turned':
      return `Agora você está virado para o ${ORIENTATION_LABELS[view.agent.orientation]}.`;
    case 'moved':
      return `Você avançou para ${formatPosition(view.agent.position)}.`;
    case 'bumped':
      return 'Tum! Você bateu na parede.';
    case 'fell_into_pit':
      return 'Você caiu em um poço.';
    case 'eaten_by_wumpus':
      return 'O Wumpus te devorou.';
    case 'grabbed_gold':
      return 'Você pegou o ouro! Agora volte para [1,1] e saia da caverna.';
    case 'nothing_to_grab':
      return 'Não há nada para pegar aqui.';
    case 'shot_hit':
      return 'Um grito ecoou pela caverna: o Wumpus morreu!';
    case 'shot_missed':
      return 'A flecha não acertou nada.';
    case 'no_arrow':
      return 'Você não tem mais flechas.';
    case 'climbed_with_gold':
      return 'Você saiu da caverna com o ouro.';
    case 'climbed_without_gold':
      return 'Você saiu da caverna sem o ouro.';
    case 'cannot_climb':
      return 'Só é possível sair da caverna pela casa [1,1].';
  }
}
