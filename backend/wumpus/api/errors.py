"""Respostas de erro padronizadas: ``{"error": {"code", "message", "details"}}``."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from wumpus.api.schemas import ErrorBody, ErrorResponse
from wumpus.domain.errors import DomainError, GameOverError

logger = logging.getLogger(__name__)


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(GameOverError, _game_over)
    app.add_exception_handler(DomainError, _domain_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(HTTPException, _http_error)
    app.add_exception_handler(Exception, _unexpected_error)


def error_response(
    status_code: int, code: str, message: str, details: list[str] | None = None
) -> JSONResponse:
    body = ErrorResponse(error=ErrorBody(code=code, message=message, details=details or []))
    return JSONResponse(status_code=status_code, content=body.model_dump(by_alias=True))


async def _game_over(_: Request, exc: Exception) -> JSONResponse:
    return error_response(409, "game_over", str(exc))


async def _domain_error(_: Request, exc: Exception) -> JSONResponse:
    return error_response(400, "invalid_move", str(exc))


async def _validation_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    details = [
        f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}" for error in exc.errors()
    ]
    return error_response(422, "invalid_request", "A requisição é inválida.", details)


async def _http_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, HTTPException)
    return error_response(exc.status_code, "http_error", str(exc.detail))


async def _unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unexpected error while handling a request", exc_info=exc)
    return error_response(500, "internal_error", "Erro inesperado no servidor.")
