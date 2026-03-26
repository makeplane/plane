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

import logging

from celery import shared_task

from plane.db.models import Issue
from plane.ee.models import WorkflowTransition
from plane.ee.services import WorkflowTransitionExecutor
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.ee.bgtasks.workflow_post_actions")


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 60},
    retry_backoff=True,
    retry_jitter=True,
)
def run_workflow_post_actions(self, issue_id, transition_id, project_id):
    try:
        transition = WorkflowTransition.objects.filter(
            id=transition_id, project_id=project_id, deleted_at__isnull=True
        ).first()
        if not transition:
            logger.warning("WorkflowTransition %s not found for project %s — skipping", transition_id, project_id)
            return

        issue = Issue.objects.select_related("workspace").get(id=issue_id, project_id=project_id)
        executor = WorkflowTransitionExecutor()
        executor.run_post_actions(issue, transition)
    except Exception as exc:
        log_exception(exc)
        raise  # triggers Celery autoretry
