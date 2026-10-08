"""Mundos em que nenhuma vizinha de [1,1] é segura: fedor e brisa logo na casa inicial."""

from wumpus.domain.types import Position
from wumpus.domain.world import World

WUMPUS_NORTH = World(
    size=4,
    wumpus=Position(1, 2),
    gold=Position(2, 2),
    pits=frozenset({Position(2, 1)}),
)

WUMPUS_EAST = World(
    size=4,
    wumpus=Position(2, 1),
    gold=Position(2, 2),
    pits=frozenset({Position(1, 2)}),
)
