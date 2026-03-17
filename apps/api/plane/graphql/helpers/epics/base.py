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
from django.db.models import Q

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import FileAsset, Issue, IssueLink, IssueRelation, IssueType, StateGroup
from plane.ee.models import ProjectFeature
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces
from plane.graphql.types.asset import FileAssetEntityType
from plane.graphql.types.epics.base import EpicStatsType
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.utils.archive import ArchivedFilter, apply_archived_filter
from plane.graphql.utils.feature_flag import _validate_feature_flag

# Local Imports
from .page import get_epic_pages_count, is_epic_page_feature_flagged


def epic_base_query(
    workspace_slug: Optional[str] = None,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
    archived_filter: Optional[ArchivedFilter] = None,
):
    """
    Get the epic base query for objects and all objects the given workspace slug
    and project id.
    """
    epic_base_query = (
        Issue.objects
        # issue intake filters
        .filter(
            Q(issue_intake__status=1)
            | Q(issue_intake__status=-1)
            | Q(issue_intake__status=2)
            | Q(issue_intake__isnull=True)
        )
        # old intake filters
        .filter(state__is_triage=False)
        # new intake filters
        .exclude(state__group=StateGroup.TRIAGE.value)
        # epic filters
        .filter(Q(type__isnull=False) & Q(type__is_epic=True))
        # deleted filters
        .filter(deleted_at__isnull=True)
        # draft filters
        .filter(is_draft=False)
    )

    # workspace filters
    if workspace_slug:
        epic_base_query = epic_base_query.filter(workspace__slug=workspace_slug)

    # project filters
    if project_id:
        epic_base_query = epic_base_query.filter(project_id=project_id).filter(project__archived_at__isnull=True)

    # project member filters
    if user_id:
        project_teamspace_filter = project_member_filter_via_teamspaces(
            user_id=user_id,
            workspace_slug=workspace_slug,
        )
        epic_base_query = epic_base_query.filter(project_teamspace_filter.query).distinct()

    # archived filters
    epic_base_query = apply_archived_filter(queryset=epic_base_query, archived_filter=archived_filter)

    return epic_base_query


@sync_to_async
def is_epic_feature_flagged(user_id: str, workspace_slug: str, raise_exception: bool = True):
    try:
        is_feature_flagged = _validate_feature_flag(
            user_id=user_id,
            workspace_slug=workspace_slug,
            feature_key=FeatureFlagsTypesEnum.EPICS.value,
            default_value=False,
        )

        if not is_feature_flagged:
            if raise_exception:
                message = "Epic feature flag is not enabled for the workspace"
                error_extensions = {
                    "code": "EPIC_FEATURE_FLAG_NOT_ENABLED",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)
            return False
        return is_feature_flagged
    except Exception:
        if raise_exception:
            message = "Error checking if epic feature flag is enabled"
            error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)
        return False


@sync_to_async
def is_project_epics_enabled(workspace_slug: str, project_id: str, raise_exception: bool = True):
    """
    Check if the epic feature flag is enabled for the workspace and project
    """
    try:
        project_feature = ProjectFeature.objects.filter(workspace__slug=workspace_slug, project_id=project_id).first()

        if not project_feature:
            if raise_exception:
                message = "Project epics are not enabled"
                error_extensions = {"code": "EPIC_NOT_ENABLED", "statusCode": 400}
                raise GraphQLError(message, extensions=error_extensions)
            return False

        if not project_feature.is_epic_enabled:
            if raise_exception:
                message = "Project epics are not enabled"
                error_extensions = {"code": "EPIC_NOT_ENABLED", "statusCode": 400}
                raise GraphQLError(message, extensions=error_extensions)
            return False
        return project_feature.is_epic_enabled
    except ProjectFeature.DoesNotExist:
        if raise_exception:
            message = "Project feature not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)
        return False
    except Exception:
        if raise_exception:
            message = "Error checking if project epics are enabled"
            error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)
        return False


