# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import datetime

# Django imports
from django.db import connection, transaction
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse

# Module imports
from plane.api.serializers import PageAPISerializer
from plane.app.permissions import ProjectPagePermission
from plane.db.models import (
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    UserFavorite,
    UserRecentVisit,
)
from plane.bgtasks.page_transaction_task import page_transaction

from .base import BaseAPIView


def unarchive_archive_page_and_descendants(page_id, archived_at):
    """Archive or unarchive a page and all its descendant pages."""
    sql = """
    WITH RECURSIVE descendants AS (
        SELECT id FROM pages WHERE id = %s
        UNION ALL
        SELECT pages.id FROM pages, descendants WHERE pages.parent_id = descendants.id
    )
    UPDATE pages SET archived_at = %s WHERE id IN (SELECT id FROM descendants);
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [page_id, archived_at])


class PageListCreateAPIEndpoint(BaseAPIView):
    """Page List and Create Endpoint for the public v1 API."""

    serializer_class = PageAPISerializer
    model = Page
    permission_classes = [ProjectPagePermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                projects__id=self.kwargs.get("project_id"),
                projects__archived_at__isnull=True,
            )
            .filter(project_pages__deleted_at__isnull=True)
            .select_related("workspace", "owned_by")
            .order_by("-created_at")
            .distinct()
        )

    @extend_schema(
        operation_id="list_pages",
        summary="List pages",
        description="Retrieve a paginated list of all pages in a project.",
        tags=["Pages"],
        responses={
            200: OpenApiResponse(
                description="Paginated list of pages",
                response=PageAPISerializer(many=True),
            ),
        },
    )
    def get(self, request, slug, project_id):
        """List pages

        Retrieve a paginated list of all pages in a project.
        Excludes archived pages by default.
        """
        queryset = self.get_queryset().filter(archived_at__isnull=True)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: PageAPISerializer(
                pages,
                many=True,
                fields=self.fields,
                expand=self.expand,
            ).data,
        )

    @extend_schema(
        operation_id="create_page",
        summary="Create page",
        description="Create a new page in the specified project.",
        tags=["Pages"],
        request=PageAPISerializer,
        responses={
            201: OpenApiResponse(
                description="Page created",
                response=PageAPISerializer,
            ),
            409: OpenApiResponse(description="Duplicate external_id"),
        },
    )
    def post(self, request, slug, project_id):
        """Create page

        Create a new page in the specified project.
        Supports external_id/external_source for third-party integrations.
        """
        project = Project.objects.get(pk=project_id)

        serializer = PageAPISerializer(data=request.data)
        if serializer.is_valid():
            # Check for duplicate external_id
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
                existing = Page.objects.filter(
                    workspace__slug=slug,
                    projects__id=project_id,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).first()
                return Response(
                    {
                        "error": "Page with the same external id and external source already exists",
                        "id": str(existing.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            with transaction.atomic():
                page = serializer.save(
                    owned_by=request.user,
                    workspace_id=project.workspace_id,
                    description_html=request.data.get(
                        "description_html", "<p></p>"
                    ),
                    description_binary=None,
                )

                ProjectPage.objects.create(
                    workspace_id=project.workspace_id,
                    project_id=project_id,
                    page_id=page.id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )

            # Track page transaction for version history
            page_transaction.delay(
                new_description_html=request.data.get(
                    "description_html", "<p></p>"
                ),
                old_description_html=None,
                page_id=page.id,
            )

            return Response(
                PageAPISerializer(page).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PageDetailAPIEndpoint(BaseAPIView):
    """Page Retrieve, Update, and Delete Endpoint for the public v1 API."""

    serializer_class = PageAPISerializer
    model = Page
    permission_classes = [ProjectPagePermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                projects__id=self.kwargs.get("project_id"),
                projects__archived_at__isnull=True,
            )
            .filter(project_pages__deleted_at__isnull=True)
            .select_related("workspace", "owned_by")
            .distinct()
        )

    @extend_schema(
        operation_id="retrieve_page",
        summary="Retrieve page",
        description="Retrieve a specific page by its ID.",
        tags=["Pages"],
        responses={
            200: OpenApiResponse(
                description="Page details",
                response=PageAPISerializer,
            ),
        },
    )
    def get(self, request, slug, project_id, page_id):
        """Retrieve page

        Retrieve a specific page by its ID.
        """
        page = self.get_queryset().get(pk=page_id)
        return Response(
            PageAPISerializer(page, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="update_page",
        summary="Update page",
        description="Update a page's properties. Locked and archived pages cannot be updated.",
        tags=["Pages"],
        request=PageAPISerializer,
        responses={
            200: OpenApiResponse(
                description="Page updated",
                response=PageAPISerializer,
            ),
            400: OpenApiResponse(description="Page is locked or archived"),
        },
    )
    def patch(self, request, slug, project_id, page_id):
        """Update page

        Update a page's properties. Locked and archived pages cannot be updated.
        Only the page owner can change the access level.
        """
        page = self.get_queryset().get(pk=page_id)

        if page.is_locked:
            return Response(
                {"error": "Page is locked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.archived_at:
            return Response(
                {"error": "Archived page cannot be edited"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only the owner can change access
        if (
            page.access != request.data.get("access", page.access)
            and page.owned_by_id != request.user.id
        ):
            return Response(
                {
                    "error": "Access cannot be updated since this page is owned by someone else"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        old_description_html = page.description_html

        serializer = PageAPISerializer(page, data=request.data, partial=True)
        if serializer.is_valid():
            # Reset description_binary when description_html changes
            if request.data.get("description_html"):
                serializer.save(description_binary=None)
            else:
                serializer.save()

            # Track page transaction for version history
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_description_html=request.data.get(
                        "description_html", "<p></p>"
                    ),
                    old_description_html=old_description_html,
                    page_id=page_id,
                )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        operation_id="delete_page",
        summary="Delete page",
        description="Permanently delete a page. The page must be archived first.",
        tags=["Pages"],
        responses={
            204: OpenApiResponse(description="Page deleted"),
            400: OpenApiResponse(description="Page must be archived first"),
            403: OpenApiResponse(description="Only owner or admin can delete"),
        },
    )
    def delete(self, request, slug, project_id, page_id):
        """Delete page

        Permanently delete a page. The page must be archived first.
        Only the page owner or a project admin can delete a page.
        """
        page = self.get_queryset().get(pk=page_id)

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

        # Remove parent from all children
        Page.objects.filter(
            parent_id=page_id,
            projects__id=project_id,
            workspace__slug=slug,
            project_pages__deleted_at__isnull=True,
        ).update(parent=None)

        page.delete()

        # Delete user favorites for this page
        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_type="page",
        ).delete()

        # Delete from recent visits
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_name="page",
        ).delete(soft=False)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PageArchiveAPIEndpoint(BaseAPIView):
    """Page Archive and Unarchive Endpoint for the public v1 API."""

    permission_classes = [ProjectPagePermission]

    @extend_schema(
        operation_id="archive_page",
        summary="Archive page",
        description="Archive a page and all its descendant pages.",
        tags=["Pages"],
        request=None,
        responses={
            200: OpenApiResponse(description="Page archived"),
        },
    )
    def post(self, request, slug, project_id, page_id):
        """Archive page

        Archive a page and all its descendant pages.
        """
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=page_id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        unarchive_archive_page_and_descendants(page_id, datetime.now())

        return Response(
            {"archived_at": str(datetime.now())},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="unarchive_page",
        summary="Unarchive page",
        description="Unarchive a page and all its descendant pages.",
        tags=["Pages"],
        request=None,
        responses={
            204: OpenApiResponse(description="Page unarchived"),
        },
    )
    def delete(self, request, slug, project_id, page_id):
        """Unarchive page

        Unarchive a page and all its descendant pages.
        If the parent page is still archived, the parent reference is removed.
        """
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # If parent is still archived, break the hierarchy
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(page_id, None)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PageLockAPIEndpoint(BaseAPIView):
    """Page Lock and Unlock Endpoint for the public v1 API."""

    permission_classes = [ProjectPagePermission]

    @extend_schema(
        operation_id="lock_page",
        summary="Lock page",
        description="Lock a page to prevent editing. Only the page owner can lock a page.",
        tags=["Pages"],
        request=None,
        responses={
            200: OpenApiResponse(description="Page locked"),
            403: OpenApiResponse(description="Only page owner can lock"),
        },
    )
    def post(self, request, slug, project_id, page_id):
        """Lock page

        Lock a page to prevent editing. Only the page owner can lock a page.
        """
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        if page.owned_by_id != request.user.id:
            return Response(
                {"error": "Only the page owner can lock the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        page.is_locked = True
        page.save()
        return Response(
            {"is_locked": True},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="unlock_page",
        summary="Unlock page",
        description="Unlock a page to allow editing. Only the page owner can unlock a page.",
        tags=["Pages"],
        request=None,
        responses={
            200: OpenApiResponse(description="Page unlocked"),
            403: OpenApiResponse(description="Only page owner can unlock"),
        },
    )
    def delete(self, request, slug, project_id, page_id):
        """Unlock page

        Unlock a page to allow editing. Only the page owner can unlock a page.
        """
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        if page.owned_by_id != request.user.id:
            return Response(
                {"error": "Only the page owner can unlock the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        page.is_locked = False
        page.save()
        return Response(
            {"is_locked": False},
            status=status.HTTP_200_OK,
        )
