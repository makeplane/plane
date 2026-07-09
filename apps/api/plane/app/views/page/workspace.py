# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json
from datetime import datetime

from django.core.serializers.json import DjangoJSONEncoder

# Django imports
from django.db import transaction
from django.db.models import (
    Case,
    Count,
    Exists,
    IntegerField,
    OuterRef,
    Q,
    UUIDField,
    Value,
    When,
)
from django.http import StreamingHttpResponse
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, WorkspacePagePermission, allow_permission
from plane.app.serializers import (
    PageBinaryUpdateSerializer,
    PageDetailSerializer,
    PageSerializer,
    PageVersionDetailSerializer,
    PageVersionSerializer,
    WorkspacePageSerializer,
)
from plane.db.models import (
    Page,
    PageLog,
    PageVersion,
    UserFavorite,
    UserRecentVisit,
    Workspace,
    WorkspaceMember,
)
from plane.utils.error_codes import ERROR_CODES

# Local imports
from ..base import BaseAPIView, BaseViewSet
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.page_version_task import track_page_version
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.bgtasks.copy_s3_object import copy_s3_objects_of_description_and_assets
from .base import PageViewSet, unarchive_archive_page_and_descendants


def _is_workspace_admin(user, slug):
    """True when the user is an active workspace admin."""
    return WorkspaceMember.objects.filter(
        workspace__slug=slug,
        member=user,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists()


class WorkspacePageViewSet(PageViewSet):
    """CRUD over workspace (wiki) pages.

    A workspace page is a ``Page`` with ``is_global=True`` and no ``ProjectPage``
    row. The project ``get_base_queryset`` cannot be reused: its inner join on
    ``projects__…`` mechanically excludes the pages that live at the workspace
    level, so the queryset is rebuilt here on the workspace scope.
    """

    permission_classes = [WorkspacePagePermission]

    def get_base_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            Page.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                is_global=True,
                projects__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .prefetch_related("labels")
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "page_labels__label_id",
                        distinct=True,
                        filter=~Q(page_labels__label_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                # A workspace page never belongs to a project — constant empty
                # array so the serializers keep a coherent contract
                project_ids=Value([], output_field=ArrayField(UUIDField())),
            )
            .order_by("-is_favorite", "-created_at")
            .distinct()
        )

    def _get_workspace_page(self, slug, page_id):
        """Fetch a page of the workspace container or raise ``Page.DoesNotExist``.

        The ``is_global`` + ``projects__isnull`` filters are the guard against
        reaching a project page through the workspace routes (IDOR).
        """
        return Page.objects.filter(is_global=True, projects__isnull=True).get(pk=page_id, workspace__slug=slug)

    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        parent = request.data.get("parent", None)
        # Container invariant: the parent of a workspace page must be a
        # workspace page of the same workspace (never a project page)
        if (
            parent
            and not Page.objects.filter(
                Q(owned_by=request.user) | Q(access=Page.PUBLIC_ACCESS),
                pk=parent,
                workspace__slug=slug,
                is_global=True,
                projects__isnull=True,
                archived_at__isnull=True,
            ).exists()
        ):
            return Response(
                {"error": "The parent page must be a workspace page of the same workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = WorkspacePageSerializer(
            data=request.data,
            context={
                "workspace_id": workspace.id,
                "owned_by_id": request.user.id,
                "description_json": request.data.get("description_json", {}),
                "description_binary": request.data.get("description_binary", None),
                "description_html": request.data.get("description_html", "<p></p>"),
            },
        )

        if serializer.is_valid():
            serializer.save()
            # capture the page transaction
            page_transaction.delay(
                new_description_html=request.data.get("description_html", "<p></p>"),
                old_description_html=None,
                page_id=serializer.data["id"],
            )
            page = self.get_base_queryset().get(pk=serializer.data["id"])
            serializer = PageDetailSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, slug, page_id):
        try:
            with transaction.atomic():
                parent = request.data.get("parent", None)
                # Lock the page and its prospective parent in a deterministic
                # (pk-ordered) sequence so concurrent re-parenting cannot race
                # into a parent cycle (e.g. A->B and B->A committing together).
                lock_ids = sorted({str(page_id), str(parent)}) if parent else [str(page_id)]
                list(Page.objects.select_for_update().filter(pk__in=lock_ids).order_by("id"))

                page = self._get_workspace_page(slug, page_id)

                if page.is_locked:
                    return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

                if parent:
                    if str(parent) == str(page_id):
                        return Response(
                            {"error": "A page cannot be its own parent"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    # Container invariant: the parent must be a workspace page
                    # of the same workspace, non-archived, and visible to the
                    # requester (own page or public).
                    if not Page.objects.filter(
                        Q(owned_by=request.user) | Q(access=Page.PUBLIC_ACCESS),
                        pk=parent,
                        workspace__slug=slug,
                        is_global=True,
                        projects__isnull=True,
                        archived_at__isnull=True,
                    ).exists():
                        return Response(
                            {"error": "The parent page must be a workspace page of the same workspace"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    # The parent cannot be the page itself or one of its
                    # descendants. Walk up the ancestor chain, guarding against
                    # pre-existing cycles in the data with a visited set.
                    seen_ancestor_ids = {str(page_id)}
                    ancestor_id = Page.objects.filter(pk=parent).values_list("parent_id", flat=True).first()
                    while ancestor_id is not None:
                        if str(ancestor_id) == str(page_id) or str(ancestor_id) in seen_ancestor_ids:
                            return Response(
                                {"error": "A page cannot be moved under one of its own descendants"},
                                status=status.HTTP_400_BAD_REQUEST,
                            )
                        seen_ancestor_ids.add(str(ancestor_id))
                        ancestor_id = Page.objects.filter(pk=ancestor_id).values_list("parent_id", flat=True).first()

                # Only update access if the page owner is the requesting user
                if page.access != request.data.get("access", page.access) and page.owned_by_id != request.user.id:
                    return Response(
                        {"error": "Access cannot be updated since this page is owned by someone else"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                serializer = PageDetailSerializer(page, data=request.data, partial=True)
                page_description = page.description_html
                if serializer.is_valid():
                    serializer.save()
                    # capture the page transaction
                    if request.data.get("description_html"):
                        page_transaction.delay(
                            new_description_html=request.data.get("description_html", "<p></p>"),
                            old_description_html=page_description,
                            page_id=page_id,
                        )

                    return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Page.DoesNotExist:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

    def retrieve(self, request, slug, page_id=None):
        page = self.get_base_queryset().filter(pk=page_id).first()
        if page is None:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        track_visit = request.query_params.get("track_visit", "true").lower() == "true"

        issue_ids = PageLog.objects.filter(page_id=page_id, entity_name="issue").values_list(
            "entity_identifier", flat=True
        )
        data = PageDetailSerializer(page).data
        data["issue_ids"] = issue_ids
        if track_visit:
            recent_visited_task.delay(
                slug=slug,
                entity_name="workspace_page",
                entity_identifier=page_id,
                user_id=request.user.id,
                project_id=None,
            )
        return Response(data, status=status.HTTP_200_OK)

    def lock(self, request, slug, page_id):
        page = self._get_workspace_page(slug, page_id)

        # only the owner or a workspace admin can lock the page
        if page.owned_by_id != request.user.id and not _is_workspace_admin(request.user, slug):
            return Response(
                {"error": "Only the owner or admin can lock the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.is_locked = True
        page.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def unlock(self, request, slug, page_id):
        page = self._get_workspace_page(slug, page_id)

        page.is_locked = False
        page.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def access(self, request, slug, page_id):
        # access is required and must be a valid choice — an empty body must never
        # silently flip a private page to public (default-0 pitfall of the project twin)
        access = request.data.get("access")
        if access not in (Page.PUBLIC_ACCESS, Page.PRIVATE_ACCESS):
            return Response(
                {"error": "Invalid access value, expected 0 (public) or 1 (private)"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        page = self._get_workspace_page(slug, page_id)

        # Only the owner or a workspace admin can update the access of the page
        if (
            page.access != access
            and page.owned_by_id != request.user.id
            and not _is_workspace_admin(request.user, slug)
        ):
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.access = access
        page.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def list(self, request, slug):
        queryset = self.get_queryset()
        pages = PageSerializer(queryset, many=True).data
        return Response(pages, status=status.HTTP_200_OK)

    def sub_pages(self, request, slug, page_id):
        queryset = self.get_base_queryset().filter(parent_id=page_id)
        pages = PageSerializer(queryset, many=True).data
        return Response(pages, status=status.HTTP_200_OK)

    def archive(self, request, slug, page_id):
        page = self._get_workspace_page(slug, page_id)

        # only the owner or a workspace admin can archive the page
        if page.owned_by_id != request.user.id and not _is_workspace_admin(request.user, slug):
            return Response(
                {"error": "Only the owner or admin can archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=page_id,
            project__isnull=True,
            workspace__slug=slug,
        ).delete()

        # The container invariant (a workspace page can only parent workspace
        # pages of the same workspace) guarantees the recursive SQL cascade
        # never crosses over to project pages.
        unarchive_archive_page_and_descendants(page_id, datetime.now())

        return Response({"archived_at": str(datetime.now())}, status=status.HTTP_200_OK)

    def unarchive(self, request, slug, page_id):
        page = self._get_workspace_page(slug, page_id)

        # only the owner or a workspace admin can un archive the page
        if page.owned_by_id != request.user.id and not _is_workspace_admin(request.user, slug):
            return Response(
                {"error": "Only the owner or admin can un archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # if parent archived then page will be un archived breaking hierarchy
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(page_id, None)

        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, slug, page_id):
        page = self._get_workspace_page(slug, page_id)

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.owned_by_id != request.user.id and not _is_workspace_admin(request.user, slug):
            return Response(
                {"error": "Only admin or owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # remove parent from all the children
        _ = Page.objects.filter(parent_id=page_id, workspace__slug=slug).update(parent=None)

        page.delete()
        # Delete the user favorite page
        UserFavorite.objects.filter(
            project__isnull=True,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_type="page",
        ).delete()
        # Delete the page from recent visit
        UserRecentVisit.objects.filter(
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_name="workspace_page",
        ).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def summary(self, request, slug):
        queryset = (
            Page.objects.filter(
                workspace__slug=slug,
                is_global=True,
                projects__isnull=True,
            )
            .filter(parent__isnull=True)
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
            archived_pages=Count(Case(When(archived_at__isnull=False, then=1), output_field=IntegerField())),
        )

        return Response(stats, status=status.HTTP_200_OK)


class WorkspacePageFavoriteViewSet(BaseViewSet):
    model = UserFavorite

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug, page_id):
        workspace = Workspace.objects.get(slug=slug)
        # Only pages of the workspace container that the requester can read
        if (
            not Page.objects.filter(
                Q(owned_by=request.user) | Q(access=Page.PUBLIC_ACCESS),
                pk=page_id,
                workspace__slug=slug,
                is_global=True,
                projects__isnull=True,
            )
            .distinct()
            .exists()
        ):
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        _ = UserFavorite.objects.create(
            workspace_id=workspace.id,
            entity_identifier=page_id,
            entity_type="page",
            user=request.user,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, page_id):
        page_favorite = UserFavorite.objects.get(
            project__isnull=True,
            user=request.user,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_type="page",
        )
        page_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePagesDescriptionViewSet(BaseViewSet):
    """Binary (Y.js) description of a workspace page.

    This endpoint is the real access guard of the realtime collaboration: the
    live server forwards the user cookie and relies entirely on
    ``WorkspacePagePermission`` here.
    """

    permission_classes = [WorkspacePagePermission]

    def _get_workspace_page(self, slug, page_id, user):
        return Page.objects.filter(is_global=True, projects__isnull=True).get(
            Q(owned_by=user) | Q(access=Page.PUBLIC_ACCESS),
            pk=page_id,
            workspace__slug=slug,
        )

    def retrieve(self, request, slug, page_id):
        page = self._get_workspace_page(slug, page_id, request.user)
        binary_data = page.description_binary

        def stream_data():
            if binary_data:
                yield binary_data
            else:
                yield b""

        response = StreamingHttpResponse(stream_data(), content_type="application/octet-stream")
        response["Content-Disposition"] = 'attachment; filename="page_description.bin"'
        return response

    def partial_update(self, request, slug, page_id):
        page = self._get_workspace_page(slug, page_id, request.user)

        if page.is_locked:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_LOCKED"],
                    "error_message": "PAGE_LOCKED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.archived_at:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_ARCHIVED"],
                    "error_message": "PAGE_ARCHIVED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Store the old description_html before saving (needed for both tasks)
        old_description_html = page.description_html

        # Serialize the existing instance
        existing_instance = json.dumps({"description_html": old_description_html}, cls=DjangoJSONEncoder)

        # Use serializer for validation and update
        serializer = PageBinaryUpdateSerializer(page, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Capture the page transaction
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_description_html=request.data.get("description_html", "<p></p>"),
                    old_description_html=old_description_html,
                    page_id=page_id,
                )

            # Run background tasks
            track_page_version.delay(
                page_id=page_id,
                existing_instance=existing_instance,
                user_id=request.user.id,
            )
            return Response({"message": "Updated successfully"})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkspacePageVersionEndpoint(BaseAPIView):
    permission_classes = [WorkspacePagePermission]

    def get(self, request, slug, page_id, pk=None):
        # Scope to the workspace container so the versions of a project page
        # can never be read through the workspace routes
        page_versions = PageVersion.objects.filter(
            workspace__slug=slug,
            page_id=page_id,
            page__is_global=True,
            page__projects__isnull=True,
        )
        # Check if pk is provided
        if pk:
            # Return a single page version
            page_version = page_versions.get(pk=pk)
            # Serialize the page version
            serializer = PageVersionDetailSerializer(page_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Serialize the page versions
        serializer = PageVersionSerializer(page_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspacePageDuplicateEndpoint(BaseAPIView):
    permission_classes = [WorkspacePagePermission]

    def post(self, request, slug, page_id):
        page = Page.objects.filter(is_global=True, projects__isnull=True).get(pk=page_id, workspace__slug=slug)

        # check for permission
        if page.access == Page.PRIVATE_ACCESS and page.owned_by_id != request.user.id:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        # A workspace page is duplicated inside the workspace container —
        # no ProjectPage row is ever replicated
        page.pk = None
        page.name = f"{page.name} (Copy)"
        page.description_binary = None
        page.owned_by = request.user
        page.created_by = request.user
        page.updated_by = request.user
        page.save()

        page_transaction.delay(
            new_description_html=page.description_html,
            old_description_html=None,
            page_id=page.id,
        )

        # Copy the s3 objects uploaded in the page
        copy_s3_objects_of_description_and_assets.delay(
            entity_name="PAGE",
            entity_identifier=page.id,
            project_id=None,
            slug=slug,
            user_id=request.user.id,
        )

        page = (
            Page.objects.filter(pk=page.id)
            .annotate(project_ids=Value([], output_field=ArrayField(UUIDField())))
            .first()
        )
        serializer = PageDetailSerializer(page)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
