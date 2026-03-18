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
import re
from typing import Optional

# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q, QuerySet

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import (
    DEFAULT_DUPLICATE_DEFINITION,
    DEFAULT_IMPLEMENTS_DEFINITION,
    DEFAULT_RELATES_TO_DEFINITION,
    Issue,
    IssueRelation,
    RelationCategory,
)
from plane.graphql.helpers import is_epic_feature_flagged, is_project_epics_enabled
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.intake.base import IntakeWorkItemStatusType
from plane.graphql.types.issues.base import IssueLiteType
from plane.graphql.types.issues.relation import WorkItemRelationTypes
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate


@sync_to_async
def get_issue_details(issue_id):
    issue = Issue.objects.get(id=issue_id)
    return issue


@sync_to_async
def handle_work_item_relation_issues(
    workspace_slug: str, work_item_id: str, work_item_queryset: QuerySet, relation_type: WorkItemRelationTypes = None
):
    def _construct_work_item_q(
        work_item_id: str, related_work_item_ids: list[str, list[str]], work_item_queryset: QuerySet
    ):
        # flatten related work item ids
        related_work_item_ids = [str(item) for sublist in related_work_item_ids for item in sublist]
        related_work_item_ids.append(work_item_id)
        related_work_item_ids = list(set(related_work_item_ids))

        # exclude related work item ids from issues and epics query set
        work_item_queryset = work_item_queryset.exclude(pk__in=related_work_item_ids)

        # return issues and epics query set excluding related work item ids
        return work_item_queryset

    if relation_type in [
        WorkItemRelationTypes.BLOCKING.value,
        WorkItemRelationTypes.BLOCKED_BY.value,
        WorkItemRelationTypes.START_AFTER.value,
        WorkItemRelationTypes.START_BEFORE.value,
        WorkItemRelationTypes.FINISH_AFTER.value,
        WorkItemRelationTypes.FINISH_BEFORE.value,
    ]:
        related_work_item_ids = (
            IssueRelation.objects.filter(
                Q(issue_id=work_item_id) | Q(related_issue_id=work_item_id),
                workspace__slug=workspace_slug,
                category=RelationCategory.DEPENDENCY,
                deleted_at__isnull=True,
            )
            .values_list("issue_id", "related_issue_id")
            .distinct()
        )

        return _construct_work_item_q(
            work_item_id=work_item_id,
            related_work_item_ids=related_work_item_ids,
            work_item_queryset=work_item_queryset,
        )

    elif relation_type in [WorkItemRelationTypes.IMPLEMENTS.value, WorkItemRelationTypes.IMPLEMENTED_BY.value]:
        actual_relation_type = (
            DEFAULT_IMPLEMENTS_DEFINITION["outward"]
            if relation_type == WorkItemRelationTypes.IMPLEMENTS.value
            else DEFAULT_IMPLEMENTS_DEFINITION["inward"]
            if relation_type == WorkItemRelationTypes.IMPLEMENTED_BY.value
            else None
        )
        if not actual_relation_type:
            return work_item_queryset

        # get related work item ids
        related_work_item_ids = (
            IssueRelation.objects.filter(Q(related_issue_id=work_item_id) | Q(issue_id=work_item_id))
            .filter(Q(definition__inward=actual_relation_type) | Q(definition__outward=actual_relation_type))
            .filter(category=RelationCategory.RELATION.value)
            .values_list("issue_id", "related_issue_id")
            .distinct()
        )

        return _construct_work_item_q(
            work_item_id=work_item_id,
            related_work_item_ids=related_work_item_ids,
            work_item_queryset=work_item_queryset,
        )
    elif relation_type in [WorkItemRelationTypes.DUPLICATE.value, WorkItemRelationTypes.RELATES_TO.value]:
        actual_relation_type = (
            DEFAULT_DUPLICATE_DEFINITION["inward"]
            if relation_type == WorkItemRelationTypes.DUPLICATE.value
            else DEFAULT_RELATES_TO_DEFINITION["inward"]
            if relation_type == WorkItemRelationTypes.RELATES_TO.value
            else None
        )
        if not actual_relation_type:
            return work_item_queryset

        # get related work item ids
        related_work_item_ids = (
            IssueRelation.objects.filter(Q(related_issue_id=work_item_id) | Q(issue_id=work_item_id))
            .filter(Q(definition__inward=actual_relation_type) | Q(definition__outward=actual_relation_type))
            .filter(category=RelationCategory.RELATION.value)
            .values_list("issue_id", "related_issue_id")
            .distinct()
        )

        return _construct_work_item_q(
            work_item_id=work_item_id,
            related_work_item_ids=related_work_item_ids,
            work_item_queryset=work_item_queryset,
        )
    else:
        return work_item_queryset


