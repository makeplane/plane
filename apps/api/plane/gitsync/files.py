# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import re
from pathlib import Path

from plane.gitsync.registry import (
    MODULE_ENVIRONMENTS,
    MODULE_FEATURES,
    MODULE_PRD,
    MODULE_TESTHUB,
    MODULE_WIKI,
)

MAX_FILE_BYTES = 1_048_576
SECRET_LINE_RE = re.compile(
    r"(password|secret|token|passwd|api_key|credential|private_key)",
    re.I,
)


class FileAccessError(ValueError):
    pass


def is_denied_env_name(name: str) -> bool:
    lowered = name.lower()
    if "local" in lowered:
        return True
    return lowered in {".env", "env_local.py"}


def is_feature_file(rel: str) -> bool:
    normalized = rel.replace("\\", "/")
    if not normalized.endswith(".feature"):
        return False
    return any(part in {"feature", "features"} for part in normalized.split("/"))


def is_environment_template(rel: str) -> bool:
    normalized = rel.replace("\\", "/")
    name = Path(normalized).name.lower()
    if is_denied_env_name(name):
        return False
    suffix = Path(normalized).suffix.lower()
    if normalized == "config/env.py" or normalized.startswith("config/env."):
        return suffix in {".py", ".yaml", ".yml", ".json"}
    if normalized.startswith("env/"):
        return suffix in {".yaml", ".yml", ".json", ".py"}
    return False


def path_allowed(module_key: str, rel_path: str) -> bool:
    normalized = rel_path.replace("\\", "/")
    if module_key == MODULE_TESTHUB:
        return False
    if module_key == MODULE_FEATURES:
        if is_feature_file(normalized):
            return True
        return normalized.startswith(
            ("packages/action_words/", "packages/api_objects/", "packages/page_objects/", "assets/ddl/")
        )
    if module_key == MODULE_ENVIRONMENTS:
        if is_denied_env_name(Path(normalized).name):
            return False
        return is_environment_template(normalized)
    if module_key == MODULE_WIKI:
        return normalized.startswith(("docs/", "wiki/"))
    if module_key == MODULE_PRD:
        return normalized.startswith("prd/")
    return False


def redact_secrets(content: str) -> str:
    lines = []
    for line in content.splitlines(keepends=True):
        if SECRET_LINE_RE.search(line) and ("=" in line or ":" in line):
            stripped = line.rstrip("\n")
            ending = "\n" if line.endswith("\n") else ""
            if "=" in stripped:
                key = stripped.split("=", 1)[0]
                lines.append(f"{key}= ***{ending}")
            else:
                key = stripped.split(":", 1)[0]
                lines.append(f"{key}: ***{ending}")
            continue
        lines.append(line)
    return "".join(lines)


def resolve_module_file(
    workdir: str,
    module_key: str,
    rel_path: str,
    max_bytes: int = MAX_FILE_BYTES,
) -> tuple[str, str]:
    normalized = _normalize_rel_path(rel_path)
    if not path_allowed(module_key, normalized):
        raise FileAccessError("path is outside the allowlist")

    root = Path(workdir).resolve()
    target = (root / normalized).resolve()
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise FileAccessError("path escapes workdir") from exc
    if not target.is_file():
        raise FileAccessError("file not found")
    size = target.stat().st_size
    if size > max_bytes:
        raise FileAccessError(f"file too large ({size} bytes)")
    text = target.read_text(encoding="utf-8", errors="replace")
    if module_key == MODULE_ENVIRONMENTS:
        text = redact_secrets(text)
    return normalized, text


def _normalize_rel_path(rel_path: str) -> str:
    raw = (rel_path or "").replace("\\", "/").strip()
    if not raw or raw.startswith("/") or raw.startswith("~"):
        raise FileAccessError("invalid path")
    parts: list[str] = []
    for part in raw.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            raise FileAccessError("invalid path")
        parts.append(part)
    if not parts:
        raise FileAccessError("invalid path")
    return "/".join(parts)
