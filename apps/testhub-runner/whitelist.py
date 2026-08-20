# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Allowlisted argv shapes the runner will execute. Plane also checks this."""
from __future__ import annotations

import re

_APPS_MODULE_RE = re.compile(r"^apps\.[a-z][a-z0-9_]*$")
ACTION_WORDS_MODULE = "packages.action_words"


def validate_argv(argv: list[str]) -> list[str]:
    if not argv or not isinstance(argv, list):
        raise ValueError("argv must be a non-empty list")
    if any(not isinstance(item, str) for item in argv):
        raise ValueError("argv items must be strings")
    if any("\x00" in item for item in argv):
        raise ValueError("invalid argv")
    if argv[0] not in {"python", "python3"}:
        raise ValueError("argv must start with python")
    if argv[1:2] != ["-m"]:
        raise ValueError("argv is not allowlisted")
    if len(argv) < 3 or not _allowed_module(argv[2]):
        raise ValueError("python -m module is not allowlisted")
    return list(argv)


def _allowed_module(module: str) -> bool:
    return bool(_APPS_MODULE_RE.fullmatch(module)) or module == ACTION_WORDS_MODULE
