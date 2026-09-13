# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import datetime

# Django imports
from django.db import transaction
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest

# Module imports
from plane.api.serializers import PageSerializer, PageDetailSerializer
from plane.app.permissions import ROLE, ProjectEntityPermission, WorkspaceEntityPermission
from plane.app.views.page.base import unarchive_archive_page_and_descendants
from plane.bgtasks.page_transaction_task import page_transaction
from plane.db.models import Page, ProjectMember, UserFavorite, UserRecentVisit, Workspace
from .base import BaseAPIView
from plane.utils.openapi import (
    page_docs,
    PAGE_ID_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    create_paginated_response,
    # Request Examples
    PAGE_CREATE_EXAMPLE,
    PAGE_UPDATE_EXAMPLE,
    # Response Examples
    PAGE_EXAMPLE,
    INVALID_REQUEST_RESPONSE,
    DELETED_RESPONSE,
    ARCHIVED_RESPONSE,
    UNARCHIVED_RESPONSE,
)


def project_page_queryset(slug, project_id, user):
    """Pages of a project visible to the user: their own plus public ones."""
    return (
        Page.objects.filter(workspace__slug=slug)
        .filter(projects__id=project_id)
        .filter(
            projects__project_projectmember__member=user,
            projects__project_projectmember__is_active=True,
            projects__archived_at__isnull=True,
        )
        .filter(project_pages__deleted_at__isnull=True)
        .filter(Q(owned_by=user) | Q(access=Page.PUBLIC_ACCESS))
        .distinct()
    )


WORKSPACE_PAGE_TYPES = {"all", "public", "private", "shared", "archived"}


def workspace_page_accessible_queryset(slug, user):
    return (
        Page.objects.filter(workspace__slug=slug, is_global=True, deleted_at__isnull=True)
        .filter(Q(owned_by=user) | Q(access=Page.PUBLIC_ACCESS))
        .distinct()
    )


def workspace_page_queryset(slug, user, page_type="all", search=None):
    queryset = workspace_page_accessible_queryset(slug, user)

    if page_type == "public":
        queryset = queryset.filter(access=Page.PUBLIC_ACCESS, archived_at__isnull=True)
    elif page_type == "private":
        queryset = queryset.filter(access=Page.PRIVATE_ACCESS, owned_by=user, archived_at__isnull=True)
    elif page_type == "shared":
        queryset = queryset.none()
    elif page_type == "archived":
        queryset = queryset.filter(archived_at__isnull=False)

    if search:
        queryset = queryset.filter(name__icontains=search)

    return queryset


