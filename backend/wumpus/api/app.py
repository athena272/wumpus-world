from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from wumpus.api.errors import register_error_handlers
from wumpus.api.routes import router
from wumpus.api.settings import Settings, load_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved = settings or load_settings()
    app = FastAPI(
        title="Wumpus World API",
        version="1.0.0",
        description="Motor do Mundo de Wumpus, base de conhecimento proposicional e agente lógico.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(resolved.allowed_origins),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    register_error_handlers(app)
    app.include_router(router)
    return app
