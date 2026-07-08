# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Django imports
from django.utils import timezone

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseAPIView
from plane.app.serializers import IssuePageSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Issue, IssuePage, Page
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host
from plane.utils.page_access import can_read_page, readable_issue_pages


class IssuePageEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    model = IssuePage

    def get(self, request, slug, project_id, issue_id):
        issue_pages = readable_issue_pages(
            IssuePage.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
            )
            .select_related("page", "page__owned_by")
            .prefetch_related("page__projects"),
            request.user,
        ).order_by("-created_at")
        pages = [issue_page.page for issue_page in issue_pages]
        serializer = IssuePageSerializer(pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, project_id, issue_id):
        page_id = request.data.get("page_id")
        if not page_id:
            return Response({"error": "page_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        issue = Issue.objects.get(workspace__slug=slug, project_id=project_id, pk=issue_id)
        page = Page.objects.filter(pk=page_id).prefetch_related("projects").first()

        # Never disclose the existence of a private page owned by someone else
        if page is None or not can_read_page(request.user, page):
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        # Intra-workspace invariant: a page can only be linked within its own workspace
        if issue.workspace_id != page.workspace_id:
            return Response(
                {"error": "The work item and the page must belong to the same workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_page, created = IssuePage.objects.get_or_create(
            workspace_id=issue.workspace_id,
            project_id=project_id,
            issue_id=issue_id,
            page_id=page.id,
        )

        if created:
            issue_activity.delay(
                type="page.activity.created",
                requested_data=json.dumps({"page_id": str(page.id)}),
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

        serializer = IssuePageSerializer(page)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug, project_id, issue_id, page_id):
        issue_page = IssuePage.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            page_id=page_id,
        ).first()

        if issue_page is None:
            return Response({"error": "Page link not found"}, status=status.HTTP_404_NOT_FOUND)

        issue_page.delete()
        issue_activity.delay(
            type="page.activity.deleted",
            requested_data=json.dumps({"page_id": str(page_id)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
