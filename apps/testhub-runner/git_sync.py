# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Allowlisted git clone/fetch for public HTTPS remotes. No extra flags, no credentials."""
from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path
from urllib.parse import urlparse

CLONE_ROOT_DEFAULT = "/opt/gitsync/clones"
EXEC_WORKDIR_PREFIXES = (
    "/opt/testhub/",
    "/opt/gitsync/clones/",
)
_BRANCH_RE = re.compile(r"^[A-Za-z0-9._/-]+$")
_HOST_RE = re.compile(r"^[A-Za-z0-9.-]+$")


class GitSyncError(ValueError):
    pass


def clone_root() -> str:
    return os.environ.get("GITSYNC_CLONE_ROOT", CLONE_ROOT_DEFAULT).replace("\\", "/").rstrip("/")


def validate_https_repo_url(raw: str) -> str:
    url = (raw or "").strip()
    if not url:
        raise GitSyncError("repository URL is required")
    if any(ch.isspace() or ord(ch) < 32 for ch in url):
        raise GitSyncError("repository URL contains invalid characters")
    parsed = urlparse(url)
    if parsed.scheme.lower() != "https":
        raise GitSyncError("only public https:// repository URLs are supported")
    if parsed.username or parsed.password or parsed.netloc.find("@") >= 0:
        raise GitSyncError("repository URL must not include credentials")
    host = (parsed.hostname or "").lower()
    if not host or not _HOST_RE.fullmatch(host):
        raise GitSyncError("repository URL host is invalid")
    if parsed.port not in (None, 443):
        raise GitSyncError("repository URL port is not allowed")
    if parsed.query or parsed.fragment:
        raise GitSyncError("repository URL must not include query or fragment")
    if not parsed.path or parsed.path == "/":
        raise GitSyncError("repository URL path is required")
    if ".." in parsed.path.split("/"):
        raise GitSyncError("repository URL path is invalid")
    return url


def validate_branch(raw: str) -> str:
    branch = (raw or "").strip()
    if not branch:
        raise GitSyncError("branch is required")
    if len(branch) > 255:
        raise GitSyncError("branch is too long")
    if branch.startswith("-") or branch.startswith("/") or branch.endswith("/") or ".." in branch:
        raise GitSyncError("branch is invalid")
    if not _BRANCH_RE.fullmatch(branch):
        raise GitSyncError("branch is invalid")
    return branch


def assert_clone_workdir(raw: str) -> Path:
    normalized = (raw or "").strip().replace("\\", "/")
    if not normalized.startswith("/"):
        raise GitSyncError("workdir must be an absolute container path")
    parts = [part for part in normalized.split("/") if part]
    if ".." in parts or not parts:
        raise GitSyncError("invalid workdir")
    root = clone_root()
    trimmed = normalized.rstrip("/")
    if trimmed == root:
        raise GitSyncError("workdir must be a clone subdirectory")
    if not (trimmed + "/").startswith(root + "/"):
        raise GitSyncError("workdir is outside the clone root")
    path = Path(normalized)
    if path.exists():
        try:
            path.resolve().relative_to(Path(root).resolve())
        except ValueError as exc:
            raise GitSyncError("workdir is outside the clone root") from exc
    return path


def resolve_exec_workdir(raw: str | None, default: Path) -> Path:
    if raw is None or not str(raw).strip():
        return default
    normalized = str(raw).strip().replace("\\", "/")
    parts = [part for part in normalized.split("/") if part]
    if ".." in parts:
        raise GitSyncError("invalid workdir")
    if not normalized.startswith("/"):
        raise GitSyncError("workdir must be an absolute container path")
    trimmed = normalized.rstrip("/") or "/"
    default_norm = str(default).replace("\\", "/").rstrip("/")
    if trimmed == default_norm:
        return Path(trimmed)
    if any(trimmed == prefix.rstrip("/") or trimmed.startswith(prefix) for prefix in EXEC_WORKDIR_PREFIXES):
        return Path(trimmed)
    raise GitSyncError("workdir is outside the allowlist")


def normalize_https_git_url(url: str) -> str:
    parsed = urlparse(url.strip())
    host = (parsed.hostname or "").lower()
    path = (parsed.path or "").rstrip("/")
    if path.endswith(".git"):
        path = path[:-4]
    return f"https://{host}{path}".lower()


def origin_urls_match(left: str, right: str) -> bool:
    try:
        return normalize_https_git_url(left) == normalize_https_git_url(right)
    except Exception:
        return False


def clone_command(url: str, branch: str, workdir: str) -> list[str]:
    return ["git", "clone", "--branch", branch, "--single-branch", "--depth", "50", "--", url, workdir]


def fetch_commands(branch: str, workdir: str) -> list[list[str]]:
    return [
        ["git", "-C", workdir, "config", "--get", "remote.origin.url"],
        ["git", "-C", workdir, "fetch", "--depth", "50", "origin", branch],
        ["git", "-C", workdir, "checkout", "-B", branch, f"origin/{branch}"],
        ["git", "-C", workdir, "reset", "--hard", f"origin/{branch}"],
    ]


def _is_git_repo(path: Path) -> bool:
    return (path / ".git").exists()


def _is_empty_dir(path: Path) -> bool:
    if not path.is_dir():
        return False
    try:
        next(path.iterdir())
    except StopIteration:
        return True
    return False


def _git_env() -> dict[str, str]:
    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    env["GIT_ASKPASS"] = "echo"
    env["GCM_INTERACTIVE"] = "never"
    return env


def run_git(argv: list[str], timeout: int) -> subprocess.CompletedProcess[str]:
    if not argv or argv[0] != "git":
        raise GitSyncError("git argv is not allowlisted")
    return subprocess.run(  # noqa: S603 — argv is constructed locally
        argv,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=False,
        env=_git_env(),
    )


def clone_or_fetch(*, repo_url: str, branch: str, workdir: str, timeout: int = 300) -> dict[str, str]:
    url = validate_https_repo_url(repo_url)
    branch_name = validate_branch(branch)
    dest = assert_clone_workdir(workdir)
    dest.parent.mkdir(parents=True, exist_ok=True)

    logs: list[str] = []
    if not dest.exists() or _is_empty_dir(dest):
        completed = run_git(clone_command(url, branch_name, str(dest)), timeout)
        logs.append(completed.stdout or "")
        logs.append(completed.stderr or "")
        if completed.returncode != 0:
            raise GitSyncError((completed.stderr or completed.stdout or "git clone failed").strip())
    elif _is_git_repo(dest):
        origin = run_git(["git", "-C", str(dest), "config", "--get", "remote.origin.url"], min(timeout, 30))
        logs.append(origin.stdout or "")
        logs.append(origin.stderr or "")
        if origin.returncode != 0:
            raise GitSyncError((origin.stderr or "could not read origin URL").strip())
        if not origin_urls_match((origin.stdout or "").strip(), url):
            raise GitSyncError("clone origin URL does not match the saved repository URL")
        for argv in fetch_commands(branch_name, str(dest))[1:]:
            completed = run_git(argv, timeout)
            logs.append(completed.stdout or "")
            logs.append(completed.stderr or "")
            if completed.returncode != 0:
                raise GitSyncError((completed.stderr or completed.stdout or "git fetch failed").strip())
    else:
        raise GitSyncError("workdir exists and is not an empty git clone")

    return {"stdout": "\n".join(part for part in logs if part), "workdir": str(dest)}
