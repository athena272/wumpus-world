import time

import pytest

from tests.agent.worlds import WUMPUS_EAST, WUMPUS_NORTH
from wumpus.agent.hybrid_agent import AgentView, decide
from wumpus.agent.inference import CellKnowledge, Inference, Truth
from wumpus.agent.session import GameSession
from wumpus.domain.errors import GameOverError
from wumpus.domain.types import (
    START,
    Action,
    BreezeMode,
    GameStatus,
    Orientation,
    Percept,
    Position,
    all_positions,
)
from wumpus.domain.world import GameConfig, Preset, World

MAX_STEPS = 400


def autoplay(config: GameConfig, world: World | None = None) -> GameSession:
    session = GameSession(config, world=world)
    for _ in range(MAX_STEPS):
        if session.state.is_over:
            return session
        session.apply(session.decide().action)
    raise AssertionError(f"Agent did not finish within {MAX_STEPS} steps: {config}")


def assert_inference_is_sound(session: GameSession) -> None:
    """Everything the KB proves must hold in the real (hidden) world."""
    world = session.state.world
    inference = session.inference
    for position, cell in inference.cells.items():
        if cell.safe:
            assert position not in world.pits, position
            assert not (session.state.wumpus_alive and world.wumpus == position), position
        if cell.pit is Truth.YES:
            assert position in world.pits, position
        if cell.pit is Truth.NO:
            assert position not in world.pits, position
        if cell.wumpus is Truth.YES:
            assert world.wumpus == position, position
        if cell.wumpus is Truth.NO:
            assert world.wumpus != position, position


def test_agent_wins_the_slides_world_without_risk() -> None:
    session = autoplay(GameConfig(preset=Preset.SLIDES))
    assert session.state.status is GameStatus.WON
    assert session.state.score > 950


def test_first_decision_explains_the_entailment() -> None:
    decision = GameSession(GameConfig(preset=Preset.SLIDES)).decide()
    assert decision.action in {Action.FORWARD, Action.TURN_LEFT}
    assert "KB ⊨" in decision.explanation


def test_agent_grabs_gold_when_it_glitters() -> None:
    to_gold = [
        Action.TURN_LEFT,
        Action.FORWARD,
        Action.SHOOT,
        Action.FORWARD,
        Action.TURN_RIGHT,
        Action.FORWARD,
    ]
    session = GameSession.replay(GameConfig(preset=Preset.SLIDES), to_gold)
    assert session.decide().action is Action.GRAB


@pytest.mark.parametrize("mode", list(BreezeMode))
def test_agent_shoots_before_risking_a_step(mode: BreezeMode) -> None:
    """Regressão: sem casa segura, o agente arriscava um passo com 50% de chance de morrer."""
    decision = GameSession(GameConfig(breeze_mode=mode), world=WUMPUS_NORTH).decide()
    assert decision.plan == (Action.TURN_LEFT, Action.SHOOT)
    assert "atirar" in decision.explanation


@pytest.mark.parametrize("mode", list(BreezeMode))
def test_agent_wins_when_the_shot_kills_the_wumpus_next_to_the_start(mode: BreezeMode) -> None:
    session = autoplay(GameConfig(breeze_mode=mode), world=WUMPUS_NORTH)
    assert session.state.status is GameStatus.WON


@pytest.mark.parametrize("mode", list(BreezeMode))
def test_agent_climbs_out_when_the_missed_shot_proves_both_neighbors_deadly(
    mode: BreezeMode,
) -> None:
    session = autoplay(GameConfig(breeze_mode=mode), world=WUMPUS_EAST)
    assert session.actions == [Action.TURN_LEFT, Action.SHOOT, Action.CLIMB]
    assert session.state.status is GameStatus.ESCAPED


def frontier_inference(frontier: dict[Position, tuple[Truth, Truth]]) -> Inference:
    """Only [1,1] visited; ``frontier`` maps a square to what the KB says of its pit and Wumpus."""
    cells = {
        position: CellKnowledge(
            position=position,
            visited=position == START,
            pit=Truth.NO if position == START else frontier.get(position, unknown)[0],
            wumpus=Truth.NO if position == START else frontier.get(position, unknown)[1],
            safe=position == START,
        )
        for position in all_positions(4)
        for unknown in [(Truth.UNKNOWN, Truth.UNKNOWN)]
    }
    return Inference(cells=cells, queries=(), wumpus_dead=False)


START_VIEW = AgentView(
    position=START,
    orientation=Orientation.EAST,
    has_gold=False,
    has_arrow=False,
    percept=Percept(stench=True, breeze=1),
    size=4,
)


def test_agent_does_not_risk_a_square_that_may_hide_a_pit_and_the_live_wumpus() -> None:
    unknown = (Truth.UNKNOWN, Truth.UNKNOWN)
    inference = frontier_inference({Position(1, 2): unknown, Position(2, 1): unknown})
    decision = decide(START_VIEW, inference)
    assert decision.action is Action.CLIMB
    assert "não compensa" in decision.explanation


def test_agent_still_risks_a_square_with_a_single_unknown_danger() -> None:
    inference = frontier_inference(
        {Position(1, 2): (Truth.UNKNOWN, Truth.UNKNOWN), Position(2, 1): (Truth.UNKNOWN, Truth.NO)}
    )
    decision = decide(START_VIEW, inference)
    assert decision.plan == (Action.FORWARD,)
    assert "Arriscando [2,1]" in decision.explanation


def test_deciding_after_the_end_is_an_error() -> None:
    session = GameSession.replay(GameConfig(preset=Preset.SLIDES), [Action.CLIMB])
    with pytest.raises(GameOverError):
        session.decide()


@pytest.mark.parametrize("mode", list(BreezeMode))
@pytest.mark.parametrize("seed", range(25))
def test_agent_always_finishes_and_its_inferences_are_sound(seed: int, mode: BreezeMode) -> None:
    config = GameConfig(size=4 + seed % 3, seed=seed, breeze_mode=mode)
    session = GameSession(config)
    for _ in range(MAX_STEPS):
        assert_inference_is_sound(session)
        if session.state.is_over:
            break
        session.apply(session.decide().action)
    assert session.state.is_over


def test_inference_on_a_large_board_is_fast_enough_for_a_request() -> None:
    session = autoplay(GameConfig(size=8, seed=7, pit_probability=0.1))
    replayed = GameSession.replay(session.config, session.actions[:-1])
    started = time.perf_counter()
    _ = replayed.inference
    _ = replayed.decide()
    assert time.perf_counter() - started < 2.0
