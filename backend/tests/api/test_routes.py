from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.api.conftest import FRONTEND_ORIGIN

SLIDES_CONFIG = {"preset": "slides", "breezeMode": "classic"}


def post_state(client: TestClient, actions: list[str], config: dict[str, Any] | None = None) -> Any:
    return client.post(
        "/api/games/state", json={"config": config or SLIDES_CONFIG, "actions": actions}
    )


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_new_game_returns_the_initial_view_in_camel_case(client: TestClient) -> None:
    response = post_state(client, [])
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "playing"
    assert body["agent"] == {
        "position": {"x": 1, "y": 1},
        "orientation": "east",
        "hasGold": False,
        "hasArrow": True,
    }
    assert body["config"]["pitProbability"] == 0.2
    assert body["world"] is None
    assert body["knowledgeBase"]["stats"]["sentences"] == len(body["knowledgeBase"]["entries"])
    assert len(body["cells"]) == 16


def test_state_after_actions_shows_percepts_inferences_and_models(client: TestClient) -> None:
    body = post_state(client, ["forward"]).json()
    assert body["percept"]["breeze"] == 1
    cell_12 = next(cell for cell in body["cells"] if cell["position"] == {"x": 1, "y": 2})
    assert cell_12["safe"] is True
    assert cell_12["pit"] == "no"
    visited = next(cell for cell in body["cells"] if cell["position"] == {"x": 2, "y": 1})
    assert visited["percept"]["breeze"] == 1
    assert body["pitModels"]["modelCount"] == 3
    assert {"query": "¬P[2,2]", "entailed": False, "position": {"x": 2, "y": 2}} in body["queries"]
    new_entries = [entry for entry in body["knowledgeBase"]["entries"] if entry["step"] == 1]
    assert {entry["origin"] for entry in new_entries} == {"rule", "percept"}


def test_world_is_revealed_only_when_the_game_ends(client: TestClient) -> None:
    body = post_state(client, ["forward", "forward"]).json()
    assert body["status"] == "dead"
    assert body["world"]["wumpus"] == {"x": 1, "y": 3}
    assert {"x": 3, "y": 1} in body["world"]["pits"]


def test_same_seed_and_actions_always_produce_the_same_view(client: TestClient) -> None:
    config = {"size": 6, "seed": 99, "breezeMode": "intensity"}
    first = post_state(client, ["turn_left", "forward"], config).json()
    second = post_state(client, ["turn_left", "forward"], config).json()
    assert first == second


def test_agent_decides_and_applies_the_action(client: TestClient) -> None:
    response = client.post("/api/agent/decide", json={"config": SLIDES_CONFIG, "actions": []})
    assert response.status_code == 200
    body = response.json()
    assert body["decision"]["action"] in {"forward", "turn_left"}
    assert "KB ⊨" in body["decision"]["explanation"]
    assert body["decision"]["plan"][0] == body["decision"]["action"]
    assert body["view"]["step"] == 1


def test_actions_after_the_end_are_rejected_with_409(client: TestClient) -> None:
    response = post_state(client, ["climb", "forward"])
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "game_over"
    decide = client.post("/api/agent/decide", json={"config": SLIDES_CONFIG, "actions": ["climb"]})
    assert decide.status_code == 409


@pytest.mark.parametrize(
    "payload",
    [
        {"config": {"size": 9}, "actions": []},
        {"config": {"preset": "slides", "size": 6}, "actions": []},
        {"config": {}, "actions": ["fly"]},
        {"config": {"pitProbability": 0.9}, "actions": []},
        {"config": {}, "actions": ["forward"] * 1001},
        {"actions": []},
        {"config": {"seed": -1}, "actions": []},
        {"config": {"seed": 2**31}, "actions": []},
        {"config": {"seed": 10**400}, "actions": []},
        {"config": {"seed": "42"}, "actions": []},
        {"config": {"seed": 42.5}, "actions": []},
        {"config": {"seed": 42.0}, "actions": []},
        {"config": {"seed": True}, "actions": []},
        {"config": {"seed": None}, "actions": []},
        {"config": {"size": "5"}, "actions": []},
        {"config": {"pitProbability": "0.2"}, "actions": []},
        {"config": {"seed": 1, "admin": True}, "actions": []},
        {"config": {}, "actions": [], "extra": 1},
        {"config": {}, "actions": "forward"},
    ],
)
def test_invalid_requests_are_rejected_with_422(
    client: TestClient, payload: dict[str, Any]
) -> None:
    response = client.post("/api/games/state", json=payload)
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "invalid_request"
    assert error["details"]


@pytest.mark.parametrize("seed", [0, 2**31 - 1])
def test_seed_accepts_the_whole_range(client: TestClient, seed: int) -> None:
    response = post_state(client, [], {"seed": seed, "pitProbability": 0.2})
    assert response.status_code == 200
    assert response.json()["config"]["seed"] == seed


def test_non_finite_pit_probability_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/games/state",
        content=b'{"config": {"pitProbability": NaN}, "actions": []}',
        headers={"content-type": "application/json"},
    )
    assert response.status_code == 422


def test_unknown_route_uses_the_standard_error_format(client: TestClient) -> None:
    response = client.get("/api/nope")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "http_error"


def test_unexpected_errors_do_not_leak_details(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def explode(*_: object, **__: object) -> None:
        raise RuntimeError("secret internals")

    monkeypatch.setattr("wumpus.api.routes.GameSession.replay", explode)
    response = post_state(client, [])
    assert response.status_code == 500
    assert response.json()["error"] == {
        "code": "internal_error",
        "message": "Erro inesperado no servidor.",
        "details": [],
    }


def test_cors_allows_only_the_configured_frontend(client: TestClient) -> None:
    allowed = client.options(
        "/api/games/state",
        headers={"Origin": FRONTEND_ORIGIN, "Access-Control-Request-Method": "POST"},
    )
    assert allowed.headers["access-control-allow-origin"] == FRONTEND_ORIGIN
    denied = client.options(
        "/api/games/state",
        headers={"Origin": "https://evil.example.com", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in denied.headers
