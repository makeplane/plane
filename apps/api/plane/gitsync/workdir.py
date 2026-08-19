# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Filesystem helpers for a bound workdir. No git subprocess — API must not shell out."""

from __future__ import annotations

from pathlib import Path

from django.conf import settings

ALLOWED_WORKDIR_PREFIXES = (
    "/opt/testhub/",
    "/opt/gitsync/",
)


class WorkdirError(ValueError):
    pass


class GitUrlNotImplemented(RuntimeError):
    """Raised when a git_url workdir has not been cloned yet."""


def default_mount_workdir() -> str:
    return str(getattr(settings, "TESTHUB_WORKDIR", "/opt/testhub/workdir"))


def clone_root() -> str:
    return str(getattr(settings, "GITSYNC_CLONE_ROOT", "/opt/gitsync/clones")).rstrip("/")


def reserved_clone_workdir(project_id, remote_id) -> str:
    """Stable path for a git_url clone on the shared runner volume."""
    return f"{clone_root()}/{project_id}/{remote_id}"


def normalize_workdir(raw: str) -> str:
    path = (raw or "").strip().replace("\\", "/")
    if not path or path == "/":
        raise WorkdirError("workdir is required")
    if not path.startswith("/"):
        raise WorkdirError("workdir must be an absolute container path")
    return path.rstrip("/") or "/"


def assert_allowed_workdir(workdir: str) -> str:
    normalized = normalize_workdir(workdir)
    default = default_mount_workdir().rstrip("/")
    if normalized == default:
        return normalized
    if any(normalized == prefix.rstrip("/") or normalized.startswith(prefix) for prefix in ALLOWED_WORKDIR_PREFIXES):
        return normalized
    raise WorkdirError("workdir is outside the allowlist")


def ensure_workdir_ready(kind: str, workdir: str) -> str:
    """Same consumer interface for both kinds. git_url is ready only after a clone exists."""
    normalized = assert_allowed_workdir(workdir)
    if kind == "git_url" and not Path(normalized).is_dir():
        raise GitUrlNotImplemented("git_url clone is not ready. Sync the data source first.")
    return normalized


def read_git_meta(repo_root: str | Path) -> dict[str, str | None]:
    root = Path(repo_root)
    git_dir = root / ".git"
    if git_dir.is_file():
        text = git_dir.read_text(encoding="utf-8").strip()
        if text.lower().startswith("gitdir:"):
            raw = text.split(":", 1)[1].strip()
            candidate = Path(raw)
            git_dir = candidate if candidate.is_absolute() else (root / candidate)
    if not git_dir.is_dir():
        return {"branch": None, "sha": None}
    head_file = git_dir / "HEAD"
    if not head_file.is_file():
        return {"branch": None, "sha": None}
    head = head_file.read_text(encoding="utf-8").strip()
    if head.startswith("ref:"):
        ref = head.split(":", 1)[1].strip()
        branch = ref.removeprefix("refs/heads/")
        ref_file = git_dir / ref
        sha = ref_file.read_text(encoding="utf-8").strip() if ref_file.is_file() else None
        if not sha:
            packed = git_dir / "packed-refs"
            if packed.is_file():
                needle = f" {ref}"
                for line in packed.read_text(encoding="utf-8").splitlines():
                    if line.endswith(needle):
                        sha = line.split(" ", 1)[0].strip()
                        break
        return {"branch": branch, "sha": sha}
    return {"branch": None, "sha": head or None}


def inspect_workdir(workdir: str) -> dict[str, object]:
    normalized = assert_allowed_workdir(workdir)
    root = Path(normalized)
    exists = root.is_dir()
    git = read_git_meta(root) if exists else {"branch": None, "sha": None}
    return {"workdir": normalized, "exists": exists, "git": git}
