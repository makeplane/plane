"""Schema-driven repair of arguments a client encoded as strings.

Two halves: the rules, exercised directly against hand-written schemas, and the
middleware, exercised through a real server so the ordering against Pydantic
validation is the thing under test rather than an assumption.
"""

from __future__ import annotations

import pytest

from plane_mcp.coercion import accepted_types, coerce_arguments

ARRAY_OF_STRING = {"anyOf": [{"items": {"type": "string"}, "type": "array"}, {"type": "null"}]}
ARRAY_OF_INT = {"items": {"type": "integer"}, "type": "array"}
OBJECT = {"type": "object", "properties": {"name": {"type": "string"}}}
STRING = {"type": "string"}
INTEGER = {"type": "integer"}
NUMBER = {"type": "number"}
BOOLEAN = {"anyOf": [{"type": "boolean"}, {"type": "null"}]}
POLYMORPHIC = {"anyOf": [{"type": "string"}, {"type": "boolean"}, {"type": "integer"}, {"items": {}, "type": "array"}]}


def repair(value, schema):
    """The repaired value for a single parameter."""
    arguments, _ = coerce_arguments({"p": value}, {"properties": {"p": schema}})
    return arguments["p"]


def changed(value, schema) -> bool:
    _, touched = coerce_arguments({"p": value}, {"properties": {"p": schema}})
    return touched == ["p"]


# --- the rules ---------------------------------------------------------------


@pytest.mark.parametrize(
    ("value", "schema", "expected"),
    [
        # The encoding clients actually get wrong.
        ('["a", "b"]', ARRAY_OF_STRING, ["a", "b"]),
        ('["a"]', ARRAY_OF_STRING, ["a"]),
        ("[]", ARRAY_OF_STRING, []),
        ("[1, 2]", ARRAY_OF_INT, [1, 2]),
        ('{"name": "x"}', OBJECT, {"name": "x"}),
        # Scalars.
        ("5", INTEGER, 5),
        ("1.5", NUMBER, 1.5),
        ("5.0", INTEGER, 5),
        ("true", BOOLEAN, True),
        ("False", BOOLEAN, False),
        ("null", BOOLEAN, None),
        ("", BOOLEAN, None),
        # A lone id where a list of ids is wanted.
        ("a", ARRAY_OF_STRING, ["a"]),
    ],
)
def test_a_stringified_value_is_decoded(value, schema, expected):
    assert repair(value, schema) == expected
    assert changed(value, schema)


@pytest.mark.parametrize(
    ("value", "schema"),
    [
        # Already the right type.
        (["a"], ARRAY_OF_STRING),
        (5, INTEGER),
        (True, BOOLEAN),
        (None, ARRAY_OF_STRING),
        # The schema wants a string, so a string is not a mistake.
        ("5", STRING),
        ("true", STRING),
        ('["a"]', STRING),
        # A schema accepting both leaves the caller's choice alone.
        ('["a"]', POLYMORPHIC),
        ("007", POLYMORPHIC),
        # Not the declared type, so the real validation error must survive.
        ("abc", INTEGER),
        ("1.5", INTEGER),
        ("maybe", BOOLEAN),
        ("abc", ARRAY_OF_INT),
        # Malformed JSON is never wrapped into a one-element list.
        ('["a"', ARRAY_OF_STRING),
        ('{"name"', OBJECT),
        # An unknown schema shape is left untouched.
        ("5", {"$ref": "#/$defs/Thing"}),
        ("5", {}),
    ],
)
def test_anything_else_is_passed_through(value, schema):
    assert repair(value, schema) == value
    assert not changed(value, schema)


def test_a_nested_value_is_reached():
    """Repair recurses, so a stringified entry inside a container is decoded too."""
    schema = {"items": {"type": "integer"}, "type": "array"}
    assert repair(["1", "2"], schema) == [1, 2]

    nested = {"type": "object", "properties": {"count": {"type": "integer"}}}
    assert repair({"count": "3"}, nested) == {"count": 3}


def test_an_undeclared_argument_is_left_alone():
    """Validation owns rejecting it; guessing a type for it would be inventing one."""
    arguments, touched = coerce_arguments({"nope": "5"}, {"properties": {}})
    assert arguments == {"nope": "5"}
    assert not touched


def test_only_repaired_parameters_are_reported():
    schema = {"properties": {"a": ARRAY_OF_STRING, "b": STRING, "c": INTEGER}}
    arguments, touched = coerce_arguments({"a": '["x"]', "b": "plain", "c": 7}, schema)
    assert arguments == {"a": ["x"], "b": "plain", "c": 7}
    assert touched == ["a"]


def test_accepted_types_flattens_unions():
    assert accepted_types(ARRAY_OF_STRING) == {"array", "null"}
    assert accepted_types({"type": ["string", "null"]}) == {"string", "null"}
    assert accepted_types({"$ref": "#/$defs/X"}) == frozenset()
    assert accepted_types(None) == frozenset()


