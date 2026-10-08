import pytest
from fastapi.testclient import TestClient

from wumpus.api.app import create_app
from wumpus.api.settings import Settings

FRONTEND_ORIGIN = "https://wumpus.example.com"


@pytest.fixture
def client() -> TestClient:
    app = create_app(Settings(allowed_origins=(FRONTEND_ORIGIN,)))
    return TestClient(app, raise_server_exceptions=False)
