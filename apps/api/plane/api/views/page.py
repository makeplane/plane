# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import (
    Q,
    Value,
    UUIDField,
)
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import (
    PageSerializer,
    PageCreateSerializer,
    PageUpdateSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    Page,
    ProjectPage,
    ProjectMember,
    UserFavorite,
    UserRecentVisit,
    Project,
)
from plane.db.models.project import ROLE
from .base import BaseAPIView
from plane.app.views.page.base import unarchive_archive_page_and_descendants
from plane.bgtasks.page_transaction_task import page_transaction
from plane.utils.openapi import (
    page_docs,
    CONFLICT_RESPONSE,
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
            .filter(
                projects__id=self.kwargs.get("project_id"),
                project_pages__deleted_at__isnull=True,
            )
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .filter(archived_at__isnull=True)
            .select_related("workspace", "owned_by")
            .prefetch_related("projects", "labels")
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
                    ArrayAgg(
                        "projects__id",
                        distinct=True,
                        filter=~Q(projects__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .order_by("-created_at")
            .distinct()
        )

    @page_docs(
        operation_id="list_pages",
        summary="List pages",
        description="Retrieve all non-archived pages in a project that the user has access to.",
    )
    def get(self, request, slug, project_id):
        """List pages

        Retrieve all non-archived pages in a project that the user has access to.
        """
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda pages: (
                PageSerializer(
                    pages,
                    many=True,
                    fields=self.fields,
                    expand=self.expand,
                ).data
            ),
        )

    @page_docs(
        operation_id="create_page",
        summary="Create page",
        description="Create a new page within a project.",
        responses={201: PageSerializer, 409: CONFLICT_RESPONSE},
    )
    def post(self, request, slug, project_id):
        """Create page

        Create a new page within a project. Creates the Page record and
        associates it with the project via ProjectPage.
        """
        serializer = PageCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Check for duplicate external_id + external_source
            if (
                request.data.get("external_id")
                and request.data.get("external_source")
                and Page.objects.filter(
                    workspace__slug=slug,
                    projects__id=project_id,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                page = Page.objects.filter(
                    workspace__slug=slug,
                    projects__id=project_id,
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

            # Validate parent belongs to the same project
            parent_id = request.data.get("parent")
            if parent_id and not Page.objects.filter(
                pk=parent_id,
                workspace__slug=slug,
                projects__id=project_id,
                project_pages__deleted_at__isnull=True,
            ).exists():
                return Response(
                    {"error": "Parent page does not belong to this project"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            project = Project.objects.get(pk=project_id, workspace__slug=slug)

            page = serializer.save(
                workspace_id=project.workspace_id,
                owned_by=request.user,
            )

            # Create the project-page association
            ProjectPage.objects.create(
                workspace_id=project.workspace_id,
                project_id=project_id,
                page_id=page.id,
            )

            # Fire the page transaction background task
            page_transaction.delay(
                new_description_html=request.data.get("description_html", "<p></p>"),
                old_description_html=None,
                page_id=page.id,
            )

            # Re-fetch with annotations for the response
            page = self.get_queryset().get(pk=page.id)
            return Response(
                PageSerializer(page).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PageDetailAPIEndpoint(BaseAPIView):
    """Page Detail Endpoint — retrieve, update, delete"""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                projects__id=self.kwargs.get("project_id"),
                project_pages__deleted_at__isnull=True,
            )
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .select_related("workspace", "owned_by")
            .prefetch_related("projects", "labels")
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
                    ArrayAgg(
                        "projects__id",
                        distinct=True,
                        filter=~Q(projects__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .distinct()
        )

    @page_docs(
        operation_id="get_page",
        summary="Get page",
        description="Retrieve a single page with full details.",
    )
    def get(self, request, slug, project_id, pk):
        """Retrieve page

        Get a single page with full details including description_html.
        """
        page = self.get_queryset().get(pk=pk)
        return Response(
            PageSerializer(page, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_200_OK,
        )

    @page_docs(
        operation_id="update_page",
        summary="Update page",
        description="Update page properties. Locked pages cannot be updated.",
        responses={409: CONFLICT_RESPONSE},
    )
    def patch(self, request, slug, project_id, pk):
        """Update page

        Update page properties. Locked pages cannot be updated.
        Only the page owner can change the access level.
        """
        page = Page.objects.get(
            Q(owned_by=request.user) | Q(access=0),
            pk=pk,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        if page.is_locked:
            return Response(
                {"error": "Page is locked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.archived_at is not None:
            return Response(
                {"error": "Cannot update an archived page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate parent exists in the same project if provided
        parent = request.data.get("parent", None)
        if parent:
            Page.objects.get(
                pk=parent,
                workspace__slug=slug,
                projects__id=project_id,
                project_pages__deleted_at__isnull=True,
            )

        # Only the owner can change access
        if page.access != request.data.get("access", page.access) and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page_description = page.description_html

        serializer = PageUpdateSerializer(page, data=request.data, partial=True)
        if serializer.is_valid():
            # Check for external_id/external_source conflicts when either changes
            new_external_id = request.data.get("external_id", page.external_id)
            new_external_source = request.data.get("external_source", page.external_source)
            if (
                new_external_id
                and new_external_source
                and (
                    new_external_id != page.external_id
                    or new_external_source != page.external_source
                )
            ):
                existing = Page.objects.filter(
                    workspace__slug=slug,
                    projects__id=project_id,
                    external_source=new_external_source,
                    external_id=new_external_id,
                ).exclude(pk=pk).first()
                if existing:
                    return Response(
                        {
                            "error": "Page with the same external id and external source already exists",
                            "id": str(existing.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

            serializer.save()

            # Fire page transaction on description change
            if "description_html" in request.data:
                page_transaction.delay(
                    new_description_html=request.data.get("description_html", "<p></p>"),
                    old_description_html=page_description,
                    page_id=pk,
                )

            # Re-fetch with annotations
            page = self.get_queryset().get(pk=pk)
            return Response(
                PageSerializer(page).data,
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @page_docs(
        operation_id="delete_page",
        summary="Delete page",
        description="Permanently delete a page. The page must be archived first.",
    )
    def delete(self, request, slug, project_id, pk):
        """Delete page

        Permanently delete a page. The page must be archived first.
        Only the owner or a project admin can delete.
        """
        page = Page.objects.get(
            Q(owned_by=request.user) | Q(access=0),
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
                role=ROLE.ADMIN.value,
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
            parent_id=pk,
            projects__id=project_id,
            workspace__slug=slug,
            project_pages__deleted_at__isnull=True,
        ).update(parent=None)

        page.delete()

        # Clean up favorites
        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        ).delete()

        # Clean up recent visits
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_name="page",
        ).delete(soft=False)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PageArchiveUnarchiveAPIEndpoint(BaseAPIView):
    """Page Archive and Unarchive Endpoint"""

    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                projects__id=self.kwargs.get("project_id"),
                project_pages__deleted_at__isnull=True,
            )
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .filter(archived_at__isnull=False)
            .select_related("workspace", "owned_by")
            .prefetch_related("projects", "labels")
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
                    ArrayAgg(
                        "projects__id",
                        distinct=True,
                        filter=~Q(projects__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .order_by("-created_at")
            .distinct()
        )

    @page_docs(
        operation_id="list_archived_pages",
        summary="List archived pages",
        description="Retrieve all pages that have been archived in the project.",
    )
    def get(self, request, slug, project_id):
        """List archived pages

        Retrieve all pages that have been archived in the project.
        """
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda pages: (
                PageSerializer(
                    pages,
                    many=True,
                    fields=self.fields,
                    expand=self.expand,
                ).data
            ),
        )

    @page_docs(
        operation_id="archive_page",
        summary="Archive page",
        description="Move a page and its descendants to archived status.",
    )
    def post(self, request, slug, project_id, page_id):
        """Archive page

        Move a page and its descendants to archived status.
        Only the page owner or a project admin can archive.
        """
        page = Page.objects.get(
            Q(owned_by=request.user) | Q(access=0),
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # Only the owner or admin can archive
        if (
            ProjectMember.objects.filter(
                project_id=project_id,
                member=request.user,
                is_active=True,
                role__lte=ROLE.MEMBER.value,
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can archive the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=page_id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        today = timezone.now().date()
        unarchive_archive_page_and_descendants(page_id, today)

        return Response(
            {"archived_at": str(today)},
            status=status.HTTP_200_OK,
        )

    @page_docs(
        operation_id="unarchive_page",
        summary="Unarchive page",
        description="Restore an archived page and its descendants to active status.",
    )
    def delete(self, request, slug, project_id, page_id):
        """Unarchive page

        Restore an archived page and its descendants to active status.
        Only the page owner or a project admin can unarchive.
        """
        page = Page.objects.get(
            Q(owned_by=request.user) | Q(access=0),
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        if page.archived_at is None:
            return Response(
                {"error": "Page is not archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only the owner or admin can unarchive
        if (
            ProjectMember.objects.filter(
                project_id=project_id,
                member=request.user,
                is_active=True,
                role__lte=ROLE.MEMBER.value,
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can unarchive the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # If parent was deleted or is still archived, break the hierarchy
        if page.parent_id:
            parent = Page.objects.filter(pk=page.parent_id).first()
            if not parent or parent.archived_at:
                page.parent = None
                page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(page_id, None)

        return Response(status=status.HTTP_204_NO_CONTENT)
