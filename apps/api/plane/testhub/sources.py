# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Resolve TestCopilot's bound workdir from gitsync, with ProjectTestRepo fallback."""

from __future__ import annotations

from plane.gitsync.bindings import BindingError, get_bound_remote, resolve_remote_workdir
from plane.gitsync.models import ProjectGitRemote
from plane.gitsync.registry import MODULE_TESTHUB
from plane.gitsync.workdir import GitUrlNotImplemented, WorkdirError, assert_allowed_workdir, default_mount_workdir
from plane.testhub.models import ProjectTestRepo
from plane.testhub.serializers import ProjectTestRepoSerializer


class TesthubUnbound(ValueError):
    pass


def testhub_remote_or_legacy(project_id) -> ProjectGitRemote | ProjectTestRepo:
    remote = get_bound_remote(project_id, MODULE_TESTHUB)
    if remote is not None:
        return remote
    repo = ProjectTestRepo.objects.filter(project_id=project_id).first()
    if repo is not None and (repo.workdir or repo.repo_url):
        return repo
    raise TesthubUnbound("Bind a test repo first.")


def testhub_workdir(project_id) -> str:
    source = testhub_remote_or_legacy(project_id)
    if isinstance(source, ProjectGitRemote):
        try:
            return resolve_remote_workdir(source)
        except (WorkdirError, GitUrlNotImplemented, BindingError) as exc:
            raise TesthubUnbound(str(exc)) from exc
    workdir = (source.workdir or "").strip()
    if not workdir:
        raise TesthubUnbound("Bind a test repo first.")
    return workdir


def testhub_exec_workdir(project_id) -> str | None:
    """Path sent to the runner. Does not require the directory to exist on this host."""
    source = testhub_remote_or_legacy(project_id)
    if isinstance(source, ProjectGitRemote):
        try:
            return assert_allowed_workdir(source.workdir or default_mount_workdir())
        except WorkdirError as exc:
            raise TesthubUnbound(str(exc)) from exc
    workdir = (source.workdir or "").strip()
    return workdir or None


def testhub_repo_payload(project_id) -> dict | None:
    remote = get_bound_remote(project_id, MODULE_TESTHUB)
    if remote is not None:
        return {
            "id": str(remote.id),
            "project": str(remote.project_id),
            "workspace": str(remote.workspace_id),
            "name": remote.name,
            "kind": remote.kind,
            "repo_url": remote.repo_url,
            "branch": remote.branch,
            "workdir": remote.workdir,
            "host_path": remote.host_path,
            "last_sync_sha": remote.last_sync_sha,
            "last_sync_at": remote.last_sync_at.isoformat() if remote.last_sync_at else None,
            "last_sync_status": remote.last_sync_status,
            "last_sync_error": remote.last_sync_error,
        }
    repo = ProjectTestRepo.objects.filter(project_id=project_id).first()
    if repo is None:
        return None
    data = ProjectTestRepoSerializer(repo).data
    data["name"] = "Test repository"
    data["kind"] = "local_mount"
    data["host_path"] = ""
    return data
