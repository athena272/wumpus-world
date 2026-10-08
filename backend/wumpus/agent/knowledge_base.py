"""Base de conhecimento genérica com as operações TELL e ASK.

Cada TELL vira uma entrada numerada (R1, R2, ...) que guarda o texto legível, a origem,
o passo em que entrou e as cláusulas CNF usadas na inferência. É isso que o frontend
mostra para acompanhar o crescimento da KB.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from enum import StrEnum

from wumpus.logic.cnf import Clause, clause_symbols, to_cnf
from wumpus.logic.dpll import entails
from wumpus.logic.sentences import Sentence


class Origin(StrEnum):
    RULE = "rule"
    """Regra do mundo, conhecida antes de qualquer percepção."""
    PERCEPT = "percept"
    """Fato percebido pelos sensores."""
    ACTION = "action"
    """Conhecimento obtido pelo resultado de uma ação (por exemplo, uma flecha)."""


@dataclass(frozen=True, slots=True)
class KbEntry:
    id: str
    text: str
    description: str
    origin: Origin
    step: int
    clauses: frozenset[Clause]


class KnowledgeBase:
    def __init__(self) -> None:
        self._entries: list[KbEntry] = []
        self._clauses: list[Clause] = []

    @property
    def entries(self) -> tuple[KbEntry, ...]:
        return tuple(self._entries)

    @property
    def clauses(self) -> tuple[Clause, ...]:
        return tuple(self._clauses)

    @property
    def symbols(self) -> frozenset[str]:
        return clause_symbols(self._clauses)

    def tell(
        self,
        sentence: Sentence,
        *,
        description: str,
        origin: Origin,
        step: int,
    ) -> KbEntry:
        return self.tell_clauses(
            str(sentence), to_cnf(sentence), description=description, origin=origin, step=step
        )

    def tell_clauses(
        self,
        text: str,
        clauses: Iterable[Clause],
        *,
        description: str,
        origin: Origin,
        step: int,
    ) -> KbEntry:
        """Adds a sentence already in CNF, such as a cardinality constraint."""
        entry = KbEntry(
            id=f"R{len(self._entries) + 1}",
            text=text,
            description=description,
            origin=origin,
            step=step,
            clauses=frozenset(clauses),
        )
        self._entries.append(entry)
        self._clauses.extend(entry.clauses)
        return entry

    def ask(self, query: Sentence) -> bool:
        """``KB ⊨ query``, decided by DPLL refutation."""
        return entails(self._clauses, query)
