import os
from dataclasses import dataclass

DEFAULT_ALLOWED_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")


@dataclass(frozen=True, slots=True)
class Settings:
    allowed_origins: tuple[str, ...]


def load_settings() -> Settings:
    """``ALLOWED_ORIGINS`` is a comma-separated list, e.g. the frontend URL on Vercel."""
    raw = os.environ.get("ALLOWED_ORIGINS", "")
    origins = tuple(origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip())
    return Settings(allowed_origins=origins or DEFAULT_ALLOWED_ORIGINS)
