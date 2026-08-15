# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Allowlisted argv shapes the runner will execute. Plane also checks this."""
from __future__ import annotations

import re

ALLOWED_MODULES = frozenset(
    {
        "apps.index_platform",
        "apps.index_ai",
        "packages.action_words",
    }
)
_TABLE_RE = re.compile(r"^[\w$]+$", re.UNICODE)
_DATASOURCE_RE = re.compile(r"^[\w-]+$")


def validate_argv(argv: list[str]) -> list[str]:
    if not argv or not isinstance(argv, list):
        raise ValueError("argv must be a non-empty list")
    if any(not isinstance(item, str) for item in argv):
        raise ValueError("argv items must be strings")
    if any("\x00" in item for item in argv):
        raise ValueError("invalid argv")
    if argv[0] not in {"python", "python3"}:
        raise ValueError("argv must start with python")
    if argv[1:2] == ["-m"]:
        if len(argv) < 3 or argv[2] not in ALLOWED_MODULES:
            raise ValueError("python -m module is not allowlisted")
        return list(argv)
    if argv[1:2] == ["apps/dump_ddl.py"]:
        _validate_dump_ddl(argv[2:])
        return list(argv)
    raise ValueError("argv is not allowlisted")


def _validate_dump_ddl(args: list[str]) -> None:
    i = 0
    while i < len(args):
        arg = args[i]
        if arg == "--datasource":
            if i + 1 >= len(args) or not _DATASOURCE_RE.fullmatch(args[i + 1]):
                raise ValueError("invalid dump_ddl datasource")
            i += 2
            continue
        if arg in {"--no-sample", "--all"}:
            i += 1
            continue
        if not _TABLE_RE.fullmatch(arg):
            raise ValueError(f"invalid dump_ddl argument: {arg!r}")
        i += 1
