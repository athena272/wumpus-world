import type { GameConfig } from '../../api/types';
import { Panel } from '../../components/Panel/Panel';
import { Sprite } from '../../components/Sprite/Sprite';
import { GameGoal } from './GameGoal';
import { GameSetupForm } from './GameSetupForm';

interface GameSetupProps {
  readonly initial: GameConfig;
  readonly onSubmit: (config: GameConfig) => void;
  readonly className?: string;
}

/** First screen when there is no game yet: the player picks the map and the rules. */
export function GameSetup({ initial, onSubmit, className }: GameSetupProps) {
  return (
    <Panel
      title="Monte sua caverna"
      subtitle="Escolha o mapa e as regras da brisa. Depois é só jogar ou deixar o agente lógico explorar."
      icon={<Sprite name="wumpus" />}
      tone="gold"
      className={className}
    >
      <GameGoal />
      <GameSetupForm initial={initial} onSubmit={onSubmit} />
    </Panel>
  );
}
