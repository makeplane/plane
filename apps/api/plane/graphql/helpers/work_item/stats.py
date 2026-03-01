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
Helper functions for getting the stats for a work item

Functions:
- get_work_item_stats_count: Get the stats for a work item
- get_work_item_stats_count_async: Get the stats for a work item asynchronously
"""

# Python imports
from typing import Union

# Third Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q

# Module Imports
from plane.db.models import FileAsset, Issue, IssueLink, IssueRelation
from plane.graphql.types.asset import FileAssetEntityType
from plane.graphql.types.issues.base import IssueStatsType

# Local imports
from .page import get_work_item_pages_count, is_work_item_page_feature_flagged


def get_work_item_stats_count(
    user_id: Union[str, strawberry.ID],
    workspace_id: Union[str, strawberry.ID],
    workspace_slug: str,
    project_id: Union[str, strawberry.ID],
    work_item_id: Union[str, strawberry.ID],
) -> IssueStatsType:
    """
    Get the stats for a work item. This includes the number of attachments, relations, sub work items, links and pages.

    Args:
        user_id: The ID of the user
        workspace_id: The ID of the workspace
        workspace_slug: The slug of the workspace
        project_id: The ID of the project
        work_item_id: The ID of the work item

    Returns:
        IssueStatsType: The stats for the work item
    """

    sub_work_items_count = Issue.objects.filter(
        workspace_id=workspace_id,
        project_id=project_id,
        parent_id=work_item_id,
    ).count()
    attachments_count = FileAsset.objects.filter(
        entity_type=FileAssetEntityType.ISSUE_ATTACHMENT.value,
        issue_id=work_item_id,
        is_uploaded=True,
        is_deleted=False,
        is_archived=False,
    ).count()
    relations_count = IssueRelation.objects.filter(Q(issue_id=work_item_id) | Q(related_issue_id=work_item_id)).count()
    links_count = IssueLink.objects.filter(issue_id=work_item_id).count()

    pages_count = 0

    # validate pages count if feature flag is enabled
    if is_work_item_page_feature_flagged(workspace_slug=workspace_slug, user_id=user_id, raise_exception=False):
        pages_count = get_work_item_pages_count(
            workspace_id=workspace_id, project_id=project_id, work_item_id=work_item_id
        )

    return IssueStatsType(
        attachments=attachments_count,
        relations=relations_count,
        sub_work_items=sub_work_items_count,
        links=links_count,
        pages=pages_count,
    )


@sync_to_async
def get_work_item_stats_count_async(
    user_id: Union[str, strawberry.ID],
    workspace_id: Union[str, strawberry.ID],
    workspace_slug: str,
    project_id: Union[str, strawberry.ID],
    work_item_id: Union[str, strawberry.ID],
) -> IssueStatsType:
    """
    Get the stats for a work item asynchronously.
    This includes the number of attachments, relations, sub work items, links and pages.
    """

    return get_work_item_stats_count(
        user_id=user_id,
        workspace_id=workspace_id,
        workspace_slug=workspace_slug,
        project_id=project_id,
        work_item_id=work_item_id,
    )
