# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Public HTTPS git_url validation. Must stay aligned with testhub-runner/git_sync.py."""
from __future__ import annotations

import re
from urllib.parse import urlparse

_BRANCH_RE = re.compile(r"^[A-Za-z0-9._/-]+$")
_HOST_RE = re.compile(r"^[A-Za-z0-9.-]+$")


class GitUrlError(ValueError):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


def validate_https_repo_url(raw: str) -> str:
    url = (raw or "").strip()
    if not url:
        raise GitUrlError("repo_url", "Repository URL is required.")
    if any(ch.isspace() or ord(ch) < 32 for ch in url):
        raise GitUrlError("repo_url", "Repository URL contains invalid characters.")
    parsed = urlparse(url)
    if parsed.scheme.lower() != "https":
        raise GitUrlError("repo_url", "Only public https:// repository URLs are supported.")
    if parsed.username or parsed.password or "@" in parsed.netloc:
        raise GitUrlError("repo_url", "Repository URL must not include credentials.")
    host = (parsed.hostname or "").lower()
    if not host or not _HOST_RE.fullmatch(host):
        raise GitUrlError("repo_url", "Repository URL host is invalid.")
    if parsed.port not in (None, 443):
        raise GitUrlError("repo_url", "Repository URL port is not allowed.")
    if parsed.query or parsed.fragment:
        raise GitUrlError("repo_url", "Repository URL must not include query or fragment.")
    if not parsed.path or parsed.path == "/":
        raise GitUrlError("repo_url", "Repository URL path is required.")
    if ".." in parsed.path.split("/"):
        raise GitUrlError("repo_url", "Repository URL path is invalid.")
    return url


def validate_branch(raw: str) -> str:
    branch = (raw or "").strip()
    if not branch:
        raise GitUrlError("branch", "Branch is required.")
    if len(branch) > 255:
        raise GitUrlError("branch", "Branch is too long.")
    if branch.startswith("-") or branch.startswith("/") or branch.endswith("/") or ".." in branch:
        raise GitUrlError("branch", "Branch is invalid.")
    if not _BRANCH_RE.fullmatch(branch):
        raise GitUrlError("branch", "Branch is invalid.")
    return branch
