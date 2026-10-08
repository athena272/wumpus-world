"""Agente lógico híbrido (AIMA, figura 7.20): decide a próxima ação a partir da KB.

Prioridades:
1. Pegar o ouro quando houver brilho.
2. Com o ouro, voltar para [1,1] por casas seguras e subir.
3. Visitar a casa segura não visitada mais próxima.
4. Com a flecha, atirar no Wumpus conhecido (ou numa casa sem poço que pode tê-lo).
5. Arriscar uma casa que não é comprovadamente perigosa.
6. Voltar para [1,1] e sair da caverna.

A cada passo o plano é recalculado do zero. Como a escolha é determinística e o custo do
plano escolhido cai a cada ação, o agente sempre progride sem oscilar.
"""

from __future__ import annotations

from dataclasses import dataclass

from wumpus.agent.inference import CellKnowledge, Inference, Truth
from wumpus.agent.planner import Pose, destination, plan_route, plan_shot
from wumpus.agent.symbols import pit, wumpus
from wumpus.domain.types import START, Action, Orientation, Percept, Position


@dataclass(frozen=True, slots=True)
class AgentView:
    """O que o agente sabe sobre si mesmo; nada do mundo real."""

    position: Position
    orientation: Orientation
    has_gold: bool
    has_arrow: bool
    percept: Percept
    size: int


@dataclass(frozen=True, slots=True)
class Decision:
    action: Action
    explanation: str
    plan: tuple[Action, ...]


def decide(view: AgentView, inference: Inference) -> Decision:
    pose: Pose = (view.position, view.orientation)
    safe = inference.safe_cells()

    if view.percept.glitter and not view.has_gold:
        return _single(Action.GRAB, f"Percebi brilho em {view.position}: pegar o ouro.")

    if view.has_gold:
        return _go_home(view, pose, safe, "Estou com o ouro")

    safe_targets = inference.safe_unvisited()
    route = plan_route(pose, view.size, safe, safe_targets) if safe_targets else None
    if route:
        target = destination(pose, route)
        reason = _safety_reason(inference, target)
        return Decision(route[0], f"Indo para {target}, que é segura: {reason}.", route)

    shot = _plan_shot(view, pose, safe, inference) if view.has_arrow else None
    if shot is not None:
        return shot

    risky = _plan_risk(view, pose, safe, inference)
    if risky is not None:
        return risky

    return _go_home(view, pose, safe, "Não há mais casas para explorar com segurança")


def _go_home(view: AgentView, pose: Pose, safe: frozenset[Position], context: str) -> Decision:
    if view.position == START:
        return _single(Action.CLIMB, f"{context} e estou em [1,1]: subir e sair da caverna.")
    route = plan_route(pose, view.size, safe, {START})
    if not route:
        return _single(Action.CLIMB, f"{context}, mas não há rota segura até [1,1].")
    return Decision(
        route[0],
        f"{context}: voltando para [1,1] só por casas seguras ({len(route)} ações).",
        route,
    )


def _plan_shot(
    view: AgentView, pose: Pose, safe: frozenset[Position], inference: Inference
) -> Decision | None:
    if inference.wumpus_dead:
        return None
    known = [cell for cell in inference.cells.values() if cell.wumpus is Truth.YES]
    if known:
        target = known[0].position
        plan = plan_shot(pose, view.size, safe, target)
        if plan:
            explanation = (
                f"KB ⊨ {wumpus(target)}: me posicionar na linha de tiro e atirar no Wumpus."
            )
            return Decision(plan[0], explanation, plan)
        return None

    for cell in _frontier_cells(view, inference):
        if cell.pit is Truth.NO and cell.wumpus is Truth.UNKNOWN:
            plan = plan_shot(pose, view.size, safe, cell.position)
            if plan:
                explanation = (
                    f"Nenhuma casa é comprovadamente segura. KB ⊨ ¬{pit(cell.position)}, "
                    f"mas o Wumpus pode estar em {cell.position}: atirar para descobrir."
                )
                return Decision(plan[0], explanation, plan)
    return None


def _plan_risk(
    view: AgentView, pose: Pose, safe: frozenset[Position], inference: Inference
) -> Decision | None:
    candidates = [
        cell
        for cell in _frontier_cells(view, inference)
        if cell.pit is not Truth.YES and (cell.wumpus is not Truth.YES or inference.wumpus_dead)
    ]
    if not candidates:
        return None
    fewest_unknowns = min(_unknown_hazards(cell, inference) for cell in candidates)
    goals = {
        cell.position for cell in candidates if _unknown_hazards(cell, inference) == fewest_unknowns
    }
    route = plan_route(pose, view.size, safe, goals)
    if not route:
        return None
    target = destination(pose, route)
    explanation = (
        f"Nenhuma casa é comprovadamente segura. Arriscando {target}: "
        f"KB ⊭ {pit(target)} e KB ⊭ {wumpus(target)}, então ela não é comprovadamente perigosa."
    )
    return Decision(route[0], explanation, route)


def _frontier_cells(view: AgentView, inference: Inference) -> list[CellKnowledge]:
    visited = {position for position, cell in inference.cells.items() if cell.visited}
    frontier = {
        neighbor
        for position in visited
        for neighbor in position.neighbors(view.size)
        if neighbor not in visited
    }
    return [inference.cell(position) for position in sorted(frontier)]


def _unknown_hazards(cell: CellKnowledge, inference: Inference) -> int:
    wumpus_unknown = cell.wumpus is Truth.UNKNOWN and not inference.wumpus_dead
    return int(cell.pit is Truth.UNKNOWN) + int(wumpus_unknown)


def _safety_reason(inference: Inference, target: Position) -> str:
    if inference.cell(target).wumpus is Truth.NO:
        return f"KB ⊨ ¬{pit(target)} ∧ ¬{wumpus(target)}"
    return f"KB ⊨ ¬{pit(target)} e o Wumpus está morto"


def _single(action: Action, explanation: str) -> Decision:
    return Decision(action, explanation, (action,))
