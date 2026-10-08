"""Regras do jogo: aplicar ações, gerar percepções e calcular a medida de desempenho.

O estado é imutável e ``apply_action`` é determinística. Assim, a mesma configuração e a
mesma lista de ações sempre reconstroem a mesma partida, o que permite uma API sem estado.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from enum import StrEnum

from wumpus.domain.errors import GameOverError
from wumpus.domain.types import (
    START,
    Action,
    BreezeMode,
    GameStatus,
    Orientation,
    Percept,
    Position,
    line_of_fire,
)
from wumpus.domain.world import World

ACTION_COST = -1
ARROW_COST = -10
DEATH_PENALTY = -1000
GOLD_REWARD = 1000


class GameEvent(StrEnum):
    TURNED = "turned"
    MOVED = "moved"
    BUMPED = "bumped"
    FELL_INTO_PIT = "fell_into_pit"
    EATEN_BY_WUMPUS = "eaten_by_wumpus"
    GRABBED_GOLD = "grabbed_gold"
    NOTHING_TO_GRAB = "nothing_to_grab"
    SHOT_HIT = "shot_hit"
    SHOT_MISSED = "shot_missed"
    NO_ARROW = "no_arrow"
    CLIMBED_WITH_GOLD = "climbed_with_gold"
    CLIMBED_WITHOUT_GOLD = "climbed_without_gold"
    CANNOT_CLIMB = "cannot_climb"


@dataclass(frozen=True, slots=True)
class AgentState:
    position: Position = START
    orientation: Orientation = Orientation.EAST
    has_gold: bool = False
    has_arrow: bool = True


@dataclass(frozen=True, slots=True)
class GameState:
    world: World
    breeze_mode: BreezeMode
    agent: AgentState
    status: GameStatus
    score: int
    step: int
    wumpus_alive: bool
    visited: frozenset[Position]
    percept: Percept
    events: tuple[GameEvent, ...] = ()

    @property
    def is_over(self) -> bool:
        return self.status is not GameStatus.PLAYING


def new_game(world: World, breeze_mode: BreezeMode) -> GameState:
    agent = AgentState()
    return GameState(
        world=world,
        breeze_mode=breeze_mode,
        agent=agent,
        status=GameStatus.PLAYING,
        score=0,
        step=0,
        wumpus_alive=True,
        visited=frozenset({START}),
        percept=perceive(world, breeze_mode, agent),
    )


def perceive(
    world: World,
    breeze_mode: BreezeMode,
    agent: AgentState,
    *,
    bump: bool = False,
    scream: bool = False,
) -> Percept:
    pits_around = world.adjacent_pits(agent.position)
    breeze = pits_around if breeze_mode is BreezeMode.INTENSITY else min(pits_around, 1)
    return Percept(
        stench=world.is_next_to_wumpus(agent.position),
        breeze=breeze,
        glitter=agent.position == world.gold and not agent.has_gold,
        bump=bump,
        scream=scream,
    )


def apply_action(state: GameState, action: Action) -> GameState:
    if state.is_over:
        raise GameOverError(state.step)
    paid = replace(state, step=state.step + 1, score=state.score + ACTION_COST)
    match action:
        case Action.TURN_LEFT:
            return _turn(paid, paid.agent.orientation.turn_left())
        case Action.TURN_RIGHT:
            return _turn(paid, paid.agent.orientation.turn_right())
        case Action.FORWARD:
            return _forward(paid)
        case Action.GRAB:
            return _grab(paid)
        case Action.SHOOT:
            return _shoot(paid)
        case Action.CLIMB:
            return _climb(paid)


def _turn(state: GameState, orientation: Orientation) -> GameState:
    agent = replace(state.agent, orientation=orientation)
    return _settle(state, agent, (GameEvent.TURNED,))


def _forward(state: GameState) -> GameState:
    target = state.agent.position.moved(state.agent.orientation)
    if not target.is_inside(state.world.size):
        return _settle(state, state.agent, (GameEvent.BUMPED,), bump=True)

    agent = replace(state.agent, position=target)
    moved = replace(state, visited=state.visited | {target})
    if state.world.has_pit(target):
        return _die(moved, agent, GameEvent.FELL_INTO_PIT)
    if state.wumpus_alive and target == state.world.wumpus:
        return _die(moved, agent, GameEvent.EATEN_BY_WUMPUS)
    return _settle(moved, agent, (GameEvent.MOVED,))


def _grab(state: GameState) -> GameState:
    agent = state.agent
    if agent.position != state.world.gold or agent.has_gold:
        return _settle(state, agent, (GameEvent.NOTHING_TO_GRAB,))
    return _settle(state, replace(agent, has_gold=True), (GameEvent.GRABBED_GOLD,))


def _shoot(state: GameState) -> GameState:
    agent = state.agent
    if not agent.has_arrow:
        return _settle(state, agent, (GameEvent.NO_ARROW,))

    path = line_of_fire(agent.position, agent.orientation, state.world.size)
    hit = state.wumpus_alive and state.world.wumpus in path
    shot = replace(
        state, score=state.score + ARROW_COST, wumpus_alive=state.wumpus_alive and not hit
    )
    event = GameEvent.SHOT_HIT if hit else GameEvent.SHOT_MISSED
    return _settle(shot, replace(agent, has_arrow=False), (event,), scream=hit)


def _climb(state: GameState) -> GameState:
    agent = state.agent
    if agent.position != START:
        return _settle(state, agent, (GameEvent.CANNOT_CLIMB,))
    if agent.has_gold:
        won = replace(state, status=GameStatus.WON, score=state.score + GOLD_REWARD)
        return _settle(won, agent, (GameEvent.CLIMBED_WITH_GOLD,))
    escaped = replace(state, status=GameStatus.ESCAPED)
    return _settle(escaped, agent, (GameEvent.CLIMBED_WITHOUT_GOLD,))


def _die(state: GameState, agent: AgentState, cause: GameEvent) -> GameState:
    dead = replace(state, status=GameStatus.DEAD, score=state.score + DEATH_PENALTY)
    return _settle(dead, agent, (cause,))


def _settle(
    state: GameState,
    agent: AgentState,
    events: tuple[GameEvent, ...],
    *,
    bump: bool = False,
    scream: bool = False,
) -> GameState:
    percept = perceive(state.world, state.breeze_mode, agent, bump=bump, scream=scream)
    return replace(state, agent=agent, percept=percept, events=events)
