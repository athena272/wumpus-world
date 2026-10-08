from typing import Any

from fastapi import APIRouter

from wumpus.agent.session import GameSession
from wumpus.api.presenter import present_decision, present_game
from wumpus.api.schemas import (
    AgentDecisionResponse,
    ErrorResponse,
    GameRequest,
    GameView,
    HealthResponse,
)

_ERRORS: dict[int | str, dict[str, Any]] = {
    409: {"model": ErrorResponse, "description": "A partida já terminou."},
    422: {"model": ErrorResponse, "description": "Requisição inválida."},
}

router = APIRouter(prefix="/api")


@router.get("/health")
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.post("/games/state", responses=_ERRORS)
def game_state(request: GameRequest) -> GameView:
    """Reconstrói a partida a partir da configuração e das ações já feitas.

    Com ``actions`` vazio, inicia uma partida nova.
    """
    session = GameSession.replay(request.config.to_domain(), request.actions)
    return present_game(session, request.config)


@router.post("/agent/decide", responses=_ERRORS)
def agent_decide(request: GameRequest) -> AgentDecisionResponse:
    """O agente lógico escolhe a próxima ação, que já é aplicada na resposta."""
    session = GameSession.replay(request.config.to_domain(), request.actions)
    decision = session.decide()
    session.apply(decision.action)
    return AgentDecisionResponse(
        decision=present_decision(decision),
        view=present_game(session, request.config),
    )
