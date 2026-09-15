# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import F, Q

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from ..base import BaseAPIView, BaseViewSet
from plane.app.serializers import IssuePageSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import IssuePage, Page, Project


class IssuePageViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]

    model = IssuePage
    serializer_class = IssuePageSerializer

    def get_queryset(self):
        return (
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
            .select_related("page")
            .order_by("-created_at")
            .distinct()
        )

    def list(self, request, slug, project_id, issue_id):
        issue_pages = self.get_queryset()
        serializer = IssuePageSerializer(issue_pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, slug, project_id, issue_id):
        page_id = request.data.get("page")
        if not page_id:
            return Response(
                {"error": "Page id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only allow linking pages of this project that the user actually has access to
        page = (
            Page.objects.filter(
                pk=page_id,
                workspace__slug=slug,
                projects__id=project_id,
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            .first()
        )
        if page is None:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        existing_issue_pages = list(self.get_queryset())
        if not any(issue_page.page_id == page.id for issue_page in existing_issue_pages):
            # a work item holds a single page, so replace any existing link
            for issue_page in existing_issue_pages:
                issue_page.delete()

            project = Project.objects.get(pk=project_id)
            IssuePage.objects.create(
                issue_id=issue_id,
                page_id=page.id,
                project_id=project_id,
                workspace_id=project.workspace_id,
                created_by=request.user,
                updated_by=request.user,
            )

        serializer = IssuePageSerializer(self.get_queryset(), many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, slug, project_id, issue_id, pk):
        issue_page = self.get_queryset().get(pk=pk)
        issue_page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssuePageLinksEndpoint(BaseAPIView):
    """All work item <-> page links of a project, used by work item layouts and the pages list."""

    permission_classes = [ProjectEntityPermission]

    def get(self, request, slug, project_id):
        links = (
            IssuePage.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                deleted_at__isnull=True,
                issue__deleted_at__isnull=True,
                page__deleted_at__isnull=True,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(Q(page__owned_by=request.user) | Q(page__access=Page.PUBLIC_ACCESS))
            .values(
                "id",
                "issue_id",
                "page_id",
                issue_name=F("issue__name"),
                issue_sequence_id=F("issue__sequence_id"),
                issue_project_id=F("issue__project_id"),
                project_identifier=F("issue__project__identifier"),
                page_name=F("page__name"),
            )
            .distinct()
        )
        return Response(list(links), status=status.HTTP_200_OK)
