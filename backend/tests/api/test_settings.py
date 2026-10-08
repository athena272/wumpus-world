import pytest

from wumpus.api.settings import DEFAULT_ALLOWED_ORIGINS, load_settings


def test_defaults_to_the_local_vite_server(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    assert load_settings().allowed_origins == DEFAULT_ALLOWED_ORIGINS


def test_parses_a_comma_separated_list(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALLOWED_ORIGINS", " https://a.vercel.app/ , https://b.dev ,")
    assert load_settings().allowed_origins == ("https://a.vercel.app", "https://b.dev")
