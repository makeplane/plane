# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Refresh a data source. local_mount re-reads disk; git_url clone is not implemented."""

from __future__ import annotations

from django.utils import timezone

from plane.gitsync.models import ProjectGitRemote
from plane.gitsync.workdir import GitUrlNotImplemented, ensure_workdir_ready, inspect_workdir


def refresh_remote(remote: ProjectGitRemote) -> ProjectGitRemote:
    if remote.kind == ProjectGitRemote.Kind.GIT_URL:
        remote.last_sync_status = "failed"
        remote.last_sync_error = "git_url clone/fetch is not implemented yet. Use a local_mount data source."
        remote.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
        raise GitUrlNotImplemented(remote.last_sync_error)

    try:
        workdir = ensure_workdir_ready(remote.kind, remote.workdir or "")
        info = inspect_workdir(workdir)
    except Exception as exc:
        remote.last_sync_status = "failed"
        remote.last_sync_error = str(exc)
        remote.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
        raise

    if not info["exists"]:
        remote.last_sync_status = "failed"
        remote.last_sync_error = f"workdir missing: {workdir}"
        remote.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
        raise FileNotFoundError(remote.last_sync_error)

    git = info["git"] or {}
    sha = str(git.get("sha") or "")
    branch = str(git.get("branch") or "")
    remote.last_sync_sha = sha
    if branch:
        remote.branch = branch
    remote.last_sync_at = timezone.now()
    remote.last_sync_status = "succeeded"
    remote.last_sync_error = ""
    remote.save(
        update_fields=[
            "last_sync_sha",
            "branch",
            "last_sync_at",
            "last_sync_status",
            "last_sync_error",
            "updated_at",
        ]
    )
    return remote
