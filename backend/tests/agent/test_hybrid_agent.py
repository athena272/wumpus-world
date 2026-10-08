import time

import pytest

from wumpus.agent.inference import Truth
from wumpus.agent.session import GameSession
from wumpus.domain.errors import GameOverError
from wumpus.domain.types import Action, BreezeMode, GameStatus
from wumpus.domain.world import GameConfig, Preset

MAX_STEPS = 400


def autoplay(config: GameConfig) -> GameSession:
    session = GameSession(config)
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
