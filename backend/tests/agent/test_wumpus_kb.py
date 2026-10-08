from wumpus.agent.inference import Truth
from wumpus.agent.knowledge_base import Origin
from wumpus.agent.session import GameSession
from wumpus.domain.types import Action, BreezeMode, Position
from wumpus.domain.world import GameConfig, Preset, World

F, L = Action.FORWARD, Action.TURN_LEFT
TWO_PITS = World(
    size=4,
    wumpus=Position(4, 4),
    gold=Position(1, 4),
    pits=frozenset({Position(3, 1), Position(2, 2)}),
)


def two_pits_session(mode: BreezeMode) -> GameSession:
    session = GameSession(GameConfig(breeze_mode=mode), world=TWO_PITS)
    session.apply(F)
    return session


def test_double_breeze_proves_both_neighbors_are_pits() -> None:
    """Regressão: dois poços vizinhos geram brisa ×2 e a KB conclui os dois poços."""
    session = two_pits_session(BreezeMode.INTENSITY)
    assert session.state.percept.breeze == 2
    inference = session.inference
    assert inference.cell(Position(3, 1)).pit is Truth.YES
    assert inference.cell(Position(2, 2)).pit is Truth.YES
    texts = [entry.text for entry in session.knowledge.base.entries]
    assert "Exatamente 2 de {P[2,2], P[3,1], P[1,1]}" in texts


def test_classic_breeze_cannot_tell_how_many_pits_there_are() -> None:
    inference = two_pits_session(BreezeMode.CLASSIC).inference
    assert inference.cell(Position(3, 1)).pit is Truth.UNKNOWN
    assert inference.cell(Position(2, 2)).pit is Truth.UNKNOWN


def test_scream_marks_the_wumpus_as_dead_and_its_square_safe() -> None:
    session = GameSession.replay(GameConfig(preset=Preset.SLIDES), [L, F, Action.SHOOT])
    inference = session.inference
    assert inference.wumpus_dead
    assert inference.cell(Position(1, 3)).safe
    origins = {entry.origin for entry in session.knowledge.base.entries if entry.step == 3}
    assert origins == {Origin.PERCEPT, Origin.ACTION}


def test_missed_arrow_clears_its_line_of_fire() -> None:
    session = GameSession.replay(GameConfig(preset=Preset.SLIDES), [Action.SHOOT])
    inference = session.inference
    for x in (2, 3, 4):
        assert inference.cell(Position(x, 1)).wumpus is Truth.NO
    assert not inference.wumpus_dead


def test_revisiting_a_square_does_not_repeat_its_rules() -> None:
    session = GameSession.replay(GameConfig(preset=Preset.SLIDES), [F, L, L, F])
    before = len(session.knowledge.base.entries)
    session.apply(L)
    session.apply(L)
    session.apply(F)
    assert len(session.knowledge.base.entries) == before


def test_dead_agent_learns_nothing_more() -> None:
    session = GameSession.replay(GameConfig(preset=Preset.SLIDES), [F])
    before = len(session.knowledge.base.entries)
    session.apply(F)
    assert len(session.knowledge.base.entries) == before
