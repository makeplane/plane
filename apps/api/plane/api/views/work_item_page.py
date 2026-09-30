# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers, status
from rest_framework.response import Response

from plane.api.serializers import WorkItemPageCreateSerializer, WorkItemPageSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import WorkItemPage
from plane.utils.work_item_page import attach_page_to_work_item, work_item_page_queryset
from .base import BaseAPIView


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

        link, result = attach_page_to_work_item(
            slug,
            project_id,
            issue_id,
            serializer.validated_data["page_id"],
            request.user,
        )
        if result == "issue":
            raise serializers.ValidationError({"issue_id": "Work item not found."})
        if result == "page":
            return Response({"error": "Page not found."}, status=status.HTTP_404_NOT_FOUND)

        response_status = status.HTTP_201_CREATED if result else status.HTTP_200_OK
        return Response(WorkItemPageSerializer(link).data, status=response_status)


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
