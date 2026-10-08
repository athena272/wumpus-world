from wumpus.domain.types import Orientation, Position, all_positions, line_of_fire


def test_turning_cycles_through_the_four_orientations() -> None:
    assert Orientation.EAST.turn_left() is Orientation.NORTH
    assert Orientation.NORTH.turn_left() is Orientation.WEST
    assert Orientation.WEST.turn_right() is Orientation.NORTH
    assert Orientation.SOUTH.turn_right() is Orientation.WEST


def test_neighbors_stay_inside_the_board() -> None:
    assert set(Position(1, 1).neighbors(4)) == {Position(2, 1), Position(1, 2)}
    assert len(Position(2, 2).neighbors(4)) == 4


def test_line_of_fire_excludes_the_origin_and_stops_at_the_wall() -> None:
    assert line_of_fire(Position(1, 1), Orientation.NORTH, 4) == (
        Position(1, 2),
        Position(1, 3),
        Position(1, 4),
    )
    assert line_of_fire(Position(4, 1), Orientation.EAST, 4) == ()


def test_all_positions_and_rendering() -> None:
    assert len(all_positions(5)) == 25
    assert str(Position(2, 3)) == "[2,3]"
