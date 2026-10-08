"""Entrypoint ASGI. A Vercel (e o ``uvicorn main:app`` local) procuram ``app`` aqui."""

from wumpus.api.app import create_app

app = create_app()
