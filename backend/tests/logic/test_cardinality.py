from itertools import product

import pytest

from wumpus.logic.cardinality import at_least, at_most, at_most_one, exactly
from wumpus.logic.cnf import Clause, is_clause_satisfied

SYMBOLS = ["P1", "P2", "P3", "P4"]


def _true_counts(clauses: frozenset[Clause]) -> set[int]:
    counts = set()
    for values in product((False, True), repeat=len(SYMBOLS)):
        model = dict(zip(SYMBOLS, values, strict=True))
        if all(is_clause_satisfied(target, model) for target in clauses):
            counts.add(sum(values))
    return counts


@pytest.mark.parametrize("k", [0, 1, 2, 3, 4])
def test_exactly_k_accepts_only_k_true_symbols(k: int) -> None:
    assert _true_counts(exactly(k, SYMBOLS)) == {k}


def test_at_least_and_at_most_bound_the_count() -> None:
    assert _true_counts(at_least(2, SYMBOLS)) == {2, 3, 4}
    assert _true_counts(at_most(1, SYMBOLS)) == {0, 1}


def test_impossible_cardinality_is_a_contradiction() -> None:
    assert exactly(5, SYMBOLS) >= {frozenset()}


def test_at_most_one_is_pairwise() -> None:
    assert len(at_most_one(SYMBOLS)) == 6


def test_negative_cardinality_is_rejected() -> None:
    with pytest.raises(ValueError, match="non-negative"):
        exactly(-1, SYMBOLS)
