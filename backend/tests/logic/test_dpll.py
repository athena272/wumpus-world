import random
from itertools import product

from tests.logic.slides_kb import P12, P22, SLIDES_KB
from wumpus.logic.cardinality import at_most_one, exactly
from wumpus.logic.cnf import Clause, Literal, clause, is_clause_satisfied, to_cnf
from wumpus.logic.dpll import DpllSolver, entails, is_satisfiable
from wumpus.logic.sentences import Not


def _brute_force_satisfiable(clauses: list[Clause], symbols: list[str]) -> bool:
    for values in product((False, True), repeat=len(symbols)):
        model = dict(zip(symbols, values, strict=True))
        if all(is_clause_satisfied(target, model) for target in clauses):
            return True
    return False


def test_slides_first_query_is_entailed() -> None:
    """α1 = "[1,2] é segura": KB ⊨ ¬P[1,2]."""
    assert entails(to_cnf(SLIDES_KB), Not(P12))


def test_slides_second_query_is_not_entailed() -> None:
    """α2 = "[2,2] é segura": KB ⊭ ¬P[2,2], because some model has a pit there."""
    assert not entails(to_cnf(SLIDES_KB), Not(P22))


def test_empty_clause_is_unsatisfiable() -> None:
    assert not is_satisfiable([clause()])
    assert is_satisfiable([])


def test_returned_model_satisfies_every_clause() -> None:
    clauses = list(to_cnf(SLIDES_KB))
    model = DpllSolver(clauses).solve()
    assert model is not None
    assert all(is_clause_satisfied(target, model) for target in clauses)


def test_assumptions_restrict_the_search_and_do_not_leak_between_calls() -> None:
    solver = DpllSolver(to_cnf(SLIDES_KB))
    assert solver.solve([Literal("P[1,2]")]) is None
    pit_in_22 = solver.solve([Literal("P[2,2]")])
    assert pit_in_22 is not None
    assert pit_in_22["P[2,2]"] is True
    assert solver.solve([Literal("P[2,2]", False)]) is not None


def test_assumption_on_unknown_symbol_is_allowed() -> None:
    model = DpllSolver([clause(Literal("A"))]).solve([Literal("Z", False)])
    assert model == {"A": True, "Z": False}


def test_cardinality_constraints_interact_with_facts() -> None:
    symbols = ["W1", "W2", "W3"]
    clauses = [*exactly(1, symbols), clause(Literal("W1", False)), clause(Literal("W2", False))]
    solver = DpllSolver(clauses)
    assert solver.solve([Literal("W3", False)]) is None


def test_pairwise_at_most_one_scales_to_an_8x8_board() -> None:
    symbols = [f"W{index}" for index in range(64)]
    clauses = [*at_most_one(symbols), clause(*(Literal(name) for name in symbols))]
    model = DpllSolver(clauses).solve([Literal("W40")])
    assert model is not None
    assert [name for name, value in model.items() if value] == ["W40"]


def test_agrees_with_brute_force_on_random_formulas() -> None:
    generator = random.Random(2026)
    symbols = [f"X{index}" for index in range(7)]
    for _ in range(300):
        clauses = [
            clause(
                *(
                    Literal(generator.choice(symbols), generator.random() < 0.5)
                    for _ in range(generator.randint(1, 3))
                )
            )
            for _ in range(generator.randint(1, 18))
        ]
        expected = _brute_force_satisfiable(clauses, symbols)
        model = DpllSolver(clauses).solve()
        assert (model is not None) == expected
        if model is not None:
            assert all(is_clause_satisfied(target, model) for target in clauses)
