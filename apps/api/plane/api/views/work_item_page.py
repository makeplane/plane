# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import transaction
from django.db.models import Q
from rest_framework import serializers, status
from rest_framework.response import Response

from plane.api.serializers import WorkItemPageCreateSerializer, WorkItemPageSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Issue, Page, WorkItemPage
from .base import BaseAPIView


def visible_page_queryset(slug, project_id, user):
    return (
        Page.objects.filter(workspace__slug=slug, deleted_at__isnull=True)
        .filter(
            Q(is_global=True)
            | Q(
                project_pages__project_id=project_id,
                project_pages__deleted_at__isnull=True,
            )
        )
        .filter(Q(owned_by=user) | Q(access=Page.PUBLIC_ACCESS))
        .distinct()
    )


def work_item_page_queryset(slug, project_id, issue_id, user):
    return (
        WorkItemPage.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            issue__project_id=project_id,
            page__deleted_at__isnull=True,
        )
        .filter(page__in=visible_page_queryset(slug, project_id, user))
        .select_related("page", "issue", "project", "workspace", "created_by", "updated_by")
        .distinct()
    )


class WorkItemPageListCreateAPIEndpoint(BaseAPIView):
    serializer_class = WorkItemPageSerializer
    model = WorkItemPage
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return work_item_page_queryset(
            self.kwargs["slug"],
            self.kwargs["project_id"],
            self.kwargs["issue_id"],
            self.request.user,
        ).order_by("-created_at")

    def get(self, request, slug, project_id, issue_id):
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            default_per_page=20,
            max_per_page=100,
            on_results=lambda links: WorkItemPageSerializer(links, many=True).data,
        )

    def post(self, request, slug, project_id, issue_id):
        serializer = WorkItemPageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        issue = Issue.objects.filter(
            pk=issue_id,
            project_id=project_id,
            workspace__slug=slug,
            deleted_at__isnull=True,
        ).first()
        if issue is None:
            raise serializers.ValidationError({"issue_id": "Work item not found."})

        page = visible_page_queryset(slug, project_id, request.user).filter(
            pk=serializer.validated_data["page_id"]
        ).first()
        if page is None:
            return Response({"error": "Page not found."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            link = WorkItemPage.all_objects.filter(
                project_id=project_id,
                issue_id=issue_id,
                page_id=page.id,
            ).first()
            if link is not None:
                if link.deleted_at is not None:
                    link.deleted_at = None
                    link.updated_by_id = request.user.id
                    link.save(update_fields=["deleted_at", "updated_by"])
                return Response(WorkItemPageSerializer(link).data, status=status.HTTP_200_OK)

            link = WorkItemPage.objects.create(
                project=issue.project,
                issue=issue,
                page=page,
                created_by_id=request.user.id,
            )

        return Response(WorkItemPageSerializer(link).data, status=status.HTTP_201_CREATED)


class WorkItemPageDetailAPIEndpoint(BaseAPIView):
    serializer_class = WorkItemPageSerializer
    model = WorkItemPage
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return work_item_page_queryset(
            self.kwargs["slug"],
            self.kwargs["project_id"],
            self.kwargs["issue_id"],
            self.request.user,
        )

    def get(self, request, slug, project_id, issue_id, pk):
        link = self.get_queryset().get(pk=pk)
        return Response(WorkItemPageSerializer(link).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, issue_id, pk):
        link = self.get_queryset().get(pk=pk)
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
