"""The surface spells it `workitem`, everywhere a model can read."""

from __future__ import annotations

import json
import re

import pytest

from plane_mcp.toolkit.spec import action_names

PQL_FIELD = re.compile(r"work_items__\w+")
RESIDUE = re.compile(r"work_item[a-z_]*")


def _residue(text: str) -> set[str]:
    return set(RESIDUE.findall(PQL_FIELD.sub("", text or "")))


def test_no_tool_name_or_action_says_work_item(resource_modules):
    for mod in resource_modules:
        assert not _residue(mod.NAME), mod.NAME
        for action in action_names(mod.ACTIONS):
            assert not _residue(action), f"{mod.NAME}.{action}"


def test_no_advertised_schema_says_work_item(listing):
    """Names, descriptions, parameters and annotations, as the client receives them."""
    found: list[str] = []
    for tool in listing:
        for param, prop in tool["inputSchema"]["properties"].items():
            if hits := _residue(param):
                found.append(f"{tool['name']}.{param}: {hits}")
            if hits := _residue(prop.get("description", "")):
                found.append(f"{tool['name']}.{param} description: {hits}")
        for field in ("name", "description"):
            if hits := _residue(tool.get(field, "")):
                found.append(f"{tool['name']} {field}: {hits}")
        if hits := _residue(json.dumps(tool.get("annotations") or {})):
            found.append(f"{tool['name']} annotations: {hits}")
    assert not found, "the advertised listing still says work_item:\n  " + "\n  ".join(found)


def test_the_pql_reference_output_says_workitem(registered):
    """Tool *output*, not a description -- the earlier checks cannot see it."""
    read = registered["get_pql_reference"].fn
    for detail in ("full", "brief"):
        assert not _residue(json.dumps(read(detail=detail))), detail


@pytest.mark.parametrize(
    ("tool_name", "args"),
    [
        ("workitem", {"action": "retrieve"}),
        ("workitem_property", {"action": "get_value", "project_id": "p"}),
        ("workitem_relation", {"action": "delete", "project_id": "p"}),
    ],
)
def test_validation_errors_name_the_surface_parameter(tool_name, args, registered, spy):
    """The error is what a model reads to correct itself, so it must name our param.

    These are generated from the values the caller passed, so an SDK kwarg leaking
    into one would tell the model to send a parameter the schema rejects.
    """
    result = registered[tool_name].fn(**args)
    assert isinstance(result, str) and result.startswith("Error:"), result
    assert not _residue(result), result


def test_unmapped_reasons_do_not_cite_a_retired_action(unmapped):
    """Each reason names the replacement to use; that name has to be current."""
    stale = [
        f"{name}: {reason}"
        for name, reason in unmapped.items()
        for hit in _residue(reason)
        if hit != name and hit not in name
    ]
    assert not stale, "an unmapped reason points at a name that no longer exists:\n  " + "\n  ".join(stale)


def test_a_retired_name_accepts_the_retired_parameter_spelling(registered_with_aliases):
    """Resolving the name but rejecting its parameters is not compatibility.

    `update_work_item` shipped taking `work_item_id`; a caller reaching it by that
    name has no reason to have followed the rename to `workitem_id`.
    """
    wrong = []
    for name, tool in registered_with_aliases.items():
        params = set((tool.parameters or {}).get("properties", {}))
        for param in sorted(params):
            if "workitem" in param:
                wrong.append(f"{name} exposes {param!r}, not its retired spelling")
    assert not wrong, "a retired tool name changed its parameter names:\n  " + "\n  ".join(wrong)


def test_the_aliases_keep_the_retired_spelling(aliases):
    """The other direction: a retired name is history and must not be modernised.

    74 of the aliased names contain `work_item`. Renaming a key here would
    silently drop the caller it exists to serve rather than resolve them.
    """
    assert len(aliases) == 169
    retired_spelling = [name for name in aliases if "work_item" in name]
    assert len(retired_spelling) == 74, f"expected 74 aliased work_item names, got {len(retired_spelling)}"
    assert not [name for name in aliases if "workitem" in name], "an alias key was renamed"
