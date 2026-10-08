from itertools import product

from tests.logic.slides_kb import R5, SLIDES_KB
from wumpus.logic.cnf import (
    Literal,
    clause,
    clause_to_str,
    is_clause_satisfied,
    is_tautology,
    to_cnf,
)
from wumpus.logic.sentences import Iff, Implies, Not, Or, Sentence, Symbol, evaluate, symbols_of

A, B, C = Symbol("A"), Symbol("B"), Symbol("C")


def _equivalent(sentence: Sentence) -> bool:
    symbols = sorted(symbols_of(sentence))
    clauses = to_cnf(sentence)
    for values in product((False, True), repeat=len(symbols)):
        model = dict(zip(symbols, values, strict=True))
        cnf_value = all(is_clause_satisfied(target, model) for target in clauses)
        if cnf_value != evaluate(sentence, model):
            return False
    return True


def test_implication_becomes_a_single_clause() -> None:
    assert to_cnf(Implies(A, B)) == {clause(Literal("A", False), Literal("B"))}


def test_breeze_biconditional_matches_the_textbook_clauses() -> None:
    expected = {
        clause(Literal("B[2,1]", False), Literal("P[1,1]"), Literal("P[2,2]"), Literal("P[3,1]")),
        clause(Literal("P[1,1]", False), Literal("B[2,1]")),
        clause(Literal("P[2,2]", False), Literal("B[2,1]")),
        clause(Literal("P[3,1]", False), Literal("B[2,1]")),
    }
    assert to_cnf(R5) == expected


def test_conversion_preserves_meaning() -> None:
    sentences: list[Sentence] = [
        SLIDES_KB,
        Not(Iff(A, Or((B, C)))),
        Implies(Iff(A, B), Not(C)),
        Not(Not(A)),
    ]
    for sentence in sentences:
        assert _equivalent(sentence), sentence


def test_tautologies_are_dropped() -> None:
    assert to_cnf(Or((A, Not(A)))) == frozenset()
    assert is_tautology(clause(Literal("A"), Literal("A", False)))


def test_clause_rendering() -> None:
    assert clause_to_str(clause(Literal("B"), Literal("A", False))) == "¬A ∨ B"
    assert clause_to_str(clause()) == "□"
