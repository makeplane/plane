# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Internal vectorization endpoint.
Triggers workspace vectorization jobs via Celery.
"""

from fastapi import APIRouter
from fastapi import Depends
from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import verify_internal_secret_key
from pi.app.api.v1.helpers.plane_sql_queries import get_all_workspace_ids
from pi.app.models.workspace_vectorization import VectorizationStatus
from pi.app.models.workspace_vectorization import WorkspaceVectorization
from pi.celery_app import celery_app
from pi.core.db.plane_pi.lifecycle import get_async_session

log = logger.getChild(__name__)
router = APIRouter(
    dependencies=[Depends(verify_internal_secret_key)],
    include_in_schema=False,
)


class VectorizeRequest(BaseModel):
    """Request model for workspace vectorization."""

    workspace_ids: list[str]
    feed_issues: bool = True
    feed_pages: bool = True
    feed_slices: int = 4
    batch_size: int = 32


class GlobalVectorizeRequest(BaseModel):
    """Request model for global vectorization (all workspaces)."""

    feed_issues: bool = True
    feed_pages: bool = True
    feed_docs: bool = True
    feed_slices: int = 16
    batch_size: int = 50


@router.post("/vectorize/all/", include_in_schema=False)
async def trigger_global_vectorization(
    body: GlobalVectorizeRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Trigger vectorization for all workspaces.
    Fetches all workspace IDs and creates tracking records for each.

    Returns:
        JSONResponse with accepted and skipped workspace IDs
    """

    log.info("Fetching all workspace IDs from Plane database")

    workspace_ids = await get_all_workspace_ids()

    if not workspace_ids:
        log.warning("No workspaces found")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"accepted": [], "skipped": [], "message": "No workspaces found"},
        )

    log.info(f"Found {len(workspace_ids)} workspace(s)")

    accepted, skipped = [], []

    for ws in workspace_ids:
        stmt = select(WorkspaceVectorization).where(
            WorkspaceVectorization.workspace_id == ws,
            (WorkspaceVectorization.status == VectorizationStatus.queued) | (WorkspaceVectorization.status == VectorizationStatus.running),
        )
        existing_job = (await db.exec(stmt)).first()

        if existing_job:
            skipped.append(ws)
            continue

        job = WorkspaceVectorization(
            workspace_id=ws,
            status=VectorizationStatus.queued,
            feed_issues=body.feed_issues,
            feed_pages=body.feed_pages,
            feed_slices=body.feed_slices,
            batch_size=body.batch_size,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        job_config = {
            "workspace_id": ws,
            "job_id": str(job.id),
            "feed_issues": body.feed_issues,
            "feed_pages": body.feed_pages,
            "feed_slices": body.feed_slices,
            "batch_size": body.batch_size,
        }
        celery_app.send_task("pi.celery_app.vectorize_workspace", args=[job_config])
        accepted.append(ws)

    log.info(f"Queued {len(accepted)} workspace(s), skipped {len(skipped)}")

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "accepted": accepted,
            "skipped": skipped,
            "message": f"Accepted {len(accepted)} workspace(s), skipped {len(skipped)} workspace(s)",
        },
    )


@router.post("/vectorize/workspaces/", include_in_schema=False)
async def trigger_vectorization(
    body: VectorizeRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Trigger vectorization for multiple workspaces.
    Creates database records and queues Celery tasks for each workspace.

    Returns:
        JSONResponse with accepted and skipped workspace IDs
    """
    accepted, skipped = [], []

    for ws in body.workspace_ids:
        # Check if workspace already has a running/queued job
        stmt = select(WorkspaceVectorization).where(
            WorkspaceVectorization.workspace_id == ws,
            (WorkspaceVectorization.status == VectorizationStatus.queued) | (WorkspaceVectorization.status == VectorizationStatus.running),
        )
        existing_job = (await db.exec(stmt)).first()

        if existing_job:
            skipped.append(ws)
            log.info(f"Skipped workspace {ws} - job already exists (ID: {existing_job.id})")
            continue

        # Create new job record
        job = WorkspaceVectorization(
            workspace_id=ws,
            status=VectorizationStatus.queued,
            feed_issues=body.feed_issues,
            feed_pages=body.feed_pages,
            feed_slices=body.feed_slices,
            batch_size=body.batch_size,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        # Queue Celery task
        job_config = {
            "workspace_id": ws,
            "job_id": str(job.id),
            "feed_issues": body.feed_issues,
            "feed_pages": body.feed_pages,
            "feed_slices": body.feed_slices,
            "batch_size": body.batch_size,
        }
        celery_app.send_task("pi.celery_app.vectorize_workspace", args=[job_config])
        accepted.append(ws)
        log.info(f"Queued workspace {ws} for vectorization (Job ID: {job.id})")

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "accepted": accepted,
            "skipped": skipped,
            "message": f"Accepted {len(accepted)} workspace(s), skipped {len(skipped)} workspace(s)",
        },
    )
