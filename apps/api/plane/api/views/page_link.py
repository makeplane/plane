# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# drf-spectacular imports
from drf_spectacular.utils import extend_schema, OpenApiResponse

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.app.serializers import IssuePageSerializer
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, IssuePage, Page
from plane.utils.page_access import can_read_page, readable_issue_pages
from .base import BaseAPIView


class WorkItemPageLinkListCreateAPIEndpoint(BaseAPIView):
    """List the pages linked to a work item and attach a page to a work item."""

    model = IssuePage
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return readable_issue_pages(
            IssuePage.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                issue_id=self.kwargs.get("issue_id"),
            )
            .select_related("page", "page__owned_by")
            .prefetch_related("page__projects"),
            self.request.user,
        ).order_by("-created_at")

    @extend_schema(
        operation_id="list_work_item_pages",
        summary="List work item pages",
        description="Retrieve the pages linked to a work item that are readable by the requester.",
        tags=["Work Items"],
        responses={
            200: OpenApiResponse(description="Paginated list of linked pages", response=IssuePageSerializer),
        },
    )
    def get(self, request, slug, project_id, issue_id):
        """List work item pages

        Retrieve the pages linked to a work item. Pages the requester is not
        allowed to read are filtered out row by row.
        """
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda issue_pages: IssuePageSerializer(
                [issue_page.page for issue_page in issue_pages], many=True
            ).data,
        )

    @extend_schema(
        operation_id="attach_page_to_work_item",
        summary="Attach a page to a work item",
        description="Link an existing page to a work item within the same workspace.",
        tags=["Work Items"],
        responses={
            201: OpenApiResponse(description="Page linked to the work item", response=IssuePageSerializer),
        },
    )
    def post(self, request, slug, project_id, issue_id):
        """Attach a page to a work item

        Link an existing page to a work item. Requires read access to the page
        and write access to the work item; the page must live in the same
        workspace as the work item.
        """
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
            )

        return Response(IssuePageSerializer(page).data, status=status.HTTP_201_CREATED)


class WorkItemPageLinkDetailAPIEndpoint(BaseAPIView):
    """Detach a page from a work item."""

    model = IssuePage
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    @extend_schema(
        operation_id="detach_page_from_work_item",
        summary="Detach a page from a work item",
        description="Remove the link between a page and a work item.",
        tags=["Work Items"],
        responses={204: OpenApiResponse(description="Page unlinked from the work item")},
    )
    def delete(self, request, slug, project_id, issue_id, page_id):
        """Detach a page from a work item

        Remove the link between a page and a work item. Requires write access
        to the work item.
        """
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
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
