# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import json

from celery import shared_task
from django.utils import timezone

from plane.testhub.models import CatalogSnapshot, ProjectTestRepo, TesthubJob
from plane.testhub.runner import RunnerError, exec_job
from plane.testhub.whitelist import latest_catalog_payload, tool_timeout
from plane.utils.exception_logger import log_exception

LOG_LIMIT = 200_000


def _clip(text: str) -> str:
    if len(text) <= LOG_LIMIT:
        return text
    return text[:LOG_LIMIT] + "\n… [truncated]"


@shared_task
def run_testhub_job(job_id: str) -> None:
    job = TesthubJob.objects.filter(pk=job_id).first()
    if job is None:
        return
    job.status = TesthubJob.Status.RUNNING
    job.started_at = timezone.now()
    job.save(update_fields=["status", "started_at", "updated_at"])

    try:
        result = exec_job(
            job_id=str(job.id),
            argv=list(job.argv),
            timeout=tool_timeout(
                job.kind,
                catalog=latest_catalog_payload(job.project_id),
                params=job.params if isinstance(job.params, dict) else {},
            ),
            workdir=_exec_workdir(job.project_id),
        )
        job.exit_code = result.exit_code
        job.stdout = _clip(result.stdout)
        job.stderr = _clip(result.stderr)
        job.finished_at = timezone.now()
        job.status = TesthubJob.Status.SUCCEEDED if result.exit_code == 0 else TesthubJob.Status.FAILED
        job.save(update_fields=["exit_code", "stdout", "stderr", "finished_at", "status", "updated_at"])

        if job.kind == "index_platform" and job.status == TesthubJob.Status.SUCCEEDED:
            _store_catalog(job, result.stdout, result.git)
        elif job.kind == "index_platform":
            _mark_index_status(job.project_id, job.status, _clip(result.stderr or f"exit {result.exit_code}"))
    except RunnerError as exc:
        job.status = TesthubJob.Status.FAILED
        job.stderr = _clip(str(exc))
        job.finished_at = timezone.now()
        job.save(update_fields=["status", "stderr", "finished_at", "updated_at"])
        if job.kind == "index_platform":
            _mark_index_status(job.project_id, TesthubJob.Status.FAILED, _clip(str(exc)))
    except Exception as exc:
        log_exception(exc)
        job.status = TesthubJob.Status.FAILED
        job.stderr = _clip(str(exc))
        job.finished_at = timezone.now()
        job.save(update_fields=["status", "stderr", "finished_at", "updated_at"])
        if job.kind == "index_platform":
            _mark_index_status(job.project_id, TesthubJob.Status.FAILED, _clip(str(exc)))


def _exec_workdir(project_id) -> str | None:
    from plane.testhub.sources import TesthubUnbound, testhub_exec_workdir

    try:
        return testhub_exec_workdir(project_id)
    except TesthubUnbound:
        return None


def _parse_catalog_json(stdout: str) -> dict:
    text = stdout.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("index_platform stdout did not contain a JSON object")
    return json.loads(text[start : end + 1])


def _store_catalog(job: TesthubJob, stdout: str, git: dict) -> None:
    payload = _parse_catalog_json(stdout)
    sha = str((payload.get("git") or {}).get("sha") or git.get("sha") or "")
    CatalogSnapshot.objects.create(
        project_id=job.project_id,
        workspace_id=job.workspace_id,
        sha=sha,
        payload=payload,
    )
    _mark_index_status(job.project_id, TesthubJob.Status.SUCCEEDED, "", sha=sha)


def _mark_index_status(project_id, status: str, error: str, sha: str | None = None) -> None:
    from plane.gitsync.bindings import get_bound_remote
    from plane.gitsync.registry import MODULE_TESTHUB

    now = timezone.now()
    repo_update = {
        "last_sync_status": status,
        "last_sync_error": error,
        "updated_at": now,
    }
    if sha is not None:
        repo_update["last_sync_sha"] = sha
        repo_update["last_sync_at"] = now
    ProjectTestRepo.objects.filter(project_id=project_id).update(**repo_update)

    remote = get_bound_remote(project_id, MODULE_TESTHUB)
    if remote is None:
        return
    remote.last_sync_status = status
    remote.last_sync_error = error
    update_fields = ["last_sync_status", "last_sync_error", "updated_at"]
    if sha is not None:
        remote.last_sync_sha = sha
        remote.last_sync_at = now
        update_fields.extend(["last_sync_sha", "last_sync_at"])
    remote.save(update_fields=update_fields)
