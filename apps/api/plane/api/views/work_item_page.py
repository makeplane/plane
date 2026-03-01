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
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# drf-spectacular imports
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest

# Module imports
from plane.api.serializers import (
    WorkItemPageSerializer,
    WorkItemPageCreateSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, Page
from plane.ee.models import WorkItemPage
from plane.utils.host import base_host
from plane.utils.openapi import (
    work_item_page_docs,
    ISSUE_ID_PARAMETER,
    PAGE_ID_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    ORDER_BY_PARAMETER,
    INVALID_REQUEST_RESPONSE,
    WORK_ITEM_NOT_FOUND_RESPONSE,
    WORK_ITEM_PAGE_NOT_FOUND_RESPONSE,
    PAGE_ALREADY_LINKED_RESPONSE,
    WORK_ITEM_PAGE_CREATE_EXAMPLE,
    WORK_ITEM_PAGE_EXAMPLE,
    create_paginated_response,
)
from .base import BaseAPIView


class WorkItemPageListCreateAPIEndpoint(BaseAPIView):
    """Work Item Page Link List and Create Endpoint"""

    serializer_class = WorkItemPageSerializer
    model = WorkItemPage
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            WorkItemPage.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("work_item_id"))
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    @work_item_page_docs(
        operation_id="list_work_item_pages",
        description="Retrieve all page links associated with a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                WorkItemPageSerializer,
                "PaginatedWorkItemPageResponse",
                "Paginated list of work item page links",
                "Paginated Work Item Page Links",
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: WORK_ITEM_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, work_item_id):
        """List work item page links

        Retrieve all page links associated with a work item.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda work_item_pages: WorkItemPageSerializer(work_item_pages, many=True).data,
        )

    @work_item_page_docs(
        operation_id="create_work_item_page",
        description="Link a page to a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=WorkItemPageCreateSerializer,
            examples=[WORK_ITEM_PAGE_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Work item page link created successfully",
                response=WorkItemPageSerializer,
                examples=[WORK_ITEM_PAGE_EXAMPLE],
            ),
            400: PAGE_ALREADY_LINKED_RESPONSE,
            404: WORK_ITEM_NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, work_item_id):
        """Create work item page link

        Link a page to a work item.
        """
        serializer = WorkItemPageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        page_id = serializer.validated_data.get("page_id")

        # Validate that the issue exists
        if not Issue.objects.filter(
            id=work_item_id,
            project_id=project_id,
            workspace__slug=slug,
        ).exists():
            return Response(
                {"error": "Work item not found", "code": "WORK_ITEM_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate that the page exists and belongs to the same project or is global
        page = Page.objects.filter(
            id=page_id,
            workspace__slug=slug,
        ).first()

        if not page:
            return Response(
                {"error": "Page not found", "code": "PAGE_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if the link already exists
        if WorkItemPage.objects.filter(
            issue_id=work_item_id,
            page_id=page_id,
        ).exists():
            return Response(
                {"error": "Page is already linked to this work item", "code": "PAGE_ALREADY_LINKED"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the work item page link
        work_item_page = WorkItemPage.objects.create(
            issue_id=work_item_id,
            page_id=page_id,
            project_id=project_id,
            workspace_id=page.workspace_id,
            created_by=request.user,
            updated_by=request.user,
        )

        # Track activity
        issue_activity.delay(
            type="page.activity.created",
            requested_data=json.dumps({"page_id": str(page_id)}, cls=DjangoJSONEncoder),
            issue_id=str(work_item_id),
            project_id=str(project_id),
            actor_id=str(request.user.id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            subscriber=True,
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        serializer = WorkItemPageSerializer(work_item_page)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkItemPageDetailAPIEndpoint(BaseAPIView):
    """Work Item Page Link Detail Endpoint"""

    permission_classes = [ProjectEntityPermission]
    model = WorkItemPage
    serializer_class = WorkItemPageSerializer
    use_read_replica = True

    def get_queryset(self):
        return (
            WorkItemPage.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("work_item_id"))
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    @work_item_page_docs(
        operation_id="retrieve_work_item_page",
        description="Retrieve details of a specific page link for a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
            PAGE_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Work item page link details",
                response=WorkItemPageSerializer,
                examples=[WORK_ITEM_PAGE_EXAMPLE],
            ),
            404: WORK_ITEM_PAGE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, work_item_id, pk):
        """Retrieve work item page link

        Get details of a specific page link for a work item.
        """
        work_item_page = self.get_queryset().filter(pk=pk).first()
        if not work_item_page:
            return Response(
                {"error": "Work item page link not found", "code": "WORK_ITEM_PAGE_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WorkItemPageSerializer(work_item_page)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @work_item_page_docs(
        operation_id="delete_work_item_page",
        description="Remove a page link from a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
            PAGE_ID_PARAMETER,
        ],
        responses={
            204: OpenApiResponse(description="Work item page link deleted successfully"),
            404: WORK_ITEM_PAGE_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, work_item_id, pk):
        """Delete work item page link

        Remove a page link from a work item.
        """
        work_item_page = self.get_queryset().filter(pk=pk).first()
        if not work_item_page:
            return Response(
                {"error": "Work item page link not found", "code": "WORK_ITEM_PAGE_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Store page info for activity tracking before deletion
        page_id = str(work_item_page.page_id)

        # Delete the link
        work_item_page.delete()

        # Track activity
        issue_activity.delay(
            type="page.activity.deleted",
            requested_data=json.dumps({"page_id": page_id}, cls=DjangoJSONEncoder),
            issue_id=str(work_item_id),
            project_id=str(project_id),
            actor_id=str(request.user.id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            subscriber=True,
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
