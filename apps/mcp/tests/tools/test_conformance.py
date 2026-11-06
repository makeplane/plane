"""Surface-wide invariants.

Every rule here corresponds to a defect that has actually occurred, or to a
regression this design would otherwise allow. They are cheap, need no network,
and are the reason the surface does not need a code generator to stay uniform.
"""

from __future__ import annotations

import json
from typing import Literal, get_args, get_origin, get_type_hints

import pytest

from plane_mcp.toolkit.governance import WORKSPACE_MANAGED
from plane_mcp.toolkit.spec import action_names

# Ratchets. Lowering these is routine; raising one is a design decision.
LISTING_BUDGET_CHARS = 70_000
MAX_ADVERTISED_TOOLS = 35  # strictest published client cap is 40 -- leave headroom
NAME_BUDGET = 46  # 64-char provider limit, less room for a client prefix
UNMAPPED_BUDGET = 7  # retired tools that cannot be aliased; see the test for the shape

# "resolve" is deliberately absent: workitem_type.resolve creates the type when
# it does not exist, so the name reads like a lookup but the action is not one.
READ_PREFIXES = ("list", "retrieve", "get", "search", "count", "read", "me")


def _module_ids(mods):
    return [m.NAME for m in mods]


# The advertised catalogue, in order. Tool definitions sit at the front of a
# client's prompt cache, so changing this order invalidates every live
# conversation. Editing this list is the deliberate act that makes that happen;
# appending to it is not.
CATALOGUE = [
    "customer",
    "customer_property",
    "customer_request",
    "cycle",
    "get_pql_reference",
    "initiative",
    "intake",
    "label",
    "member",
    "milestone",
    "module",
    "page",
    "project",
    "project_estimate",
    "release",
    "release_label",
    "release_tag",
    "state",
    "work_log",
    "workitem",
    "workitem_activity",
    "workitem_attachment",
    "workitem_comment",
    "workitem_link",
    "workitem_property",
    "workitem_relation",
    "workitem_type",
    "workspace",
    # Appended, not sorted in: see registry.py.
    "template",
    "collection",
]


def test_resource_order_is_pinned(resource_modules):
    """The catalogue order is a wire-format guarantee, not an artefact of `sorted()`.

    It used to be whatever `pkgutil` yielded over sorted filenames, so renaming a
    module silently reordered the listing and busted every client's prompt cache
    with a green suite. Pinning it here turns that into a visible diff.
    """
    assert _module_ids(resource_modules) == CATALOGUE


def test_module_filename_matches_its_tool_name(resource_modules):
    """Keeps the catalogue greppable: `workitem` lives in `workitem.py`."""
    for mod in resource_modules:
        filename = mod.__name__.rsplit(".", 1)[-1]
        assert filename == mod.NAME, f"{filename}.py declares NAME = {mod.NAME!r}"


def test_every_module_declares_its_contract(resource_modules):
    for mod in resource_modules:
        assert mod.NAME, f"{mod.__name__} has no NAME"
        assert mod.ACTIONS, f"{mod.NAME} declares no ACTIONS"
        assert hasattr(mod, "register"), f"{mod.NAME} has no register()"
        assert isinstance(getattr(mod, "LEGACY", None), dict), f"{mod.NAME} has no LEGACY map"


def test_module_names_are_unique(resource_modules):
    names = _module_ids(resource_modules)
    assert len(names) == len(set(names))


def test_action_names_are_unique_within_a_resource(resource_modules):
    for mod in resource_modules:
        names = action_names(mod.ACTIONS)
        assert len(names) == len(set(names)), f"{mod.NAME} repeats an action name"


def test_read_actions_are_marked_read(resource_modules):
    """A read action that forgets `read=True` silently downgrades the annotation."""
    for mod in resource_modules:
        for action in mod.ACTIONS:
            if action.name.startswith(READ_PREFIXES) and not action.read:
                pytest.fail(f"{mod.NAME}.{action.name} looks like a read but is not marked read=True")


