"""Call-time parameter validation and payload shaping.

Validation failures are returned as strings rather than raised. The MCP spec
designates tool execution errors as the model's self-correction channel, so the
message must name exactly what to supply.

Nothing here knows about a particular tool surface: these take values in and
give SDK-shaped values back, so any surface can use them.
"""

from __future__ import annotations

import json
from collections.abc import Sequence
from html import escape
from typing import Any


def missing(action: str, *names: str) -> str:
    return f"Error: action '{action}' requires: {', '.join(names)}."


def needs(action: str, **supplied: Any) -> str | None:
    """Error naming only the absent parameters among those given, else None.

    The shared-condition form -- `if not a or not b: return missing(action, "a",
    "b")` -- blames both whenever either is absent, so a caller that supplied `a`
    is told to send it again. Pass the values instead of the names and the
    message narrows itself:

        if error := needs(action, name=name, owned_by=owned_by):
            return error

    Takes the parameters the caller names, unlike `require`, which reads them
    from the action declaration. Use this in a guard shared by several actions,
    where the declaration for any one of them is the wrong list.
    """
    absent = [name for name, value in supplied.items() if not value]
    return missing(action, *absent) if absent else None


def require(actions: Any, action: str, **supplied: Any) -> str | None:
    """Check an action's declared required params up front, from the declaration.

    Most resources guard inline, sharing a prefix check between actions. Use this
    where validation has to happen before anything else -- a resource that makes a
    preflight call should not spend it on a request that was never going to work.
    """
    declared = next((a.requires for a in actions if a.name == action), ())
    absent = [name for name in declared if not supplied.get(name)]
    return missing(action, *absent) if absent else None


def one_of(name: str, value: Any, allowed: Sequence[str], hint: str = "") -> str | None:
    """Error naming the permitted values, or None when `value` is valid or unset."""
    if not value or value in allowed:
        return None
    message = f"Error: {name} must be one of: {', '.join(allowed)}."
    return f"{message} {hint}" if hint else message


def opt(value: Any) -> Any:
    """Normalise a sentinel default ("" / 0) back to None for SDK payloads.

    Only for parameters where 0 is never meaningful (per_page, ids, text). A
    parameter that can be 0 is declared `int | None = None` and passed as is.
    False is a value, not a sentinel, even though False == 0.
    """
    if isinstance(value, bool):
        return value
    return value if value not in ("", 0) else None


def membership(added: Sequence[Any] | None = None, removed: Sequence[Any] | None = None) -> dict[str, list[Any]]:
    """The answer every membership mutation gives: the ids it added and removed.

    The endpoints behind these return no body, or one the SDK discards, so a bare
    None was the only answer and read as "did anything happen?". This echoes the
    ids the server accepted. It is not a read-back: the matching list action shows
    the full membership.
    """
    return {"added": list(added or []), "removed": list(removed or [])}


def rich_text(html: str, plain: str) -> str | None:
    """The HTML for a rich-text field, promoting plain text when no HTML was given."""
    if html:
        return html
    if plain:
        return "<p>" + escape(plain).replace("\n", "<br/>") + "</p>"
    return None


def coerce_list(value: Any, *, split: bool = True) -> list[Any] | None:
    """Accept a JSON-encoded string where a list is expected.

    Models routinely send '["uuid"]' for a list parameter. Absorbing it here
    removes a failure class that is not worth surfacing to the caller.

    `split` decides what a bare comma means: a separator in an id list, ordinary
    punctuation in free text. Pass `split=False` for anything a person typed, or
    the default value "Hello, world" is silently stored as two values.
    """
    if value is None:
        return None
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        if text.startswith("["):
            try:
                parsed = json.loads(text)
            except ValueError:
                return [text]
            return parsed if isinstance(parsed, list) else [parsed]
        if not split:
            return [text]
        return [part.strip() for part in text.split(",") if part.strip()]
    return [value]


def page_params(cursor: str = "", per_page: int = 0, **extra: Any) -> dict[str, Any] | None:
    """Build a query-param dict, dropping unset values. None when nothing is set.

    Only for endpoints annotated `Mapping[str, Any]`. The rest of the SDK types
    `params` as a Pydantic model and calls `.model_dump()` on it, so a dict there
    raises AttributeError at call time -- use `as_params` for those.
    """
    params: dict[str, Any] = {}
    if cursor:
        params["cursor"] = cursor
    if per_page:
        params["per_page"] = per_page
    params.update({k: v for k, v in extra.items() if v not in ("", 0, None, False)})
    return params or None


def as_params(model: type[Any], **values: Any) -> Any | None:
    """Build a typed SDK query-param model, dropping unset values.

    Returns None when nothing was supplied so the SDK keeps its own defaults.
    """
    supplied = {k: v for k, v in values.items() if v not in ("", 0, None)}
    return model(**supplied) if supplied else None


def ids_of(items: Any) -> list[str]:
    """Extract ids from a field that may hold bare id strings or model objects."""
    out: list[str] = []
    for item in items or []:
        value = item if isinstance(item, str) else getattr(item, "id", None)
        if value:
            out.append(str(value))
    return out
