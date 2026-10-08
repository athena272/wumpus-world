"""Satisfatibilidade proposicional com DPLL e consequência lógica por refutação.

``KB ⊨ α`` se e somente se ``KB ∧ ¬α`` é insatisfatível. O resolvedor faz busca em
profundidade com retrocesso cronológico e propagação unitária. A propagação usa dois
literais vigiados por cláusula, o que evita varrer todas as cláusulas a cada atribuição.
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence

from wumpus.logic.cnf import Clause, Literal, is_tautology, to_cnf
from wumpus.logic.sentences import Not, Sentence

type Model = dict[str, bool]

_UNASSIGNED = 0
_TRUE = 1
_FALSE = -1


class DpllSolver:
    """Reusable solver: build it once for a clause set and query it with assumptions."""

    def __init__(self, clauses: Iterable[Clause], extra_symbols: Iterable[str] = ()) -> None:
        unique = set(clauses)
        relevant = [target for target in unique if not is_tautology(target)]
        mentioned = {literal.symbol for target in unique for literal in target}
        names = sorted(mentioned | set(extra_symbols))

        self._names = names
        self._index = {name: position + 1 for position, name in enumerate(names)}
        self._has_empty_clause = any(not target for target in relevant)
        self._units: list[int] = []
        self._clauses: list[list[int]] = []
        self._watches: dict[int, list[int]] = {}

        occurrences = [0] * (len(names) + 1)
        for target in relevant:
            encoded = sorted(self._encode(literal) for literal in target)
            for code in encoded:
                occurrences[abs(code)] += 1
            if len(encoded) == 1:
                self._units.append(encoded[0])
            elif encoded:
                position = len(self._clauses)
                self._clauses.append(encoded)
                self._watches.setdefault(encoded[0], []).append(position)
                self._watches.setdefault(encoded[1], []).append(position)

        self._order = sorted(range(1, len(names) + 1), key=lambda var: -occurrences[var])
        self._values = [_UNASSIGNED] * (len(names) + 1)
        self._trail: list[int] = []
        self._queue_head = 0

    @property
    def symbols(self) -> tuple[str, ...]:
        return tuple(self._names)

    def solve(self, assumptions: Sequence[Literal] = ()) -> Model | None:
        """A model of the clauses plus ``assumptions``, or ``None`` when unsatisfiable."""
        self._reset()
        try:
            return self._search(assumptions)
        finally:
            self._reset()

    def is_satisfiable(self, assumptions: Sequence[Literal] = ()) -> bool:
        return self.solve(assumptions) is not None

    def _search(self, assumptions: Sequence[Literal]) -> Model | None:
        if self._has_empty_clause:
            return None
        roots = self._units + [self._encode(literal) for literal in assumptions]
        for code in roots:
            if not self._assume(code):
                return None

        decisions: list[tuple[int, int, bool]] = []
        while True:
            variable = self._next_unassigned()
            if variable is None:
                return self._model()
            decisions.append((len(self._trail), -variable, False))
            self._enqueue(-variable)
            while not self._propagate():
                while decisions and decisions[-1][2]:
                    decisions.pop()
                if not decisions:
                    return None
                trail_size, literal, _ = decisions.pop()
                self._undo_to(trail_size)
                decisions.append((trail_size, -literal, True))
                self._enqueue(-literal)

    def _assume(self, code: int) -> bool:
        value = self._value(code)
        if value == _FALSE:
            return False
        if value == _UNASSIGNED:
            self._enqueue(code)
        return self._propagate()

    def _propagate(self) -> bool:
        """Unit propagation over the watched literals. Returns False on conflict."""
        while self._queue_head < len(self._trail):
            false_code = -self._trail[self._queue_head]
            self._queue_head += 1
            watchers = self._watches.get(false_code)
            if not watchers:
                continue
            position = 0
            while position < len(watchers):
                clause_index = watchers[position]
                literals = self._clauses[clause_index]
                if literals[0] == false_code:
                    literals[0], literals[1] = literals[1], literals[0]
                other = literals[0]
                if self._value(other) == _TRUE:
                    position += 1
                    continue
                if self._move_watch(literals, clause_index):
                    watchers[position] = watchers[-1]
                    watchers.pop()
                    continue
                if self._value(other) == _FALSE:
                    return False
                self._enqueue(other)
                position += 1
        return True

    def _move_watch(self, literals: list[int], clause_index: int) -> bool:
        for candidate in range(2, len(literals)):
            if self._value(literals[candidate]) != _FALSE:
                literals[1], literals[candidate] = literals[candidate], literals[1]
                self._watches.setdefault(literals[1], []).append(clause_index)
                return True
        return False

    def _next_unassigned(self) -> int | None:
        for variable in self._order:
            if self._values[variable] == _UNASSIGNED:
                return variable
        return None

    def _enqueue(self, code: int) -> None:
        self._values[abs(code)] = _TRUE if code > 0 else _FALSE
        self._trail.append(code)

    def _undo_to(self, trail_size: int) -> None:
        for code in self._trail[trail_size:]:
            self._values[abs(code)] = _UNASSIGNED
        del self._trail[trail_size:]
        self._queue_head = trail_size

    def _reset(self) -> None:
        self._undo_to(0)

    def _value(self, code: int) -> int:
        value = self._values[abs(code)]
        return value if code > 0 else -value

    def _encode(self, literal: Literal) -> int:
        if literal.symbol not in self._index:
            self._names.append(literal.symbol)
            self._index[literal.symbol] = len(self._names)
            self._values.append(_UNASSIGNED)
            self._order.append(len(self._names))
        variable = self._index[literal.symbol]
        return variable if literal.positive else -variable

    def _model(self) -> Model:
        return {
            name: self._values[position + 1] == _TRUE for position, name in enumerate(self._names)
        }


def is_satisfiable(clauses: Iterable[Clause]) -> bool:
    return DpllSolver(clauses).is_satisfiable()


def entails(clauses: Iterable[Clause], query: Sentence) -> bool:
    """``KB ⊨ α``: the knowledge base plus ``¬α`` has no model."""
    return not is_satisfiable([*clauses, *to_cnf(Not(query))])
