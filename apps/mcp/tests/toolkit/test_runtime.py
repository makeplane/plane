"""Call-time parameter coercion."""

from __future__ import annotations

import pytest

from plane_mcp.toolkit.runtime import coerce_list


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("id-1,id-2", ["id-1", "id-2"]),
        ("id-1, id-2", ["id-1", "id-2"]),
        ("id-1", ["id-1"]),
        ('["id-1","id-2"]', ["id-1", "id-2"]),
        ("", None),
    ],
)
def test_an_id_list_splits_on_commas(raw, expected):
    """A UUID never contains a comma, so there it is a separator."""
    assert coerce_list(raw) == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("Hello, world", ["Hello, world"]),
        ("plain text", ["plain text"]),
        ('["a","b"]', ["a", "b"]),
        ("", None),
    ],
)
def test_free_text_keeps_its_commas(raw, expected):
    """A property's default_value is typed by a person.

    Splitting it turned the one default "Hello, world" into two values and
    reported success -- the same corruption class as re-deriving a value's type
    from how its string looked.
    """
    assert coerce_list(raw, split=False) == expected
