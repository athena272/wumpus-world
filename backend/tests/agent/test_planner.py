from wumpus.agent.planner import destination, plan_route, plan_shot
from wumpus.domain.types import Action, Orientation, Position, all_positions

F, L, R = Action.FORWARD, Action.TURN_LEFT, Action.TURN_RIGHT
START_POSE = (Position(1, 1), Orientation.EAST)


def test_route_uses_the_fewest_actions() -> None:
    plan = plan_route(START_POSE, 4, all_positions(4), {Position(1, 2)})
    assert plan == (L, F)


def test_route_only_walks_on_allowed_squares() -> None:
    allowed = {Position(1, 1), Position(1, 2), Position(1, 3), Position(2, 3)}
    plan = plan_route(START_POSE, 4, allowed, {Position(3, 3)})
    assert plan is not None
    assert destination(START_POSE, plan) == Position(3, 3)
    assert plan.count(F) == 4


def test_unreachable_goal_returns_none() -> None:
    assert plan_route(START_POSE, 4, {Position(1, 1)}, {Position(3, 3)}) is None


def test_already_at_goal_returns_an_empty_plan() -> None:
    assert plan_route(START_POSE, 4, all_positions(4), {Position(1, 1)}) == ()


def test_shot_turns_to_face_the_target_and_shoots() -> None:
    assert plan_shot(START_POSE, 4, {Position(1, 1)}, Position(1, 3)) == (L, Action.SHOOT)
    assert plan_shot(START_POSE, 4, {Position(1, 1)}, Position(4, 1)) == (Action.SHOOT,)


def test_destination_follows_the_plan() -> None:
    assert destination(START_POSE, (F, L, F, R)) == Position(2, 2)
