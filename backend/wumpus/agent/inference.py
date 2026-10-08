"""O que a KB permite concluir sobre cada casa (ASK), e os modelos dos poços da fronteira.

Para cada casa perguntamos ``KB ⊨ P``, ``KB ⊨ ¬P``, ``KB ⊨ W`` e ``KB ⊨ ¬W``. Cada
pergunta é uma refutação por DPLL. Os modelos encontrados no caminho são reaproveitados:
se algum modelo da KB já contradiz a pergunta, ela não é consequência lógica e não é
preciso chamar o resolvedor de novo.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from wumpus.agent.symbols import WUMPUS_ALIVE, breeze, pit, wumpus
from wumpus.agent.wumpus_kb import WumpusKnowledgeBase
from wumpus.domain.types import Position, all_positions
from wumpus.logic.cnf import Literal
from wumpus.logic.dpll import DpllSolver, Model
from wumpus.logic.model_checking import enumerate_models

MAX_FRONTIER_SYMBOLS = 10
"""Acima disso a enumeração (2ⁿ) deixa de ser didática; o DPLL continua respondendo."""
MAX_LISTED_MODELS = 32


class Truth(StrEnum):
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"


@dataclass(frozen=True, slots=True)
class CellKnowledge:
    position: Position
    visited: bool
    pit: Truth
    wumpus: Truth
    safe: bool

    @property
    def provably_dangerous(self) -> bool:
        return self.pit is Truth.YES or self.wumpus is Truth.YES


@dataclass(frozen=True, slots=True)
class AskResult:
    position: Position
    query: str
    entailed: bool


@dataclass(frozen=True, slots=True)
class Inference:
    cells: dict[Position, CellKnowledge]
    queries: tuple[AskResult, ...]
    wumpus_dead: bool

    def cell(self, position: Position) -> CellKnowledge:
        return self.cells[position]

    def safe_unvisited(self) -> frozenset[Position]:
        return frozenset(
            position for position, cell in self.cells.items() if cell.safe and not cell.visited
        )

    def safe_cells(self) -> frozenset[Position]:
        return frozenset(position for position, cell in self.cells.items() if cell.safe)


@dataclass(frozen=True, slots=True)
class PitModels:
    """Verificação de modelos sobre os poços candidatos da fronteira, como nos slides."""

    symbols: tuple[str, ...]
    total_assignments: int
    model_count: int
    models: tuple[dict[str, bool], ...]
    truncated: bool
    skipped: bool


class InconsistentKnowledgeError(RuntimeError):
    """The KB has no model. It means a bug in the rules, never a player mistake."""


class _EntailmentOracle:
    def __init__(self, solver: DpllSolver) -> None:
        first = solver.solve()
        if first is None:
            raise InconsistentKnowledgeError("The knowledge base is unsatisfiable")
        self._solver = solver
        self._models: list[Model] = [first]

    def entails(self, literal: Literal) -> bool:
        if any(model.get(literal.symbol) is not literal.positive for model in self._models):
            return False
        counterexample = self._solver.solve([literal.negate()])
        if counterexample is None:
            return True
        self._models.append(counterexample)
        return False

    def truth(self, symbol: str) -> Truth:
        if self.entails(Literal(symbol, True)):
            return Truth.YES
        if self.entails(Literal(symbol, False)):
            return Truth.NO
        return Truth.UNKNOWN


def infer(knowledge: WumpusKnowledgeBase) -> Inference:
    cells = all_positions(knowledge.size)
    extra = [WUMPUS_ALIVE.name] + [pit(c).name for c in cells] + [wumpus(c).name for c in cells]
    oracle = _EntailmentOracle(DpllSolver(knowledge.clauses, extra_symbols=extra))

    wumpus_dead = oracle.entails(Literal(WUMPUS_ALIVE.name, False))
    visited = knowledge.visited
    result: dict[Position, CellKnowledge] = {}
    for position in cells:
        pit_truth = oracle.truth(pit(position).name)
        wumpus_truth = oracle.truth(wumpus(position).name)
        no_live_wumpus = wumpus_truth is Truth.NO or wumpus_dead
        result[position] = CellKnowledge(
            position=position,
            visited=position in visited,
            pit=pit_truth,
            wumpus=wumpus_truth,
            safe=position in visited or (pit_truth is Truth.NO and no_live_wumpus),
        )
    return Inference(
        cells=result,
        queries=_frontier_queries(knowledge, result),
        wumpus_dead=wumpus_dead,
    )


def _frontier_queries(
    knowledge: WumpusKnowledgeBase, cells: dict[Position, CellKnowledge]
) -> tuple[AskResult, ...]:
    queries: list[AskResult] = []
    for position in knowledge.frontier():
        cell = cells[position]
        pit_name, wumpus_name = pit(position).name, wumpus(position).name
        queries += [
            AskResult(position, f"¬{pit_name}", cell.pit is Truth.NO),
            AskResult(position, pit_name, cell.pit is Truth.YES),
            AskResult(position, f"¬{wumpus_name}", cell.wumpus is Truth.NO),
            AskResult(position, wumpus_name, cell.wumpus is Truth.YES),
        ]
    return tuple(queries)


def pit_models(knowledge: WumpusKnowledgeBase) -> PitModels:
    frontier = knowledge.frontier()
    symbols = tuple(pit(position).name for position in frontier)
    total = 2 ** len(symbols)
    if len(symbols) > MAX_FRONTIER_SYMBOLS:
        return PitModels(symbols, total, 0, (), truncated=False, skipped=True)

    fixed: dict[str, bool] = {}
    for position, percept in knowledge.percepts.items():
        fixed[pit(position).name] = False
        fixed[breeze(position).name] = percept.has_breeze
    models = enumerate_models(knowledge.clauses, symbols, fixed)
    return PitModels(
        symbols=symbols,
        total_assignments=total,
        model_count=len(models),
        models=tuple(models[:MAX_LISTED_MODELS]),
        truncated=len(models) > MAX_LISTED_MODELS,
        skipped=False,
    )
