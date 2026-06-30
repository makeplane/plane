# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging

from celery import shared_task
from django.utils import timezone

from plane.db.models import APIToken, Importer, Project, Workspace
from plane.utils.exception_logger import log_exception
from plane.utils.importers.eva.client import EvaApiClient, EvaApiError
from plane.utils.importers.eva.extract import EvaExtractor
from plane.utils.importers.eva.load import EvaLoader

logger = logging.getLogger("plane.worker")


def _set_import_progress(
    importer: Importer,
    *,
    phase: str,
    completed: int = 0,
    total: int = 1,
    percent: int = 0,
    stats: dict | None = None,
) -> None:
    importer.imported_data = {
        "progress": {
            "phase": phase,
            "completed": completed,
            "total": total,
            "percent": percent,
        },
        "stats": stats or {},
        "warnings": [],
    }
    importer.save(update_fields=["imported_data", "updated_at"])


@shared_task
def eva_import_task(importer_id: str) -> None:
    importer = Importer.objects.select_related("project", "workspace", "initiated_by", "token").get(pk=importer_id)
    importer.status = "processing"
    importer.save(update_fields=["status", "updated_at"])
    _set_import_progress(importer, phase="extracting", percent=0)

    try:
        metadata = importer.metadata or {}
        client = EvaApiClient(metadata.get("url", ""), metadata.get("token", ""))
        extractor = EvaExtractor(client)
        eva_project_id = metadata.get("eva_project_id")
        if not eva_project_id:
            raise EvaApiError("Missing EVA project id in importer metadata")

        extracted = extractor.extract_project(eva_project_id)
        loader = EvaLoader(
            importer=importer,
            workspace=importer.workspace,
            project=importer.project,
            actor=importer.initiated_by,
            config=importer.config or {},
            data=importer.data or {},
        )
        imported_data = loader.run(extracted)
        importer.imported_data = imported_data
        importer.status = "completed"
        importer.updated_at = timezone.now()
        importer.save(update_fields=["imported_data", "status", "updated_at"])
    except Exception as error:
        log_exception(error)
        importer.refresh_from_db()
        importer.status = "failed"
        previous = importer.imported_data if isinstance(importer.imported_data, dict) else {}
        importer.imported_data = {
            "error": str(error),
            "progress": previous.get("progress"),
            "stats": previous.get("stats", {}),
            "warnings": previous.get("warnings", []),
        }
        importer.updated_at = timezone.now()
        importer.save(update_fields=["imported_data", "status", "updated_at"])


def create_importer_service_token(*, workspace: Workspace, user) -> APIToken:
    return APIToken.objects.create(
        workspace=workspace,
        user=user,
        label="eva-importer",
        description="Service token for EVA import job tracking",
        is_service=True,
    )
