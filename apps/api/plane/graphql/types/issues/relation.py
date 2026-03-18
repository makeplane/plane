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
from enum import Enum
from typing import Optional

# Third-party library imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Count, Q

# Module Imports
from plane.db.models import Issue
from plane.graphql.types.epics.base import EpicAnalyticsType
from plane.graphql.utils.work_item import get_all_related_work_items


class WorkItemRelationTypes(Enum):
    BLOCKING = "blocking"
    BLOCKED_BY = "blocked_by"
    START_AFTER = "start_after"
    START_BEFORE = "start_before"
    FINISH_AFTER = "finish_after"
    FINISH_BEFORE = "finish_before"
    DUPLICATE = "duplicate"
    RELATES_TO = "relates_to"
    IMPLEMENTS = "implements"
    IMPLEMENTED_BY = "implemented_by"

    def __str__(self):
        return self.name.lower()


@strawberry.type
class WorkItemRelationWorkItemType:
    id: strawberry.ID
    name: str
    priority: str
    sequence_id: int

    @strawberry.field
    def project(self) -> strawberry.ID:
        return self.project_id

    @strawberry.field
    def project_identifier(self) -> str:
        return self.project.identifier

    @strawberry.field
    def state(self) -> strawberry.ID:
        return self.state_id

    @strawberry.field
    async def assignees(self) -> Optional[list[strawberry.ID]]:
        return self.assignee_ids if self.assignee_ids and len(self.assignee_ids) > 0 else None

    @strawberry.field
    def is_epic(self) -> bool:
        return self.type.is_epic if self.type and self.type.is_epic else False

    @strawberry.field
    async def analytics(self) -> EpicAnalyticsType:
        is_epic = self.type.is_epic if self.type and self.type.is_epic else False
        if not is_epic:
            return EpicAnalyticsType(
                backlog=None,
                unstarted=None,
                started=None,
                completed=None,
                cancelled=None,
            )

        # use pre-computed analytics if available (from batch query)
        if hasattr(self, "_precomputed_analytics") and self._precomputed_analytics:
            analytics = self._precomputed_analytics
            return EpicAnalyticsType(
                backlog=analytics.get("backlog"),
                unstarted=analytics.get("unstarted"),
                started=analytics.get("started"),
                completed=analytics.get("completed"),
                cancelled=analytics.get("cancelled"),
            )

        # fallback to individual query (for non-batched contexts)
        sub_work_items = await sync_to_async(lambda: get_all_related_work_items(work_item_id=self.id))()

        sub_work_items_count = len(sub_work_items)

        if sub_work_items_count == 0:
            return EpicAnalyticsType(
                backlog=None,
                unstarted=None,
                started=None,
                completed=None,
                cancelled=None,
            )

        issues = await sync_to_async(
            lambda: Issue.issue_objects.filter(id__in=sub_work_items)
            .only("id", "state")
            .aggregate(
                backlog_issues=Count("id", filter=Q(state__group="backlog")),
                unstarted_issues=Count("id", filter=Q(state__group="unstarted")),
                started_issues=Count("id", filter=Q(state__group="started")),
                completed_issues=Count("id", filter=Q(state__group="completed")),
                cancelled_issues=Count("id", filter=Q(state__group="cancelled")),
            )
        )()

        backlog = issues["backlog_issues"] if issues["backlog_issues"] else None
        unstarted = issues["unstarted_issues"] if issues["unstarted_issues"] else None
        started = issues["started_issues"] if issues["started_issues"] else None
        completed = issues["completed_issues"] if issues["completed_issues"] else None
        cancelled = issues["cancelled_issues"] if issues["cancelled_issues"] else None

        return EpicAnalyticsType(
            backlog=backlog,
            unstarted=unstarted,
            started=started,
            completed=completed,
            cancelled=cancelled,
        )


@strawberry.type
class IssueRelationType:
    blocking: list[WorkItemRelationWorkItemType]
    blocked_by: list[WorkItemRelationWorkItemType]
    duplicate: list[WorkItemRelationWorkItemType]
    relates_to: list[WorkItemRelationWorkItemType]
    start_after: list[WorkItemRelationWorkItemType]
    start_before: list[WorkItemRelationWorkItemType]
    finish_after: list[WorkItemRelationWorkItemType]
    finish_before: list[WorkItemRelationWorkItemType]
    implements: Optional[list[WorkItemRelationWorkItemType]] = None
    implemented_by: Optional[list[WorkItemRelationWorkItemType]] = None
