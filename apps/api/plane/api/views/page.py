# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import hashlib
import json
import uuid

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
from plane.utils.order_queryset import PAGE_ORDER_BY_ALLOWLIST, sanitize_order_by
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
    PAGE_NOT_EDITABLE_RESPONSE,
    PAGE_ACCESS_DENIED_RESPONSE,
    PAGE_NOT_ARCHIVED_RESPONSE,
    PAGE_DELETE_FORBIDDEN_RESPONSE,
    PAGE_WRITE_REJECTED_RESPONSE,
    CONFLICT_RESPONSE,
    DELETED_RESPONSE,
    create_paginated_response,
)

from .base import BaseAPIView


# Supported values for the `type` query filter on the list endpoint.
PAGE_TYPES = {"all", "public", "private", "archived"}


def as_text(value):
    """Render a value the way the model stores it, so the two compare equally."""
    return str(value) if value is not None else None


def advisory_lock_key(*parts):
    """Derive a stable 64-bit advisory-lock key from the given parts.

    Mirrors ``plane.utils.uuid.convert_uuid_to_integer`` (sha256 truncated to a
    signed bigint). The leading part namespaces the key so page locks never
    collide with other advisory locks (e.g. Issue's per-project sequence lock).
    """
    digest = hashlib.sha256(":".join(str(part) for part in parts).encode()).digest()
    return int.from_bytes(digest[:8], byteorder="big", signed=True)


