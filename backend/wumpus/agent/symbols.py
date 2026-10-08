"""Nomes dos símbolos proposicionais do Mundo de Wumpus (``P[x,y]``, ``W[x,y]``, ...)."""

from wumpus.domain.types import Position
from wumpus.logic.sentences import Symbol

WUMPUS_ALIVE = Symbol("WumpusVivo")


def pit(position: Position) -> Symbol:
    return Symbol(f"P{position}")


def wumpus(position: Position) -> Symbol:
    return Symbol(f"W{position}")


def breeze(position: Position) -> Symbol:
    return Symbol(f"B{position}")


def stench(position: Position) -> Symbol:
    return Symbol(f"S{position}")


def glitter(position: Position) -> Symbol:
    return Symbol(f"G{position}")
