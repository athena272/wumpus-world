"""Tipos básicos do Mundo de Wumpus: posições, orientação, ações e percepções."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Orientation(StrEnum):
    NORTH = "north"
    EAST = "east"
    SOUTH = "south"
    WEST = "west"

    @property
    def delta(self) -> tuple[int, int]:
        return _DELTAS[self]

    def turn_left(self) -> Orientation:
        return _CLOCKWISE[(_CLOCKWISE.index(self) - 1) % len(_CLOCKWISE)]

    def turn_right(self) -> Orientation:
        return _CLOCKWISE[(_CLOCKWISE.index(self) + 1) % len(_CLOCKWISE)]


_CLOCKWISE = (Orientation.NORTH, Orientation.EAST, Orientation.SOUTH, Orientation.WEST)
_DELTAS = {
    Orientation.NORTH: (0, 1),
    Orientation.EAST: (1, 0),
    Orientation.SOUTH: (0, -1),
    Orientation.WEST: (-1, 0),
}


@dataclass(frozen=True, slots=True, order=True)
class Position:
    """Casa ``[x,y]``: x é a coluna e y a linha, com origem embaixo à esquerda (1-indexado)."""

    x: int
    y: int

    def moved(self, orientation: Orientation) -> Position:
        dx, dy = orientation.delta
        return Position(self.x + dx, self.y + dy)

    def is_inside(self, size: int) -> bool:
        return 1 <= self.x <= size and 1 <= self.y <= size

    def neighbors(self, size: int) -> tuple[Position, ...]:
        candidates = (self.moved(orientation) for orientation in _CLOCKWISE)
        return tuple(candidate for candidate in candidates if candidate.is_inside(size))

    def __str__(self) -> str:
        return f"[{self.x},{self.y}]"


START = Position(1, 1)


def all_positions(size: int) -> tuple[Position, ...]:
    return tuple(Position(x, y) for y in range(1, size + 1) for x in range(1, size + 1))


def line_of_fire(origin: Position, orientation: Orientation, size: int) -> tuple[Position, ...]:
    """Casas atravessadas por uma flecha disparada de ``origin`` (sem incluir a origem)."""
    cells: list[Position] = []
    current = origin.moved(orientation)
    while current.is_inside(size):
        cells.append(current)
        current = current.moved(orientation)
    return tuple(cells)


class Action(StrEnum):
    TURN_LEFT = "turn_left"
    TURN_RIGHT = "turn_right"
    FORWARD = "forward"
    GRAB = "grab"
    SHOOT = "shoot"
    CLIMB = "climb"


class BreezeMode(StrEnum):
    CLASSIC = "classic"
    """Brisa booleana, como no AIMA."""
    INTENSITY = "intensity"
    """A brisa informa quantos poços existem nas casas vizinhas (0 a 4)."""


class GameStatus(StrEnum):
    PLAYING = "playing"
    WON = "won"
    """Saiu da caverna com o ouro."""
    ESCAPED = "escaped"
    """Saiu da caverna sem o ouro."""
    DEAD = "dead"


@dataclass(frozen=True, slots=True)
class Percept:
    """``[Stench, Breeze, Glitter, Bump, Scream]``. ``breeze`` é a quantidade de poços
    vizinhos no modo intensidade e 0 ou 1 no modo clássico."""

    stench: bool = False
    breeze: int = 0
    glitter: bool = False
    bump: bool = False
    scream: bool = False

    @property
    def has_breeze(self) -> bool:
        return self.breeze > 0
