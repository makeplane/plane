"""A guard must name what is absent, and only what is absent.

Guards were written as a shared condition over several parameters:

    if not name or not owned_by:
        return missing(action, "name", "owned_by")

Supply `name`, omit `owned_by`, and the error blames both. The model then
re-sends a parameter it already had, and the round trip teaches it nothing. The
error string is the self-correction channel, so its precision is the feature.
"""

from __future__ import annotations

import inspect

import pytest

from plane_mcp.tools.registry import RESOURCES
from tests.tools.test_dispatch import CONDITIONAL, NEEDS_FIXTURE, _value


def _cases():
    for mod in RESOURCES:
        for action in mod.ACTIONS:
            if (mod.NAME, action.name) in NEEDS_FIXTURE or len(action.requires) < 2:
                continue
            for omitted in action.requires:
                yield pytest.param(mod, action, omitted, id=f"{mod.NAME}.{action.name}-without-{omitted}")


@pytest.mark.parametrize(("mod", "action", "omitted"), list(_cases()))
def test_a_guard_names_only_the_absent_parameter(mod, action, omitted, registered, spy):
    tool = registered[mod.NAME]
    signature = inspect.signature(tool.fn)

    args = {"action": action.name} if "action" in signature.parameters else {}
    for param in action.requires:
        if param != omitted:
            args[param] = _value(mod.NAME, param, signature.parameters[param].annotation)
    args.update({k: v for k, v in CONDITIONAL.get((mod.NAME, action.name), {}).items() if k != omitted})

    result = tool.fn(**args)

    assert isinstance(result, str) and result.startswith("Error:"), (
        f"declared required {omitted!r} was not guarded; the call proceeded to {spy.recorder.methods}"
    )

    named = _named_parameters(result)
    assert omitted in named, f"error does not name the missing {omitted!r}: {result}"

    supplied = {p for p in action.requires if p != omitted}
    blamed = sorted(supplied & named)
    assert not blamed, f"error blames {blamed}, which were supplied: {result}"


def _named_parameters(error: str) -> set[str]:
    """The parameters a `missing()` error lists.

    Parsed rather than substring-matched: `cycle_id` occurs inside
    `new_cycle_id`, and `value` inside the action name `set_value`, so `in`
    reports parameters the message never mentioned.
    """
    _, _, listed = error.partition(" requires: ")
    return {part.strip() for part in listed.rstrip(".").split(",") if part.strip()}


def test_a_retired_tool_name_is_logged_when_resolved():
    """Scheduling the removal of these aliases needs evidence about who still calls them.

    A handler is attached to the logger directly rather than using `caplog`:
    FastMCP installs its own Rich handler and stops propagation, so records never
    reach the root logger that `caplog` listens on.
    """
    import asyncio
    import logging

    from fastmcp import FastMCP

    from plane_mcp.tools import register_tools

    mcp = FastMCP("legacy-telemetry")
    register_tools(mcp)

    records: list[logging.LogRecord] = []

    class _Capture(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            records.append(record)

    logger = logging.getLogger("fastmcp.plane_mcp.tools.legacy")
    handler = _Capture(level=logging.INFO)
    logger.addHandler(handler)
    previous = logger.level
    logger.setLevel(logging.INFO)
    try:
        tool = asyncio.new_event_loop().run_until_complete(mcp.get_tool("create_label"))
    finally:
        logger.removeHandler(handler)
        logger.setLevel(previous)

    assert tool is not None
    logged = [record.getMessage() for record in records]
    assert any("retired tool name" in line and "create_label" in line for line in logged), (
        f"resolving a legacy name produced no usable log line: {logged}"
    )
