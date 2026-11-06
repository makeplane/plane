"""If an action accepts a cursor, it must hand one back.

Seven resources took a `cursor` parameter and returned `response.results` -- the
bare page, with the pagination envelope discarded. A caller could pass a cursor
but had no way to ever learn a valid value, and a truncated first page was
indistinguishable from a complete one.

This is written as a surface-wide invariant rather than seven per-module tests,
so a resource added later is covered without anyone remembering to.
"""

from __future__ import annotations

import inspect

import pytest

from plane_mcp.tools.registry import RESOURCES
from tests.tools.test_dispatch import CONDITIONAL, NEEDS_FIXTURE, _value

NEXT = "CURSOR-NEXT"

# Endpoints Plane does not paginate. The SDK response model carries no cursor
# fields at all, so the action must not advertise `cursor`/`per_page` either --
# claiming to page and then silently truncating is the bug this test exists for.
NOT_PAGINATED = {("initiative", "list")}


class _Page:
    """A page of results carrying a full pagination envelope."""

    results = [{"id": "rec-1"}, {"id": "rec-2"}]
    total_count = 7
    count = 2
    next_cursor = NEXT
    prev_cursor = "CURSOR-PREV"
    next_page_results = True
    prev_page_results = False


def _paginated_actions():
    for mod in RESOURCES:
        for action in mod.ACTIONS:
            if "cursor" not in action.optional:
                continue
            if (mod.NAME, action.name) in NEEDS_FIXTURE:
                continue
            yield pytest.param(mod, action, id=f"{mod.NAME}.{action.name}")


def _cursor_of(result):
    """Read next_cursor from an envelope dict or a paginated response model."""
    if isinstance(result, dict):
        return result.get("next_cursor")
    return getattr(result, "next_cursor", None)


@pytest.mark.parametrize(("mod", "action"), list(_paginated_actions()))
def test_a_cursor_accepting_action_returns_a_cursor(mod, action, registered, spy):
    spy.__dict__["default"] = _Page()
    tool = registered[mod.NAME]
    signature = inspect.signature(tool.fn)

    args = {"action": action.name} if "action" in signature.parameters else {}
    for param in action.requires:
        args[param] = _value(mod.NAME, param, signature.parameters[param].annotation)
    args.update(CONDITIONAL.get((mod.NAME, action.name), {}))

    result = tool.fn(**args)

    assert not (isinstance(result, str) and result.startswith("Error:")), result
    assert _cursor_of(result) == NEXT, (
        f"{mod.NAME}.{action.name} accepts `cursor` but its result exposes no next_cursor "
        f"-- a caller can page in but never page on. Got {type(result).__name__}."
    )


@pytest.mark.parametrize(("mod_name", "action_name"), sorted(NOT_PAGINATED))
def test_an_unpaginated_action_does_not_advertise_a_cursor(mod_name, action_name):
    """Better to not offer paging than to offer it and drop the caller's place."""
    mod = next(m for m in RESOURCES if m.NAME == mod_name)
    action = next(a for a in mod.ACTIONS if a.name == action_name)

    assert "cursor" not in action.optional, (
        f"{mod_name}.{action_name} advertises `cursor`, but its SDK response model carries "
        "no cursor fields, so the page it returns is silently truncated"
    )
    assert "per_page" not in action.optional


def test_project_list_bounds_its_own_page(registered, spy):
    """Unbounded, Plane returns every project: 265 of them overflowed a caller's context."""
    from plane_mcp.tools.project import DEFAULT_PER_PAGE

    registered["project"].fn(action="list")

    sent = spy.recorder.only().kwargs["params"]
    assert sent.per_page == DEFAULT_PER_PAGE, "an unbounded project list can exhaust the caller"


def test_an_explicit_page_size_still_wins(registered, spy):
    registered["project"].fn(action="list", per_page=5)

    assert spy.recorder.only().kwargs["params"].per_page == 5