def take_advisory_lock(*parts):
    """Take a transaction-scoped advisory lock, released when the txn ends."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_advisory_xact_lock(%s)", [advisory_lock_key(*parts)])


def lock_external_id(project_id, external_source, external_id):
    """Serialize writes touching one external page identity.

    ``external_id``/``external_source`` have no DB uniqueness constraint (no
    Plane entity constrains them, and a project-scoped constraint is not even
    expressible on ``Page`` — pages attach to projects through the ``ProjectPage``
    m2m). Without one, a bare check-then-insert races: two concurrent writes can
    both pass the existence check and both persist. Locking on the identity —
    the same ``pg_advisory_xact_lock`` pattern ``Issue.save`` uses to allocate
    sequence ids — makes check-then-write deterministic.
    """
    take_advisory_lock("page-external-id", project_id, external_source, external_id)


def lock_page_hierarchy(project_id):
    """Serialize reparenting within a project so cycles cannot interleave.

    Validating the ancestor chain and saving the new parent must be one atomic
    step: two concurrent updates (A under B, B under A) can each read a
    cycle-free hierarchy and then both commit, leaving a cycle that would make
    the recursive archive CTE loop forever. Reparenting is rare, so one
    project-scoped lock is enough and avoids lock-ordering deadlocks.
    """
    take_advisory_lock("page-hierarchy", project_id)


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
        """Return the visibility-filtered page queryset for this request."""
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            # Project scope, active link and live project are asserted on ONE
            # ProjectPage row. Split across separate filter() calls they become
            # separate joins meaning "linked to this project" AND "has some
            # undeleted link somewhere" — so a page removed from this project
            # but still linked to another stayed visible here. The m2m
            # (`projects__id`) cannot express it either: it joins the through
            # table directly and never sees the soft-delete.
            .filter(
                project_pages__project_id=self.kwargs.get("project_id"),
                project_pages__deleted_at__isnull=True,
                project_pages__project__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            # `parent` is selected too: the serializer reads it for the
            # expand=parent visibility check, and unarchive reads
            # parent.archived_at — both would otherwise be a query per row.
            .select_related("workspace", "owned_by", "parent")
            .order_by("-created_at")
            .distinct()
        )

    def serialize(self, pages, **kwargs):
        """Build the response serializer for this request.

        Every page response is built here so the request is always in context:
        ``PageAPISerializer`` needs it to decide whether the caller may see a
        page's ``parent``, and without it falls back to reporting the stored
        value — which is right for an internal snapshot and wrong for a reply.
        """
        return PageAPISerializer(pages, context={"request": self.request}, **kwargs)

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

        invalid_parent = Response(
            {"error": "The parent page does not exist in this project"},
            status=status.HTTP_400_BAD_REQUEST,
        )

        # A malformed UUID would otherwise surface as a generic 400 from the
        # base exception handler; report it as the parent problem it is.
        try:
            parent_id = uuid.UUID(str(parent_id))
        except (ValueError, AttributeError, TypeError):
            return invalid_parent

        if self.get_queryset().filter(pk=parent_id).first() is None:
            return invalid_parent

        if page_id is not None:
            # Walk the proposed parent's ancestor chain; if the page itself
            # appears, setting this parent would create a cycle. Only parent_id
            # is read at each level, so this never loads whole page rows, and
            # `seen` bounds the walk even if the stored data already cycles.
            ancestor_id = parent_id
            seen = set()
            while ancestor_id is not None:
                if str(ancestor_id) == str(page_id):
                    return Response(
                        {"error": "A page cannot be its own parent or descendant"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if ancestor_id in seen:
                    break
                seen.add(ancestor_id)
                ancestor_id = Page.objects.filter(pk=ancestor_id).values_list("parent_id", flat=True).first()
        return None


class PageListCreateAPIEndpoint(PageAPIBaseView):
    """Page List and Create Endpoint for the public v1 API."""

    @page_docs(
        operation_id="list_pages",
        summary="List pages",
        description=(
            "Retrieve a paginated list of pages in a project. Private pages are "
            "only returned to their owner, and a page whose parent is private to "
            "another user reports no parent. Supports name search and filtering "
            "by type (all, public, private, archived)."
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
        if page_type not in PAGE_TYPES:
            return Response(
                {
                    "error": "Invalid type",
                    "allowed": sorted(PAGE_TYPES),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page_type == "public":
            queryset = queryset.filter(access=Page.PUBLIC_ACCESS, archived_at__isnull=True)
        elif page_type == "private":
            queryset = queryset.filter(access=Page.PRIVATE_ACCESS, archived_at__isnull=True)
        elif page_type == "archived":
            queryset = queryset.filter(archived_at__isnull=False)
        else:
            queryset = queryset.filter(archived_at__isnull=True)

        # `order_by` is advertised on this endpoint, so honour it — through the
        # allowlist helper, which keeps user input out of .order_by() and falls
        # back to the default for anything unrecognised.
        queryset = queryset.order_by(
            sanitize_order_by(
                request.GET.get("order_by", "-created_at"),
                PAGE_ORDER_BY_ALLOWLIST,
                default="-created_at",
            )
        )

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: (
                self.serialize(
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
            400: PAGE_WRITE_REJECTED_RESPONSE,
            409: CONFLICT_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create page

        Create a new page in the specified project.
        Supports external_id/external_source for third-party integrations.
        """
        project = Project.objects.get(workspace__slug=slug, pk=project_id)

        # Pages in an archived project are excluded from every read path, so
        # accepting the write here would create a row the caller can never see
        # again through this API.
        if project.archived_at:
            return Response(
                {"error": "Pages cannot be added to an archived project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PageAPISerializer(data=request.data)
        if serializer.is_valid():
            external_id = request.data.get("external_id")
            external_source = request.data.get("external_source")

            with transaction.atomic():
                # Validate the requested parent (project scope) inside the
                # transaction that persists it, so a parent cannot be archived
                # or detached between the check and the insert.
                if "parent" in request.data:
                    lock_page_hierarchy(project_id)
                    parent_error = self.validate_parent_or_error(request)
                    if parent_error is not None:
                        return parent_error

                # Duplicate external_id check. Uniqueness is project-wide (an
                # integration must not create two pages for the same external
                # record), so the existence check is intentionally unscoped by
                # visibility — but the conflicting page's id is only disclosed
                # when the caller can actually see it, so a 409 never leaks the
                # UUID of another user's private page. The check and the insert
                # run inside one transaction behind an advisory lock on the
                # external identity, so concurrent creates cannot both pass it.
                if external_id and external_source:
                    lock_external_id(project_id, external_source, external_id)
                    existing = Page.objects.filter(
                        workspace__slug=slug,
                        project_pages__project_id=project_id,
                        project_pages__deleted_at__isnull=True,
                        external_source=external_source,
                        external_id=external_id,
                    ).first()
                    if existing is not None:
                        body = {"error": "Page with the same external id and external source already exists"}
                        if self.get_queryset().filter(pk=existing.id).exists():
                            body["id"] = str(existing.id)
                        return Response(body, status=status.HTTP_409_CONFLICT)

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
                self.serialize(page).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PageDetailAPIEndpoint(PageAPIBaseView):
    """Page Retrieve, Update, and Delete Endpoint for the public v1 API."""

    @page_docs(
        operation_id="retrieve_page",
        summary="Retrieve page",
        description=(
            "Retrieve a specific page by its ID. Private pages are only visible to "
            "their owner, and a page whose parent is private to another user "
            "reports no parent."
        ),
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
            self.serialize(page, fields=self.fields, expand=self.expand).data,
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
            400: PAGE_NOT_EDITABLE_RESPONSE,
            403: PAGE_ACCESS_DENIED_RESPONSE,
            404: PAGE_NOT_FOUND_RESPONSE,
            409: CONFLICT_RESPONSE,
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

        # Snapshot before mutation for version history + webhook diffing
        description_html_sent = "description_html" in request.data
        old_description_html = page.description_html
        current_instance = json.dumps(PageAPISerializer(page).data, cls=DjangoJSONEncoder)

        # The external identity is the (id, source) pair: a change to either
        # half can collide, so both are compared against the stored values.
        external_id = request.data.get("external_id", page.external_id)
        external_source = request.data.get("external_source", page.external_source)
        identity_changed = (as_text(external_id), as_text(external_source)) != (
            page.external_id,
            page.external_source,
        )

        serializer = self.serialize(page, data=request.data, partial=True)
        if serializer.is_valid():
            with transaction.atomic():
                # Validate the requested parent inside the transaction that
                # persists it. Two concurrent reparents could otherwise each see
                # a cycle-free hierarchy and both commit, leaving a cycle.
                if "parent" in request.data:
                    lock_page_hierarchy(project_id)
                    parent_error = self.validate_parent_or_error(request, page_id=page_id)
                    if parent_error is not None:
                        return parent_error

                # Guard external identity uniqueness on update, mirroring the
                # create path and the cycle/module endpoints, so a page's
                # external identity can't be changed to one already used by
                # another page in the project. Checked under the same advisory
                # lock as create so the two paths cannot race each other.
                if external_id and identity_changed:
                    lock_external_id(project_id, external_source, external_id)
                    conflict = (
                        Page.objects.filter(
                            workspace__slug=slug,
                            project_pages__project_id=project_id,
                            project_pages__deleted_at__isnull=True,
                            external_source=external_source,
                            external_id=external_id,
                        )
                        .exclude(pk=page.id)
                        .first()
                    )
                    if conflict is not None:
                        # Report the page that actually owns the identity, not
                        # the one being edited — and, as on create, only when
                        # the caller can see it, so the 409 cannot reveal the
                        # id of someone else's private page.
                        body = {"error": "Page with the same external id and external source already exists"}
                        if self.get_queryset().filter(pk=conflict.id).exists():
                            body["id"] = str(conflict.id)
                        return Response(body, status=status.HTTP_409_CONFLICT)

                # Reset description_binary whenever description_html is sent so
                # the live (Yjs) service regenerates it from the sanitized HTML.
                # Keyed on presence, not truthiness: clearing a page by sending
                # an empty body must drop the stale binary too, or the editor
                # would restore the old content from it.
                if description_html_sent:
                    page = serializer.save(description_binary=None)
                else:
                    page = serializer.save()

            # Track page transaction for version history and mentions
            if description_html_sent:
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
            400: PAGE_NOT_ARCHIVED_RESPONSE,
            403: PAGE_DELETE_FORBIDDEN_RESPONSE,
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

        # Detach EVERY child first. Page.parent is on_delete=CASCADE and
        # page.delete() soft-deletes through its relations, so any child still
        # pointing at this page goes down with it. Scoping the detach to this
        # project left children that live in another project — or whose link
        # here was removed — still attached, and deleting one page silently
        # destroyed them.
        Page.objects.filter(parent_id=page_id).update(parent=None)

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

        # Archiving walks the parent chain, so it takes the same lock as
        # reparenting and runs as one transaction: a concurrent reparent must
        # not move a page into or out of the subtree midway through the walk,
        # and the favourite cleanup must not survive a failed archive.
        with transaction.atomic():
            lock_page_hierarchy(project_id)

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

        # Detaching from an archived parent and unarchiving the subtree are one
        # hierarchy mutation: they take the reparenting lock and commit together
        # so a page can never end up detached but still archived.
        with transaction.atomic():
            lock_page_hierarchy(project_id)

            # If parent is still archived, break the hierarchy
            if page.parent_id and page.parent.archived_at:
                page.parent = None
                page.save(update_fields=["parent", "updated_at", "updated_by"])

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

        # Write only the lock flag. A bare save() would rewrite every column
        # from this in-memory copy, including description_html/description_binary,
        # clobbering any collaborative edit the live (Yjs) service persisted
        # between this request's read and its write.
        page.is_locked = True
        page.save(update_fields=["is_locked", "updated_at", "updated_by"])

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

        # Write only the lock flag — see the note on locking above.
        page.is_locked = False
        page.save(update_fields=["is_locked", "updated_at", "updated_by"])

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
