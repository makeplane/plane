# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Q, UUIDField, Value
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest

# Module imports
from plane.api.serializers import (
    PageSerializer,
    PageCreateSerializer,
    PageUpdateSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    Page,
    Project,
    ProjectMember,
    UserFavorite,
    UserRecentVisit,
)

from .base import BaseAPIView
from plane.utils.order_queryset import PAGE_ORDER_BY_ALLOWLIST, sanitize_order_by
from plane.utils.openapi import (
    page_docs,
    PAGE_PK_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    ORDER_BY_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    create_paginated_response,
    # Request Examples
    PAGE_CREATE_EXAMPLE,
    PAGE_UPDATE_EXAMPLE,
    # Response Examples
    PAGE_EXAMPLE,
    INVALID_REQUEST_RESPONSE,
    PROJECT_NOT_FOUND_RESPONSE,
    EXTERNAL_ID_EXISTS_RESPONSE,
    DELETED_RESPONSE,
    ADMIN_ONLY_RESPONSE,
)


class PageListCreateAPIEndpoint(BaseAPIView):
    """Page List and Create Endpoint"""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(projects__id=self.kwargs.get("project_id"))
            .filter(project_pages__deleted_at__isnull=True)
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .select_related("workspace")
            .select_related("owned_by")
            .select_related("parent")
            .prefetch_related("labels")
            .prefetch_related("projects")
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "page_labels__label_id",
                        distinct=True,
                        filter=~Q(page_labels__label_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                project_ids=Coalesce(
                    ArrayAgg("projects__id", distinct=True, filter=Q(projects__id__isnull=False)),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .order_by("-created_at")
            .distinct()
        )

    @page_docs(
        operation_id="create_page",
        summary="Create page",
        description="Create a new page in a project with content, labels, and hierarchy.",
        request=OpenApiRequest(
            request=PageCreateSerializer,
            examples=[PAGE_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Page created",
                response=PageSerializer,
                examples=[PAGE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create page

        Create a new page in a project with content, labels, and hierarchy.
        Automatically assigns the requesting user as the page owner.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        serializer = PageCreateSerializer(
            data=request.data,
            context={"project_id": project_id, "owned_by_id": request.user.id},
        )
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and request.data.get("external_source")
                and Page.objects.filter(
                    projects__id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                page = Page.objects.filter(
                    projects__id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).first()
                return Response(
                    {
                        "error": "Page with the same external id and external source already exists",
                        "id": str(page.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer.save()
            page = self.get_queryset().get(pk=serializer.instance.id)
            serializer = PageSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @page_docs(
        operation_id="list_pages",
        summary="List pages",
        description="Retrieve all pages in a project.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                PageSerializer,
                "PaginatedPageResponse",
                "Paginated list of pages",
                "Paginated Pages",
            ),
            404: OpenApiResponse(description="Project not found"),
        },
    )
    def get(self, request, slug, project_id):
        """List pages

        Retrieve all pages in a project visible to the requesting user.
        Returns paginated results with label and project associations.
        """
        order_by = sanitize_order_by(
            request.GET.get("order_by", "-created_at"),
            PAGE_ORDER_BY_ALLOWLIST,
            default="-created_at",
        )
        return self.paginate(
            request=request,
            queryset=(self.get_queryset().filter(archived_at__isnull=True).order_by(order_by)),
            on_results=lambda pages: PageSerializer(pages, many=True, fields=self.fields, expand=self.expand).data,
        )


class PageDetailAPIEndpoint(BaseAPIView):
    """Page Detail Endpoint"""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(projects__id=self.kwargs.get("project_id"))
            .filter(project_pages__deleted_at__isnull=True)
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .select_related("workspace")
            .select_related("owned_by")
            .select_related("parent")
            .prefetch_related("labels")
            .prefetch_related("projects")
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "page_labels__label_id",
                        distinct=True,
                        filter=~Q(page_labels__label_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                project_ids=Coalesce(
                    ArrayAgg("projects__id", distinct=True, filter=Q(projects__id__isnull=False)),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .order_by("-created_at")
            .distinct()
        )

    @page_docs(
        operation_id="retrieve_page",
        summary="Retrieve page",
        description="Retrieve details of a specific page.",
        parameters=[
            PAGE_PK_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Page",
                response=PageSerializer,
                examples=[PAGE_EXAMPLE],
            ),
            404: OpenApiResponse(description="Page not found"),
        },
    )
    def get(self, request, slug, project_id, pk):
        """Retrieve page

        Retrieve details of a specific page.
        """
        page = self.get_queryset().get(pk=pk)
        data = PageSerializer(page, fields=self.fields, expand=self.expand).data
        return Response(data, status=status.HTTP_200_OK)

    @page_docs(
        operation_id="update_page",
        summary="Update page",
        description="Modify an existing page's properties like name, content, labels, or hierarchy.",
        parameters=[
            PAGE_PK_PARAMETER,
        ],
        request=OpenApiRequest(
            request=PageUpdateSerializer,
            examples=[PAGE_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Page updated successfully",
                response=PageSerializer,
                examples=[PAGE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: OpenApiResponse(description="Page not found"),
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, pk):
        """Update page

        Modify an existing page's properties like name, content, labels, or hierarchy.
        Locked pages cannot be edited and access changes are restricted to the owner.
        """
        # Resolve through get_queryset() so the owner-or-public visibility rule
        # is applied before any mutation — a project member must not be able to
        # update another user's private page
        page = self.get_queryset().get(pk=pk)

        if page.is_locked:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

        # Only the owner can update the access of the page
        if page.access != request.data.get("access", page.access) and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PageUpdateSerializer(
            page,
            data=request.data,
            context={"project_id": project_id},
            partial=True,
        )
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and (page.external_id != request.data.get("external_id"))
                and Page.objects.filter(
                    projects__id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source", page.external_source),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "Page with the same external id and external source already exists",
                        "id": str(page.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer.save()
            page = self.get_queryset().get(pk=pk)
            serializer = PageSerializer(page)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @page_docs(
        operation_id="delete_page",
        summary="Delete page",
        description="Permanently remove an archived page and detach all its child pages.",
        parameters=[
            PAGE_PK_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
            400: OpenApiResponse(description="Page is not archived"),
            403: ADMIN_ONLY_RESPONSE,
            404: OpenApiResponse(description="Page not found"),
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Delete page

        Permanently remove a page. The page must be archived before deleting
        and only the owner or a project admin can perform this action.
        """
        page = Page.objects.get(
            pk=pk,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.owned_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=20,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Remove the parent from all the children
        _ = Page.objects.filter(
            parent_id=pk,
            projects__id=project_id,
            workspace__slug=slug,
            project_pages__deleted_at__isnull=True,
        ).update(parent=None)

        page.delete()
        # Delete the user favorite page
        UserFavorite.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        ).delete()
        # Delete the page from recent visits
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_name="page",
        ).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
