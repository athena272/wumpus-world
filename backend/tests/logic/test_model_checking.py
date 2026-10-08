from tests.logic.slides_kb import P12, P22, SLIDES_KB
from wumpus.logic.cnf import to_cnf
from wumpus.logic.model_checking import count_models, enumerate_models, tt_entails
from wumpus.logic.sentences import Not


def test_truth_table_of_the_slides_has_three_models() -> None:
    """2⁷ = 128 rows, and exactly 3 of them satisfy R1..R5 (highlighted in the slides)."""
    assert count_models(SLIDES_KB) == 3


def test_tt_entails_reproduces_both_queries() -> None:
    assert tt_entails(SLIDES_KB, Not(P12))
    assert not tt_entails(SLIDES_KB, Not(P22))


def test_enumerate_models_over_frontier_symbols() -> None:
    fixed = {"B[1,1]": False, "B[2,1]": True, "P[1,1]": False, "P[2,1]": False}
    models = enumerate_models(to_cnf(SLIDES_KB), ["P[1,2]", "P[2,2]", "P[3,1]"], fixed)
    assert sorted(tuple(model.values()) for model in models) == [
        (False, False, True),
        (False, True, False),
        (False, True, True),
    ]


def test_clauses_with_unknown_symbols_are_ignored() -> None:
    models = enumerate_models(to_cnf(SLIDES_KB), ["P[1,2]"], {})
    assert len(models) == 2
