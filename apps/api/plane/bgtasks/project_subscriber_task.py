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

# Third party imports
from celery import shared_task
from uuid import UUID

# Module imports
from plane.db.models import Issue, IssueSubscriber
from plane.ee.models import ProjectSubscriber
from plane.utils.exception_logger import log_exception


@shared_task
def add_project_subscribers_to_work_items_task(workspace_id: str, project_id: str, subscriber_ids: list[str]):
    """
    Background task to add project subscribers to all the work items in a project.
    Args:
        workspace_id: The UUID of the workspace
        project_id: The UUID of the project
        subscriber_ids: The UUIDs of the subscribers to add
    """
    try:
        issue_ids = list(
            Issue.objects.filter(
                workspace_id=workspace_id,
                project_id=project_id,
            ).values_list("id", flat=True)
        )

        if not issue_ids:
            return

        # Get existing issue-subscriber pairs to avoid duplicates
        existing_pairs = set(
            IssueSubscriber.objects.filter(
                workspace_id=workspace_id,
                project_id=project_id,
                issue_id__in=issue_ids,
                subscriber_id__in=subscriber_ids,
            ).values_list("issue_id", "subscriber_id")
        )

        records = []
        for issue_id in issue_ids:
            for subscriber_id in subscriber_ids:
                if (issue_id, UUID(subscriber_id)) not in existing_pairs:
                    records.append(
                        IssueSubscriber(
                            workspace_id=workspace_id,
                            project_id=project_id,
                            issue_id=issue_id,
                            subscriber_id=subscriber_id,
                        )
                    )
        IssueSubscriber.objects.bulk_create(records, batch_size=100, ignore_conflicts=True)
    except Exception as e:
        log_exception(e)


@shared_task
def add_project_subscribers_to_single_work_item_task(workspace_id: str, project_id: str, work_item_id: str):
    """
    Background task to add project subscribers to a single work item.
    Args:
        workspace_id: The UUID of the workspace
        project_id: The UUID of the project
        work_item_id: The UUID of the work item
    """
    try:
        project_subscriber_ids = ProjectSubscriber.objects.filter(
            workspace_id=workspace_id,
            project_id=project_id,
        ).values_list("subscriber_id", flat=True)

        subscribers_already_subscribed = IssueSubscriber.objects.filter(
            workspace_id=workspace_id,
            project_id=project_id,
            issue_id=work_item_id,
            subscriber_id__in=project_subscriber_ids,
        ).values_list("subscriber_id", flat=True)

        subscribers_to_add = set(project_subscriber_ids) - set(subscribers_already_subscribed)

        issue_subscribers = []

        for subscriber_id in subscribers_to_add:
            issue_subscribers.append(
                IssueSubscriber(
                    workspace_id=workspace_id,
                    project_id=project_id,
                    issue_id=work_item_id,
                    subscriber_id=subscriber_id,
                )
            )
        IssueSubscriber.objects.bulk_create(issue_subscribers, batch_size=100, ignore_conflicts=True)
    except Exception as e:
        log_exception(e)
