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

# Django imports
from django.utils import timezone
from django.db.models import Q, F, UUIDField, Value
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet
from plane.app.serializers import IssueRelationSerializer, RelatedIssueSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    Project,
    IssueRelation,
    Issue,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.issue_relation_mapper import get_actual_relation
from plane.utils.host import base_host


class IssueRelationViewSet(BaseViewSet):
    serializer_class = IssueRelationSerializer
    model = IssueRelation
    permission_classes = [ProjectEntityPermission]

    ISSUE_FIELDS = [
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

    def list(self, request, slug, project_id, issue_id):
        empty_uuid_array = Value([], output_field=ArrayField(UUIDField()))

        def _agg_ids(field, **filter_kwargs):
            return Coalesce(
                ArrayAgg(field, filter=Q(**filter_kwargs), distinct=True),
                empty_uuid_array,
            )

        issue_relation_qs = IssueRelation.objects.filter(
            Q(issue_id=issue_id) | Q(related_issue_id=issue_id),
            workspace__slug=slug,
        )

        relation_ids = issue_relation_qs.aggregate(
            blocking_ids=_agg_ids("issue_id", relation_type="blocked_by", related_issue_id=issue_id),
            blocked_by_ids=_agg_ids("related_issue_id", relation_type="blocked_by", issue_id=issue_id),
            duplicate_ids=_agg_ids("related_issue_id", relation_type="duplicate", issue_id=issue_id),
            duplicate_ids_related=_agg_ids("issue_id", relation_type="duplicate", related_issue_id=issue_id),
            relates_to_ids=_agg_ids("related_issue_id", relation_type="relates_to", issue_id=issue_id),
            relates_to_ids_related=_agg_ids("issue_id", relation_type="relates_to", related_issue_id=issue_id),
            start_after_ids=_agg_ids("issue_id", relation_type="start_before", related_issue_id=issue_id),
            start_before_ids=_agg_ids("related_issue_id", relation_type="start_before", issue_id=issue_id),
            finish_after_ids=_agg_ids("issue_id", relation_type="finish_before", related_issue_id=issue_id),
            finish_before_ids=_agg_ids("related_issue_id", relation_type="finish_before", issue_id=issue_id),
            implements_ids=_agg_ids("related_issue_id", relation_type="implemented_by", issue_id=issue_id),
            implemented_by_ids=_agg_ids("issue_id", relation_type="implemented_by", related_issue_id=issue_id),
        )

        # Merge bidirectional relations (duplicate and relates_to are symmetric)
        ids_by_relation = {
            "blocking": relation_ids["blocking_ids"],
            "blocked_by": relation_ids["blocked_by_ids"],
            "duplicate": list(set(relation_ids["duplicate_ids"] + relation_ids["duplicate_ids_related"])),
            "relates_to": list(set(relation_ids["relates_to_ids"] + relation_ids["relates_to_ids_related"])),
            "start_after": relation_ids["start_after_ids"],
            "start_before": relation_ids["start_before_ids"],
            "finish_after": relation_ids["finish_after_ids"],
            "finish_before": relation_ids["finish_before_ids"],
            "implements": relation_ids["implements_ids"],
            "implemented_by": relation_ids["implemented_by_ids"],
        }

        all_issue_ids = {uid for ids in ids_by_relation.values() for uid in ids}

        if all_issue_ids:
            issues_qs = (
                Issue.objects.filter(
                    pk__in=all_issue_ids,
                    workspace__slug=slug,
                    project__deleted_at__isnull=True,
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
                .values(*self.ISSUE_FIELDS)
            )
            issues_by_id = {str(issue["id"]): issue for issue in issues_qs}
        else:
            issues_by_id = {}

        def build_relation_list(ids, relation_type_value):
            return [
                {**issue, "relation_type": relation_type_value} for uid in ids if (issue := issues_by_id.get(str(uid)))
            ]

        response_data = {
            relation_type: build_relation_list(ids, relation_type) for relation_type, ids in ids_by_relation.items()
        }

        return Response(response_data, status=status.HTTP_200_OK)

    def create(self, request, slug, project_id, issue_id):
        relation_type = request.data.get("relation_type", None)
        if relation_type is None:
            return Response(
                {"message": "Issue relation type is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issues = request.data.get("issues", [])
        project = Project.objects.get(pk=project_id)

        actual_relation = get_actual_relation(relation_type)
        is_reverse = relation_type in ["blocking", "start_after", "finish_after", "implemented_by"]

        IssueRelation.objects.bulk_create(
            [
                IssueRelation(
                    issue_id=issue if is_reverse else issue_id,
                    related_issue_id=issue_id if is_reverse else issue,
                    relation_type=actual_relation,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                    updated_by=request.user,
                )
                for issue in issues
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        issue_activity.delay(
            type="issue_relation.activity.created",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        # Re-fetch with select_related to avoid N+1 queries in serializers.
        # bulk_create with ignore_conflicts=True may not return PKs,
        # so query by the issue/related_issue pairs and relation type.
        if is_reverse:
            refetch_filter = Q(
                issue_id__in=issues,
                related_issue_id=issue_id,
                relation_type=actual_relation,
            )
        else:
            refetch_filter = Q(
                issue_id=issue_id,
                related_issue_id__in=issues,
                relation_type=actual_relation,
            )

        refetched_relations = IssueRelation.objects.filter(
            refetch_filter,
            workspace__slug=slug,
        ).select_related(
            "issue__type",
            "issue__state",
            "related_issue__type",
            "related_issue__state",
        )

        serializer_class = RelatedIssueSerializer if is_reverse else IssueRelationSerializer
        return Response(
            serializer_class(refetched_relations, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    def remove_relation(self, request, slug, project_id, issue_id):
        related_issue = request.data.get("related_issue", None)

        issue_relation = (
            IssueRelation.objects.filter(workspace__slug=slug)
            .filter(
                Q(issue_id=related_issue, related_issue_id=issue_id)
                | Q(issue_id=issue_id, related_issue_id=related_issue)
            )
            .select_related(
                "issue__type",
                "issue__state",
                "related_issue__type",
                "related_issue__state",
            )
            .first()
        )

        if issue_relation is None:
            return Response(
                {"message": "Issue relation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_instance = json.dumps(
            IssueRelationSerializer(issue_relation).data,
            cls=DjangoJSONEncoder,
        )
        issue_relation.delete()
        issue_activity.delay(
            type="issue_relation.activity.deleted",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
