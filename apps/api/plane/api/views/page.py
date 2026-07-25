# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json
import uuid

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse

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
from plane.bgtasks.webhook_task import dispatch_page_webhook, model_activity
from plane.utils.host import base_host
from plane.utils.page import MAX_PAGE_TREE_DEPTH, unarchive_archive_page_and_descendants
from plane.utils.openapi import (
    page_docs,
    PAGE_ID_PARAMETER,
    PAGE_TYPE_PARAMETER,
    SEARCH_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    create_paginated_response,
    PAGE_CREATE_EXAMPLE,
    PAGE_UPDATE_EXAMPLE,
    PAGE_EXAMPLE,
    PAGE_EXTERNAL_ID_EXISTS_RESPONSE,
)

from .base import BaseAPIView


class PageAPIEndpoint(BaseAPIView):
    """Shared base for the public v1 page endpoints.

    Centralises the access-scoped queryset so every action — list, retrieve,
    update, delete, archive and lock — honours page visibility identically: a
    private page (``access=PRIVATE_ACCESS``) is only ever visible or mutable to
    its owner, while public pages follow project membership (enforced by
    ``ProjectEntityPermission``). This closes the private-page leak where any
    project member could read or edit another member's private page.
    """

    serializer_class = PageAPISerializer
    model = Page
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        """The access-scoped page queryset every action reads and writes through."""
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                projects__id=self.kwargs.get("project_id"),
                projects__archived_at__isnull=True,
            )
            .filter(project_pages__deleted_at__isnull=True)
            # Visibility rule: the owner sees their own pages at any access
            # level; everyone else only sees public pages. Private pages never
            # leak to non-owners — used by every action, read or write.
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            .select_related("workspace", "owned_by")
            .distinct()
        )

    def _is_owner_or_admin(self, page):
        """True if the caller owns the page or is a project admin.

        Mirrors the internal ``PageViewSet`` authorization for archive/restore
        and delete.
        """
        if page.owned_by_id == self.request.user.id:
            return True
        return ProjectMember.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            member=self.request.user,
            role=20,
            is_active=True,
        ).exists()

    def _invalid_parent_response(self, request, page=None):
        """Validate a ``parent`` in the request body, returning an error response.

        ``parent`` is a writable relation, and DRF would otherwise resolve it
        through ``Page.objects.all()`` — letting a caller re-parent a page under
        any page id in the database, including another project's, another
        workspace's, or another user's private page. Resolving it through
        :meth:`get_queryset` instead confines the target to pages this caller can
        actually see in this project.

        Also rejects a parent that would form a cycle (a page under itself or
        under one of its own descendants): the page tree is walked with a
        recursive CTE, so a cycle would recurse until it is cut off.

        Returns ``None`` when the payload is acceptable.
        """
        if "parent" not in request.data:
            return None

        parent_id = request.data.get("parent")
        if parent_id is None:
            # Explicitly detaching the page from its parent is always allowed.
            return None

        try:
            uuid.UUID(str(parent_id))
        except (AttributeError, TypeError, ValueError):
            # A malformed id would otherwise surface as the base view's generic
            # "Please provide valid detail"; name the offending field instead.
            return Response(
                {"error": "The requested parent page does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not self.get_queryset().filter(pk=parent_id).exists():
            return Response(
                {"error": "The requested parent page does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page is not None and self._parent_would_cycle(page, parent_id):
            return Response(
                {"error": "A page cannot be nested under itself or its own descendant"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return None

    def _parent_would_cycle(self, page, parent_id):
        """True if re-parenting ``page`` under ``parent_id`` closes a loop.

        Walks up from the proposed parent; if ``page`` is one of its ancestors the
        link would create a cycle. The walk is depth-bounded so an already-cyclic
        row cannot spin here either.

        The walk stays inside ``page``'s workspace. Legacy rows can carry a
        cross-tenant ``parent_id`` — the page endpoints historically accepted any
        parent id — and following one would take the search into another tenant's
        tree. It is also the wrong answer: the subtree traversal this check exists
        to protect (:func:`unarchive_archive_page_and_descendants`) stops at the
        same workspace boundary, so a chain that leaves the workspace can never
        close a cycle that traversal would follow. Bounding the walk keeps the two
        in step and makes a corrupted link terminate the search instead of
        extending it.
        """
        if str(parent_id) == str(page.id):
            return True

        ancestor_id = parent_id
        for _ in range(MAX_PAGE_TREE_DEPTH):
            ancestor = (
                Page.objects.filter(pk=ancestor_id, workspace_id=page.workspace_id)
                .values_list("parent_id", flat=True)
                .first()
            )
            if ancestor is None:
                return False
            if str(ancestor) == str(page.id):
                return True
            ancestor_id = ancestor
        return False


class PageListCreateAPIEndpoint(PageAPIEndpoint):
    """List pages in a project or create a new page (public v1 API)."""

    @page_docs(
        operation_id="list_pages",
        summary="List pages",
        description=(
            "Retrieve a paginated list of the pages the caller can access in a project. "
            "Private pages are only returned to their owner. Filter with `type` "
            "(all | public | private | archived) and `search` (page name). `type` defaults to "
            "`all`, which covers non-archived pages only — pass `archived` to list archived ones."
        ),
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            PAGE_TYPE_PARAMETER,
            SEARCH_PARAMETER,
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

        Retrieve a paginated list of pages the caller can access, filtered by
        `type` and `search`. Archived pages are excluded unless `type=archived`.
        """
        queryset = self.get_queryset()

        search = request.GET.get("search")
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
            queryset=queryset.order_by("-created_at"),
            on_results=lambda pages: PageAPISerializer(pages, many=True, fields=self.fields, expand=self.expand).data,
        )

    @page_docs(
        operation_id="create_page",
        summary="Create page",
        description=(
            "Create a new page in a project. Content is provided as `description_html`, "
            "sanitized on write. Supports `external_id`/`external_source` for integrations."
        ),
        request=PageAPISerializer,
        examples=[PAGE_CREATE_EXAMPLE],
        responses={
            201: OpenApiResponse(
                description="Page created",
                response=PageAPISerializer,
                examples=[PAGE_EXAMPLE],
            ),
            409: PAGE_EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create page

        Create a new page owned by the caller. `description_html` is sanitized;
        the Yjs binary is left empty for the live service to derive.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        # A parent must be a page this caller can already see in this project.
        invalid_parent = self._invalid_parent_response(request)
        if invalid_parent:
            return invalid_parent

        serializer = PageAPISerializer(data=request.data)
        if serializer.is_valid():
            # Reject a duplicate (external_source, external_id) pair. The lookup
            # is a single query: an exists() followed by a first() costs an extra
            # round trip and can return None if the row disappears in between.
            # Only the id is selected — a full row would drag the page body and
            # its Yjs binary back just to build an error response.
            existing = None
            if request.data.get("external_id") and request.data.get("external_source"):
                existing = (
                    Page.objects.filter(
                        workspace__slug=slug,
                        projects__id=project_id,
                        external_source=request.data.get("external_source"),
                        external_id=request.data.get("external_id"),
                    )
                    .values("id")
                    .first()
                )
            if existing:
                error = {"error": "Page with the same external id and external source already exists"}
                # The conflict itself is reported either way — the pair is taken
                # in this project no matter who owns the page holding it. The id
                # is only echoed for a page get_queryset would hand back anyway:
                # returning it for someone else's private page would leak both the
                # existence and the identifier of a page this API deliberately
                # hides. Resolved through get_queryset so the visibility rule
                # stays written once; the extra query only runs on this error path.
                if self.get_queryset().filter(pk=existing["id"]).exists():
                    error["id"] = str(existing["id"])
                return Response(error, status=status.HTTP_409_CONFLICT)

            with transaction.atomic():
                page = serializer.save(
                    owned_by=request.user,
                    workspace_id=project.workspace_id,
                    # description_html is not passed explicitly: it arrives
                    # already sanitized in validated_data, and an omitted field
                    # picks up the model's own default ("<p></p>"). Defaulting it
                    # here with `or` also rewrote an explicit "" — which means
                    # "create this page empty", the same meaning update gives it
                    # and a state the model itself models (description_stripped
                    # special-cases it) — into a paragraph the caller never sent.
                    # The binary starts empty; the live service derives it.
                    description_binary=None,
                )
                ProjectPage.objects.create(
                    workspace_id=project.workspace_id,
                    project_id=project_id,
                    page_id=page.id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )

            # Track the page transaction for version history.
            page_transaction.delay(
                new_description_html=page.description_html,
                old_description_html=None,
                page_id=page.id,
            )
            # Fire the same `page` created webhook the internal app API fires.
            dispatch_page_webhook(request, slug, page.id, verb="created")

            return Response(PageAPISerializer(page).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PageDetailAPIEndpoint(PageAPIEndpoint):
    """Retrieve, update or delete a page (public v1 API)."""

    @page_docs(
        operation_id="retrieve_page",
        summary="Retrieve page",
        description="Retrieve a page by ID. Private pages are only visible to their owner.",
        parameters=[PAGE_ID_PARAMETER, FIELDS_PARAMETER, EXPAND_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Page details",
                response=PageAPISerializer,
                examples=[PAGE_EXAMPLE],
            )
        },
    )
    def get(self, request, slug, project_id, page_id):
        """Retrieve page"""
        page = self.get_queryset().get(pk=page_id)
        return Response(
            PageAPISerializer(page, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_200_OK,
        )

    @page_docs(
        operation_id="update_page",
        summary="Update page",
        description=(
            "Update a page's properties or content. Locked and archived pages cannot be "
            "edited, and only the owner may change `access`. Content is sanitized "
            "`description_html`."
        ),
        parameters=[PAGE_ID_PARAMETER],
        request=PageAPISerializer,
        examples=[PAGE_UPDATE_EXAMPLE],
        responses={
            200: OpenApiResponse(
                description="Page updated",
                response=PageAPISerializer,
                examples=[PAGE_EXAMPLE],
            ),
            400: OpenApiResponse(description="Page is locked or archived"),
            403: OpenApiResponse(description="Only the owner can change access"),
        },
    )
    def patch(self, request, slug, project_id, page_id):
        """Update page"""
        page = self.get_queryset().get(pk=page_id)

        if page.is_locked:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

        if page.archived_at:
            return Response(
                {"error": "Archived page cannot be edited"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only the owner can change the access level.
        if page.access != request.data.get("access", page.access) and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # A parent must be a page this caller can already see in this project, and
        # must not put the page under itself or one of its descendants.
        invalid_parent = self._invalid_parent_response(request, page=page)
        if invalid_parent:
            return invalid_parent

        old_description_html = page.description_html

        # Keyed on presence, not truthiness: description_html is a blankable
        # TextField, so "" is a valid payload meaning "empty this page". Testing
        # truthiness treated that clear as "no content sent", leaving the stale
        # Yjs binary in place (so the editor resurrected the old body) and
        # skipping both the version entry and the webhook.
        content_changed = "description_html" in request.data

        # Properties travel through model_activity; content is signalled
        # separately (debounced) further down.
        property_data = {key: value for key, value in request.data.items() if key != "description_html"}
        # Snapshot BEFORE the write so the fan-out can diff what changed — but
        # only when a property actually changed, and never carrying
        # description_html: model_activity does not diff it, and a large page
        # body would otherwise ride along in every Celery message, including
        # pure-content updates that need no snapshot at all.
        current_instance = (
            json.dumps(
                {key: value for key, value in PageAPISerializer(page).data.items() if key != "description_html"},
                cls=DjangoJSONEncoder,
            )
            if property_data
            else None
        )

        serializer = PageAPISerializer(page, data=request.data, partial=True)
        if serializer.is_valid():
            if content_changed:
                # A direct content write resets the Yjs binary; the live service
                # re-derives it from the HTML on next open.
                serializer.save(description_binary=None)
            else:
                serializer.save()

            if content_changed:
                # Record what was actually stored: the serializer sanitizes
                # description_html, so the raw request body would put unsanitized
                # markup into the page's version history.
                page_transaction.delay(
                    new_description_html=serializer.instance.description_html,
                    old_description_html=old_description_html,
                    page_id=page_id,
                )

            # Property edits fan out one `page` update webhook per changed field
            # through the shared model_activity path.
            if property_data:
                model_activity.delay(
                    model_name="page",
                    model_id=str(page_id),
                    requested_data=property_data,
                    current_instance=current_instance,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=base_host(request=request, is_app=True),
                )

            # Content changes reuse the debounced content-persist webhook so an
            # integration streaming edits does not emit a webhook per call.
            if content_changed:
                dispatch_page_webhook(
                    request,
                    slug,
                    page_id,
                    verb="updated",
                    field="description_html",
                    debounce=True,
                )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @page_docs(
        operation_id="delete_page",
        summary="Delete page",
        description="Permanently delete an archived page. Only the owner or a project admin can delete.",
        parameters=[PAGE_ID_PARAMETER],
        responses={
            204: OpenApiResponse(description="Page deleted"),
            400: OpenApiResponse(description="Page must be archived first"),
            403: OpenApiResponse(description="Only owner or admin can delete"),
        },
    )
    def delete(self, request, slug, project_id, page_id):
        """Delete page"""
        page = self.get_queryset().get(pk=page_id)

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not self._is_owner_or_admin(page):
            return Response(
                {"error": "Only admin or owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Detach children so the recursive delete does not orphan them.
        Page.objects.filter(
            parent_id=page_id,
            projects__id=project_id,
            workspace__slug=slug,
            project_pages__deleted_at__isnull=True,
        ).update(parent=None)

        page.delete()
        # Fire the same `page` deleted webhook the internal app API fires.
        dispatch_page_webhook(request, slug, page.id, verb="deleted")

        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_type="page",
        ).delete()
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_name="page",
        ).delete(soft=False)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PageArchiveAPIEndpoint(PageAPIEndpoint):
    """Archive or restore a page (public v1 API)."""

    @page_docs(
        operation_id="archive_page",
        summary="Archive page",
        description="Archive a page and all its descendants. Only the owner or a project admin can archive.",
        parameters=[PAGE_ID_PARAMETER],
        request=None,
        responses={
            200: OpenApiResponse(description="Page archived"),
            403: OpenApiResponse(description="Only owner or admin can archive"),
        },
    )
    def post(self, request, slug, project_id, page_id):
        """Archive page"""
        page = self.get_queryset().get(pk=page_id)

        if not self._is_owner_or_admin(page):
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

        # One value shared by the SQL update, the webhook and the response so all
        # three agree. archived_at is a DateField, so resolve the UTC date here
        # rather than handing the database a datetime and relying on the session
        # time zone to cast it — and a naive server-local clock could land on the
        # wrong calendar day around midnight.
        old_archived_at = page.archived_at
        archived_at = timezone.now().date()
        unarchive_archive_page_and_descendants(page_id, archived_at, actor_id=request.user.id)
        dispatch_page_webhook(
            request,
            slug,
            page_id,
            verb="updated",
            field="archived_at",
            old_value=str(old_archived_at) if old_archived_at else None,
            new_value=str(archived_at),
        )

        return Response({"archived_at": str(archived_at)}, status=status.HTTP_200_OK)

    @page_docs(
        operation_id="unarchive_page",
        summary="Unarchive page",
        description="Unarchive a page and all its descendants. Only the owner or a project admin can restore.",
        parameters=[PAGE_ID_PARAMETER],
        request=None,
        responses={
            204: OpenApiResponse(description="Page unarchived"),
            403: OpenApiResponse(description="Only owner or admin can unarchive"),
        },
    )
    def delete(self, request, slug, project_id, page_id):
        """Unarchive page"""
        page = self.get_queryset().get(pk=page_id)

        if not self._is_owner_or_admin(page):
            return Response(
                {"error": "Only the owner or admin can unarchive the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        old_archived_at = page.archived_at
        # If the parent is still archived, break the hierarchy.
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(page_id, None, actor_id=request.user.id)
        dispatch_page_webhook(
            request,
            slug,
            page_id,
            verb="updated",
            field="archived_at",
            old_value=str(old_archived_at) if old_archived_at else None,
            new_value=None,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class PageLockAPIEndpoint(PageAPIEndpoint):
    """Lock or unlock a page (public v1 API)."""

    @page_docs(
        operation_id="lock_page",
        summary="Lock page",
        description="Lock a page to prevent editing. Any project member who can access the page may lock it.",
        parameters=[PAGE_ID_PARAMETER],
        request=None,
        responses={200: OpenApiResponse(description="Page locked")},
    )
    def post(self, request, slug, project_id, page_id):
        """Lock page"""
        page = self.get_queryset().get(pk=page_id)

        # Report the page's real prior state — locking an already-locked page must
        # not claim it changed from unlocked.
        was_locked = page.is_locked
        page.is_locked = True
        page.save()
        dispatch_page_webhook(
            request,
            slug,
            page_id,
            verb="updated",
            field="is_locked",
            old_value=was_locked,
            new_value=True,
        )
        return Response({"is_locked": True}, status=status.HTTP_200_OK)

    @page_docs(
        operation_id="unlock_page",
        summary="Unlock page",
        description="Unlock a page to allow editing. Any project member who can access the page may unlock it.",
        parameters=[PAGE_ID_PARAMETER],
        request=None,
        responses={200: OpenApiResponse(description="Page unlocked")},
    )
    def delete(self, request, slug, project_id, page_id):
        """Unlock page"""
        page = self.get_queryset().get(pk=page_id)

        was_locked = page.is_locked
        page.is_locked = False
        page.save()
        dispatch_page_webhook(
            request,
            slug,
            page_id,
            verb="updated",
            field="is_locked",
            old_value=was_locked,
            new_value=False,
        )
        return Response({"is_locked": False}, status=status.HTTP_200_OK)
