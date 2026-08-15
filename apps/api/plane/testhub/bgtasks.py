# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import json

from celery import shared_task
from django.utils import timezone

from plane.testhub.models import CatalogSnapshot, ProjectTestRepo, TesthubJob
from plane.testhub.runner import RunnerError, exec_job
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

    repo = ProjectTestRepo.objects.filter(project_id=job.project_id).first()
    try:
        result = exec_job(job_id=str(job.id), argv=list(job.argv), timeout=_timeout_for(job.kind))
        job.exit_code = result.exit_code
        job.stdout = _clip(result.stdout)
        job.stderr = _clip(result.stderr)
        job.finished_at = timezone.now()
        job.status = TesthubJob.Status.SUCCEEDED if result.exit_code == 0 else TesthubJob.Status.FAILED
        job.save(update_fields=["exit_code", "stdout", "stderr", "finished_at", "status", "updated_at"])

        if job.kind == "index_platform" and job.status == TesthubJob.Status.SUCCEEDED:
            _store_catalog(job, result.stdout, result.git)
        elif repo is not None and job.kind == "index_platform":
            repo.last_sync_status = job.status
            repo.last_sync_error = _clip(result.stderr or f"exit {result.exit_code}")
            repo.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
    except RunnerError as exc:
        job.status = TesthubJob.Status.FAILED
        job.stderr = _clip(str(exc))
        job.finished_at = timezone.now()
        job.save(update_fields=["status", "stderr", "finished_at", "updated_at"])
        if repo is not None and job.kind == "index_platform":
            repo.last_sync_status = TesthubJob.Status.FAILED
            repo.last_sync_error = _clip(str(exc))
            repo.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])
    except Exception as exc:
        log_exception(exc)
        job.status = TesthubJob.Status.FAILED
        job.stderr = _clip(str(exc))
        job.finished_at = timezone.now()
        job.save(update_fields=["status", "stderr", "finished_at", "updated_at"])
        if repo is not None and job.kind == "index_platform":
            repo.last_sync_status = TesthubJob.Status.FAILED
            repo.last_sync_error = _clip(str(exc))
            repo.save(update_fields=["last_sync_status", "last_sync_error", "updated_at"])


def _timeout_for(kind: str) -> int:
    if kind == "dump_ddl":
        return 600
    if kind == "action_words":
        return 300
    return 180


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
    ProjectTestRepo.objects.filter(project_id=job.project_id).update(
        last_sync_sha=sha,
        last_sync_at=timezone.now(),
        last_sync_status=TesthubJob.Status.SUCCEEDED,
        last_sync_error="",
        updated_at=timezone.now(),
    )
