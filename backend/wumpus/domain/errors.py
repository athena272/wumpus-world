class DomainError(Exception):
    """Base class for rule violations that the API reports as client errors."""


class GameOverError(DomainError):
    def __init__(self, action_index: int) -> None:
        super().__init__(
            f"A partida já terminou; a ação #{action_index + 1} não pode ser aplicada."
        )
        self.action_index = action_index
