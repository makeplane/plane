# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Django imports
from django.db.models import Max
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet
from plane.app.serializers import IssueChecklistItemSerializer
from plane.app.permissions import ROLE, ProjectEntityPermission
from plane.db.models import Issue, IssueChecklistItem, ProjectMember
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host

SORT_ORDER_STEP = 65535


class IssueChecklistItemViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]

    model = IssueChecklistItem
    serializer_class = IssueChecklistItemSerializer

    def get_queryset(self):
        # SECURITY: ProjectEntityPermission only proves the caller is a member of
        # the URL project_id — it does NOT prove issue_id lives in that project.
        # Every lookup must keep workspace__slug + project_id + issue_id together,
        # or a member of one project can read/write another project's checklist
        # items in the same workspace. See the same note in
        # plane/app/views/issue/sub_issue.py:38-44.
        queryset = (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
        )

        # SECURITY: a guest without guest_view_all_features may only see the
        # checklist of a work item they created themselves, mirroring
        # IssueViewSet.retrieve (views/issue/base.py:599-613). Child-entity
        # viewsets otherwise gate only on project membership, which would let
        # a guest read a checklist on a work item whose detail view they are
        # forbidden from opening.
        if ProjectMember.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            member=self.request.user,
            role=ROLE.GUEST.value,
            is_active=True,
            project__guest_view_all_features=False,
        ).exists():
            queryset = queryset.filter(issue__created_by=self.request.user)

        return queryset.order_by("sort_order", "created_at").distinct()

    def create(self, request, slug, project_id, issue_id):
        # SECURITY: bind the parent work item to the URL workspace + project so a
        # cross-project issue_id 404s instead of silently attaching the item
        # somewhere the caller does not expect.
        if not Issue.objects.filter(pk=issue_id, project_id=project_id, workspace__slug=slug).exists():
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = IssueChecklistItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if "sort_order" not in serializer.validated_data:
            last_sort_order = IssueChecklistItem.objects.filter(
                issue_id=issue_id, project_id=project_id, workspace__slug=slug
            ).aggregate(largest=Max("sort_order"))["largest"]
            serializer.validated_data["sort_order"] = (
                SORT_ORDER_STEP if last_sort_order is None else last_sort_order + SORT_ORDER_STEP
            )

        serializer.save(project_id=project_id, issue_id=issue_id)

        issue_activity.delay(
            type="checklist_item.activity.created",
            requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            origin=base_host(request=request, is_app=True),
            # NOTE: no `notification=True` here. issue_activity defaults it to
            # False; IssueLinkViewSet passes True, which would fan out an
            # in-app + email notification to every subscriber on every
            # checklist change. That is not wanted for a checkbox tick.
        )

        checklist_item = self.get_queryset().get(id=serializer.data.get("id"))
        serializer = IssueChecklistItemSerializer(checklist_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, slug, project_id, issue_id, pk):
        # SECURITY: resolve through get_queryset(), never a bare pk lookup, so
        # this cannot drift out of sync with the scoping filter above.
        checklist_item = self.get_queryset().filter(pk=pk).first()
        if not checklist_item:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_instance = json.dumps(IssueChecklistItemSerializer(checklist_item).data, cls=DjangoJSONEncoder)

        serializer = IssueChecklistItemSerializer(checklist_item, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        issue_activity.delay(
            type="checklist_item.activity.updated",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            origin=base_host(request=request, is_app=True),
        )

        checklist_item = self.get_queryset().get(id=serializer.data.get("id"))
        serializer = IssueChecklistItemSerializer(checklist_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, project_id, issue_id, pk):
        checklist_item = self.get_queryset().filter(pk=pk).first()
        if not checklist_item:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_instance = json.dumps(IssueChecklistItemSerializer(checklist_item).data, cls=DjangoJSONEncoder)

        issue_activity.delay(
            type="checklist_item.activity.deleted",
            requested_data=json.dumps({"checklist_item_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            origin=base_host(request=request, is_app=True),
        )

        checklist_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
