"""Reproduz, passo a passo, o raciocínio mostrado nos slides da aula."""

from wumpus.agent.inference import Truth
from wumpus.agent.session import GameSession
from wumpus.domain.types import Action, Position
from wumpus.domain.world import GameConfig, Preset

F, L, R = Action.FORWARD, Action.TURN_LEFT, Action.TURN_RIGHT
SLIDES = GameConfig(preset=Preset.SLIDES)


def session_after(*actions: Action) -> GameSession:
    return GameSession.replay(SLIDES, actions)


def test_initial_state_marks_the_neighbors_of_the_start_as_safe() -> None:
    inference = session_after().inference
    assert inference.safe_unvisited() == {Position(1, 2), Position(2, 1)}


def test_breeze_in_21_makes_12_safe_but_not_22() -> None:
    """KB ⊨ α1 ("[1,2] é segura") e KB ⊭ α2 ("[2,2] é segura")."""
    inference = session_after(F).inference
    assert inference.cell(Position(1, 2)).pit is Truth.NO
    assert inference.cell(Position(1, 2)).safe
    assert inference.cell(Position(2, 2)).pit is Truth.UNKNOWN
    assert inference.cell(Position(3, 1)).pit is Truth.UNKNOWN
    assert not inference.cell(Position(2, 2)).safe


def test_pit_models_match_the_eight_combinations_of_the_slides() -> None:
    models = session_after(F).pit_models
    assert models.symbols == ("P[1,2]", "P[2,2]", "P[3,1]")
    assert models.total_assignments == 8
    assert models.model_count == 3
    assert all(model["P[1,2]"] is False for model in models.models)


def test_stench_in_12_locates_the_wumpus_and_the_pit() -> None:
    """Slide "apareceu um fedor": W! em [1,3], P! em [3,1] e [2,2] OK."""
    inference = session_after(F, L, L, F, R, F).inference
    assert inference.cell(Position(1, 3)).wumpus is Truth.YES
    assert inference.cell(Position(3, 1)).pit is Truth.YES
    assert inference.cell(Position(2, 2)).safe


def test_kb_grows_with_each_new_square() -> None:
    session = session_after()
    initial = len(session.knowledge.base.entries)
    session.apply(F)
    grown = len(session.knowledge.base.entries)
    session.apply(L)
    assert grown > initial
    assert len(session.knowledge.base.entries) == grown


def test_frontier_queries_report_what_was_asked() -> None:
    queries = session_after(F).inference.queries
    asked = {(query.query, query.entailed) for query in queries}
    assert ("¬P[1,2]", True) in asked
    assert ("¬P[2,2]", False) in asked
