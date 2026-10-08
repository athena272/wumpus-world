import pytest

from tests.logic.slides_kb import B21, P11, P22, P31, R5
from wumpus.logic.sentences import (
    And,
    Implies,
    Not,
    Or,
    Symbol,
    conjunction,
    disjunction,
    evaluate,
    symbols_of,
)

A = Symbol("A")
B = Symbol("B")


def test_renders_the_notation_used_in_class() -> None:
    assert str(R5) == "B[2,1] ⇔ (P[1,1] ∨ P[2,2] ∨ P[3,1])"
    assert str(Not(And((A, B)))) == "¬(A ∧ B)"
    assert str(Implies(Not(A), B)) == "¬A ⇒ B"


def test_conjunction_and_disjunction_collapse_single_operands() -> None:
    assert conjunction(A) == A
    assert disjunction(A) == A
    assert conjunction(A, B) == And((A, B))
    assert disjunction(A, B) == Or((A, B))


def test_connectives_reject_fewer_than_two_operands() -> None:
    with pytest.raises(ValueError, match="at least two"):
        And((A,))
    with pytest.raises(ValueError, match="at least one"):
        disjunction()


@pytest.mark.parametrize(
    ("antecedent", "consequent", "expected"),
    [(False, False, True), (False, True, True), (True, False, False), (True, True, True)],
)
def test_implication_truth_table(antecedent: bool, consequent: bool, expected: bool) -> None:
    assert evaluate(Implies(A, B), {"A": antecedent, "B": consequent}) is expected


def test_biconditional_matches_the_breeze_rule() -> None:
    model = {"B[2,1]": True, "P[1,1]": False, "P[2,2]": False, "P[3,1]": True}
    assert evaluate(R5, model) is True
    assert evaluate(R5, {**model, "P[3,1]": False}) is False


def test_evaluate_requires_every_symbol() -> None:
    with pytest.raises(KeyError, match="A"):
        evaluate(A, {})


def test_symbols_of_collects_every_proposition() -> None:
    assert symbols_of(R5) == {B21.name, P11.name, P22.name, P31.name}