@strawberry.type
class IssuesSearchQuery:
    # getting issues which are not related
    @strawberry.field(extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])])

    # getting issue relation issues
    async def issuesSearch(
        self,
        info: Info,
        slug: str,
        project: Optional[strawberry.ID] = None,
        issue: Optional[strawberry.ID] = None,
        cursor: Optional[str] = None,
        search: Optional[str] = None,
        relationType: Optional[bool] = False,
        subIssues: Optional[bool] = False,
        is_epic_related: Optional[bool] = False,
        is_intake_related: Optional[bool] = False,
        relationTypeValue: Optional[WorkItemRelationTypes] = None,
    ) -> PaginatorResponse[IssueLiteType]:
        user = info.context.user
        user_id = str(user.id)

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )

        issue_queryset = (
            Issue.objects.filter(workspace__slug=slug)
            # project teamspace filters
            .filter(project_teamspace_filter.query)
            # issue intake filters
            .filter(
                Q(issue_intake__status=1)
                | Q(issue_intake__status=-1)
                | Q(issue_intake__status=2)
                | Q(issue_intake__isnull=True)
            )
            # old intake filters
            .filter(state__is_triage=False)
            # archived filters
            .filter(archived_at__isnull=True)
            # deleted filters
            .filter(deleted_at__isnull=True)
            # draft filters
            .filter(is_draft=False)
        )

        if is_intake_related:
            issue_queryset = issue_queryset.exclude(issue_intake__status=IntakeWorkItemStatusType.DUPLICATE.value)

        # epic filters
        is_epics_required = False
        epic_feature_flagged = False
        epic_project_enabled = False
        if is_epic_related:
            epic_feature_flagged = await is_epic_feature_flagged(
                user_id=user_id, workspace_slug=slug, raise_exception=False
            )
            if epic_feature_flagged:
                epic_project_enabled = await is_project_epics_enabled(
                    workspace_slug=slug, project_id=project, raise_exception=False
                )
                if epic_project_enabled:
                    is_epics_required = True

        if is_epics_required is False:
            issue_queryset = issue_queryset.filter(Q(type__is_epic=False) | Q(type__isnull=True))

        # workspace issues
        if project:
            issue_queryset = issue_queryset.filter(project_id=project)

        # issue relation issues
        if relationType and issue:
            if relationTypeValue is None:
                issue_queryset = issue_queryset.filter(
                    ~Q(pk=issue),
                    ~Q(
                        issue_related__issue_id=issue,
                        issue_related__deleted_at__isnull=True,
                    ),
                    ~Q(
                        issue_relation__related_issue_id=issue,
                        issue_related__deleted_at__isnull=True,
                    ),
                )
            else:
                issue_queryset = await handle_work_item_relation_issues(
                    workspace_slug=slug,
                    work_item_id=str(issue),
                    work_item_queryset=issue_queryset,
                    relation_type=relationTypeValue,
                )

        # sub issues
        if subIssues and issue:
            current_issue = await get_issue_details(issue)
            issue_queryset = issue_queryset.filter(Q(parent__isnull=True), ~Q(pk=issue))
            if current_issue.parent_id:
                issue_queryset = issue_queryset.filter(~Q(pk=current_issue.parent_id))

        # apply search filter
        q = Q()
        if search:
            fields = ["name", "sequence_id", "project__identifier"]
            for field in fields:
                if field == "sequence_id":
                    # Match whole integers only (exclude decimal numbers)
                    sequences = re.findall(r"\b\d+\b", search)
                    for sequence_id in sequences:
                        q |= Q(**{"sequence_id": sequence_id})
                else:
                    q |= Q(**{f"{field}__icontains": search})

        issues = await sync_to_async(
            lambda: list(
                issue_queryset.filter(q)
                .distinct()
                .values(
                    "id",
                    "sequence_id",
                    "name",
                    "project",
                    "project__identifier",
                    "type__is_epic",
                )
            )
        )()

        for issue in issues:
            issue["project_identifier"] = issue["project__identifier"]
            del issue["project__identifier"]

            issue["is_epic"] = issue["type__is_epic"] and epic_project_enabled or False
            del issue["type__is_epic"]

        listed_issues: list[IssueLiteType] = [IssueLiteType(**issue) for issue in issues]

        return paginate(results_object=listed_issues, cursor=cursor)
