"""
SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
SPDX-License-Identifier: LicenseRef-Plane-Commercial

Licensed under the Plane Commercial License (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
https://plane.so/legals/eula

DO NOT remove or modify this notice.
NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
"""

import logging
import uuid

from celery import shared_task
from django.db import transaction

from plane.ee.models import Workflow, WorkflowState
from plane.db.models import State
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")


@shared_task(bind=True, max_retries=3, time_limit=None, soft_time_limit=None)
def seed_workflow_default_states(self):
    """
    Background task: for every default workflow, link all project states into it
    as WorkflowState entries. Wrapped in a single atomic transaction so partial
    failures roll back cleanly.
    """
    try:
        default_workflows = list(
            Workflow.objects.filter(deleted_at__isnull=True, is_default=True).values_list(
                "id", "project_id", "workspace_id"
            )
        )

        logger.info(f"[seed_workflow_default_states] Found {len(default_workflows)} default workflows")

        if not default_workflows:
            logger.info("[seed_workflow_default_states] No default workflows found, skipping")
            return {"status": "skipped", "reason": "no_default_workflows"}

        batch_size = 5000
        total_created = 0

        for i in range(0, len(default_workflows), batch_size):
            chunk = default_workflows[i : i + batch_size]

            # {project_id: (workflow_id, workspace_id)}
            project_workflow_map = {
                project_id: (workflow_id, workspace_id) for workflow_id, project_id, workspace_id in chunk
            }
            chunk_project_ids = list(project_workflow_map.keys())

            states = list(
                State.objects.filter(
                    project_id__in=chunk_project_ids,
                    deleted_at__isnull=True,
                ).values_list("id", "project_id")
            )

            workflow_states = [
                WorkflowState(
                    id=uuid.uuid4(),
                    workflow_id=project_workflow_map[project_id][0],
                    state_id=state_id,
                    project_id=project_id,
                    workspace_id=project_workflow_map[project_id][1],
                )
                for state_id, project_id in states
                if project_id in project_workflow_map
            ]

            with transaction.atomic():
                WorkflowState.objects.bulk_create(
                    workflow_states,
                    batch_size=batch_size,
                    ignore_conflicts=True,
                )
            total_created += len(workflow_states)

            logger.info(
                f"[seed_workflow_default_states] Processed "
                f"{min(i + batch_size, len(default_workflows))}/{len(default_workflows)} workflows"
            )

        logger.info(f"[seed_workflow_default_states] Complete — {total_created} workflow state entries created")
        return {"status": "success", "total_created": total_created}

    except Exception as e:
        log_exception(e)
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2**self.request.retries))
        return {"status": "error", "message": str(e)}
