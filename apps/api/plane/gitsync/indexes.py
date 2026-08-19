# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Fan-out catalog refresh after a data source sync."""
from __future__ import annotations

from pathlib import Path

from plane.db.models import Project
from plane.gitsync.bindings import BindingError, resolve_remote_workdir
from plane.gitsync.conventions import ConventionError, scan_module_catalog
from plane.gitsync.models import ModuleBinding, ProjectGitRemote
from plane.gitsync.registry import CONVENTION_SCAN_MODULES, MODULE_TESTHUB
from plane.gitsync.workdir import GitUrlNotImplemented, WorkdirError


def refresh_bound_indexes(user, project_id, remote: ProjectGitRemote, *, touch_testhub_status: bool = True) -> dict:
    indexes: dict = {}
    keys = list(ModuleBinding.objects.filter(remote=remote).values_list("module_key", flat=True))
    if MODULE_TESTHUB in keys:
        indexes[MODULE_TESTHUB] = enqueue_testhub_index(user, project_id, touch_remote_status=touch_testhub_status)
    workdir_path = Path((remote.workdir or "").strip())
    if not workdir_path.is_dir():
        return indexes
    try:
        workdir = resolve_remote_workdir(remote)
    except (WorkdirError, GitUrlNotImplemented, BindingError) as exc:
        for key in keys:
            if key in CONVENTION_SCAN_MODULES:
                indexes[key] = {"ok": False, "error": str(exc)}
        return indexes
    for key in keys:
        if key not in CONVENTION_SCAN_MODULES:
            continue
        try:
            scan_module_catalog(key, workdir)
            indexes[key] = {"ok": True}
        except ConventionError as exc:
            indexes[key] = {"ok": False, "error": str(exc)}
    return indexes


def enqueue_testhub_index(user, project_id, *, touch_remote_status: bool = True):
    from plane.testhub.enqueue import TesthubJobConflict, enqueue_index_platform
    from plane.testhub.serializers import TesthubJobSerializer
    from plane.testhub.sources import TesthubUnbound

    project = Project.objects.get(pk=project_id)
    try:
        job = enqueue_index_platform(project=project, user=user, touch_remote_status=touch_remote_status)
    except TesthubJobConflict as exc:
        return {"error": str(exc)}
    except TesthubUnbound as exc:
        return {"error": str(exc)}
    return TesthubJobSerializer(job).data
