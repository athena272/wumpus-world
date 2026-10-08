from collections.abc import Iterable

import pytest

from wumpus.domain.errors import GameOverError
from wumpus.domain.game import (
    ARROW_COST,
    DEATH_PENALTY,
    GOLD_REWARD,
    GameEvent,
    GameState,
    apply_action,
    new_game,
)
from wumpus.domain.types import Action, BreezeMode, GameStatus, Orientation, Percept, Position
from wumpus.domain.world import SLIDES_WORLD, World

F, L, R = Action.FORWARD, Action.TURN_LEFT, Action.TURN_RIGHT


def play(actions: Iterable[Action], world: World = SLIDES_WORLD) -> GameState:
    state = new_game(world, BreezeMode.CLASSIC)
    for action in actions:
        state = apply_action(state, action)
    return state


def test_initial_state_matches_the_slides() -> None:
    state = new_game(SLIDES_WORLD, BreezeMode.CLASSIC)
    assert state.agent.position == Position(1, 1)
    assert state.agent.orientation is Orientation.EAST
    assert state.percept == Percept()
    assert state.visited == {Position(1, 1)}


def test_moving_right_perceives_the_breeze_of_the_slides() -> None:
    state = play([F])
    assert state.agent.position == Position(2, 1)
    assert state.percept == Percept(breeze=1)
    assert state.score == -1
    assert state.events == (GameEvent.MOVED,)


def test_stench_appears_next_to_the_wumpus() -> None:
    state = play([L, F])
    assert state.agent.position == Position(1, 2)
    assert state.percept.stench is True


def test_intensity_mode_reports_how_many_pits_are_around() -> None:
    world = World(
        size=4,
        wumpus=Position(4, 4),
        gold=Position(1, 4),
        pits=frozenset({Position(3, 1), Position(2, 2)}),
    )
    state = apply_action(new_game(world, BreezeMode.INTENSITY), F)
    assert state.percept.breeze == 2
    classic = apply_action(new_game(world, BreezeMode.CLASSIC), F)
    assert classic.percept.breeze == 1


def test_walking_into_a_wall_bumps_without_moving() -> None:
    state = play([R, F])
    assert state.agent.position == Position(1, 1)
    assert state.percept.bump is True
    assert play([R, F, L]).percept.bump is False


def test_falling_into_a_pit_ends_the_game() -> None:
    state = play([F, F])
    assert state.status is GameStatus.DEAD
    assert state.events == (GameEvent.FELL_INTO_PIT,)
    assert state.score == 2 * -1 + DEATH_PENALTY


def test_walking_into_the_live_wumpus_ends_the_game() -> None:
    state = play([L, F, F])
    assert state.status is GameStatus.DEAD
    assert state.events == (GameEvent.EATEN_BY_WUMPUS,)


def test_shooting_the_wumpus_makes_it_scream_and_its_square_safe() -> None:
    state = play([L, F, Action.SHOOT])
    assert state.percept.scream is True
    assert state.wumpus_alive is False
    assert state.agent.has_arrow is False
    assert state.score == 3 * -1 + ARROW_COST
    after = apply_action(state, F)
    assert after.status is GameStatus.PLAYING
    assert after.percept.scream is False


def test_missed_shot_and_second_shot() -> None:
    state = play([Action.SHOOT])
    assert state.events == (GameEvent.SHOT_MISSED,)
    assert state.wumpus_alive is True
    again = apply_action(state, Action.SHOOT)
    assert again.events == (GameEvent.NO_ARROW,)
    assert again.score == state.score - 1


def test_grabbing_and_climbing_out_with_the_gold_wins() -> None:
    to_gold = [L, F, Action.SHOOT, F, R, F]
    state = play(to_gold)
    assert state.agent.position == Position(2, 3)
    assert state.percept.glitter is True
    grabbed = apply_action(state, Action.GRAB)
    assert grabbed.agent.has_gold is True
    assert grabbed.percept.glitter is False
    home = play([*to_gold, Action.GRAB, R, F, F, R, F, Action.CLIMB])
    assert home.status is GameStatus.WON
    assert home.events == (GameEvent.CLIMBED_WITH_GOLD,)
    assert home.score == 13 * -1 + ARROW_COST + GOLD_REWARD


def test_climbing_without_gold_and_away_from_the_exit() -> None:
    assert play([F, Action.CLIMB]).events == (GameEvent.CANNOT_CLIMB,)
    escaped = play([Action.CLIMB])
    assert escaped.status is GameStatus.ESCAPED
    assert escaped.score == -1


def test_grabbing_where_there_is_no_gold() -> None:
    assert play([Action.GRAB]).events == (GameEvent.NOTHING_TO_GRAB,)


def test_no_action_is_accepted_after_the_game_ends() -> None:
    finished = play([Action.CLIMB])
    with pytest.raises(GameOverError) as error:
        apply_action(finished, F)
    assert error.value.action_index == 1
