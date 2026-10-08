"""Partida reconstruída a partir da configuração e do histórico de ações.

A API não guarda estado: cada requisição traz ``config`` e ``actions`` e a sessão é
reconstruída aplicando as ações em ordem. O mundo real fica no ``GameState``; a KB só
recebe o que o agente percebe.
"""

from __future__ import annotations

from collections.abc import Iterable

from wumpus.agent.hybrid_agent import AgentView, Decision, decide
from wumpus.agent.inference import Inference, PitModels, infer, pit_models
from wumpus.agent.wumpus_kb import WumpusKnowledgeBase
from wumpus.domain.errors import GameOverError
from wumpus.domain.game import GameState, apply_action, new_game
from wumpus.domain.types import Action, GameStatus
from wumpus.domain.world import GameConfig, World, build_world


class GameSession:
    def __init__(self, config: GameConfig, world: World | None = None) -> None:
        """``world`` overrides the one derived from ``config``; useful for scenario tests."""
        self.config = config
        self.actions: list[Action] = []
        self.state: GameState = new_game(world or build_world(config), config.breeze_mode)
        self.knowledge = WumpusKnowledgeBase(config.size, config.breeze_mode)
        self.knowledge.observe(self.state.agent.position, self.state.percept, step=0)
        self._inference: Inference | None = None
        self._pit_models: PitModels | None = None

    @classmethod
    def replay(cls, config: GameConfig, actions: Iterable[Action]) -> GameSession:
        session = cls(config)
        for action in actions:
            session.apply(action)
        return session

    def apply(self, action: Action) -> None:
        previous = self.state
        self.state = apply_action(previous, action)
        self.actions.append(action)
        self._inference = None
        self._pit_models = None
        if self.state.status is GameStatus.DEAD:
            return
        if action is Action.SHOOT and previous.agent.has_arrow:
            self.knowledge.observe_shot(
                previous.agent.position,
                previous.agent.orientation,
                scream=self.state.percept.scream,
                step=self.state.step,
            )
        self.knowledge.observe(self.state.agent.position, self.state.percept, self.state.step)

    @property
    def inference(self) -> Inference:
        if self._inference is None:
            self._inference = infer(self.knowledge)
        return self._inference

    @property
    def pit_models(self) -> PitModels:
        if self._pit_models is None:
            self._pit_models = pit_models(self.knowledge, self.inference.possible_wumpus_cells())
        return self._pit_models

    def agent_view(self) -> AgentView:
        agent = self.state.agent
        return AgentView(
            position=agent.position,
            orientation=agent.orientation,
            has_gold=agent.has_gold,
            has_arrow=agent.has_arrow,
            percept=self.state.percept,
            size=self.config.size,
        )

    def decide(self) -> Decision:
        if self.state.is_over:
            raise GameOverError(self.state.step)
        return decide(self.agent_view(), self.inference)
