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
import json
from typing import Any, Optional, Union

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import F, Q, UUIDField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

# Third Party imports
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

# Module imports
from plane.permissions import can, WorkitemPermissions
from plane.permissions.definitions import ResourceType
from plane.app.serializers import RelatedWorkItemRelationSerializer, WorkItemRelationSerializer
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import DefaultDependencyKeys, Issue, IssueRelation, RelationCategory, WorkItemRelationDefinition
from plane.utils.host import base_host

# Local imports
from ..base import BaseViewSet

# **************** Constants ****************
WORK_ITEM_LIST_FIELDS = [
    "id",
    "name",
    "state_id",
    "sort_order",
    "priority",
    "sequence_id",
    "project_id",
    "label_ids",
    "assignee_ids",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "type_id",
    "is_epic",
]


# **************** Helpers ****************
def _aggregate_ids(field: str, **filter_kwargs: Any) -> Any:
    return Coalesce(
        ArrayAgg(field, filter=Q(**filter_kwargs), distinct=True),
        Value([], output_field=ArrayField(UUIDField())),
    )


def _fetch_work_item_by_ids(
    workspace_slug: str, work_item_ids: Optional[list[Union[str, UUIDField]]] = None
) -> dict[str, dict]:
    if not work_item_ids:
        return {}

    work_items = (
        Issue.objects.filter(
            workspace__slug=workspace_slug,
            project__deleted_at__isnull=True,
            pk__in=work_item_ids,
            deleted_at__isnull=True,
        )
        .annotate(
            label_ids=Coalesce(
                ArrayAgg(
                    "labels__id",
                    distinct=True,
                    filter=Q(~Q(labels__id__isnull=True) & Q(label_issue__deleted_at__isnull=True)),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
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
        .annotate(is_epic=F("type__is_epic"))
        .values(*WORK_ITEM_LIST_FIELDS)
    )
    return {str(wi["id"]): wi for wi in work_items}


def _work_item_relations_list(
    work_items: dict[str, dict],
    relation_type_value: str,
    work_item_ids: list[str],
) -> list[dict]:
    return [
        {**work_item, "relation_type": relation_type_value}
        for uid in work_item_ids
        if (work_item := work_items.get(str(uid)))
    ]


def _emit_work_item_relation_activity(
    request: Request,
    type: str,
    actor_id: str,
    work_item_id: str,
    project_id: str,
    current_instance: Optional[dict] = None,
    requested_data: Optional[dict] = None,
) -> None:
    issue_activity.delay(
        type=type,
        actor_id=str(actor_id),
        issue_id=str(work_item_id),
        project_id=str(project_id),
        current_instance=current_instance,
        requested_data=json.dumps(requested_data),
        epoch=int(timezone.now().timestamp()),
        notification=True,
        origin=base_host(request=request, is_app=True),
    )


# **************** ViewSets ****************
class IssueRelationViewSet(BaseViewSet):
    """
    Deprecated: Use WorkItemRelationDependencyViewSet and WorkItemRelationRelationViewSet instead.
    """

    use_read_replica = True

    message = "Deprecated this endpoint."

    def list(self, request: Request, slug: str, project_id: str, work_item_id: str) -> Response:
        return Response(status=status.HTTP_400_BAD_REQUEST, data={"message": self.message})

    def create(self, request: Request, slug: str, project_id: str, work_item_id: str) -> Response:
        return Response(status=status.HTTP_200_OK, data={"message": self.message})

    def remove_relation(self, request: Request, slug: str, project_id: str, work_item_id: str) -> Response:
        return Response(status=status.HTTP_200_OK, data={"message": self.message})


class WorkItemRelationDependencyViewSet(BaseViewSet):
    use_read_replica = True

    relation_model = IssueRelation
    relation_definition_model = WorkItemRelationDefinition
    serializer_class = WorkItemRelationSerializer

    @can(WorkitemPermissions.VIEW, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)
    def list(self, request: Request, slug: str, project_id: str, work_item_id: str) -> Response:
        work_item_relation_query_set = IssueRelation.objects.filter(
            category=RelationCategory.DEPENDENCY, workspace__slug=slug
        ).filter(Q(issue_id=work_item_id) | Q(related_issue_id=work_item_id))

        relation_work_item_ids = work_item_relation_query_set.aggregate(
            blocking_ids=_aggregate_ids("issue_id", relation_type="blocked_by", related_issue_id=work_item_id),
            blocked_by_ids=_aggregate_ids("related_issue_id", relation_type="blocked_by", issue_id=work_item_id),
            start_after_ids=_aggregate_ids("issue_id", relation_type="start_before", related_issue_id=work_item_id),
            start_before_ids=_aggregate_ids("related_issue_id", relation_type="start_before", issue_id=work_item_id),
            finish_after_ids=_aggregate_ids("issue_id", relation_type="finish_before", related_issue_id=work_item_id),
            finish_before_ids=_aggregate_ids("related_issue_id", relation_type="finish_before", issue_id=work_item_id),
        )

        # Merge bidirectional relations (duplicate and relates_to are symmetric)
        work_item_ids_by_relation = {
            "blocking": relation_work_item_ids["blocking_ids"],
            "blocked_by": relation_work_item_ids["blocked_by_ids"],
            "start_after": relation_work_item_ids["start_after_ids"],
            "start_before": relation_work_item_ids["start_before_ids"],
            "finish_after": relation_work_item_ids["finish_after_ids"],
            "finish_before": relation_work_item_ids["finish_before_ids"],
        }

        # fetch all work items in a single query
        all_work_item_ids = {uid for ids in work_item_ids_by_relation.values() for uid in ids}

        # fetch all work items by IDs
        work_items = _fetch_work_item_by_ids(workspace_slug=slug, work_item_ids=list(all_work_item_ids))

        # build all relation lists from fetched work items
        response_data = {
            relation_type: _work_item_relations_list(work_items, relation_type, ids)
            for relation_type, ids in work_item_ids_by_relation.items()
        }

        return Response(response_data, status=status.HTTP_200_OK)

    @can(WorkitemPermissions.EDIT, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)
    def create_relation(self, request: Request, slug: str, project_id: str, work_item_id: str) -> Response:
        user_id = request.user.id

        relation_type = request.data.get("relation_type")
        if relation_type is None:
            return Response(
                {"message": "Work item relation type is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        valid_types = [k.value for k in DefaultDependencyKeys]
        if relation_type not in valid_types:
            return Response(
                {"message": "Invalid work item relation type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request_work_item_ids = request.data.get("work_item_ids", [])
        if not request_work_item_ids:
            return Response(
                {"message": "Work items are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        work_item = Issue.objects.filter(pk=work_item_id, workspace__slug=slug).first()
        if work_item is None:
            return Response(
                {"message": "Work item not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        workspace_id = work_item.workspace_id
        project_id = work_item.project_id

        request_work_items = _fetch_work_item_by_ids(workspace_slug=slug, work_item_ids=list(request_work_item_ids))
        if len(request_work_items) != len(request_work_item_ids):
            return Response(
                {"message": "Request work items not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        actual_relation = {
            DefaultDependencyKeys.BLOCKED_BY.value: DefaultDependencyKeys.BLOCKED_BY.value,
            DefaultDependencyKeys.BLOCKING.value: DefaultDependencyKeys.BLOCKED_BY.value,
            DefaultDependencyKeys.START_BEFORE.value: DefaultDependencyKeys.START_BEFORE.value,
            DefaultDependencyKeys.START_AFTER.value: DefaultDependencyKeys.START_BEFORE.value,
            DefaultDependencyKeys.FINISH_BEFORE.value: DefaultDependencyKeys.FINISH_BEFORE.value,
            DefaultDependencyKeys.FINISH_AFTER.value: DefaultDependencyKeys.FINISH_BEFORE.value,
        }.get(relation_type, relation_type)
        is_reverse = relation_type in [
            DefaultDependencyKeys.BLOCKING.value,
            DefaultDependencyKeys.START_AFTER.value,
            DefaultDependencyKeys.FINISH_AFTER.value,
        ]

        self.relation_model.objects.bulk_create(
            [
                self.relation_model(
                    workspace_id=workspace_id,
                    project_id=project_id,
                    category=RelationCategory.DEPENDENCY,
                    relation_type=actual_relation,
                    issue_id=other_id if is_reverse else work_item_id,
                    related_issue_id=work_item_id if is_reverse else other_id,
                    created_by_id=user_id,
                    updated_by_id=user_id,
                )
                for other_id in request_work_item_ids
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        _emit_work_item_relation_activity(
            request=request,
            type="issue_relation.activity.created",
            actor_id=str(user_id),
            work_item_id=str(work_item_id),
            project_id=str(project_id),
            current_instance=None,
            requested_data={"issues": request_work_item_ids, "relation_type": relation_type},
        )

        response_data = [
            {**item, "id": item_id, "relation_type": relation_type} for item_id, item in request_work_items.items()
        ]
        return Response(response_data, status=status.HTTP_201_CREATED)

    @can(WorkitemPermissions.EDIT, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)
    def remove_relation(self, request: Request, slug: str, project_id: str, work_item_id: str) -> Response:
        user_id = request.user.id
        related_work_item_id = request.data.get("work_item_id")
        if related_work_item_id is None:
            return Response({"message": "Related work item id is required"}, status=status.HTTP_400_BAD_REQUEST)

        work_item_relation = (
            self.relation_model.objects.filter(
                workspace__slug=slug,
                category=RelationCategory.DEPENDENCY,
                relation_type__in=[
                    DefaultDependencyKeys.BLOCKED_BY.value,
                    DefaultDependencyKeys.START_BEFORE.value,
                    DefaultDependencyKeys.FINISH_BEFORE.value,
                ],
            )
            .filter(
                Q(issue_id=related_work_item_id, related_issue_id=work_item_id)
                | Q(issue_id=work_item_id, related_issue_id=related_work_item_id)
            )
            .first()
        )
        if work_item_relation is None:
            return Response(
                {"message": "Work item relation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        work_item_relation.delete()

        _emit_work_item_relation_activity(
            request=request,
            type="issue_relation.activity.deleted",
            actor_id=str(user_id),
            work_item_id=str(work_item_id),
            project_id=str(project_id),
            current_instance=None,
            requested_data={"related_issue": related_work_item_id, "relation_type": work_item_relation.relation_type},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkItemRelationRelationViewSet(BaseViewSet):
    """
    List, create, and remove custom work item relations (relates to, duplicates, etc.).

    Relation types are defined per workspace via WorkItemRelationDefinition (outward/inward labels).
    """

    use_read_replica = True

    relation_model = IssueRelation
    relation_definition_model = WorkItemRelationDefinition
    serializer_class = RelatedWorkItemRelationSerializer

    @can(WorkitemPermissions.VIEW, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)
    def list(self, request: Request, slug: str, project_id: str, work_item_id: str) -> Response:
        """Return all custom relations for the work item, grouped by relation label (outward/inward)."""
        relation_definitions = list(
            self.relation_definition_model.objects.filter(workspace__slug=slug, is_active=True).values(
                "id", "outward", "inward"
            )
        )
        relation_definition_ids = [d["id"] for d in relation_definitions]
        relation_definition_by_id = {d["id"]: d for d in relation_definitions}

        # Work item relations with category=relation use definition_id (not relation_type)
        work_item_relations = (
            self.relation_model.objects.filter(
                category=RelationCategory.RELATION,
                definition_id__in=relation_definition_ids,
            )
            .filter(Q(issue_id=work_item_id) | Q(related_issue_id=work_item_id), workspace__slug=slug)
            .values("definition_id", "issue_id", "related_issue_id")
        )

        # Group related work item IDs by relation label (outward / inward from current item's perspective)
        work_item_ids_by_relation = {}
        for relation_definition in relation_definitions:
            work_item_ids_by_relation[relation_definition["outward"]] = []
            work_item_ids_by_relation[relation_definition["inward"]] = []

        for rel in work_item_relations:
            relation_definition = relation_definition_by_id.get(rel["definition_id"])
            if not relation_definition:
                continue

            if rel["issue_id"] == work_item_id:
                work_item_ids_by_relation[relation_definition["outward"]].append(rel["related_issue_id"])
            else:
                work_item_ids_by_relation[relation_definition["inward"]].append(rel["issue_id"])

        all_work_item_ids = {uid for ids in work_item_ids_by_relation.values() for uid in ids}
        work_items = _fetch_work_item_by_ids(workspace_slug=slug, work_item_ids=list(all_work_item_ids))

        response_data = {
            relation_type: _work_item_relations_list(work_items, relation_type, ids)
            for relation_type, ids in work_item_ids_by_relation.items()
        }
        return Response(response_data, status=status.HTTP_200_OK)

    @can(WorkitemPermissions.EDIT, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)
    def create_relation(self, request: Request, slug: str, project_id: str, work_item_id: str) -> Response:
        """Create custom relations between the work item and the given work_item_ids."""
        user_id = request.user.id

        relation_definition_id = request.data.get("relation_definition_id")
        if relation_definition_id is None:
            return Response(
                {"message": "Definition id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        relation_definition_type = request.data.get("relation_definition_type")
        if relation_definition_type is None:
            return Response(
                {"message": "Work item relation type is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request_work_item_ids = request.data.get("work_item_ids", [])
        if not request_work_item_ids:
            return Response(
                {"message": "Work items are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        work_item = Issue.objects.filter(pk=work_item_id, workspace__slug=slug, project_id=project_id).first()
        if work_item is None:
            return Response(
                {"message": "Work item not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        workspace_id = work_item.workspace_id
        project_id = work_item.project_id

        definition = (
            self.relation_definition_model.objects.filter(
                workspace__slug=slug, id=relation_definition_id, is_active=True
            )
            .filter(Q(outward=relation_definition_type) | Q(inward=relation_definition_type))
            .first()
        )
        if definition is None:
            return Response({"message": "Relation definition not found"}, status=status.HTTP_404_NOT_FOUND)

        request_work_items = _fetch_work_item_by_ids(workspace_slug=slug, work_item_ids=list(request_work_item_ids))
        if len(request_work_items) != len(request_work_item_ids):
            return Response(
                {"message": "Request work items not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        is_outward = definition.outward == relation_definition_type

        self.relation_model.objects.bulk_create(
            [
                self.relation_model(
                    workspace_id=workspace_id,
                    project_id=project_id,
                    category=RelationCategory.RELATION,
                    relation_type=None,
                    definition_id=relation_definition_id,
                    issue_id=work_item_id if is_outward else other_id,
                    related_issue_id=other_id if is_outward else work_item_id,
                    created_by_id=user_id,
                    updated_by_id=user_id,
                )
                for other_id in request_work_item_ids
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        _emit_work_item_relation_activity(
            request=request,
            type="issue_relation.activity.created",
            actor_id=str(user_id),
            work_item_id=str(work_item_id),
            project_id=str(project_id),
            current_instance=None,
            requested_data={"issues": request_work_item_ids, "relation_type": relation_definition_type},
        )

        response_data = [
            {**item, "id": item_id, "relation_type": relation_definition_type}
            for item_id, item in request_work_items.items()
        ]
        return Response(response_data, status=status.HTTP_201_CREATED)

    @can(WorkitemPermissions.EDIT, resource_param="work_item_id", scope_param_type=ResourceType.WORKITEM)
    def remove_relation(self, request: Request, slug: str, project_id: str, work_item_id: str) -> Response:
        """Remove the custom relation between the work item and the given related work_item_id."""
        user_id = request.user.id
        related_work_item_id = request.data.get("work_item_id")
        if related_work_item_id is None:
            return Response(
                {"message": "Related work item id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        work_item_relation = (
            self.relation_model.objects.filter(workspace__slug=slug, category=RelationCategory.RELATION)
            .filter(
                Q(issue_id=related_work_item_id, related_issue_id=work_item_id)
                | Q(issue_id=work_item_id, related_issue_id=related_work_item_id)
            )
            .select_related("definition")
            .first()
        )
        if work_item_relation is None:
            return Response(
                {"message": "Work item relation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        work_item_relation.delete()

        _emit_work_item_relation_activity(
            request=request,
            type="issue_relation.activity.deleted",
            actor_id=str(user_id),
            work_item_id=str(work_item_id),
            project_id=str(project_id),
            current_instance=None,
            requested_data={"related_issue": related_work_item_id, "relation_type": work_item_relation.relation_type},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