def test_booleans_are_not_treated_as_numbers():
    """`json.loads("true")` is a bool; an integer parameter must not accept it."""
    assert repair("true", INTEGER) == "true"


# --- the middleware, through a real server -----------------------------------
#
# The rules above only help if they run *before* schema validation. That ordering
# is a FastMCP detail, so it is tested against a real server with the real tool
# functions in place -- a stand-in for the function would be validated against
# the stand-in's signature and prove nothing.

import asyncio  # noqa: E402
import os  # noqa: E402

import pytest  # noqa: E402

os.environ.setdefault("PLANE_API_KEY", "test")
os.environ.setdefault("PLANE_WORKSPACE_SLUG", "test")

ASSIGNEE = "4161e0f8-48a2-49b4-a43a-458465337135"

# The tool and module holding `assignees`.
WORK_ITEM_TOOL = "workitem"
WORK_ITEM_MODULE = "plane_mcp.tools.workitem"


class _Recorder:
    """Stands in for the Plane client; records the first SDK call and stops."""

    def __init__(self):
        self.kwargs: dict = {}

    def __getattr__(self, _name):
        return self

    def __call__(self, **kwargs):
        self.kwargs = kwargs
        raise RuntimeError("recorded")


def _invoke(tool: str, arguments: dict, module: str | None = None):
    """Call `tool` through a real client. Returns (error text, recorded kwargs).

    Validation is untouched: the registered function runs, and only the Plane
    client underneath it is replaced.
    """
    import importlib

    from fastmcp import Client

    import plane_mcp.server as server_module

    recorder = _Recorder()
    restore = None
    if module:
        target = importlib.import_module(module)
        restore = (target, target.get_plane_client_context)
        target.get_plane_client_context = lambda: (recorder, "acme")

    async def run():
        async with Client(server_module.get_stdio_mcp()) as client:
            await client.call_tool(tool, arguments)

    error = ""
    try:
        asyncio.new_event_loop().run_until_complete(run())
    except Exception as exc:  # noqa: BLE001 - the error text is the assertion
        error = str(exc)
    finally:
        if restore:
            restore[0].get_plane_client_context = restore[1]
    return error, recorder.kwargs


def _work_item_args(assignees) -> dict:
    return {"action": "create", "project_id": "p", "name": "One", "assignees": assignees}


@pytest.mark.parametrize("sent", [f'["{ASSIGNEE}"]', [ASSIGNEE]], ids=["stringified", "proper-list"])
def test_a_list_reaches_the_sdk_however_the_client_encoded_it(sent):
    """The reported failure, and the shape that already worked.

    `assignees` is declared `array<string> | null`, so the stringified form
    previously raised `1 validation error for call[...]` and the tool never ran.
    """
    error, recorded = _invoke(WORK_ITEM_TOOL, _work_item_args(sent), WORK_ITEM_MODULE)

    assert "validation error" not in error, error
    assert recorded.get("data") is not None, f"the SDK call never happened: {error}"
    assert list(recorded["data"].assignees) == [ASSIGNEE]


def test_a_string_parameter_is_left_to_the_surface():
    """`add_ids` is declared `str`; its comma handling belongs to the tool, not here."""
    error, recorded = _invoke(
        "cycle",
        {"action": "manage_workitems", "project_id": "p", "cycle_id": "c", "add_ids": "a,b"},
        "plane_mcp.tools.cycle",
    )

    assert "validation error" not in error, error
    assert recorded.get("issue_ids") == ["a", "b"]


def test_a_genuinely_wrong_value_still_fails_validation():
    """Leniency must not swallow a real mistake."""
    error, _ = _invoke("cycle", {"action": "list", "project_id": "p", "per_page": "not-a-number"})

    assert "validation error" in error, error
    assert "per_page" in error


def test_a_numeric_string_is_a_number_not_a_boolean():
    """`"1"` on a `boolean | integer` parameter is 1; only a boolean-only schema reads it as true."""
    assert repair("1", {"anyOf": [{"type": "boolean"}, {"type": "integer"}]}) == 1
    assert repair("1", {"type": "boolean"}) is True


def test_non_dict_arguments_are_returned_unchanged():
    for value in (None, [], "", 0):
        assert coerce_arguments(value, {"properties": {}}) == (value, [])


def test_the_middleware_passes_through_when_coercion_raises(monkeypatch):
    """A defect in the repair must not cost a call that would otherwise work."""
    import plane_mcp.middleware as middleware

    def boom(*_args, **_kwargs):
        raise ValueError("defect")

    monkeypatch.setattr(middleware, "coerce_arguments", boom)
    error, recorded = _invoke("cycle", {"action": "list", "project_id": "p"}, "plane_mcp.tools.cycle")

    assert "validation error" not in error, error
    assert recorded, "the tool never ran despite the pass-through"
