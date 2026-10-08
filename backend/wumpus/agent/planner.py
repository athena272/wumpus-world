"""Planejamento de rotas por busca em largura sobre (posição, orientação).

Como cada giro e cada passo custam uma ação, a BFS devolve o plano com menos ações.
"""

from __future__ import annotations

from collections import deque
from collections.abc import Callable, Collection

from wumpus.domain.types import Action, Orientation, Position, line_of_fire

type Pose = tuple[Position, Orientation]

_MOVES = (Action.FORWARD, Action.TURN_LEFT, Action.TURN_RIGHT)


def plan_path(
    start: Pose,
    size: int,
    allowed: Collection[Position],
    is_goal: Callable[[Position, Orientation], bool],
) -> tuple[Action, ...] | None:
    """Shortest action sequence to a goal pose, walking only on ``allowed`` squares."""
    if is_goal(*start):
        return ()
    parents: dict[Pose, tuple[Pose, Action]] = {}
    frontier: deque[Pose] = deque([start])
    seen = {start}
    while frontier:
        pose = frontier.popleft()
        for action in _MOVES:
            nxt = _successor(pose, action, size, allowed)
            if nxt is None or nxt in seen:
                continue
            seen.add(nxt)
            parents[nxt] = (pose, action)
            if is_goal(*nxt):
                return _rebuild(parents, start, nxt)
            frontier.append(nxt)
    return None


def plan_route(
    start: Pose,
    size: int,
    allowed: Collection[Position],
    goals: Collection[Position],
) -> tuple[Action, ...] | None:
    """Path to the nearest of ``goals``. Goals may lie outside ``allowed``."""
    walkable = set(allowed) | set(goals)
    return plan_path(start, size, walkable, lambda position, _: position in goals)


def plan_shot(
    start: Pose,
    size: int,
    allowed: Collection[Position],
    target: Position,
) -> tuple[Action, ...] | None:
    """Moves to a pose facing ``target`` in a straight line, then shoots."""

    def aims_at_target(position: Position, orientation: Orientation) -> bool:
        return target in line_of_fire(position, orientation, size)

    path = plan_path(start, size, allowed, aims_at_target)
    return None if path is None else (*path, Action.SHOOT)


def destination(start: Pose, plan: tuple[Action, ...]) -> Position:
    position, orientation = start
    for action in plan:
        if action is Action.TURN_LEFT:
            orientation = orientation.turn_left()
        elif action is Action.TURN_RIGHT:
            orientation = orientation.turn_right()
        elif action is Action.FORWARD:
            position = position.moved(orientation)
    return position


def _successor(pose: Pose, action: Action, size: int, allowed: Collection[Position]) -> Pose | None:
    position, orientation = pose
    if action is Action.TURN_LEFT:
        return position, orientation.turn_left()
    if action is Action.TURN_RIGHT:
        return position, orientation.turn_right()
    target = position.moved(orientation)
    if not target.is_inside(size) or target not in allowed:
        return None
    return target, orientation


def _rebuild(
    parents: dict[Pose, tuple[Pose, Action]], start: Pose, goal: Pose
) -> tuple[Action, ...]:
    actions: list[Action] = []
    pose = goal
    while pose != start:
        pose, action = parents[pose]
        actions.append(action)
    return tuple(reversed(actions))
