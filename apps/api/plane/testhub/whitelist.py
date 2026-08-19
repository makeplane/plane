# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import json
import re
from typing import Any

BOOTSTRAP_KIND = "index_platform"
LEGACY_ACTION_WORDS_KIND = "action_words"

_MODULE_RE = re.compile(r"^apps\.[a-z][a-z0-9_]*$")
_DESTRUCTIVE_FALLBACK = frozenset({"db_seed", "api_request", "ui_action"})


class WhitelistError(ValueError):
    pass


def latest_tools(project_id) -> list[dict[str, Any]]:
    from plane.testhub.models import CatalogSnapshot

    snapshot = CatalogSnapshot.objects.filter(project_id=project_id).order_by("-created_at").first()
    if snapshot is None:
        return []
    payload = snapshot.payload if isinstance(snapshot.payload, dict) else {}
    tools = payload.get("tools") or []
    return [row for row in tools if isinstance(row, dict)]


def find_tool(
    kind: str,
    tools: list[dict[str, Any]] | None,
    params: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    resolved = _resolve_kind(kind, params)
    for tool in tools or []:
        if str(tool.get("app_id") or "") == resolved:
            return tool
    return None


def is_destructive(
    kind: str,
    params: dict[str, Any] | None = None,
    tools: list[dict[str, Any]] | None = None,
) -> bool:
    if kind == BOOTSTRAP_KIND:
        return False
    tool = find_tool(kind, tools, params)
    if tool is not None:
        return bool(tool.get("destructive"))
    return _resolve_kind(kind, params) in _DESTRUCTIVE_FALLBACK


def build_argv(
    kind: str,
    params: dict[str, Any] | None = None,
    *,
    tools: list[dict[str, Any]] | None = None,
) -> list[str]:
    payload = params or {}
    if kind == BOOTSTRAP_KIND:
        return ["python", "-m", "apps.index_platform", "--out", "-"]

    resolved = _resolve_kind(kind, payload)
    tool = find_tool(resolved, tools, payload)
    if tool is None:
        raise WhitelistError(f"kind is not a registered Plane app: {resolved} (sync the catalog first)")
    if not _is_runnable(tool):
        raise WhitelistError(f"kind is not plane-runnable: {resolved}")
    return _argv_from_tool(tool, payload)


def tool_timeout(kind: str, tools: list[dict[str, Any]] | None = None) -> int:
    if kind == BOOTSTRAP_KIND:
        return 180
    tool = find_tool(kind, tools)
    if tool is None:
        return 180
    try:
        timeout = int(tool.get("timeout") or 180)
    except (TypeError, ValueError):
        return 180
    return max(5, min(timeout, 900))


def _is_runnable(tool: dict[str, Any]) -> bool:
    if "plane_runnable" in tool:
        return bool(tool.get("plane_runnable"))
    return bool(tool.get("whitelisted", True))


def _resolve_kind(kind: str, params: dict[str, Any] | None) -> str:
    if kind != LEGACY_ACTION_WORDS_KIND:
        return kind
    word_id = str((params or {}).get("word_id") or "")
    prefix = word_id.split(".", 1)[0] if "." in word_id else ""
    if not prefix:
        raise WhitelistError("action_words requires word_id")
    return prefix


def _argv_from_tool(tool: dict[str, Any], payload: dict[str, Any]) -> list[str]:
    argv = [str(part) for part in (tool.get("argv") or [])]
    if len(argv) < 3 or argv[0] not in {"python", "python3"} or argv[1] != "-m":
        raise WhitelistError("registered tool argv must start with python -m")
    module = argv[2]
    if not _MODULE_RE.fullmatch(module):
        raise WhitelistError(f"registered tool module is not apps.*: {module}")

    plan = tool.get("argv_plan") or []
    schema = tool.get("params_schema") if isinstance(tool.get("params_schema"), dict) else {}
    properties = schema.get("properties") if isinstance(schema.get("properties"), dict) else {}
    allowed_keys = {str(step.get("key")) for step in plan if isinstance(step, dict) and step.get("key")}
    extra = set(payload) - allowed_keys
    if extra:
        raise WhitelistError(f"unexpected params: {sorted(extra)}")

    required = schema.get("required") if isinstance(schema.get("required"), list) else []
    for key in required:
        if key not in payload or payload.get(key) in (None, "", []):
            raise WhitelistError(f"missing required param: {key}")

    for step in plan:
        if not isinstance(step, dict):
            continue
        key = str(step.get("key") or "")
        kind = str(step.get("kind") or "")
        flag = step.get("flag")
        value = payload.get(key)
        if key in properties:
            _validate_schema_value(key, value, properties[key], required=key in required)
        if kind == "store_true":
            if value:
                argv.append(str(flag or f"--{key.replace('_', '-')}"))
            continue
        if kind == "store_false":
            if value is False:
                argv.append(str(flag or f"--{key.replace('_', '-')}"))
            continue
        if value is None or value == "":
            continue
        if kind == "json_option":
            if not isinstance(value, dict):
                raise WhitelistError(f"{key} must be a JSON object")
            argv.extend([str(flag or f"--{key.replace('_', '-')}"), json.dumps(value, ensure_ascii=False)])
            continue
        if kind == "option":
            argv.extend([str(flag or f"--{key.replace('_', '-')}"), _scalar_token(key, value)])
            continue
        if kind == "positional":
            if step.get("variadic"):
                items = value if isinstance(value, list) else [value]
                for item in items:
                    argv.append(_scalar_token(key, item))
            else:
                argv.append(_scalar_token(key, value))
            continue
        raise WhitelistError(f"unknown argv_plan kind: {kind}")
    if any("\x00" in part for part in argv):
        raise WhitelistError("invalid argv")
    return argv


def _validate_schema_value(key: str, value: Any, spec: dict[str, Any], *, required: bool) -> None:
    if value is None or value == "":
        if required:
            raise WhitelistError(f"missing required param: {key}")
        return
    expected = spec.get("type")
    if expected == "boolean" and not isinstance(value, bool):
        raise WhitelistError(f"{key} must be a boolean")
    if expected == "object" and not isinstance(value, dict):
        raise WhitelistError(f"{key} must be an object")
    if expected == "array":
        if not isinstance(value, list):
            raise WhitelistError(f"{key} must be an array")
        return
    if expected == "integer" and not isinstance(value, int):
        raise WhitelistError(f"{key} must be an integer")
    if expected in {None, "string"}:
        if not isinstance(value, str):
            raise WhitelistError(f"{key} must be a string")
        pattern = spec.get("pattern")
        if pattern and not re.fullmatch(str(pattern), value):
            raise WhitelistError(f"invalid {key}")
        enum = spec.get("enum")
        if enum and value not in enum:
            raise WhitelistError(f"invalid {key}")


def _scalar_token(key: str, value: Any) -> str:
    if isinstance(value, bool) or value is None or isinstance(value, (dict, list)):
        raise WhitelistError(f"invalid {key}")
    token = str(value)
    if "\x00" in token or "\n" in token or "\r" in token:
        raise WhitelistError(f"invalid {key}")
    return token
