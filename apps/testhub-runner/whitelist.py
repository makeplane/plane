# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Allowlisted argv shapes the runner will execute. Plane also checks this."""
from __future__ import annotations

import re

_APPS_MODULE_RE = re.compile(r"^apps\.[a-z][a-z0-9_]*$")
ACTION_WORDS_MODULE = "packages.action_words"
CONFIG_MODULE = "packages.config"
ENV_NAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9._-]*$")
ALLOWED_LOCAL_FILES = frozenset({"config/env_local.py"})
MAX_LOCAL_FILE_BYTES = 256_000


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
    if argv[2] == CONFIG_MODULE:
        rest = argv[3:]
        if rest in ([], ["show"]):
            return list(argv)
        if len(rest) == 2 and rest[0] == "use" and ENV_NAME_RE.fullmatch(rest[1]):
            return list(argv)
        raise ValueError("packages.config argv is not allowlisted")
    return list(argv)


def _allowed_module(module: str) -> bool:
    return bool(_APPS_MODULE_RE.fullmatch(module)) or module in {ACTION_WORDS_MODULE, CONFIG_MODULE}


def validate_local_file_path(rel_path: str) -> str:
    normalized = (rel_path or "").replace("\\", "/").strip()
    if normalized not in ALLOWED_LOCAL_FILES:
        raise ValueError("path is not allowlisted")
    return normalized


def validate_local_file_content(content: str) -> str:
    if not isinstance(content, str):
        raise ValueError("content must be a string")
    if "\x00" in content:
        raise ValueError("invalid content")
    if len(content.encode("utf-8")) > MAX_LOCAL_FILE_BYTES:
        raise ValueError("file too large")
    return content