@sync_to_async
def get_project_epic_type(workspace_slug: str, project_id: str):
    """
    Get the epic type for the given project
    """
    try:
        return IssueType.objects.get(
            workspace__slug=workspace_slug,
            project_issue_types__project_id=project_id,
            is_epic=True,
            level=1,
            is_active=True,
        )
    except IssueType.DoesNotExist:
        message = "Epic type not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_project_epics(
    workspace_slug: str,
    project_id: str,
    user_id: str,
    filters: Optional[JSON] = {},
    orderBy: Optional[str] = "-created_at",
    archived_filter: Optional[ArchivedFilter] = None,
):
    """
    Get all epics for the given project
    """

    base_query = epic_base_query(
        workspace_slug=workspace_slug, project_id=project_id, user_id=user_id, archived_filter=archived_filter
    )

    epics = (
        base_query.select_related("workspace", "project", "state")
        .prefetch_related("assignees", "labels")
        .order_by(orderBy, "-created_at")
        .filter(**filters)
        .distinct()
    )

    return list(epics)


@sync_to_async
def get_epic(workspace_slug: str, project_id: str, epic_id: str, archived_filter: Optional[ArchivedFilter] = None):
    """
    Get the epic for the given project and epic id
    """
    base_query = epic_base_query(workspace_slug=workspace_slug, project_id=project_id, archived_filter=archived_filter)

    try:
        return base_query.get(id=epic_id)
    except Issue.DoesNotExist:
        message = "Epic not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


def get_epic_stats_count(
    user_id: Union[str, strawberry.ID],
    workspace_id: Union[str, strawberry.ID],
    workspace_slug: str,
    project_id: Union[str, strawberry.ID],
    epic_id: Union[str, strawberry.ID],
) -> EpicStatsType:
    sub_work_items_count = Issue.objects.filter(
        workspace_id=workspace_id,
        project_id=project_id,
        parent_id=epic_id,
    ).count()
    attachments_count = FileAsset.objects.filter(
        entity_type=FileAssetEntityType.ISSUE_ATTACHMENT.value,
        issue_id=epic_id,
    ).count()
    relations_count = IssueRelation.objects.filter(Q(issue_id=epic_id) | Q(related_issue_id=epic_id)).count()
    links_count = IssueLink.objects.filter(issue_id=epic_id).count()

    pages_count = 0
    if is_epic_page_feature_flagged(workspace_slug=workspace_slug, user_id=user_id, raise_exception=False):
        pages_count = get_epic_pages_count(workspace_id=workspace_id, project_id=project_id, epic_id=epic_id)

    return EpicStatsType(
        attachments=attachments_count,
        relations=relations_count,
        sub_work_items=sub_work_items_count,
        links=links_count,
        pages=pages_count,
    )


@sync_to_async
def get_epic_stats_count_async(
    user_id: Union[str, strawberry.ID],
    workspace_id: Union[str, strawberry.ID],
    workspace_slug: str,
    project_id: Union[str, strawberry.ID],
    epic_id: Union[str, strawberry.ID],
) -> EpicStatsType:
    return get_epic_stats_count(
        user_id=user_id,
        workspace_id=workspace_id,
        workspace_slug=workspace_slug,
        project_id=project_id,
        epic_id=epic_id,
    )


def get_work_item_ids(filters: Optional[dict] = {}) -> list[str]:
    return list(Issue.objects.filter(**filters).only("id").values_list("id", flat=True))


@sync_to_async
def get_work_item_ids_async(filters: Optional[dict] = {}) -> list[str]:
    return get_work_item_ids(filters=filters)


def update_work_item_parent_id(
    work_item_ids: list[Union[str, strawberry.ID]], parent_id: Optional[Union[str, strawberry.ID]] = None
):
    Issue.objects.filter(id__in=work_item_ids).update(parent_id=parent_id)


@sync_to_async
def update_work_item_parent_id_async(
    work_item_ids: list[Union[str, strawberry.ID]], parent_id: Optional[Union[str, strawberry.ID]] = None
):
    return update_work_item_parent_id(work_item_ids=work_item_ids, parent_id=parent_id)
