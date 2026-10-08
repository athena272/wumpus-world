"""Restrições de cardinalidade ("exatamente k de n símbolos são verdadeiros") em CNF.

A codificação é a direta por combinações. Ela é exponencial em n, mas no Mundo de
Wumpus n é no máximo 4 (vizinhos de uma casa) ou N² para "no máximo um Wumpus",
que usa a forma par a par, com N² (N² - 1) / 2 cláusulas binárias.
"""

from collections.abc import Sequence
from itertools import combinations

from wumpus.logic.cnf import Clause, Literal


def at_least(k: int, symbols: Sequence[str]) -> frozenset[Clause]:
    """Every subset of size ``n - k + 1`` must contain a true symbol."""
    _validate(k)
    if k == 0:
        return frozenset()
    size = len(symbols) - k + 1
    if size <= 0:
        return frozenset({frozenset()})
    return frozenset(
        frozenset(Literal(name, True) for name in subset) for subset in combinations(symbols, size)
    )


def at_most(k: int, symbols: Sequence[str]) -> frozenset[Clause]:
    """Every subset of size ``k + 1`` must contain a false symbol."""
    _validate(k)
    return frozenset(
        frozenset(Literal(name, False) for name in subset)
        for subset in combinations(symbols, k + 1)
    )


def exactly(k: int, symbols: Sequence[str]) -> frozenset[Clause]:
    return at_least(k, symbols) | at_most(k, symbols)


def at_least_one(symbols: Sequence[str]) -> frozenset[Clause]:
    return at_least(1, symbols)


def at_most_one(symbols: Sequence[str]) -> frozenset[Clause]:
    return at_most(1, symbols)


def _validate(k: int) -> None:
    if k < 0:
        raise ValueError(f"Cardinality must be non-negative, got {k}")
