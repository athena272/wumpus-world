import pytest

from wumpus.domain.types import START, Position
from wumpus.domain.world import (
    SLIDES_WORLD,
    GameConfig,
    Preset,
    World,
    build_world,
    generate_world,
)


def test_same_seed_produces_the_same_world() -> None:
    assert generate_world(6, 42, 0.2) == generate_world(6, 42, 0.2)
    assert generate_world(6, 42, 0.2) != generate_world(6, 43, 0.2)


@pytest.mark.parametrize("seed", range(50))
def test_generated_worlds_respect_the_rules(seed: int) -> None:
    world = generate_world(8, seed, 0.3)
    assert START not in world.pits
    assert world.wumpus != START
    assert world.wumpus not in world.pits
    assert world.gold not in world.pits


def test_board_full_of_pits_still_has_room_for_the_wumpus() -> None:
    world = generate_world(4, 1, 0.999)
    assert world.wumpus not in world.pits


def test_slides_preset_matches_the_figure() -> None:
    world = build_world(GameConfig(preset=Preset.SLIDES))
    assert world is SLIDES_WORLD
    assert world.wumpus == Position(1, 3)
    assert world.gold == Position(2, 3)
    assert world.pits == {Position(3, 1), Position(3, 3), Position(4, 4)}


def test_adjacent_pits_counts_double_breezes() -> None:
    assert SLIDES_WORLD.adjacent_pits(Position(4, 3)) == 2
    assert SLIDES_WORLD.adjacent_pits(Position(2, 1)) == 1
    assert SLIDES_WORLD.adjacent_pits(Position(1, 1)) == 0


@pytest.mark.parametrize(
    "kwargs",
    [{"size": 3}, {"size": 9}, {"pit_probability": 1.0}, {"preset": Preset.SLIDES, "size": 5}],
)
def test_invalid_configs_are_rejected(kwargs: dict[str, object]) -> None:
    with pytest.raises(ValueError):  # noqa: PT011
        GameConfig(**kwargs)  # type: ignore[arg-type]


def test_start_square_must_be_safe() -> None:
    with pytest.raises(ValueError, match="safe"):
        World(size=4, wumpus=START, gold=Position(2, 2), pits=frozenset())
