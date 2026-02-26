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
import copy

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Q, UUIDField, Value
from django.db.models.functions import Coalesce

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import IssueRelation
from plane.graphql.helpers import (
    get_epic,
    get_project,
    get_workspace_async,
    is_epic_feature_flagged,
    is_project_epics_enabled,
    is_timeline_dependency_feature_flagged_async,
    work_item_base_query,
)
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.epics.relation import EpicRelationType
from plane.graphql.types.issues.relation import WorkItemRelationTypes
from plane.graphql.utils.archive import ArchivedFilterTypes


@strawberry.type
class EpicRelationQuery:
    @strawberry.field(extensions=[PermissionExtension(permissions=[ProjectBasePermission()])])
    async def epic_relation(self, info: Info, slug: str, project: str, epic: str) -> EpicRelationType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace_async(slug=slug)
        workspace_slug = str(workspace.slug)

        # get the project
        project = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project.id)

        # get the epic work items
        epic_details = await get_epic(workspace_slug=workspace_slug, project_id=project_id, epic_id=epic)
        epic_id = str(epic_details.id)

        # check if the timeline dependency feature flag is enabled
        timeline_dependency_feature_flagged = await is_timeline_dependency_feature_flagged_async(
            user_id=user_id,
            workspace_slug=slug,
            raise_exception=False,
        )

        # get the project teamspace filter
        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=workspace_slug,
        )

        # construct the epic work item relation query
        epic_work_item_relation_query = (
            IssueRelation.objects.filter(workspace__slug=workspace_slug)
            .filter(project_teamspace_filter.query)
            .filter(Q(issue_id=epic_id) | Q(related_issue_id=epic_id))
            .order_by("-created_at")
            .distinct()
        )

        # build aggregation kwargs for single query
        aggregation_kwargs = {
            # blocking: BLOCKED_BY where related_issue_id=issue → get issue_id
            "blocking_work_item_ids": Coalesce(
                ArrayAgg(
                    "issue_id",
                    filter=Q(relation_type=WorkItemRelationTypes.BLOCKED_BY.value, related_issue_id=epic_id),
                    distinct=True,
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            # blocked_by: BLOCKED_BY where issue_id=issue → get related_issue_id
            "blocked_by_work_item_ids": Coalesce(
                ArrayAgg(
                    "related_issue_id",
                    filter=Q(relation_type=WorkItemRelationTypes.BLOCKED_BY.value, issue_id=epic_id),
                    distinct=True,
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            # duplicate: DUPLICATE from both directions combined
            "duplicate_work_item_ids": Coalesce(
                ArrayAgg(
                    "related_issue_id",
                    filter=Q(relation_type=WorkItemRelationTypes.DUPLICATE.value, issue_id=epic_id),
                    distinct=True,
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            "duplicate_work_item_ids_related": Coalesce(
                ArrayAgg(
                    "issue_id",
                    filter=Q(relation_type=WorkItemRelationTypes.DUPLICATE.value, related_issue_id=epic_id),
                    distinct=True,
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            # relates_to: RELATES_TO from both directions combined
            "relates_to_work_item_ids": Coalesce(
                ArrayAgg(
                    "related_issue_id",
                    filter=Q(relation_type=WorkItemRelationTypes.RELATES_TO.value, issue_id=epic_id),
                    distinct=True,
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            "relates_to_work_item_ids_related": Coalesce(
                ArrayAgg(
                    "issue_id",
                    filter=Q(relation_type=WorkItemRelationTypes.RELATES_TO.value, related_issue_id=epic_id),
                    distinct=True,
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            # implements: IMPLEMENTED_BY where issue_id=issue → get related_issue_id
            "implements_work_item_ids": Coalesce(
                ArrayAgg(
                    "related_issue_id",
                    filter=Q(relation_type=WorkItemRelationTypes.IMPLEMENTED_BY.value, issue_id=epic_id),
                    distinct=True,
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            # implemented_by: IMPLEMENTED_BY where related_issue_id=issue → get issue_id
            "implemented_by_work_item_ids": Coalesce(
                ArrayAgg(
                    "issue_id",
                    filter=Q(relation_type=WorkItemRelationTypes.IMPLEMENTED_BY.value, related_issue_id=epic_id),
                    distinct=True,
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
        }

        # check if the timeline dependency feature flag is enabled
        timeline_dependency_feature_flagged = await is_timeline_dependency_feature_flagged_async(
            user_id=user_id,
            workspace_slug=slug,
            raise_exception=False,
        )

        # add timeline dependency aggregations if feature flag is enabled
        if timeline_dependency_feature_flagged:
            aggregation_kwargs.update(
                {
                    # start_after: START_BEFORE where related_issue_id=issue → get issue_id
                    "start_after_work_item_ids": Coalesce(
                        ArrayAgg(
                            "issue_id",
                            filter=Q(relation_type=WorkItemRelationTypes.START_BEFORE.value, related_issue_id=epic_id),
                            distinct=True,
                        ),
                        Value([], output_field=ArrayField(UUIDField())),
                    ),
                    # start_before: START_BEFORE where issue_id=issue → get related_issue_id
                    "start_before_work_item_ids": Coalesce(
                        ArrayAgg(
                            "related_issue_id",
                            filter=Q(relation_type=WorkItemRelationTypes.START_BEFORE.value, issue_id=epic_id),
                            distinct=True,
                        ),
                        Value([], output_field=ArrayField(UUIDField())),
                    ),
                    # finish_after: FINISH_BEFORE where related_issue_id=issue → get issue_id
                    "finish_after_work_item_ids": Coalesce(
                        ArrayAgg(
                            "issue_id",
                            filter=Q(relation_type=WorkItemRelationTypes.FINISH_BEFORE.value, related_issue_id=epic_id),
                            distinct=True,
                        ),
                        Value([], output_field=ArrayField(UUIDField())),
                    ),
                    # finish_before: FINISH_BEFORE where issue_id=issue → get related_issue_id
                    "finish_before_work_item_ids": Coalesce(
                        ArrayAgg(
                            "related_issue_id",
                            filter=Q(relation_type=WorkItemRelationTypes.FINISH_BEFORE.value, issue_id=epic_id),
                            distinct=True,
                        ),
                        Value([], output_field=ArrayField(UUIDField())),
                    ),
                }
            )

        # execute single aggregation query
        relation_ids = await sync_to_async(lambda: epic_work_item_relation_query.aggregate(**aggregation_kwargs))()

        # extract IDs from aggregation result
        blocking_work_item_ids = relation_ids.get("blocking_work_item_ids", [])
        blocked_by_work_item_ids = relation_ids.get("blocked_by_work_item_ids", [])
        duplicate_work_item_ids = list(
            set(
                relation_ids.get("duplicate_work_item_ids", [])
                + relation_ids.get("duplicate_work_item_ids_related", [])
            )
        )
        relates_work_item_ids = list(
            set(
                relation_ids.get("relates_to_work_item_ids", [])
                + relation_ids.get("relates_to_work_item_ids_related", [])
            )
        )
        implements_work_item_ids = relation_ids.get("implements_work_item_ids", [])
        implemented_by_work_item_ids = relation_ids.get("implemented_by_work_item_ids", [])

        if timeline_dependency_feature_flagged:
            start_after_work_item_ids = relation_ids.get("start_after_work_item_ids", [])
            start_before_work_item_ids = relation_ids.get("start_before_work_item_ids", [])
            finish_after_work_item_ids = relation_ids.get("finish_after_work_item_ids", [])
            finish_before_work_item_ids = relation_ids.get("finish_before_work_item_ids", [])
        else:
            start_after_work_item_ids = []
            start_before_work_item_ids = []
            finish_after_work_item_ids = []
            finish_before_work_item_ids = []

        # collect all unique work item IDs to fetch in a single query
        all_work_item_ids = set()
        all_work_item_ids.update(blocking_work_item_ids or [])
        all_work_item_ids.update(blocked_by_work_item_ids or [])
        all_work_item_ids.update(duplicate_work_item_ids or [])
        all_work_item_ids.update(relates_work_item_ids or [])
        all_work_item_ids.update(start_after_work_item_ids or [])
        all_work_item_ids.update(start_before_work_item_ids or [])
        all_work_item_ids.update(finish_after_work_item_ids or [])
        all_work_item_ids.update(finish_before_work_item_ids or [])
        all_work_item_ids.update(implements_work_item_ids or [])
        all_work_item_ids.update(implemented_by_work_item_ids or [])

        # construct the work item required fields
        work_item_required_fields = ["id", "name", "priority", "sequence_id", "project", "state", "type"]

        # fetch all work items in a single query
        # intentionally using the work_item_base_query instead of epic_base_query to avoid N+1 queries
        # TODO: Need to update to global work item base query to access epics
        if all_work_item_ids:
            work_item_query = (
                work_item_base_query(workspace_slug=slug, archived_filter=ArchivedFilterTypes.INCLUDE)
                .filter(id__in=all_work_item_ids)
                .select_related("project", "type")
                .prefetch_related("assignees")
                .only(*work_item_required_fields)
                .annotate(
                    assignee_ids=Coalesce(
                        ArrayAgg(
                            "assignees__id",
                            distinct=True,
                            filter=Q(
                                ~Q(assignees__id__isnull=True)
                                & Q(assignees__member_project__is_active=True)
                                & Q(issue_assignee__deleted_at__isnull=True)
                            ),
                        ),
                        Value([], output_field=ArrayField(UUIDField())),
                    ),
                )
            )
            all_work_items_list = await sync_to_async(list)(work_item_query)
            work_items_by_id = {str(item.id): item for item in all_work_items_list}

            # TODO: Pre-compute analytics for issues to avoid N+1 queries
        else:
            work_items_by_id = {}

        # helper to build work items list with relation_type
        def build_relation_list(ids, relation_type_value):
            result = []
            for work_item_id in ids or []:
                item = work_items_by_id.get(str(work_item_id))
                if item:
                    item_copy = copy.copy(item)
                    item_copy.relation_type = relation_type_value
                    result.append(item_copy)
            return result

        # build all relation lists from fetched work items
        blocking_work_items = build_relation_list(blocking_work_item_ids, WorkItemRelationTypes.BLOCKING.value)
        blocked_by_work_items = build_relation_list(blocked_by_work_item_ids, WorkItemRelationTypes.BLOCKED_BY.value)
        duplicate_work_items = build_relation_list(duplicate_work_item_ids, WorkItemRelationTypes.DUPLICATE.value)
        relates_to_work_items = build_relation_list(relates_work_item_ids, WorkItemRelationTypes.RELATES_TO.value)
        start_after_work_items = build_relation_list(start_after_work_item_ids, WorkItemRelationTypes.START_AFTER.value)
        start_before_work_items = build_relation_list(
            start_before_work_item_ids, WorkItemRelationTypes.START_BEFORE.value
        )
        finish_after_work_items = build_relation_list(
            finish_after_work_item_ids, WorkItemRelationTypes.FINISH_AFTER.value
        )
        finish_before_work_items = build_relation_list(
            finish_before_work_item_ids, WorkItemRelationTypes.FINISH_BEFORE.value
        )
        implements_work_items = build_relation_list(implements_work_item_ids, WorkItemRelationTypes.IMPLEMENTS.value)
        implemented_by_work_items = build_relation_list(
            implemented_by_work_item_ids, WorkItemRelationTypes.IMPLEMENTED_BY.value
        )

        relation_response = EpicRelationType(
            blocking=blocking_work_items,
            blocked_by=blocked_by_work_items,
            duplicate=duplicate_work_items,
            relates_to=relates_to_work_items,
            start_after=start_after_work_items,
            start_before=start_before_work_items,
            finish_after=finish_after_work_items,
            finish_before=finish_before_work_items,
            implements=implements_work_items if len(implements_work_item_ids) > 0 else None,
            implemented_by=implemented_by_work_items if len(implemented_by_work_item_ids) > 0 else None,
        )

        return relation_response
