# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import json
import re
from typing import Any

BOOTSTRAP_KIND = "index_platform"
LEGACY_ACTION_WORDS_KIND = "action_words"
ACTION_WORDS_MODULE = "packages.action_words"
ACTION_WORD_KINDS = frozenset(
    {"db_seed", "db_assert", "api_request", "api_assert", "ui_action", "ui_assert"}
)

_APPS_MODULE_RE = re.compile(r"^apps\.[a-z][a-z0-9_]*$")
_DESTRUCTIVE_FALLBACK = frozenset({"db_seed", "api_request", "ui_action"})


class WhitelistError(ValueError):
    pass


def latest_catalog_payload(project_id) -> dict[str, Any]:
    from plane.testhub.models import CatalogSnapshot

    snapshot = CatalogSnapshot.objects.filter(project_id=project_id).order_by("-created_at").first()
    if snapshot is None:
        return {}
    payload = snapshot.payload if isinstance(snapshot.payload, dict) else {}
    return payload


def latest_tools(project_id) -> list[dict[str, Any]]:
    tools = latest_catalog_payload(project_id).get("tools") or []
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
    catalog: dict[str, Any] | None = None,
) -> bool:
    if kind == BOOTSTRAP_KIND:
        return False
    try:
        row = _find_runnable(kind, params or {}, tools=tools, catalog=catalog)
    except WhitelistError:
        return _resolve_kind(kind, params) in _DESTRUCTIVE_FALLBACK
    return bool(row.get("destructive")) if "destructive" in row else _resolve_kind(kind, params) in _DESTRUCTIVE_FALLBACK


def build_argv(
    kind: str,
    params: dict[str, Any] | None = None,
    *,
    tools: list[dict[str, Any]] | None = None,
    catalog: dict[str, Any] | None = None,
) -> list[str]:
    payload = params or {}
    if kind == BOOTSTRAP_KIND:
        return ["python", "-m", "apps.index_platform", "--out", "-"]

    row = _find_runnable(kind, payload, tools=tools, catalog=catalog)
    if not _is_runnable(row):
        resolved = _resolve_kind(kind, payload)
        raise WhitelistError(f"kind is not plane-runnable: {resolved}")
    return _argv_from_tool(row, payload)


def tool_timeout(
    kind: str,
    tools: list[dict[str, Any]] | None = None,
    *,
    catalog: dict[str, Any] | None = None,
    params: dict[str, Any] | None = None,
) -> int:
    if kind == BOOTSTRAP_KIND:
        return 180
    try:
        row = _find_runnable(kind, params or {}, tools=tools, catalog=catalog)
    except WhitelistError:
        return 180
    try:
        timeout = int(row.get("timeout") or 180)
    except (TypeError, ValueError):
        return 180
    return max(5, min(timeout, 900))


def _catalog_parts(
    tools: list[dict[str, Any]] | None,
    catalog: dict[str, Any] | None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    payload = catalog if isinstance(catalog, dict) else {}
    tool_rows = list(tools) if tools is not None else [row for row in (payload.get("tools") or []) if isinstance(row, dict)]
    components = payload.get("components") if isinstance(payload.get("components"), dict) else {}
    words = [row for row in (components.get("action_words") or []) if isinstance(row, dict)]
    return tool_rows, words


def _find_runnable(
    kind: str,
    params: dict[str, Any],
    *,
    tools: list[dict[str, Any]] | None,
    catalog: dict[str, Any] | None,
) -> dict[str, Any]:
    resolved = _resolve_kind(kind, params)
    tool_rows, words = _catalog_parts(tools, catalog)
    if resolved in ACTION_WORD_KINDS:
        word_id = str(params.get("word_id") or "")
        if not word_id:
            raise WhitelistError("missing required param: word_id")
        for word in words:
            if str(word.get("word_id") or "") != word_id:
                continue
            plane_kind = str(word.get("plane_kind") or word.get("category") or "")
            if plane_kind != resolved:
                raise WhitelistError(f"action word category mismatch: {word_id}")
            return word
        raise WhitelistError(f"action word is not registered for Plane: {word_id}")

    tool = find_tool(resolved, tool_rows, params)
    if tool is None:
        raise WhitelistError(f"kind is not a registered Plane app: {resolved} (sync the catalog first)")
    return tool


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


def _allowed_module(module: str) -> bool:
    return bool(_APPS_MODULE_RE.fullmatch(module)) or module == ACTION_WORDS_MODULE


def _argv_from_tool(tool: dict[str, Any], payload: dict[str, Any]) -> list[str]:
    argv = [str(part) for part in (tool.get("argv") or [])]
    if len(argv) < 3 or argv[0] not in {"python", "python3"} or argv[1] != "-m":
        raise WhitelistError("registered tool argv must start with python -m")
    module = argv[2]
    if not _allowed_module(module):
        raise WhitelistError(f"registered tool module is not allowlisted: {module}")

    plan = tool.get("argv_plan") or []
    schema = tool.get("job_params_schema") if isinstance(tool.get("job_params_schema"), dict) else tool.get("params_schema")
    schema = schema if isinstance(schema, dict) else {}
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
