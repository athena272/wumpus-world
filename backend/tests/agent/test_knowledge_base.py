from wumpus.agent.knowledge_base import KnowledgeBase, Origin
from wumpus.logic.cardinality import exactly
from wumpus.logic.sentences import Iff, Not, Or, Symbol

B = Symbol("B")
P1, P2 = Symbol("P1"), Symbol("P2")


def test_tell_numbers_entries_and_keeps_their_metadata() -> None:
    kb = KnowledgeBase()
    first = kb.tell(Not(P1), description="sem poço", origin=Origin.RULE, step=0)
    second = kb.tell(Iff(B, Or((P1, P2))), description="brisa", origin=Origin.RULE, step=1)
    assert (first.id, second.id) == ("R1", "R2")
    assert second.text == "B ⇔ (P1 ∨ P2)"
    assert second.step == 1
    assert len(second.clauses) == 3
    assert kb.symbols == {"B", "P1", "P2"}


def test_ask_uses_everything_that_was_told() -> None:
    kb = KnowledgeBase()
    kb.tell(Iff(B, Or((P1, P2))), description="brisa", origin=Origin.RULE, step=0)
    kb.tell(Not(P1), description="sem poço", origin=Origin.PERCEPT, step=1)
    assert not kb.ask(P2)
    kb.tell(B, description="brisa percebida", origin=Origin.PERCEPT, step=1)
    assert kb.ask(P2)


def test_tell_clauses_accepts_cardinality_constraints() -> None:
    kb = KnowledgeBase()
    entry = kb.tell_clauses(
        "Exatamente 2 de {P1, P2}",
        exactly(2, ["P1", "P2"]),
        description="brisa x2",
        origin=Origin.PERCEPT,
        step=3,
    )
    assert entry.text == "Exatamente 2 de {P1, P2}"
    assert kb.ask(P1)
    assert kb.ask(P2)
