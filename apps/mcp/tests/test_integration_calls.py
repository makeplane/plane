"""Bind the live integration test's tool calls against the real schemas, offline.

`test_integration.py` is skipped without credentials, so a call naming a
parameter no tool accepts sits there indefinitely — that is how `create_milestone`
came to be called with `name`, `description` and `associated_work_item_ids`, none
of which exist on it.

Parsing the calls out of the source and checking them against the registered
tools catches that in the normal suite, with no network and no workspace.
"""

from __future__ import annotations

import ast
import asyncio
import os
from pathlib import Path

import pytest
from fastmcp import FastMCP

os.environ.setdefault("PLANE_API_KEY", "test")
os.environ.setdefault("PLANE_WORKSPACE_SLUG", "test")

SOURCE = Path(__file__).resolve().parent / "test_integration.py"

# Types a JSON schema accepts for the value written in the test.
LITERAL_TYPES: dict[type, tuple[str, ...]] = {
    str: ("string",),
    bool: ("boolean",),
    int: ("integer", "number"),
    float: ("number",),
}


def _calls() -> list[tuple[int, str, dict[str, ast.expr]]]:
    """(line, tool name, argument name -> value node) for every literal call."""
    found = []
    for node in ast.walk(ast.parse(SOURCE.read_text())):
        if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)):
            continue
        if node.func.attr != "call_tool" or not node.args:
            continue
        name = node.args[0]
        if not isinstance(name, ast.Constant):
            continue
        args: dict[str, ast.expr] = {}
        if len(node.args) > 1 and isinstance(node.args[1], ast.Dict):
            pairs = zip(node.args[1].keys, node.args[1].values, strict=True)
            args = {key.value: value for key, value in pairs if isinstance(key, ast.Constant)}
        found.append((node.lineno, name.value, args))
    return found


@pytest.fixture(scope="module")
def schemas() -> dict[str, dict]:
    """Input schema per tool name, including the retired names that resolve."""
    from plane_mcp.tools import register_tools
    from plane_mcp.tools.registry import alias_table

    loop = asyncio.new_event_loop()
    mcp = FastMCP("integration-contract")
    register_tools(mcp)

    out = {tool.name: tool.parameters or {} for tool in loop.run_until_complete(mcp.list_tools())}
    for legacy in alias_table():
        tool = loop.run_until_complete(mcp.get_tool(legacy))
        if tool is not None:
            out[legacy] = tool.parameters or {}
    return out


def test_the_integration_test_calls_tools_that_exist(schemas):
    unknown = [f"L{line}: {tool}" for line, tool, _ in _calls() if tool not in schemas]
    assert not unknown, "the integration test calls tools that are not callable:\n  " + "\n  ".join(unknown)


def test_every_argument_is_one_the_tool_accepts(schemas):
    wrong = []
    for line, tool, args in _calls():
        if tool not in schemas:
            continue
        accepted = set(schemas[tool].get("properties", {}))
        for name in sorted(set(args) - accepted):
            wrong.append(f"L{line}: {tool} has no parameter {name!r}")
    assert not wrong, "the integration test passes parameters that do not exist:\n  " + "\n  ".join(wrong)


def test_every_required_parameter_is_supplied():
    """A missing required parameter is an error the live run reaches only at runtime.

    The schema requires `action` and nothing else — each action declares its own
    required parameters, checked in the dispatch — so `ACTIONS` is the source of
    truth here, not `required`.
    """
    from plane_mcp.tools.registry import RESOURCES, alias_table

    aliases = alias_table()
    declared = {(mod.NAME, action.name): action.requires for mod in RESOURCES for action in mod.ACTIONS}

    absent = []
    for line, tool, args in _calls():
        target = aliases.get(tool)
        if target is None:
            continue  # a tool called by its current name; it has no action to look up
        for name in declared.get(target, ()):
            # A retired name keeps the pre-consolidation parameter spelling.
            if name not in args and name.replace("workitem", "work_item") not in args:
                absent.append(f"L{line}: {tool} requires {name!r}")
    assert not absent, "the integration test omits required parameters:\n  " + "\n  ".join(absent)


def test_literal_arguments_match_the_declared_type(schemas):
    """Catches a list passed where the surface takes a comma-separated string."""
    mismatched = []
    for line, tool, args in _calls():
        if tool not in schemas:
            continue
        properties = schemas[tool].get("properties", {})
        for name, node in args.items():
            declared = properties.get(name, {}).get("type")
            if not declared or "anyOf" in properties.get(name, {}):
                continue
            if isinstance(node, ast.List) and declared != "array":
                mismatched.append(f"L{line}: {tool}.{name} takes {declared}, a list is passed")
            elif isinstance(node, ast.Constant) and node.value is not None:
                allowed = LITERAL_TYPES.get(type(node.value), ())
                if allowed and declared not in allowed:
                    mismatched.append(f"L{line}: {tool}.{name} takes {declared}, got {type(node.value).__name__}")
    assert not mismatched, "the integration test passes wrongly-typed arguments:\n  " + "\n  ".join(mismatched)
