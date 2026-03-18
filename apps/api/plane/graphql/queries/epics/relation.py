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
from typing import Any, Optional

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
from plane.db.models import (
    DEFAULT_DUPLICATE_DEFINITION,
    DEFAULT_RELATES_TO_DEFINITION,
    DEFAULT_IMPLEMENTS_DEFINITION,
    Issue,
    IssueRelation,
    RelationCategory,
    WorkItemRelationDefinition,
)
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


# **************** Helpers ****************
def _aggregate_relation_ids(field: str, **filter_kwargs: Any):
    return Coalesce(
        ArrayAgg(field, filter=Q(**filter_kwargs), distinct=True),
        Value([], output_field=ArrayField(UUIDField())),
    )


def _build_relation_list(
    work_items: dict[str, dict], work_item_ids: list[str], relation_type_value: WorkItemRelationTypes
) -> list[dict]:
    result = []

    for work_item_id in work_item_ids or []:
        work_item = work_items.get(str(work_item_id))
        if work_item:
            work_item_copy = copy.copy(work_item)
            work_item_copy.relation_type = relation_type_value
            result.append(work_item_copy)

    return result


# **************** Async Functions ****************
@sync_to_async
def _get_work_item_relation_definition(
    workspace_slug: str,
) -> tuple[list[dict], list[str], dict[str, dict]]:
    relation_definitions = (
        WorkItemRelationDefinition.objects.filter(workspace__slug=workspace_slug, is_active=True)
        .only("id", "outward", "inward")
        .values("id", "outward", "inward")
    )

    relation_definitions = list(relation_definitions)
    relation_definition_ids = [d["id"] for d in relation_definitions]
    relation_definition_by_id = {d["id"]: d for d in relation_definitions}

    return relation_definitions, relation_definition_ids, relation_definition_by_id


@sync_to_async
def _get_work_item_relations_by_definition_ids(
    workspace_slug: str, relation_definition_ids: list[str], work_item_id: str
) -> list[dict]:
    relations = (
        IssueRelation.objects.filter(
            workspace__slug=workspace_slug,
            category=RelationCategory.RELATION,
            definition_id__in=relation_definition_ids,
        )
        .filter(Q(issue_id=work_item_id) | Q(related_issue_id=work_item_id))
        .values("definition_id", "issue_id", "related_issue_id")
    )

    relations = list(relations)

    return relations


