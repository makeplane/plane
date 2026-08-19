# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from celery import shared_task
from django.contrib.auth import get_user_model

from plane.gitsync.models import ProjectGitRemote
from plane.gitsync.sync import apply_git_meta
from plane.testhub.runner import RunnerError, git_sync
from plane.utils.exception_logger import log_exception

LOG_LIMIT = 200_000


def _clip(text: str) -> str:
    if len(text) <= LOG_LIMIT:
        return text
    return text[:LOG_LIMIT] + "\n… [truncated]"


@shared_task
def run_git_url_sync(remote_id: str, user_id: str | None = None) -> None:
    remote = ProjectGitRemote.objects.filter(pk=remote_id).first()
    if remote is None:
        return
    remote.last_sync_status = "running"
    remote.last_sync_error = ""
    remote.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])

    try:
        result = git_sync(
            repo_url=remote.repo_url,
            branch=remote.branch,
            workdir=remote.workdir,
            timeout=300,
        )
        if result.exit_code != 0:
            raise RunnerError(_clip(result.stderr or result.stdout or f"exit {result.exit_code}"))
        apply_git_meta(remote, result.git, status="succeeded", error="")
    except RunnerError as exc:
        remote.last_sync_status = "failed"
        remote.last_sync_error = _clip(str(exc))
        remote.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
        return
    except Exception as exc:
        log_exception(exc)
        remote.last_sync_status = "failed"
        remote.last_sync_error = _clip(str(exc))
        remote.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
        return

    user = None
    if user_id:
        user = get_user_model().objects.filter(pk=user_id).first()
    from plane.gitsync.indexes import refresh_bound_indexes

    refresh_bound_indexes(user, remote.project_id, remote, touch_testhub_status=False)
