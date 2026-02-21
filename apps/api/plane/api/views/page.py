# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q, Value, UUIDField
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import PageSerializer
from plane.app.permissions import ProjectEntityPermission, ProjectPagePermission
from plane.app.views.page.base import unarchive_archive_page_and_descendants
from plane.bgtasks.page_transaction_task import page_transaction
from plane.db.models import Page, ProjectMember, UserFavorite, UserRecentVisit

from .base import BaseAPIView


class PageQuerySetMixin:
    """Shared queryset with workspace/project filtering and label/project annotations."""

    def get_queryset(self):
        return (
            Page.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                projects__id=self.kwargs.get("project_id"),
                project_pages__deleted_at__isnull=True,
            )
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


class PageListCreateAPIEndpoint(PageQuerySetMixin, BaseAPIView):
    """Page List and Create Endpoint"""

    permission_classes = [ProjectEntityPermission]

    def get(self, request, slug, project_id):
        """List pages

        Retrieve all pages in a project with support for filtering and pagination.
        """
        queryset = self.get_queryset()

        # External ID/source lookup returns a single object directly
        external_id = request.GET.get("external_id")
        external_source = request.GET.get("external_source")
        if external_id and external_source:
            page = queryset.filter(
                external_id=external_id,
                external_source=external_source,
            ).first()
            if page is None:
                return Response(
                    {"error": "The requested resource does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(PageSerializer(page).data, status=status.HTTP_200_OK)

        # Archived filter (default: non-archived)
        archived = request.GET.get("archived", "false").lower() == "true"
        if archived:
            queryset = queryset.filter(archived_at__isnull=False)
        else:
            queryset = queryset.filter(archived_at__isnull=True)

        # Access filter — validate the value is 0 (public) or 1 (private)
        access_param = request.GET.get("access")
        if access_param is not None:
            try:
                access_value = int(access_param)
                if access_value not in (Page.PUBLIC_ACCESS, Page.PRIVATE_ACCESS):
                    raise ValueError
                queryset = queryset.filter(access=access_value)
            except (ValueError, TypeError):
                return Response(
                    {"error": "access must be 0 (public) or 1 (private)"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Visibility filter: own pages only, or own + all public pages
        owned = request.GET.get("owned", "false").lower() == "true"
        if owned:
            queryset = queryset.filter(owned_by=request.user)
        else:
            queryset = queryset.filter(Q(owned_by=request.user) | Q(access=0))

        # Default: top-level pages only
        queryset = queryset.filter(parent__isnull=True)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: PageSerializer(pages, many=True).data,
        )

    def post(self, request, slug, project_id):
        """Create page

        Create a new page in the project.
        """
        # Conflict check for external_id/external_source
        external_id = request.data.get("external_id")
        external_source = request.data.get("external_source")
        if external_id and external_source:
            existing_page = Page.objects.filter(
                projects__id=project_id,
                workspace__slug=slug,
                external_id=external_id,
                external_source=external_source,
            ).first()
            if existing_page:
                return Response(
                    {
                        "error": "Page with the same external id and external source already exists",
                        "id": str(existing_page.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        serializer = PageSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "owned_by_id": request.user.id,
            },
        )
        if serializer.is_valid():
            serializer.save()
            page_transaction.delay(
                new_description_html=request.data.get("description_html", "<p></p>"),
                old_description_html=None,
                page_id=serializer.data["id"],
            )
            page = self.get_queryset().get(pk=serializer.data["id"])
            return Response(PageSerializer(page).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PageDetailAPIEndpoint(PageQuerySetMixin, BaseAPIView):
    """Page Detail Endpoint"""

    permission_classes = [ProjectPagePermission]

    def get(self, request, slug, project_id, pk):
        """Retrieve page

        Retrieve details of a specific page.
        """
        page = self.get_queryset().get(pk=pk)
        return Response(PageSerializer(page).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id, pk):
        """Update page

        Partially update a page's properties.
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

        # Only the page owner may change the access level
        if page.access != request.data.get("access", page.access) and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page_description = page.description_html
        serializer = PageSerializer(
            page,
            data=request.data,
            partial=True,
            context={"project_id": project_id},
        )
        if serializer.is_valid():
            serializer.save()
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_description_html=request.data.get("description_html", "<p></p>"),
                    old_description_html=page_description,
                    page_id=pk,
                )
            page = self.get_queryset().get(pk=pk)
            return Response(PageSerializer(page).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, pk):
        """Delete page

        Permanently delete a page. The page must be archived before deletion.
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

        # Remove parent reference from all children before deletion
        Page.objects.filter(
            parent_id=pk,
            projects__id=project_id,
            workspace__slug=slug,
            project_pages__deleted_at__isnull=True,
        ).update(parent=None)

        # Clean up related records before deleting the page
        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        ).delete()

        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_name="page",
        ).delete(soft=False)

        page.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class PageArchiveUnarchiveAPIEndpoint(BaseAPIView):
    """Page Archive and Unarchive Endpoint"""

    permission_classes = [ProjectPagePermission]

    def post(self, request, slug, project_id, page_id):
        """Archive page

        Archive a page and all its descendants.
        """
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # Only the owner or admin can archive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id,
                member=request.user,
                is_active=True,
                role__lte=15,
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

        archived_at = timezone.now().date()
        unarchive_archive_page_and_descendants(page_id, archived_at)

        return Response({"archived_at": archived_at.isoformat()}, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, page_id):
        """Unarchive page

        Restore an archived page and all its descendants.
        """
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # Only the owner or admin can unarchive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id,
                member=request.user,
                is_active=True,
                role__lte=15,
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can unarchive the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # If parent is archived, break hierarchy by clearing parent
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(page_id, None)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PageLockUnlockAPIEndpoint(BaseAPIView):
    """Page Lock and Unlock Endpoint"""

    permission_classes = [ProjectPagePermission]

    def post(self, request, slug, project_id, page_id):
        """Lock page

        Lock a page to prevent further edits.
        """
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        page.is_locked = True
        page.save(update_fields=["is_locked"])

        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, slug, project_id, page_id):
        """Unlock page

        Unlock a page to allow edits.
        """
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        page.is_locked = False
        page.save(update_fields=["is_locked"])

        return Response(status=status.HTTP_204_NO_CONTENT)
