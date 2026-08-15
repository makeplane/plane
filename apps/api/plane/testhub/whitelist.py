# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import json
import re
from typing import Any

ALLOWED_KINDS = frozenset({"index_platform", "dump_ddl", "index_ai", "action_words"})
DESTRUCTIVE_KINDS = frozenset({"action_words"})
DESTRUCTIVE_WORD_PREFIXES = ("db_seed.", "api_request.")

_TABLE_RE = re.compile(r"^[\w$]+$", re.UNICODE)
_DATASOURCE_RE = re.compile(r"^[\w-]+$")
_WORD_ID_RE = re.compile(r"^[a-z][a-z0-9_.]*$")


class WhitelistError(ValueError):
    pass


def is_destructive(kind: str, params: dict[str, Any] | None = None) -> bool:
    if kind not in DESTRUCTIVE_KINDS:
        return False
    word_id = str((params or {}).get("word_id") or "")
    if not word_id:
        return True
    return word_id.startswith(DESTRUCTIVE_WORD_PREFIXES)


def build_argv(kind: str, params: dict[str, Any] | None = None) -> list[str]:
    payload = params or {}
    if kind not in ALLOWED_KINDS:
        raise WhitelistError(f"kind is not whitelisted: {kind}")
    if kind == "index_platform":
        return ["python", "-m", "apps.index_platform", "--out", "-"]
    if kind == "index_ai":
        argv = ["python", "-m", "apps.index_ai"]
        if payload.get("check"):
            argv.append("--check")
        return argv
    if kind == "dump_ddl":
        return _dump_ddl_argv(payload)
    if kind == "action_words":
        return _action_words_argv(payload)
    raise WhitelistError(f"kind is not whitelisted: {kind}")


def _dump_ddl_argv(payload: dict[str, Any]) -> list[str]:
    argv = ["python", "apps/dump_ddl.py"]
    datasource = str(payload.get("datasource") or "main")
    if not _DATASOURCE_RE.fullmatch(datasource):
        raise WhitelistError("invalid dump_ddl datasource")
    argv.extend(["--datasource", datasource])
    if payload.get("no_sample"):
        argv.append("--no-sample")
    if payload.get("all"):
        argv.append("--all")
        return argv
    tables = payload.get("tables") or []
    if isinstance(tables, str):
        tables = [part.strip() for part in tables.split(",") if part.strip()]
    if not tables:
        raise WhitelistError("dump_ddl requires tables or all=true")
    for table in tables:
        if not isinstance(table, str) or not _TABLE_RE.fullmatch(table):
            raise WhitelistError(f"invalid dump_ddl table: {table!r}")
        argv.append(table)
    return argv


def _action_words_argv(payload: dict[str, Any]) -> list[str]:
    word_id = str(payload.get("word_id") or "")
    if not _WORD_ID_RE.fullmatch(word_id):
        raise WhitelistError("invalid action word id")
    argv = ["python", "-m", "packages.action_words", "run", word_id]
    if payload.get("example"):
        argv.append("--example")
        return argv
    params = payload.get("params")
    if params is None:
        params = {}
    if not isinstance(params, (dict, list)):
        raise WhitelistError("action_words params must be an object")
    argv.extend(["--params", json.dumps(params, ensure_ascii=False)])
    return argv
