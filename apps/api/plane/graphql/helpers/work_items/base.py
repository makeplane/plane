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

# Python imports
from typing import Optional, Union

# Third Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports

# Strawberry Imports
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import Issue, StateGroup
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces


def _work_item_base_query(
    user_id: Optional[Union[str, strawberry.ID]] = None,
    workspace_id: Optional[Union[str, strawberry.ID]] = None,
    project_id: Optional[Union[str, strawberry.ID]] = None,
    filters: Optional[dict] = None,
):
    """
    Get the work item base query for objects and all objects the given workspace slug
    and project id
    """
    work_item_base_query = (
        Issue.objects
        # old intake filters
        .filter(state__is_triage=False)
        # ignoring triage state group (intake work items)
        .filter(state__group__ne=StateGroup.TRIAGE.value)
        # archived filters
        .filter(archived_at__isnull=True)
        # draft filters
        .filter(is_draft=False)
    )

    if workspace_id:
        work_item_base_query = work_item_base_query.filter(workspace_id=workspace_id)
    if project_id:
        work_item_base_query = work_item_base_query.filter(project_id=project_id).filter(
            project__archived_at__isnull=True
        )
    if filters:
        work_item_base_query = work_item_base_query.filter(**filters)

    # project member filters
    if user_id:
        project_teamspace_filter = project_member_filter_via_teamspaces(
            user_id=user_id,
            workspace_slug=workspace_id,
        )
        work_item_base_query = work_item_base_query.filter(project_teamspace_filter.query).distinct()

    return work_item_base_query


def get_work_items(
    user_id: Optional[Union[str, strawberry.ID]] = None,
    workspace_id: Optional[Union[str, strawberry.ID]] = None,
    project_id: Optional[Union[str, strawberry.ID]] = None,
    filters: Optional[dict] = None,
):
    """
    Get the work items for the given workspace, project, and user
    """
    base_query = _work_item_base_query(
        user_id=user_id, workspace_id=workspace_id, project_id=project_id, filters=filters
    )
    issues = base_query.all()

    return list(issues)


@sync_to_async
def get_work_items_async(
    user_id: Optional[Union[str, strawberry.ID]] = None,
    workspace_id: Optional[Union[str, strawberry.ID]] = None,
    project_id: Optional[Union[str, strawberry.ID]] = None,
    filters: Optional[dict] = None,
):
    """
    Get the work items for the given workspace, project, and user
    """
    return get_work_items(user_id=user_id, workspace_id=workspace_id, project_id=project_id, filters=filters)


@sync_to_async
def get_work_item(
    workspace_id: Union[str, strawberry.ID],
    work_item_id: Union[str, strawberry.ID],
    project_id: Optional[Union[str, strawberry.ID]] = None,
    user_id: Optional[Union[str, strawberry.ID]] = None,
):
    """
    Get the work item for the given project and work item id
    """

    base_query = _work_item_base_query(workspace_id=workspace_id, project_id=project_id, user_id=user_id)

    try:
        return base_query.get(id=work_item_id)
    except Issue.DoesNotExist:
        message = "Work item not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)
