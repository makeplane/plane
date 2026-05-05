# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import connection
from django.db.models import Case, Count, IntegerField, Q, When
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import PageSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Page, ProjectPage
from .base import BaseAPIView


def _archive_page_and_descendants(page_id, archived_at):
    """Recursively archive (or unarchive) a page and all its sub-pages."""
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


class ProjectPageListCreateAPIEndpoint(BaseAPIView):
    """List and create project pages via the public API."""

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
            )
            .select_related("workspace")
            .select_related("owned_by")
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, project_id):
        return self.paginate(
            request=request,
            queryset=self.get_queryset().filter(archived_at__isnull=True),
            on_results=lambda pages: PageSerializer(
                pages, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    def post(self, request, slug, project_id):
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

        serializer = PageSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "owned_by_id": request.user.id,
            },
        )
        if serializer.is_valid():
            serializer.save()
            page = self.get_queryset().get(pk=serializer.instance.id)
            return Response(
                PageSerializer(page).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectPageDetailAPIEndpoint(BaseAPIView):
    """Retrieve, update and delete a project page via the public API."""

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
            )
            .select_related("workspace")
            .select_related("owned_by")
            .distinct()
        )

    def get(self, request, slug, project_id, page_id):
        page = self.get_queryset().get(pk=page_id)
        serializer = PageSerializer(page, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id, page_id):
        page = self.get_queryset().get(pk=page_id)

        if page.is_locked:
            return Response(
                {"error": "Page is locked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            page.access != request.data.get("access", page.access)
            and page.owned_by_id != request.user.id
        ):
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PageSerializer(page, data=request.data, partial=True)
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
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, page_id):
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        if page.owned_by_id != request.user.id:
            return Response(
                {"error": "Only the page owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        ProjectPage.objects.filter(
            page_id=page.id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()
        page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPageArchiveAPIEndpoint(BaseAPIView):
    """Archive, unarchive and list archived project pages via the public API."""

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
            )
            .filter(archived_at__isnull=False)
            .select_related("workspace")
            .select_related("owned_by")
            .order_by("-archived_at")
            .distinct()
        )

    def get(self, request, slug, project_id):
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda pages: PageSerializer(
                pages, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    def post(self, request, slug, project_id, page_id):
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )
        if page.archived_at is not None:
            return Response(
                {"error": "Page is already archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        _archive_page_and_descendants(page_id, now)
        return Response({"archived_at": str(now)}, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, page_id):
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )
        # if parent is still archived, detach to avoid resurrecting under archived parent
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])
        _archive_page_and_descendants(page_id, None)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPageLockAPIEndpoint(BaseAPIView):
    """Lock and unlock a project page via the public API."""

    permission_classes = [ProjectEntityPermission]

    def post(self, request, slug, project_id, page_id):
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
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )
        page.is_locked = False
        page.save(update_fields=["is_locked"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPageAccessAPIEndpoint(BaseAPIView):
    """Toggle access (public/private) on a project page via the public API."""

    permission_classes = [ProjectEntityPermission]

    def post(self, request, slug, project_id, page_id):
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )
        access = request.data.get("access")
        if access is None:
            return Response(
                {"error": "'access' is required (0=public, 1=private)"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            access = int(access)
        except (TypeError, ValueError):
            return Response(
                {"error": "'access' must be an integer (0=public, 1=private)"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if access not in (Page.PUBLIC_ACCESS, Page.PRIVATE_ACCESS):
            return Response(
                {"error": "'access' must be 0 (public) or 1 (private)"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if page.access != access and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Only the page owner can change access"},
                status=status.HTTP_403_FORBIDDEN,
            )
        page.access = access
        page.save(update_fields=["access"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPageDuplicateAPIEndpoint(BaseAPIView):
    """Duplicate a project page via the public API."""

    permission_classes = [ProjectEntityPermission]

    def post(self, request, slug, project_id, page_id):
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )
        if page.access == Page.PRIVATE_ACCESS and page.owned_by_id != request.user.id:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        project_ids = list(
            ProjectPage.objects.filter(page_id=page.id).values_list("project_id", flat=True)
        )

        page.pk = None
        page.name = f"{page.name} (Copy)"
        page.description_binary = None
        page.owned_by = request.user
        page.created_by = request.user
        page.updated_by = request.user
        page.archived_at = None
        page.save()

        for pid in project_ids:
            ProjectPage.objects.create(
                workspace_id=page.workspace_id,
                project_id=pid,
                page_id=page.id,
                created_by_id=page.created_by_id,
                updated_by_id=page.updated_by_id,
            )

        return Response(PageSerializer(page).data, status=status.HTTP_201_CREATED)


class ProjectPageSummaryAPIEndpoint(BaseAPIView):
    """Aggregate page counts (public, private, archived) for a project."""

    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get(self, request, slug, project_id):
        queryset = (
            Page.objects.filter(workspace__slug=slug)
            .filter(projects__id=project_id)
            .filter(project_pages__deleted_at__isnull=True)
            .filter(
                projects__project_projectmember__member=request.user,
                projects__project_projectmember__is_active=True,
            )
            .filter(Q(owned_by=request.user) | Q(access=Page.PUBLIC_ACCESS))
            .distinct()
        )
        stats = queryset.aggregate(
            public_pages=Count(
                Case(
                    When(access=Page.PUBLIC_ACCESS, archived_at__isnull=True, then=1),
                    output_field=IntegerField(),
                )
            ),
            private_pages=Count(
                Case(
                    When(access=Page.PRIVATE_ACCESS, archived_at__isnull=True, then=1),
                    output_field=IntegerField(),
                )
            ),
            archived_pages=Count(
                Case(
                    When(archived_at__isnull=False, then=1),
                    output_field=IntegerField(),
                )
            ),
        )
        return Response(stats, status=status.HTTP_200_OK)
