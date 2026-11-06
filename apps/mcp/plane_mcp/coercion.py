"""Repair argument values a client encoded as strings."""

from __future__ import annotations

import json
from typing import Any

CONTAINER_START = ("[", "{")

# JSON type name -> the Python types that satisfy it.
_PYTHON_TYPES: dict[str, tuple[type, ...]] = {
    "string": (str,),
    "integer": (int,),
    "number": (int, float),
    "boolean": (bool,),
    "array": (list,),
    "object": (dict,),
}

_TRUE = frozenset({"true", "yes", "1"})
_FALSE = frozenset({"false", "no", "0"})
_EMPTY = frozenset({"", "null", "none"})


def accepted_types(schema: Any) -> frozenset[str]:
    """Every JSON type a schema accepts, flattening `anyOf` / `oneOf` / `allOf`."""
    if not isinstance(schema, dict):
        return frozenset()

    found: set[str] = set()
    declared = schema.get("type")
    if isinstance(declared, str):
        found.add(declared)
    elif isinstance(declared, list):
        found.update(entry for entry in declared if isinstance(entry, str))

    for keyword in ("anyOf", "oneOf", "allOf"):
        for branch in schema.get(keyword) or ():
            found |= accepted_types(branch)

    return frozenset(found)


def _branch_for(schema: Any, wanted: str) -> dict[str, Any]:
    """The sub-schema describing `wanted`, so `items` / `properties` stay reachable."""
    if not isinstance(schema, dict):
        return {}
    if schema.get("type") == wanted:
        return schema
    for keyword in ("anyOf", "oneOf", "allOf"):
        for branch in schema.get(keyword) or ():
            if isinstance(branch, dict) and (found := _branch_for(branch, wanted)):
                return found
    return {}


def _as_number(text: str, allowed: frozenset[str]) -> tuple[Any, bool]:
    """`"5"` -> 5, `"1.5"` -> 1.5. Rejects anything that is not exactly a number."""
    try:
        parsed = json.loads(text)
    except ValueError:
        return None, False
    if isinstance(parsed, bool) or not isinstance(parsed, int | float):
        return None, False
    if isinstance(parsed, float) and "integer" in allowed and "number" not in allowed:
        # A float where only an integer is accepted: repair 5.0, refuse 1.5.
        if not parsed.is_integer():
            return None, False
        return int(parsed), True
    return parsed, True


def _repair_string(value: str, schema: Any, allowed: frozenset[str]) -> tuple[Any, bool]:
    """Reinterpret a string as the type the schema declares. Order is significant."""
    text = value.strip()

    if text.startswith(CONTAINER_START):
        try:
            parsed = json.loads(text)
        except ValueError:
            return value, False
        if _satisfies(parsed, allowed):
            return _repair(parsed, schema)[0], True
        return value, False

    if "null" in allowed and text.lower() in _EMPTY:
        return None, True

    if allowed & {"integer", "number"}:
        number, ok = _as_number(text, allowed)
        if ok:
            return number, True

    if "boolean" in allowed and text.lower() in _TRUE | _FALSE:
        return text.lower() in _TRUE, True

    if "array" in allowed and text:
        items = _branch_for(schema, "array").get("items")
        if "string" in accepted_types(items):
            return [text], True

    return value, False


def _satisfies(value: Any, allowed: frozenset[str]) -> bool:
    """Whether a decoded value is already one of the accepted types."""
    if value is None:
        return "null" in allowed
    if isinstance(value, bool):
        return "boolean" in allowed
    return any(isinstance(value, _PYTHON_TYPES.get(name, ())) for name in allowed)


def _repair(value: Any, schema: Any) -> tuple[Any, bool]:
    """Repair `value` against `schema`. Returns the value and whether it changed."""
    allowed = accepted_types(schema)

    if isinstance(value, str) and allowed and "string" not in allowed:
        return _repair_string(value, schema, allowed)

    # Recurse so a stringified value nested inside a container is reached too.
    if isinstance(value, list):
        items = _branch_for(schema, "array").get("items")
        if items is None:
            return value, False
        repaired = [_repair(entry, items) for entry in value]
        return [entry for entry, _ in repaired], any(changed for _, changed in repaired)

    if isinstance(value, dict):
        properties = _branch_for(schema, "object").get("properties") or {}
        out, touched = {}, False
        for key, entry in value.items():
            out[key], changed = _repair(entry, properties.get(key)) if key in properties else (entry, False)
            touched = touched or changed
        return out, touched

    return value, False


def coerce_arguments(arguments: dict[str, Any], schema: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """Repair a tool call's arguments against its input schema."""
    if not isinstance(arguments, dict) or not arguments or not isinstance(schema, dict):
        return arguments, []

    properties = schema.get("properties") or {}
    repaired: dict[str, Any] = {}
    touched: list[str] = []
    for name, value in arguments.items():
        declared = properties.get(name)
        if declared is None:
            repaired[name] = value
            continue
        repaired[name], changed = _repair(value, declared)
        if changed:
            touched.append(name)
    return repaired, touched