class PageListCreateAPIEndpoint(BaseAPIView):
    """Page List and Create Endpoint"""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return project_page_queryset(
            self.kwargs.get("slug"), self.kwargs.get("project_id"), self.request.user
        ).select_related("workspace", "owned_by")

    @page_docs(
        operation_id="create_page",
        summary="Create page",
        description="Create a new page in a project with HTML content.",
        request=OpenApiRequest(
            request=PageDetailSerializer,
            examples=[PAGE_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Page created",
                response=PageDetailSerializer,
                examples=[PAGE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create page

        Create a new page in a project with HTML content.
        Supports external ID tracking for integration purposes.
        """
        serializer = PageDetailSerializer(
            data=request.data,
            context={"project_id": project_id, "owned_by_id": request.user.id},
        )
        if serializer.is_valid():
            if request.data.get("external_id") and request.data.get("external_source"):
                existing_page = Page.objects.filter(
                    projects__id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).first()
                if existing_page:
                    return Response(
                        {
                            "error": "Page with the same external id and external source already exists",
                            "id": str(existing_page.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

            page = serializer.save()
            # capture the page transaction with the sanitized content
            page_transaction.delay(
                new_description_html=page.description_html or "<p></p>",
                old_description_html=None,
                page_id=str(page.id),
            )
            return Response(PageDetailSerializer(page).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @page_docs(
        operation_id="list_pages",
        summary="List pages",
        description="Retrieve all pages in a project visible to the requesting user.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
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
        },
    )
    def get(self, request, slug, project_id):
        """List pages

        Retrieve all pages in a project, including nested pages.
        Private pages are only visible to their owner.
        Returns paginated results.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda pages: PageSerializer(pages, many=True, fields=self.fields, expand=self.expand).data,
        )


class PageDetailAPIEndpoint(BaseAPIView):
    """Page Detail Endpoint"""

    serializer_class = PageDetailSerializer
    model = Page
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return project_page_queryset(
            self.kwargs.get("slug"), self.kwargs.get("project_id"), self.request.user
        ).select_related("workspace", "owned_by")

    @page_docs(
        operation_id="retrieve_page",
        summary="Retrieve page",
        description="Retrieve details of a specific page including its HTML content.",
        parameters=[
            PAGE_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Page retrieved",
                response=PageDetailSerializer,
                examples=[PAGE_EXAMPLE],
            ),
        },
    )
    def get(self, request, slug, project_id, pk):
        """Retrieve page

        Retrieve details of a specific page including its HTML content.
        """
        serializer = PageDetailSerializer(
            self.get_queryset().get(pk=pk),
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @page_docs(
        operation_id="update_page",
        summary="Update page",
        description="Partially update an existing page's properties or HTML content.",
        parameters=[
            PAGE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=PageDetailSerializer,
            examples=[PAGE_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Page updated",
                response=PageDetailSerializer,
                examples=[PAGE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, pk):
        """Update page

        Partially update an existing page's properties or HTML content.
        Locked pages cannot be updated, and only the page owner can change
        its access level.
        """
        page = self.get_queryset().get(pk=pk)

        # A locked page can only be unlocked
        if page.is_locked and set(request.data.keys()) - {"is_locked"}:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

        # Only update access if the page owner is the requesting user
        requested_access = request.data.get("access", page.access)
        try:
            requested_access = int(requested_access)
        except (TypeError, ValueError):
            return Response({"error": "Invalid access value"}, status=status.HTTP_400_BAD_REQUEST)
        if page.access != requested_access and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            request.data.get("external_id")
            and (page.external_id != str(request.data.get("external_id")))
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

        serializer = PageDetailSerializer(
            page,
            data=request.data,
            partial=True,
            context={"project_id": project_id},
        )
        page_description = page.description_html
        if serializer.is_valid():
            page = serializer.save()
            # capture the page transaction with the sanitized content
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_description_html=page.description_html or "<p></p>",
                    old_description_html=page_description,
                    page_id=str(pk),
                )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @page_docs(
        operation_id="delete_page",
        summary="Delete page",
        description="Permanently remove a page from a project. The page must be archived first, and only the page owner or a project admin can delete it.",  # noqa: E501
        parameters=[
            PAGE_ID_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Delete page

        Permanently remove a page from a project. The page must be archived
        first, and only the page owner or a project admin can delete it.
        """
        page = self.get_queryset().get(pk=pk)

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.owned_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=ROLE.ADMIN.value,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            # remove parent from all the children
            Page.objects.filter(
                parent_id=pk,
                projects__id=project_id,
                workspace__slug=slug,
                project_pages__deleted_at__isnull=True,
            ).update(parent=None)

            page.delete()
            # Delete the user favorite page
            UserFavorite.objects.filter(
                project=project_id,
                workspace__slug=slug,
                entity_identifier=pk,
                entity_type="page",
            ).delete()
            # Delete the page from recent visit
            UserRecentVisit.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                entity_identifier=pk,
                entity_name="page",
            ).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePageListCreateAPIEndpoint(BaseAPIView):
    """Workspace-scoped wiki page list and create endpoint."""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return workspace_page_queryset(
            self.kwargs.get("slug"),
            self.request.user,
            self.request.query_params.get("type", "all"),
            self.request.query_params.get("search"),
        ).select_related("workspace", "owned_by")

    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = PageDetailSerializer(
            data=request.data,
            context={"workspace_id": workspace.id, "owned_by_id": request.user.id},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.data.get("external_id") and request.data.get("external_source"):
            existing_page = Page.objects.filter(
                workspace=workspace,
                is_global=True,
                external_source=request.data["external_source"],
                external_id=request.data["external_id"],
            ).first()
            if existing_page:
                return Response(
                    {
                        "error": "Page with the same external id and external source already exists",
                        "id": str(existing_page.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        page = serializer.save()
        page_transaction.delay(
            new_description_html=page.description_html or "<p></p>",
            old_description_html=None,
            page_id=str(page.id),
        )
        return Response(PageDetailSerializer(page).data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        page_type = request.query_params.get("type", "all")
        if page_type not in WORKSPACE_PAGE_TYPES:
            return Response({"error": "Invalid page type"}, status=status.HTTP_400_BAD_REQUEST)

        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            default_per_page=20,
            max_per_page=100,
            on_results=lambda pages: PageSerializer(
                pages, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class WorkspacePageDetailAPIEndpoint(BaseAPIView):
    """Workspace-scoped wiki page detail endpoint."""

    serializer_class = PageDetailSerializer
    model = Page
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return workspace_page_accessible_queryset(
            self.kwargs.get("slug"), self.request.user
        ).select_related("workspace", "owned_by")

    def get(self, request, slug, pk):
        page = self.get_queryset().get(pk=pk)
        serializer = PageDetailSerializer(page, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, pk):
        page = self.get_queryset().get(pk=pk)

        if page.is_locked and set(request.data.keys()) - {"is_locked"}:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

        requested_access = request.data.get("access", page.access)
        try:
            requested_access = int(requested_access)
        except (TypeError, ValueError):
            return Response({"error": "Invalid access value"}, status=status.HTTP_400_BAD_REQUEST)

        if page.access != requested_access and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.data.get("external_id"):
            duplicate = Page.objects.filter(
                workspace=page.workspace,
                is_global=True,
                external_source=request.data.get("external_source", page.external_source),
                external_id=request.data["external_id"],
            ).exclude(pk=pk).first()
            if duplicate:
                return Response(
                    {
                        "error": "Page with the same external id and external source already exists",
                        "id": str(duplicate.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        page_description = page.description_html
        serializer = PageDetailSerializer(
            page,
            data=request.data,
            partial=True,
            context={"workspace_id": page.workspace_id},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        page = serializer.save()
        if request.data.get("description_html"):
            page_transaction.delay(
                new_description_html=page.description_html or "<p></p>",
                old_description_html=page_description,
                page_id=str(pk),
            )
        return Response(serializer.data, status=status.HTTP_200_OK)


class PageArchiveUnarchiveAPIEndpoint(BaseAPIView):
    """Page Archive and Unarchive Endpoint"""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return project_page_queryset(self.kwargs.get("slug"), self.kwargs.get("project_id"), self.request.user)

    @page_docs(
        operation_id="archive_page",
        summary="Archive page",
        description="Archive a page and all of its nested pages. Only the page owner or a project admin can archive it.",  # noqa: E501
        parameters=[
            PAGE_ID_PARAMETER,
        ],
        responses={
            200: ARCHIVED_RESPONSE,
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, pk):
        """Archive page

        Archive a page and all of its nested pages.
        Only the page owner or a project admin can archive it.
        """
        page = self.get_queryset().get(pk=pk)

        # only the owner or admin can archive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id, member=request.user, is_active=True, role__lte=ROLE.MEMBER.value
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can archive the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=pk,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        unarchive_archive_page_and_descendants(pk, datetime.now())

        return Response({"archived_at": str(datetime.now())}, status=status.HTTP_200_OK)

    @page_docs(
        operation_id="unarchive_page",
        summary="Unarchive page",
        description="Restore an archived page and all of its nested pages. Only the page owner or a project admin can unarchive it.",  # noqa: E501
        parameters=[
            PAGE_ID_PARAMETER,
        ],
        responses={
            204: UNARCHIVED_RESPONSE,
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Unarchive page

        Restore an archived page and all of its nested pages.
        Only the page owner or a project admin can unarchive it.
        """
        page = self.get_queryset().get(pk=pk)

        # only the owner or admin can unarchive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id, member=request.user, is_active=True, role__lte=ROLE.MEMBER.value
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can unarchive the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # if parent archived then page will be unarchived breaking hierarchy
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(pk, None)

        return Response(status=status.HTTP_204_NO_CONTENT)