def test_delete_actions_are_marked_destructive(resource_modules):
    for mod in resource_modules:
        for action in mod.ACTIONS:
            if action.name.startswith("delete") and not action.destructive:
                pytest.fail(f"{mod.NAME}.{action.name} deletes but is not marked destructive=True")


def test_action_literal_matches_the_declaration(resource_modules, registered):
    """The signature is the schema; the declaration is the docs. They must agree."""
    for mod in resource_modules:
        tool = registered[mod.NAME]
        hints = get_type_hints(tool.fn)
        if "action" not in hints:
            assert len(mod.ACTIONS) == 1, f"{mod.NAME} has multiple actions but no action parameter"
            continue
        literal = hints["action"]
        assert get_origin(literal) is Literal, f"{mod.NAME}.action must be a Literal"
        assert get_args(literal) == action_names(mod.ACTIONS), (
            f"{mod.NAME}: Literal {get_args(literal)} != ACTIONS {action_names(mod.ACTIONS)}"
        )


def test_declared_parameters_exist_in_the_signature(resource_modules, registered):
    """Guards a description that names a parameter which was renamed or removed."""
    for mod in resource_modules:
        properties = registered[mod.NAME].parameters["properties"]
        for action in mod.ACTIONS:
            for param in action.requires + action.optional:
                assert param in properties, f"{mod.NAME}.{action.name} documents unknown parameter {param!r}"


def test_description_is_generated_from_the_declaration(resource_modules, registered):
    """A hand-edited description would drift from ACTIONS; this catches it."""
    for mod in resource_modules:
        description = registered[mod.NAME].description or ""
        for action in mod.ACTIONS:
            assert action.line() in description, (
                f"{mod.NAME}: description is missing the generated line for {action.name!r}"
            )


def test_no_untyped_parameters(listing):
    """An untyped object blocks strict mode and makes the model guess the shape."""
    for tool in listing:
        for name, prop in tool["inputSchema"]["properties"].items():
            branches = [prop, *prop.get("anyOf", [])]
            for branch in branches:
                if branch.get("type") == "object":
                    assert branch.get("additionalProperties") is False, f"{tool['name']}.{name} is an untyped object"


def test_schemas_are_strict_compatible(listing):
    for tool in listing:
        assert tool["inputSchema"].get("additionalProperties") is False, tool["name"]
        assert tool["inputSchema"].get("required") == ["action"] or "action" not in tool["inputSchema"]["properties"], (
            tool["name"]
        )


def test_every_tool_has_annotations_and_a_title(listing):
    for tool in listing:
        annotations = tool.get("annotations")
        assert annotations, f"{tool['name']} has no annotations"
        assert annotations.get("title"), f"{tool['name']} has no title"


def test_read_only_hint_matches_the_actions(resource_modules, registered):
    for mod in resource_modules:
        annotations = registered[mod.NAME].annotations
        assert annotations.readOnlyHint == all(a.read for a in mod.ACTIONS), mod.NAME
        assert annotations.destructiveHint == any(a.destructive for a in mod.ACTIONS), mod.NAME


def test_no_output_schemas_are_advertised(listing):
    """Two thirds of the wire payload, for a field no model receives."""
    assert not [tool["name"] for tool in listing if "outputSchema" in tool]


def test_tool_names_leave_room_for_client_prefixes(listing):
    for tool in listing:
        assert len(tool["name"]) <= NAME_BUDGET, tool["name"]


def test_listing_is_deterministic(registered):
    """Tool definitions head a client's prompt cache; reordering invalidates it.

    Pinned to `CATALOGUE` rather than asserted `sorted()`. Alphabetical order was an
    artefact of the `pkgutil` scan this package used to do over sorted filenames; kept
    as an assertion afterwards, it forced every new resource into the middle of the
    listing, shifting every tool below it and costing the cached prefix each time.
    `test_resource_order_is_pinned` checks the same order at the module level, so a
    mismatch between the two means registration dropped or reordered a resource.
    """
    assert list(registered) == CATALOGUE


