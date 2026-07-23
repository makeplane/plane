# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import connection, transaction
from django.db.models import Q
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiRequest, OpenApiResponse

# Module imports
from plane.api.serializers import PageAPISerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    UserFavorite,
    UserRecentVisit,
)
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.webhook_task import model_activity, webhook_activity
from plane.utils.host import base_host
from plane.utils.openapi import (
    page_docs,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    ORDER_BY_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    SEARCH_PARAMETER,
    PAGE_ID_PARAMETER,
    PAGE_TYPE_PARAMETER,
    PAGE_EXAMPLE,
    PAGE_CREATE_EXAMPLE,
    PAGE_UPDATE_EXAMPLE,
    PAGE_NOT_FOUND_RESPONSE,
    PAGE_LOCKED_RESPONSE,
    PAGE_ARCHIVED_RESPONSE,
    PAGE_ACCESS_DENIED_RESPONSE,
    CONFLICT_RESPONSE,
    DELETED_RESPONSE,
    create_paginated_response,
)

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


class PageAPIBaseView(BaseAPIView):
    """
    Shared base for the public v1 page endpoints.

    All page actions resolve pages through :meth:`get_queryset`, which is the
    single source of truth for page visibility. Access control mirrors the
    internal ``PageViewSet``: a page whose ``access`` is ``PRIVATE_ACCESS`` is
    only visible to (and mutable by) its owner, while public pages follow
    project membership. Keeping this filter in one place means every verb —
    list, retrieve, update, delete, archive, lock — enforces the same rule and
    a private page owned by someone else is never leaked (it resolves to a 404,
    not a 403, so its very existence stays hidden).
    """

    serializer_class = PageAPISerializer
    model = Page
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                projects__id=self.kwargs.get("project_id"),
                projects__archived_at__isnull=True,
            )
            .filter(project_pages__deleted_at__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            .select_related("workspace", "owned_by")
            .order_by("-created_at")
            .distinct()
        )

    def validate_parent_or_error(self, request, page_id=None):
        """Validate a requested ``parent`` against project scope and cycles.

        Returns a 400 ``Response`` describing the problem, or ``None`` when the
        parent is absent or valid. The parent must reference a page the caller
        can see within the same project — reusing the visibility queryset means
        a parent in another project/workspace, or another user's private page,
        is rejected instead of silently creating a cross-tenant/hidden link. On
        update, a self- or descendant-parent is rejected so the recursive
        archive CTE can never loop forever on a cycle.
        """
        if "parent" not in request.data:
            return None
        parent_id = request.data.get("parent")
        if parent_id in (None, ""):
            return None

        parent = self.get_queryset().filter(pk=parent_id).first()
        if parent is None:
            return Response(
                {"error": "The parent page does not exist in this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page_id is not None:
            # Walk the proposed parent's ancestor chain; if the page itself
            # appears, setting this parent would create a cycle.
            ancestor = parent
            seen = set()
            while ancestor is not None:
                if str(ancestor.id) == str(page_id):
                    return Response(
                        {"error": "A page cannot be its own parent or descendant"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if ancestor.id in seen:
                    break
                seen.add(ancestor.id)
                ancestor = ancestor.parent
        return None


class PageListCreateAPIEndpoint(PageAPIBaseView):
    """Page List and Create Endpoint for the public v1 API."""

    @page_docs(
        operation_id="list_pages",
        summary="List pages",
        description=(
            "Retrieve a paginated list of pages in a project. Private pages are "
            "only returned to their owner. Supports name search and filtering by "
            "type (all, public, private, archived)."
        ),
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            SEARCH_PARAMETER,
            PAGE_TYPE_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                PageAPISerializer,
                "PaginatedPageResponse",
                "Paginated list of pages",
                "Paginated Pages",
            ),
        },
    )
    def get(self, request, slug, project_id):
        """List pages

        Retrieve a paginated list of pages in a project. Private pages are only
        returned to their owner. Excludes archived pages unless ``type=archived``.
        """
        queryset = self.get_queryset()

        search = request.GET.get("search", None)
        if search:
            queryset = queryset.filter(name__icontains=search)

        page_type = request.GET.get("type", "all")
        if page_type == "public":
            queryset = queryset.filter(access=Page.PUBLIC_ACCESS, archived_at__isnull=True)
        elif page_type == "private":
            queryset = queryset.filter(access=Page.PRIVATE_ACCESS, archived_at__isnull=True)
        elif page_type == "archived":
            queryset = queryset.filter(archived_at__isnull=False)
        else:
            queryset = queryset.filter(archived_at__isnull=True)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: (
                PageAPISerializer(
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
        description=(
            "Create a new page in the specified project. Content is exchanged as "
            "sanitized description_html. Supports external_id/external_source for "
            "third-party integrations."
        ),
        request=OpenApiRequest(
            request=PageAPISerializer,
            examples=[PAGE_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Page created",
                response=PageAPISerializer,
                examples=[PAGE_EXAMPLE],
            ),
            409: CONFLICT_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create page

        Create a new page in the specified project.
        Supports external_id/external_source for third-party integrations.
        """
        project = Project.objects.get(workspace__slug=slug, pk=project_id)

        serializer = PageAPISerializer(data=request.data)
        if serializer.is_valid():
            # Validate the requested parent (project scope) before persisting.
            parent_error = self.validate_parent_or_error(request)
            if parent_error is not None:
                return parent_error

            # Check for a duplicate external_id. Uniqueness is project-wide (an
            # integration must not create two pages for the same external
            # record), so the existence check is intentionally unscoped by
            # visibility — but the conflicting page's id is only disclosed when
            # the caller can actually see it, so a 409 never leaks the UUID of
            # another user's private page.
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
                body = {"error": "Page with the same external id and external source already exists"}
                if self.get_queryset().filter(pk=existing.id).exists():
                    body["id"] = str(existing.id)
                return Response(body, status=status.HTTP_409_CONFLICT)

            with transaction.atomic():
                # description_html is sanitized by the serializer; description_binary
                # is reset so the live (Yjs) service regenerates it from the HTML.
                page = serializer.save(
                    owned_by=request.user,
                    workspace_id=project.workspace_id,
                    description_binary=None,
                )

                ProjectPage.objects.create(
                    workspace_id=project.workspace_id,
                    project_id=project_id,
                    page_id=page.id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )

            # Track page transaction for version history and mentions
            page_transaction.delay(
                new_description_html=page.description_html,
                old_description_html=None,
                page_id=page.id,
            )

            # Dispatch the `page` webhook event
            model_activity.delay(
                model_name="page",
                model_id=str(page.id),
                requested_data=request.data,
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

            return Response(
                PageAPISerializer(page).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PageDetailAPIEndpoint(PageAPIBaseView):
    """Page Retrieve, Update, and Delete Endpoint for the public v1 API."""

    @page_docs(
        operation_id="retrieve_page",
        summary="Retrieve page",
        description="Retrieve a specific page by its ID. Private pages are only visible to their owner.",
        parameters=[PAGE_ID_PARAMETER, FIELDS_PARAMETER, EXPAND_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Page details",
                response=PageAPISerializer,
                examples=[PAGE_EXAMPLE],
            ),
            404: PAGE_NOT_FOUND_RESPONSE,
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

    @page_docs(
        operation_id="update_page",
        summary="Update page",
        description="Update a page's properties. Locked and archived pages cannot be updated.",
        parameters=[PAGE_ID_PARAMETER],
        request=OpenApiRequest(
            request=PageAPISerializer,
            examples=[PAGE_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Page updated",
                response=PageAPISerializer,
                examples=[PAGE_EXAMPLE],
            ),
            400: PAGE_LOCKED_RESPONSE,
            403: PAGE_ACCESS_DENIED_RESPONSE,
            404: PAGE_NOT_FOUND_RESPONSE,
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
        if page.access != request.data.get("access", page.access) and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate the requested parent (project scope + no cycles).
        parent_error = self.validate_parent_or_error(request, page_id=page_id)
        if parent_error is not None:
            return parent_error

        # Guard external_id uniqueness on update, mirroring the create path and
        # the cycle/module endpoints, so a page's external_id can't be changed
        # to one already used by another page in the project.
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

        # Snapshot before mutation for version history + webhook diffing
        old_description_html = page.description_html
        current_instance = json.dumps(PageAPISerializer(page).data, cls=DjangoJSONEncoder)

        serializer = PageAPISerializer(page, data=request.data, partial=True)
        if serializer.is_valid():
            # Reset description_binary when description_html changes so the live
            # (Yjs) service regenerates it from the sanitized HTML.
            if request.data.get("description_html"):
                page = serializer.save(description_binary=None)
            else:
                page = serializer.save()

            # Track page transaction for version history and mentions
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_description_html=page.description_html,
                    old_description_html=old_description_html,
                    page_id=page_id,
                )

            # Dispatch the `page` webhook event
            model_activity.delay(
                model_name="page",
                model_id=str(page_id),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @page_docs(
        operation_id="delete_page",
        summary="Delete page",
        description="Permanently delete a page. The page must be archived first.",
        parameters=[PAGE_ID_PARAMETER],
        responses={
            204: DELETED_RESPONSE,
            400: PAGE_ARCHIVED_RESPONSE,
            403: PAGE_ACCESS_DENIED_RESPONSE,
            404: PAGE_NOT_FOUND_RESPONSE,
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

        # Dispatch the `page` webhook delete event
        webhook_activity.delay(
            event="page",
            verb="deleted",
            field=None,
            old_value=None,
            new_value=None,
            actor_id=str(request.user.id),
            slug=slug,
            current_site=base_host(request=request, is_app=True),
            event_id=str(page_id),
            old_identifier=None,
            new_identifier=None,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class PageArchiveAPIEndpoint(PageAPIBaseView):
    """Page Archive and Unarchive Endpoint for the public v1 API."""

    @page_docs(
        operation_id="archive_page",
        summary="Archive page",
        description="Archive a page and all its descendant pages.",
        parameters=[PAGE_ID_PARAMETER],
        request=None,
        responses={
            200: OpenApiResponse(description="Page archived"),
            404: PAGE_NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, page_id):
        """Archive page

        Archive a page and all its descendant pages.
        """
        page = self.get_queryset().get(pk=page_id)

        current_instance = json.dumps(PageAPISerializer(page).data, cls=DjangoJSONEncoder)
        # Page.archived_at is a DateField, so persist (and report) a date — a
        # full timestamp would not round-trip on a subsequent read.
        archived_at = timezone.now().date()

        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=page_id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        unarchive_archive_page_and_descendants(page_id, archived_at)

        # Dispatch the `page` webhook event for the archived_at change
        model_activity.delay(
            model_name="page",
            model_id=str(page_id),
            requested_data={"archived_at": str(archived_at)},
            current_instance=current_instance,
            actor_id=request.user.id,
            slug=slug,
            origin=base_host(request=request, is_app=True),
        )

        return Response(
            {"archived_at": str(archived_at)},
            status=status.HTTP_200_OK,
        )

    @page_docs(
        operation_id="unarchive_page",
        summary="Unarchive page",
        description="Unarchive a page and all its descendant pages.",
        parameters=[PAGE_ID_PARAMETER],
        request=None,
        responses={
            204: OpenApiResponse(description="Page unarchived"),
            404: PAGE_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, page_id):
        """Unarchive page

        Unarchive a page and all its descendant pages.
        If the parent page is still archived, the parent reference is removed.
        """
        page = self.get_queryset().get(pk=page_id)

        current_instance = json.dumps(PageAPISerializer(page).data, cls=DjangoJSONEncoder)

        # If parent is still archived, break the hierarchy
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(page_id, None)

        # Dispatch the `page` webhook event for the archived_at change
        model_activity.delay(
            model_name="page",
            model_id=str(page_id),
            requested_data={"archived_at": None},
            current_instance=current_instance,
            actor_id=request.user.id,
            slug=slug,
            origin=base_host(request=request, is_app=True),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class PageLockAPIEndpoint(PageAPIBaseView):
    """Page Lock and Unlock Endpoint for the public v1 API."""

    @page_docs(
        operation_id="lock_page",
        summary="Lock page",
        description="Lock a page to prevent editing. Only the page owner can lock a page.",
        parameters=[PAGE_ID_PARAMETER],
        request=None,
        responses={
            200: OpenApiResponse(description="Page locked"),
            403: PAGE_ACCESS_DENIED_RESPONSE,
            404: PAGE_NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, page_id):
        """Lock page

        Lock a page to prevent editing. Only the page owner can lock a page.
        """
        page = self.get_queryset().get(pk=page_id)

        if page.owned_by_id != request.user.id:
            return Response(
                {"error": "Only the page owner can lock the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        current_instance = json.dumps(PageAPISerializer(page).data, cls=DjangoJSONEncoder)

        page.is_locked = True
        page.save()

        # Dispatch the `page` webhook event for the is_locked change
        model_activity.delay(
            model_name="page",
            model_id=str(page_id),
            requested_data={"is_locked": True},
            current_instance=current_instance,
            actor_id=request.user.id,
            slug=slug,
            origin=base_host(request=request, is_app=True),
        )

        return Response(
            {"is_locked": True},
            status=status.HTTP_200_OK,
        )

    @page_docs(
        operation_id="unlock_page",
        summary="Unlock page",
        description="Unlock a page to allow editing. Only the page owner can unlock a page.",
        parameters=[PAGE_ID_PARAMETER],
        request=None,
        responses={
            200: OpenApiResponse(description="Page unlocked"),
            403: PAGE_ACCESS_DENIED_RESPONSE,
            404: PAGE_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, page_id):
        """Unlock page

        Unlock a page to allow editing. Only the page owner can unlock a page.
        """
        page = self.get_queryset().get(pk=page_id)

        if page.owned_by_id != request.user.id:
            return Response(
                {"error": "Only the page owner can unlock the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        current_instance = json.dumps(PageAPISerializer(page).data, cls=DjangoJSONEncoder)

        page.is_locked = False
        page.save()

        # Dispatch the `page` webhook event for the is_locked change
        model_activity.delay(
            model_name="page",
            model_id=str(page_id),
            requested_data={"is_locked": False},
            current_instance=current_instance,
            actor_id=request.user.id,
            slug=slug,
            origin=base_host(request=request, is_app=True),
        )

        return Response(
            {"is_locked": False},
            status=status.HTTP_200_OK,
        )
