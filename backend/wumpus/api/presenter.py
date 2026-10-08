"""Converte a sessão (domínio + KB + inferência) nos contratos HTTP."""

from wumpus.agent.hybrid_agent import Decision
from wumpus.agent.inference import AskResult, CellKnowledge, PitModels
from wumpus.agent.knowledge_base import KbEntry
from wumpus.agent.session import GameSession
from wumpus.api.schemas import (
    AgentOut,
    AskResultOut,
    CellOut,
    DecisionOut,
    GameConfigIn,
    GameView,
    KbEntryOut,
    KbStatsOut,
    KnowledgeBaseOut,
    PerceptOut,
    PitModelsOut,
    PositionOut,
    WorldOut,
)
from wumpus.domain.types import Percept, Position


def present_game(session: GameSession, config: GameConfigIn) -> GameView:
    state = session.state
    inference = session.inference
    percepts = session.knowledge.percepts
    return GameView(
        config=config,
        status=state.status,
        score=state.score,
        step=state.step,
        agent=AgentOut(
            position=_position(state.agent.position),
            orientation=state.agent.orientation,
            has_gold=state.agent.has_gold,
            has_arrow=state.agent.has_arrow,
        ),
        percept=_percept(state.percept),
        events=list(state.events),
        wumpus_dead_known=inference.wumpus_dead,
        cells=[_cell(cell, percepts.get(cell.position)) for cell in inference.cells.values()],
        knowledge_base=_knowledge_base(session),
        queries=[_query(query) for query in inference.queries],
        pit_models=_pit_models(session.pit_models),
        world=_world(session) if state.is_over else None,
    )


def present_decision(decision: Decision) -> DecisionOut:
    return DecisionOut(
        action=decision.action,
        explanation=decision.explanation,
        plan=list(decision.plan),
    )


def _position(position: Position) -> PositionOut:
    return PositionOut(x=position.x, y=position.y)


def _percept(percept: Percept) -> PerceptOut:
    return PerceptOut(
        stench=percept.stench,
        breeze=percept.breeze,
        glitter=percept.glitter,
        bump=percept.bump,
        scream=percept.scream,
    )


def _cell(cell: CellKnowledge, percept: Percept | None) -> CellOut:
    return CellOut(
        position=_position(cell.position),
        visited=cell.visited,
        pit=cell.pit,
        wumpus=cell.wumpus,
        safe=cell.safe,
        percept=_percept(percept) if percept is not None else None,
    )


def _knowledge_base(session: GameSession) -> KnowledgeBaseOut:
    base = session.knowledge.base
    entries = base.entries
    return KnowledgeBaseOut(
        entries=[_entry(entry) for entry in entries],
        stats=KbStatsOut(
            sentences=len(entries),
            clauses=len(base.clauses),
            symbols=len(base.symbols),
        ),
    )


def _entry(entry: KbEntry) -> KbEntryOut:
    return KbEntryOut(
        id=entry.id,
        text=entry.text,
        description=entry.description,
        origin=entry.origin,
        step=entry.step,
        clause_count=len(entry.clauses),
    )


def _query(query: AskResult) -> AskResultOut:
    return AskResultOut(
        position=_position(query.position), query=query.query, entailed=query.entailed
    )


def _pit_models(models: PitModels) -> PitModelsOut:
    return PitModelsOut(
        symbols=list(models.symbols),
        total_assignments=models.total_assignments,
        model_count=models.model_count,
        models=[dict(model) for model in models.models],
        truncated=models.truncated,
        skipped=models.skipped,
    )


def _world(session: GameSession) -> WorldOut:
    world = session.state.world
    return WorldOut(
        wumpus=_position(world.wumpus),
        gold=_position(world.gold),
        pits=[_position(pit) for pit in sorted(world.pits)],
        wumpus_alive=session.state.wumpus_alive,
    )