def test_tool_count_is_within_client_caps(listing):
    assert len(listing) <= MAX_ADVERTISED_TOOLS, (
        f"{len(listing)} tools advertised; the strictest published client cap is 40"
    )


def test_listing_is_within_budget(listing):
    """Ratchet against re-bloat -- the surface growing back one merge at a time."""
    payload = sum(len(json.dumps(tool, separators=(",", ":"))) for tool in listing)
    assert payload <= LISTING_BUDGET_CHARS, f"listing is {payload} chars"


def test_alias_targets_all_resolve(aliases, registered):
    for legacy, (tool_name, action) in aliases.items():
        assert tool_name in registered, f"{legacy} targets unknown tool {tool_name}"
        enum = registered[tool_name].parameters["properties"].get("action", {}).get("enum")
        if enum is not None:
            assert action in enum, f"{legacy} targets unknown action {tool_name}.{action}"


def test_no_alias_collisions(aliases):
    targets = list(aliases.values())
    assert len(targets) == len(set(targets))


def test_alias_table_covers_every_retired_tool(aliases, unmapped, retired_tool_names, registered):
    """Completion gate: every name this server once exposed is still accounted for.

    A retired name the surface still exposes verbatim needs no alias, and one
    declared in LEGACY_UNMAPPED is a deliberate, reasoned break.
    """
    uncovered = sorted(retired_tool_names - set(aliases) - set(registered) - set(unmapped))
    assert not uncovered, f"{len(uncovered)} retired tools are unaccounted for: {uncovered}"


def test_unmapped_declarations_name_real_retired_tools(unmapped, retired_tool_names):
    """A typo here would silently excuse a tool that still needs an alias."""
    unknown = sorted(set(unmapped) - retired_tool_names)
    assert not unknown, f"declared unmapped but never a tool on this server: {unknown}"


def test_unmapped_stays_small(unmapped):
    """Every entry is a break for someone. Ratchet, not a dumping ground.

    All current entries are one shape: a retired tool that chose between two
    operations with a boolean or a Literal parameter. Neither survives a rename,
    because the alias fixes `action` to a single value.
    """
    assert len(unmapped) <= UNMAPPED_BUDGET, f"{len(unmapped)} legacy tools dropped: {sorted(unmapped)}"


def test_aliases_do_not_shadow_a_resource_tool(aliases, registered):
    assert not set(aliases) & set(registered)


# A resource whose scope can be refused must say which noun it is refusing, or the
# caller gets a raw 400 and no idea which scope to use. Structure is each resource's
# own business; this is about what a caller sees.

SCOPED_WRITES = [
    (
        "state",
        "states.create",
        {"action": "create", "project_id": "p", "name": "S", "color": "#fff"},
        {"code": WORKSPACE_MANAGED},
    ),
    (
        "workitem_type",
        "work_item_types.create",
        {"action": "create", "project_id": "p", "name": "T"},
        {"code": WORKSPACE_MANAGED},
    ),
    (
        "workitem_property",
        "workspace_work_item_properties.create",
        {"action": "create", "workitem_type_id": "t", "display_name": "P", "property_type": "TEXT"},
        {"error": "Workspace work item types are not enabled"},
    ),
]


@pytest.mark.parametrize(
    ("name", "method", "arguments", "refusal"), SCOPED_WRITES, ids=[case[0] for case in SCOPED_WRITES]
)
def test_a_wrong_scope_refusal_is_answered_not_raised(name, method, arguments, refusal, registered, spy):
    """Without `@scoped` the caller gets a raw 400 and no idea which scope to use."""
    from plane.errors.errors import HttpError

    spy.returns[method] = HttpError("refused", status_code=400, response=refusal)

    result = registered[name].fn(**arguments)

    assert isinstance(result, str) and result.startswith("Error:"), (
        f"{name} let a wrong-scope refusal out raw; it needs @scoped"
    )
    assert "project_id" in result, "named the problem without naming the fix"
