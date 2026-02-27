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
from .base import BaseAPIView
from plane.bgtasks.page_transaction_task import page_transaction


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

    def get(self, request, slug, project_id, pk):
        """Retrieve page

        Get a single page with full details including description_html.
        """
        page = self.get_queryset().get(pk=pk)
        return Response(
            PageSerializer(page, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, slug, project_id, pk):
        """Update page

        Update page properties. Locked pages cannot be updated.
        Only the page owner can change the access level.
        """
        page = Page.objects.get(
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
            if (
                request.data.get("external_id")
                and (page.external_id != request.data.get("external_id"))
                and Page.objects.filter(
                    workspace__slug=slug,
                    projects__id=project_id,
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

            # Fire page transaction on description change
            if request.data.get("description_html"):
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

    def delete(self, request, slug, project_id, pk):
        """Delete page

        Permanently delete a page. The page must be archived first.
        Only the owner or a project admin can delete.
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
