# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Refresh a data source. local_mount re-reads disk; git_url clone/fetch runs on the runner."""
from __future__ import annotations

from django.utils import timezone

from plane.gitsync.git_url import GitUrlError, validate_branch, validate_https_repo_url
from plane.gitsync.models import ProjectGitRemote
from plane.gitsync.serializers import assign_git_url_workdir
from plane.gitsync.workdir import ensure_workdir_ready, inspect_workdir


def refresh_remote(remote: ProjectGitRemote) -> ProjectGitRemote:
    if remote.kind == ProjectGitRemote.Kind.GIT_URL:
        raise ValueError("git_url remotes must be synced through queue_git_url_sync")

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
    apply_git_meta(remote, git, status="succeeded", error="")
    return remote


def queue_git_url_sync(remote: ProjectGitRemote, user_id=None) -> ProjectGitRemote:
    if remote.kind != ProjectGitRemote.Kind.GIT_URL:
        raise ValueError("queue_git_url_sync is only for git_url remotes")
    try:
        remote.repo_url = validate_https_repo_url(remote.repo_url)
        remote.branch = validate_branch(remote.branch)
    except GitUrlError as exc:
        remote.last_sync_status = "failed"
        remote.last_sync_error = str(exc)
        remote.save(update_fields=["repo_url", "branch", "last_sync_status", "last_sync_error", "updated_at"])
        raise
    if (remote.credential_ref or "").strip():
        remote.last_sync_status = "failed"
        remote.last_sync_error = "Private remotes are not supported yet. Use a public HTTPS URL."
        remote.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
        raise GitUrlError("credential_ref", remote.last_sync_error)
    assign_git_url_workdir(remote)
    remote.last_sync_status = "queued"
    remote.last_sync_error = ""
    remote.save(update_fields=["repo_url", "branch", "workdir", "last_sync_status", "last_sync_error", "updated_at"])
    from plane.gitsync.bgtasks import run_git_url_sync

    run_git_url_sync.delay(str(remote.id), str(user_id) if user_id else None)
    return remote


def apply_git_meta(remote: ProjectGitRemote, git: dict, *, status: str, error: str) -> ProjectGitRemote:
    sha = str((git or {}).get("sha") or "")
    branch = str((git or {}).get("branch") or "")
    remote.last_sync_sha = sha
    if branch:
        remote.branch = branch
    remote.last_sync_at = timezone.now()
    remote.last_sync_status = status
    remote.last_sync_error = error
    update_fields = [
        "last_sync_sha",
        "last_sync_at",
        "last_sync_status",
        "last_sync_error",
        "updated_at",
    ]
    if branch:
        update_fields.append("branch")
    remote.save(update_fields=update_fields)
    return remote
