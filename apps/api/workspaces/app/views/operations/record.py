# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Records: the structured documents that are not work.

An RCA has no assignee, no state and no sprint. Filing one as an issue would
put it in every burndown and every velocity number, which is exactly the
distortion PROJECT.md's records module exists to avoid. These are rows so that
they stay searchable and auditable without ever touching delivery metrics.
"""

# Django imports
from django.db.models import Prefetch, Q
from django.utils.dateparse import parse_datetime

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from workspaces.app.permissions import ROLE, allow_permission
from workspaces.app.serializers import OperationsRecordSerializer
from workspaces.app.views.base import BaseViewSet
from workspaces.db.models import (
    Issue,
    OperationsRecord,
    OperationsRecordIssue,
    OperationsRecordParticipant,
    Workspace,
    WorkspaceMember,
)


def sync_record_links(record, participant_ids, issue_ids):
    """Reconcile a record's participants and linked issues with what was sent."""
    if participant_ids is not None:
        valid = set(
            WorkspaceMember.objects.filter(
                workspace_id=record.workspace_id, member_id__in=participant_ids, is_active=True
            ).values_list("member_id", flat=True)
        )
        existing = {link.member_id: link for link in OperationsRecordParticipant.objects.filter(record=record)}
        for member_id in valid - set(existing):
            OperationsRecordParticipant.objects.create(
                workspace_id=record.workspace_id, record=record, member_id=member_id
            )
        stale = [link.id for member_id, link in existing.items() if member_id not in valid]
        if stale:
            OperationsRecordParticipant.objects.filter(id__in=stale).delete()

    if issue_ids is not None:
        valid = set(
            Issue.objects.filter(id__in=issue_ids, workspace_id=record.workspace_id).values_list("id", flat=True)
        )
        existing = {link.issue_id: link for link in OperationsRecordIssue.objects.filter(record=record)}
        for issue_id in valid - set(existing):
            OperationsRecordIssue.objects.create(workspace_id=record.workspace_id, record=record, issue_id=issue_id)
        stale = [link.id for issue_id, link in existing.items() if issue_id not in valid]
        if stale:
            OperationsRecordIssue.objects.filter(id__in=stale).delete()


class OperationsRecordViewSet(BaseViewSet):
    serializer_class = OperationsRecordSerializer
    model = OperationsRecord
    search_fields = ["name", "description_stripped"]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project", "created_by")
            .prefetch_related(
                "record_participants",
                Prefetch("record_issues", queryset=OperationsRecordIssue.objects.select_related("issue")),
            )
        )

    def apply_filters(self, request, queryset):
        record_type = request.query_params.get("record_type")
        if record_type:
            queryset = queryset.filter(record_type__in=[v for v in record_type.split(",") if v])

        project_id = request.query_params.get("project_id")
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        start = parse_datetime(request.query_params.get("start_date") or "")
        if start:
            queryset = queryset.filter(occurred_at__gte=start)
        end = parse_datetime(request.query_params.get("end_date") or "")
        if end:
            queryset = queryset.filter(occurred_at__lte=end)

        query = request.query_params.get("query")
        if query:
            # `description_stripped` is what makes a record searchable rather
            # than merely listable -- it is maintained on every save.
            queryset = queryset.filter(Q(name__icontains=query) | Q(description_stripped__icontains=query))
        return queryset

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        queryset = self.apply_filters(request, self.get_queryset())
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda records: OperationsRecordSerializer(records, many=True).data,
            default_per_page=30,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = OperationsRecordSerializer(data=request.data, context={"workspace_id": workspace.id})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        participant_ids = serializer.validated_data.pop("participant_ids", None)
        issue_ids = serializer.validated_data.pop("issue_ids", None)
        record = serializer.save(workspace_id=workspace.id)
        sync_record_links(record, participant_ids, issue_ids)
        return Response(
            OperationsRecordSerializer(self.get_queryset().get(pk=record.pk)).data, status=status.HTTP_201_CREATED
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        return Response(OperationsRecordSerializer(self.get_queryset().get(pk=pk)).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        record = self.get_queryset().get(pk=pk)
        serializer = OperationsRecordSerializer(
            record, data=request.data, partial=True, context={"workspace_id": record.workspace_id}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        participant_ids = serializer.validated_data.pop("participant_ids", None)
        issue_ids = serializer.validated_data.pop("issue_ids", None)
        serializer.save()
        sync_record_links(record, participant_ids, issue_ids)
        return Response(OperationsRecordSerializer(self.get_queryset().get(pk=pk)).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        self.get_queryset().get(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
