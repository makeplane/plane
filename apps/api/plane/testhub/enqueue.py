# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from plane.db.models import Project
from plane.testhub.models import TesthubJob
from plane.testhub.whitelist import build_argv

ACTIVE_JOB_STATUSES = (TesthubJob.Status.QUEUED, TesthubJob.Status.RUNNING)


class TesthubJobConflict(RuntimeError):
    pass


def enqueue_index_platform(*, project: Project, user, touch_remote_status: bool = True) -> TesthubJob:
    from plane.testhub.bgtasks import run_testhub_job
    from plane.testhub.sources import testhub_remote_or_legacy

    if TesthubJob.objects.filter(project_id=project.id, status__in=ACTIVE_JOB_STATUSES).exists():
        raise TesthubJobConflict("A testhub job is already running for this project.")

    testhub_remote_or_legacy(project.id)

    argv = build_argv("index_platform", {})
    job = TesthubJob.objects.create(
        project=project,
        workspace_id=project.workspace_id,
        kind="index_platform",
        params={},
        argv=argv,
        requested_by=user,
    )
    from plane.gitsync.bindings import get_bound_remote
    from plane.testhub.models import ProjectTestRepo

    remote = get_bound_remote(project.id, "testhub")
    if touch_remote_status and remote is not None:
        remote.last_sync_status = TesthubJob.Status.QUEUED
        remote.last_sync_error = ""
        remote.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
    repo = ProjectTestRepo.objects.filter(project_id=project.id).first()
    if touch_remote_status and repo is not None:
        repo.last_sync_status = TesthubJob.Status.QUEUED
        repo.last_sync_error = ""
        repo.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])

    run_testhub_job.delay(str(job.id))
    return job
