"""Contratos HTTP (Pydantic). Os campos são expostos em camelCase para o frontend.

O frontend gera os tipos TypeScript a partir do OpenAPI destes modelos (``pnpm gen:api``).
"""

from __future__ import annotations

from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

from wumpus.agent.inference import Truth
from wumpus.agent.knowledge_base import Origin
from wumpus.domain.game import GameEvent
from wumpus.domain.types import Action, BreezeMode, GameStatus, Orientation
from wumpus.domain.world import MAX_SIZE, MIN_SIZE, SLIDES_WORLD, GameConfig, Preset

MAX_ACTIONS = 1000
MAX_SEED = 2**31 - 1


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
        frozen=True,
    )


class InputModel(ApiModel):
    """Body sent by clients: unknown fields are refused instead of silently ignored."""

    model_config = ConfigDict(extra="forbid")


class PositionOut(ApiModel):
    x: int
    y: int


class GameConfigIn(InputModel):
    # strict: numbers must arrive as JSON numbers; "42", 4.0 and true are rejected, not coerced.
    size: int = Field(default=4, ge=MIN_SIZE, le=MAX_SIZE, strict=True)
    seed: int = Field(default=0, ge=0, le=MAX_SEED, strict=True)
    pit_probability: float = Field(default=0.2, ge=0.05, le=0.4, strict=True, allow_inf_nan=False)
    breeze_mode: BreezeMode = BreezeMode.CLASSIC
    preset: Preset = Preset.RANDOM

    @model_validator(mode="after")
    def _slides_board_is_fixed(self) -> Self:
        side = SLIDES_WORLD.size
        if self.preset is Preset.SLIDES and self.size != side:
            raise ValueError(f"O mapa dos slides usa uma grade {side}x{side}.")
        return self

    def to_domain(self) -> GameConfig:
        return GameConfig(
            size=self.size,
            seed=self.seed,
            pit_probability=self.pit_probability,
            breeze_mode=self.breeze_mode,
            preset=self.preset,
        )


class GameRequest(InputModel):
    config: GameConfigIn
    actions: list[Action] = Field(default_factory=list, max_length=MAX_ACTIONS)


class AgentOut(ApiModel):
    position: PositionOut
    orientation: Orientation
    has_gold: bool
    has_arrow: bool


class PerceptOut(ApiModel):
    stench: bool
    breeze: int = Field(ge=0, le=4)
    glitter: bool
    bump: bool
    scream: bool


class CellOut(ApiModel):
    position: PositionOut
    visited: bool
    pit: Truth
    wumpus: Truth
    safe: bool
    percept: PerceptOut | None = Field(
        description="Última percepção registrada na casa; só existe para casas visitadas."
    )


class KbEntryOut(ApiModel):
    id: str
    text: str
    description: str
    origin: Origin
    step: int
    clause_count: int


class KbStatsOut(ApiModel):
    sentences: int
    clauses: int
    symbols: int


class KnowledgeBaseOut(ApiModel):
    entries: list[KbEntryOut]
    stats: KbStatsOut


class AskResultOut(ApiModel):
    position: PositionOut
    query: str
    entailed: bool


class PitModelsOut(ApiModel):
    symbols: list[str]
    total_assignments: int
    model_count: int
    models: list[dict[str, bool]]
    truncated: bool
    skipped: bool


class WorldOut(ApiModel):
    wumpus: PositionOut
    gold: PositionOut
    pits: list[PositionOut]
    wumpus_alive: bool


class GameView(ApiModel):
    config: GameConfigIn
    status: GameStatus
    score: int
    step: int
    agent: AgentOut
    percept: PerceptOut
    events: list[GameEvent]
    wumpus_dead_known: bool = Field(description="A KB prova que o Wumpus está morto.")
    cells: list[CellOut]
    knowledge_base: KnowledgeBaseOut
    queries: list[AskResultOut]
    pit_models: PitModelsOut
    world: WorldOut | None = Field(description="Mundo real, revelado só quando a partida termina.")


class DecisionOut(ApiModel):
    action: Action
    explanation: str
    plan: list[Action]


class AgentDecisionResponse(ApiModel):
    decision: DecisionOut
    view: GameView


class HealthResponse(ApiModel):
    status: Literal["ok"]


class ErrorBody(ApiModel):
    code: str
    message: str
    details: list[str] = Field(default_factory=list)


class ErrorResponse(ApiModel):
    error: ErrorBody
