"""Configuração da partida e geração determinística do mundo."""

from __future__ import annotations

import random
from dataclasses import dataclass
from enum import StrEnum

from wumpus.domain.types import START, BreezeMode, Position, all_positions

MIN_SIZE = 4
MAX_SIZE = 8


class Preset(StrEnum):
    RANDOM = "random"
    SLIDES = "slides"
    """Mapa da figura dos slides (AIMA, figura 7.2)."""


@dataclass(frozen=True, slots=True)
class GameConfig:
    size: int = 4
    seed: int = 0
    pit_probability: float = 0.2
    breeze_mode: BreezeMode = BreezeMode.CLASSIC
    preset: Preset = Preset.RANDOM

    def __post_init__(self) -> None:
        if not MIN_SIZE <= self.size <= MAX_SIZE:
            raise ValueError(f"Board size must be between {MIN_SIZE} and {MAX_SIZE}")
        if not 0 <= self.pit_probability < 1:
            raise ValueError("Pit probability must be in [0, 1)")
        if self.preset is Preset.SLIDES and self.size != SLIDES_WORLD.size:
            side = SLIDES_WORLD.size
            raise ValueError(f"The slides preset uses a {side}x{side} board")


@dataclass(frozen=True, slots=True)
class World:
    size: int
    wumpus: Position
    gold: Position
    pits: frozenset[Position]

    def __post_init__(self) -> None:
        cells = (self.wumpus, self.gold, *self.pits)
        if any(not cell.is_inside(self.size) for cell in cells):
            raise ValueError("Every element of the world must be inside the board")
        if START in self.pits or self.wumpus == START:
            raise ValueError("The starting square must be safe")
        # The agent's KB assumes this (¬W[i] ∨ ¬P[i]); breaking it would make inference unsound.
        if self.wumpus in self.pits:
            raise ValueError("The Wumpus cannot share a square with a pit")

    def has_pit(self, position: Position) -> bool:
        return position in self.pits

    def adjacent_pits(self, position: Position) -> int:
        return sum(1 for neighbor in position.neighbors(self.size) if neighbor in self.pits)

    def is_next_to_wumpus(self, position: Position) -> bool:
        return self.wumpus in position.neighbors(self.size)


SLIDES_WORLD = World(
    size=4,
    wumpus=Position(1, 3),
    gold=Position(2, 3),
    pits=frozenset({Position(3, 1), Position(3, 3), Position(4, 4)}),
)


def build_world(config: GameConfig) -> World:
    if config.preset is Preset.SLIDES:
        return SLIDES_WORLD
    return generate_world(config.size, config.seed, config.pit_probability)


def generate_world(size: int, seed: int, pit_probability: float) -> World:
    """Same inputs always produce the same world, so a game can be replayed from its seed.

    Each square except [1,1] holds a pit with ``pit_probability``. The Wumpus and the
    gold are placed on squares without pits; they may share a square, as in the AIMA.
    """
    rng = random.Random(seed)
    candidates = [cell for cell in all_positions(size) if cell != START]
    pits = {cell for cell in candidates if rng.random() < pit_probability}
    free = [cell for cell in candidates if cell not in pits]
    if not free:
        released = rng.choice(sorted(pits))
        pits.discard(released)
        free = [released]
    return World(
        size=size,
        wumpus=rng.choice(free),
        gold=rng.choice(free),
        pits=frozenset(pits),
    )