@sync_to_async
def _get_work_items_by_ids(workspace_slug: str, work_item_ids: Optional[list[str]] = None) -> dict[str, Issue]:
    work_item_required_fields = ["id", "name", "priority", "sequence_id", "project", "state", "type"]

    if work_item_ids is None:
        return {}

    work_items_query = (
        work_item_base_query(workspace_slug=workspace_slug, archived_filter=ArchivedFilterTypes.INCLUDE)
        .filter(id__in=work_item_ids)
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

    work_items = list(work_items_query)
    if not work_items:
        return {}

    work_items_by_id_map = {}
    for work_item in work_items:
        work_items_by_id_map[str(work_item.id)] = copy.copy(work_item)

    return work_items_by_id_map


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
            .filter(category=RelationCategory.DEPENDENCY)
            .filter(project_teamspace_filter.query)
            .filter(Q(issue_id=epic_id) | Q(related_issue_id=epic_id))
            .order_by("-created_at")
            .distinct()
        )

        # build aggregation kwargs for single query for all relation types
        aggregation_kwargs = {
            # blocking: BLOCKED_BY where related_issue_id=issue → get issue_id
            "blocking_work_item_ids": _aggregate_relation_ids(
                "issue_id", relation_type=WorkItemRelationTypes.BLOCKED_BY.value, related_issue_id=epic_id
            ),
            # blocked_by: BLOCKED_BY where issue_id=issue → get related_issue_id
            "blocked_by_work_item_ids": _aggregate_relation_ids(
                "related_issue_id", relation_type=WorkItemRelationTypes.BLOCKED_BY.value, issue_id=epic_id
            ),
        }

        # add timeline dependency aggregations if feature flag is enabled
        if timeline_dependency_feature_flagged:
            aggregation_kwargs.update(
                {
                    # start_after: START_BEFORE where related_issue_id=issue → get issue_id
                    "start_after_work_item_ids": _aggregate_relation_ids(
                        "issue_id", relation_type=WorkItemRelationTypes.START_BEFORE.value, related_issue_id=epic_id
                    ),
                    # start_before: START_BEFORE where issue_id=issue → get related_issue_id
                    "start_before_work_item_ids": _aggregate_relation_ids(
                        "related_issue_id", relation_type=WorkItemRelationTypes.START_BEFORE.value, issue_id=epic_id
                    ),
                    # finish_after: FINISH_BEFORE where related_issue_id=issue → get issue_id
                    "finish_after_work_item_ids": _aggregate_relation_ids(
                        "issue_id", relation_type=WorkItemRelationTypes.FINISH_BEFORE.value, related_issue_id=epic_id
                    ),
                    # finish_before: FINISH_BEFORE where issue_id=issue → get related_issue_id
                    "finish_before_work_item_ids": _aggregate_relation_ids(
                        "related_issue_id", relation_type=WorkItemRelationTypes.FINISH_BEFORE.value, issue_id=epic_id
                    ),
                }
            )

        # execute single aggregation query
        relation_ids = await sync_to_async(lambda: epic_work_item_relation_query.aggregate(**aggregation_kwargs))()

        # extract IDs from aggregation result
        blocking_work_item_ids = relation_ids.get("blocking_work_item_ids", [])
        blocked_by_work_item_ids = relation_ids.get("blocked_by_work_item_ids", [])

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
        work_item_ids = set()
        work_item_ids.update(blocking_work_item_ids or [])
        work_item_ids.update(blocked_by_work_item_ids or [])
        work_item_ids.update(start_after_work_item_ids or [])
        work_item_ids.update(start_before_work_item_ids or [])
        work_item_ids.update(finish_after_work_item_ids or [])
        work_item_ids.update(finish_before_work_item_ids or [])

        # ******************** Related to work items definition and relations ********************
        # fetch related to work items definition and relations
        (
            relation_definitions,
            relation_definition_ids,
            relation_definition_by_id,
        ) = await _get_work_item_relation_definition(
            workspace_slug=slug,
        )

        # fetch related to work items relations by definition IDs
        work_item_relations = await _get_work_item_relations_by_definition_ids(
            workspace_slug=slug,
            relation_definition_ids=relation_definition_ids,
            work_item_id=str(epic_id),
        )

        # Group related to work item IDs by relation label (outward / inward from current item's perspective)
        work_item_ids_by_relation = {}
        for relation_definition in relation_definitions:
            work_item_ids_by_relation[relation_definition["outward"]] = []
            work_item_ids_by_relation[relation_definition["inward"]] = []

        # Add related to work item IDs to the work item IDs set
        for relation in work_item_relations:
            relation_definition = relation_definition_by_id.get(relation["definition_id"])
            if not relation_definition:
                continue

            if str(relation["issue_id"]) == str(epic_id):
                work_item_ids_by_relation[relation_definition["outward"]].append(relation["related_issue_id"])
            else:
                work_item_ids_by_relation[relation_definition["inward"]].append(relation["issue_id"])

        relation_work_item_ids = {uid for ids in work_item_ids_by_relation.values() for uid in ids}

        work_item_ids.update(relation_work_item_ids)
        # ******************** Related to work items definition and relations ********************

        # fetch all work items in a single query
        work_item_ids = list([str(work_item_id) for work_item_id in work_item_ids])

        work_items = await _get_work_items_by_ids(workspace_slug=slug, work_item_ids=work_item_ids)

        # build all relation lists from fetched work items
        blocking_work_items = _build_relation_list(
            work_items=work_items,
            work_item_ids=blocking_work_item_ids,
            relation_type_value=WorkItemRelationTypes.BLOCKING.value,
        )
        blocked_by_work_items = _build_relation_list(
            work_items=work_items,
            work_item_ids=blocked_by_work_item_ids,
            relation_type_value=WorkItemRelationTypes.BLOCKED_BY.value,
        )
        start_after_work_items = _build_relation_list(
            work_items=work_items,
            work_item_ids=start_after_work_item_ids,
            relation_type_value=WorkItemRelationTypes.START_AFTER.value,
        )
        start_before_work_items = _build_relation_list(
            work_items=work_items,
            work_item_ids=start_before_work_item_ids,
            relation_type_value=WorkItemRelationTypes.START_BEFORE.value,
        )
        finish_after_work_items = _build_relation_list(
            work_items=work_items,
            work_item_ids=finish_after_work_item_ids,
            relation_type_value=WorkItemRelationTypes.FINISH_AFTER.value,
        )
        finish_before_work_items = _build_relation_list(
            work_items=work_items,
            work_item_ids=finish_before_work_item_ids,
            relation_type_value=WorkItemRelationTypes.FINISH_BEFORE.value,
        )

        response_data = {
            relation_type: _build_relation_list(
                work_items=work_items, work_item_ids=ids, relation_type_value=relation_type
            )
            for relation_type, ids in work_item_ids_by_relation.items()
        }

        relation_response = EpicRelationType(
            blocking=blocking_work_items,
            blocked_by=blocked_by_work_items,
            start_after=start_after_work_items,
            start_before=start_before_work_items,
            finish_after=finish_after_work_items,
            finish_before=finish_before_work_items,
            duplicate=response_data.get(DEFAULT_DUPLICATE_DEFINITION["outward"], []),
            relates_to=response_data.get(DEFAULT_RELATES_TO_DEFINITION["outward"], []),
            implements=response_data.get(DEFAULT_IMPLEMENTS_DEFINITION["outward"], []),
            implemented_by=response_data.get(DEFAULT_IMPLEMENTS_DEFINITION["inward"], []),
        )

        return relation_response
