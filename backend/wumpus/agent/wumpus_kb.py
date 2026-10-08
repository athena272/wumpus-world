"""Conhecimento do agente sobre o Mundo de Wumpus.

Esta classe só recebe o que o agente percebe (posição, percepções e resultado da
flecha). Ela nunca consulta o mundo real, então tudo o que sabe veio da KB.
"""

from __future__ import annotations

from wumpus.agent.knowledge_base import KnowledgeBase, Origin
from wumpus.agent.symbols import WUMPUS_ALIVE, breeze, glitter, pit, stench, wumpus
from wumpus.domain.types import (
    START,
    BreezeMode,
    Orientation,
    Percept,
    Position,
    all_positions,
    line_of_fire,
)
from wumpus.logic.cardinality import at_least_one, at_most_one, exactly
from wumpus.logic.cnf import Clause
from wumpus.logic.sentences import Iff, Not, Symbol, conjunction, disjunction


class WumpusKnowledgeBase:
    def __init__(self, size: int, breeze_mode: BreezeMode) -> None:
        self.size = size
        self.breeze_mode = breeze_mode
        self.base = KnowledgeBase()
        self._percepts: dict[Position, Percept] = {}
        self._wumpus_dead = False
        self._tell_world_rules()

    @property
    def clauses(self) -> tuple[Clause, ...]:
        return self.base.clauses

    @property
    def visited(self) -> frozenset[Position]:
        return frozenset(self._percepts)

    @property
    def percepts(self) -> dict[Position, Percept]:
        """Última percepção registrada em cada casa visitada."""
        return dict(self._percepts)

    @property
    def heard_scream(self) -> bool:
        return self._wumpus_dead

    def frontier(self) -> tuple[Position, ...]:
        """Casas não visitadas vizinhas de alguma casa visitada."""
        visited = self.visited
        cells = {
            neighbor
            for cell in visited
            for neighbor in cell.neighbors(self.size)
            if neighbor not in visited
        }
        return tuple(sorted(cells))

    def observe(self, position: Position, percept: Percept, step: int) -> None:
        """Registers what the agent senses after arriving at (or staying in) ``position``."""
        first_visit = position not in self._percepts
        self._percepts[position] = percept
        if first_visit:
            self._tell_first_visit(position, percept, step)

    def observe_shot(
        self, origin: Position, orientation: Orientation, *, scream: bool, step: int
    ) -> None:
        path = line_of_fire(origin, orientation, self.size)
        if scream:
            self._wumpus_dead = True
            self.base.tell(
                Not(WUMPUS_ALIVE),
                description="Grito: a flecha matou o Wumpus.",
                origin=Origin.PERCEPT,
                step=step,
            )
            self.base.tell(
                disjunction(*(wumpus(cell) for cell in path)),
                description="O Wumpus estava na linha de tiro da flecha.",
                origin=Origin.ACTION,
                step=step,
            )
        elif path:
            self.base.tell(
                conjunction(*(Not(wumpus(cell)) for cell in path)),
                description="A flecha atravessou essas casas sem grito: não há Wumpus nelas.",
                origin=Origin.ACTION,
                step=step,
            )

    def _tell_world_rules(self) -> None:
        cells = all_positions(self.size)
        wumpus_names = [wumpus(cell).name for cell in cells]
        self.base.tell(
            Not(pit(START)),
            description="Não há poço na casa inicial.",
            origin=Origin.RULE,
            step=0,
        )
        self.base.tell(
            Not(wumpus(START)),
            description="Não há Wumpus na casa inicial.",
            origin=Origin.RULE,
            step=0,
        )
        self.base.tell_clauses(
            f"{wumpus_names[0]} ∨ {wumpus_names[1]} ∨ … ∨ {wumpus_names[-1]}",
            at_least_one(wumpus_names),
            description="Existe pelo menos um Wumpus.",
            origin=Origin.RULE,
            step=0,
        )
        self.base.tell_clauses(
            "¬W[i] ∨ ¬W[j], para todo par de casas i ≠ j",
            at_most_one(wumpus_names),
            description="Existe no máximo um Wumpus.",
            origin=Origin.RULE,
            step=0,
        )

    def _tell_first_visit(self, position: Position, percept: Percept, step: int) -> None:
        neighbors = position.neighbors(self.size)
        tell = self.base.tell

        tell(
            Not(pit(position)),
            description=f"O agente está vivo em {position}: não há poço ali.",
            origin=Origin.PERCEPT,
            step=step,
        )
        if not self._wumpus_dead:
            tell(
                Not(wumpus(position)),
                description=f"O agente está vivo em {position}: o Wumpus não está ali.",
                origin=Origin.PERCEPT,
                step=step,
            )
        tell(
            Iff(breeze(position), disjunction(*(pit(cell) for cell in neighbors))),
            description=f"Há brisa em {position} se e somente se há poço numa casa vizinha.",
            origin=Origin.RULE,
            step=step,
        )
        tell(
            Iff(stench(position), disjunction(*(wumpus(cell) for cell in neighbors))),
            description=f"Há fedor em {position} se e somente se o Wumpus está numa casa vizinha.",
            origin=Origin.RULE,
            step=step,
        )
        tell(
            _literal(breeze(position), percept.has_breeze),
            description=f"Brisa percebida em {position}."
            if percept.has_breeze
            else f"Nenhuma brisa em {position}.",
            origin=Origin.PERCEPT,
            step=step,
        )
        tell(
            _literal(stench(position), percept.stench),
            description=f"Fedor percebido em {position}."
            if percept.stench
            else f"Nenhum fedor em {position}.",
            origin=Origin.PERCEPT,
            step=step,
        )
        if self.breeze_mode is BreezeMode.INTENSITY and percept.has_breeze:
            self._tell_breeze_intensity(position, percept.breeze, neighbors, step)
        if percept.glitter:
            tell(
                glitter(position),
                description=f"Brilho percebido em {position}: o ouro está aqui.",
                origin=Origin.PERCEPT,
                step=step,
            )

    def _tell_breeze_intensity(
        self, position: Position, intensity: int, neighbors: tuple[Position, ...], step: int
    ) -> None:
        names = [pit(cell).name for cell in neighbors]
        self.base.tell_clauses(
            f"Exatamente {intensity} de {{{', '.join(names)}}}",
            exactly(intensity, names),
            description=f"Brisa ×{intensity} em {position}: exatamente {intensity} "
            f"poço(s) nas casas vizinhas.",
            origin=Origin.PERCEPT,
            step=step,
        )


def _literal(symbol: Symbol, value: bool) -> Symbol | Not:
    return symbol if value else Not(symbol)
