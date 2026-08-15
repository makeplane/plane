# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from pathlib import Path

ALLOWED_PREFIXES = (
    "assets/",
    "packages/api_objects/",
    "tests/",
    "data/",
)

MAX_FILE_BYTES = 1_048_576


class FileAccessError(ValueError):
    pass


def resolve_repo_file(workdir: str, rel_path: str, max_bytes: int = MAX_FILE_BYTES) -> tuple[str, str]:
    """Return (posix_rel_path, text). Raises FileAccessError on deny/missing."""
    normalized = _normalize_rel_path(rel_path)
    if not any(normalized.startswith(prefix) for prefix in ALLOWED_PREFIXES):
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
    return normalized, target.read_text(encoding="utf-8", errors="replace")


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
