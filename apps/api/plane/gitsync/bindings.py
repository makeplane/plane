# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from plane.gitsync.models import ModuleBinding, ProjectGitRemote
from plane.gitsync.registry import MODULE_TESTHUB, is_known_module
from plane.gitsync.workdir import GitUrlNotImplemented, WorkdirError, ensure_workdir_ready


class BindingError(ValueError):
    pass


def get_bound_remote(project_id, module_key: str) -> ProjectGitRemote | None:
    binding = (
        ModuleBinding.objects.filter(project_id=project_id, module_key=module_key).select_related("remote").first()
    )
    return binding.remote if binding else None


def require_bound_remote(project_id, module_key: str) -> ProjectGitRemote:
    remote = get_bound_remote(project_id, module_key)
    if remote is None:
        raise BindingError(f"Module {module_key} is not bound to a data source.")
    return remote


def resolve_module_workdir(project_id, module_key: str) -> str:
    remote = require_bound_remote(project_id, module_key)
    return resolve_remote_workdir(remote)


def resolve_remote_workdir(remote: ProjectGitRemote) -> str:
    workdir = (remote.workdir or "").strip()
    if not workdir:
        if remote.kind == ProjectGitRemote.Kind.GIT_URL:
            raise GitUrlNotImplemented("git_url clone is not ready. Sync the data source first.")
        raise WorkdirError("workdir is required")
    return ensure_workdir_ready(remote.kind, workdir)


def bind_module(*, project, module_key: str, remote: ProjectGitRemote | None) -> ModuleBinding | None:
    if not is_known_module(module_key):
        raise BindingError(f"Unknown module: {module_key}")
    if remote is None:
        ModuleBinding.objects.filter(project=project, module_key=module_key).delete()
        return None
    if str(remote.project_id) != str(project.id):
        raise BindingError("Data source does not belong to this project.")
    binding, _created = ModuleBinding.objects.update_or_create(
        project=project,
        module_key=module_key,
        defaults={"workspace_id": project.workspace_id, "remote": remote},
    )
    if module_key == MODULE_TESTHUB:
        _shadow_testhub_repo(project, remote)
    return binding


def _shadow_testhub_repo(project, remote: ProjectGitRemote) -> None:
    from plane.testhub.models import ProjectTestRepo

    ProjectTestRepo.objects.update_or_create(
        project=project,
        defaults={
            "workspace_id": project.workspace_id,
            "repo_url": remote.repo_url or "",
            "branch": remote.branch or "sandbox/jafron",
            "workdir": remote.workdir or "",
        },
    )
