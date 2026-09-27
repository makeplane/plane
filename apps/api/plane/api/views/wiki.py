# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.response import Response

from plane.api.serializers import WikiPageAPISerializer, WikiPageWriteSerializer
from plane.api.service_tokens import authorize_service_request, is_service_principal
from plane.app.views.page.base import unarchive_archive_page_and_descendants
from plane.bgtasks.page_transaction_task import page_transaction
from plane.db.models import Page, UserFavorite, WikiEvent, Workspace
from plane.utils.page_access import (
    can_view_page,
    company_wiki_open_read,
    filter_visible_pages,
    resolve_workspace_role,
)
from plane.utils.page_hierarchy import PageHierarchyError, validate_page_parent
from plane.utils.wiki_ai import emit_wiki_event
from .base import BaseAPIView


SERVICE_WRITE_FIELDS = {
    "name",
    "description_markdown",
    "description_html",
    "description_json",
    "parent",
    "color",
    "sort_order",
}


def _hierarchy_error_response(exc):
    return Response(
        {"error": exc.message, "error_code": exc.code},
        status=status.HTTP_400_BAD_REQUEST,
    )


def _service_write_denied(request, slug):
    if not is_service_principal(request):
        return Response(
            {"error": "Wiki public API writes require a service access token."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if not authorize_service_request(request, slug, "wiki.pages"):
        return Response(
            {"error": "Token is missing wiki.pages:write or is outside the workspace boundary."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


def _reject_unsupported_write_fields(request):
    unsupported = sorted(set(request.data.keys()) - SERVICE_WRITE_FIELDS)
    if not unsupported:
        return None
    return Response(
        {
            "error": "Unsupported fields for wiki.pages:write.",
            "unsupported_fields": unsupported,
            "allowed_fields": sorted(SERVICE_WRITE_FIELDS),
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


def _workspace(slug):
    return Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()


def _wiki_page(workspace, page_id, *, include_archived=True):
    queryset = Page.objects.filter(
        id=page_id,
        workspace=workspace,
        is_global=True,
        deleted_at__isnull=True,
    ).select_related("workspace", "owned_by", "parent")
    if not include_archived:
        queryset = queryset.filter(archived_at__isnull=True)
    return queryset.first()


def _resolve_parent(workspace, parent_id):
    if not parent_id:
        return None
    return (
        Page.objects.filter(
            id=parent_id,
            workspace=workspace,
            is_global=True,
            deleted_at__isnull=True,
            archived_at__isnull=True,
        )
        .select_related("workspace", "parent")
        .first()
    )


class WikiPageListAPIEndpoint(BaseAPIView):
    """Read or create Workspace/Company Wiki pages through the public API."""

    service_scope = "wiki.pages"

    def _visible_queryset(self, request, workspace):
        queryset = Page.objects.filter(
            workspace=workspace,
            is_global=True,
            deleted_at__isnull=True,
        ).select_related("workspace", "owned_by", "parent")

        archived = request.GET.get("archived", "false").lower() == "true"
        queryset = queryset.filter(archived_at__isnull=not archived)

        updated_after = request.GET.get("updated_after")
        if updated_after:
            parsed = parse_datetime(updated_after)
            if parsed is None:
                return None
            queryset = queryset.filter(updated_at__gte=parsed)

        if is_service_principal(request):
            if not authorize_service_request(request, workspace.slug, self.service_scope):
                return False
            return queryset.order_by("-updated_at", "-created_at")

        role = resolve_workspace_role(workspace.id, request.user.id)
        if role is None and not company_wiki_open_read(workspace):
            return False

        return filter_visible_pages(
            queryset,
            request.user,
            workspace,
            workspace_role=role,
        ).order_by("-updated_at", "-created_at")

    def get(self, request, slug):
        workspace = _workspace(slug)
        if workspace is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        queryset = self._visible_queryset(request, workspace)
        if queryset is None:
            return Response(
                {"updated_after": "Use an ISO-8601 date-time value."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if queryset is False:
            return Response(
                {"error": "You do not have access to this workspace Wiki."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: WikiPageAPISerializer(pages, many=True).data,
        )

    def post(self, request, slug):
        workspace = _workspace(slug)
        if workspace is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        denied = _service_write_denied(request, slug)
        if denied is not None:
            return denied

        unsupported = _reject_unsupported_write_fields(request)
        if unsupported is not None:
            return unsupported

        serializer = WikiPageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        parent_id = data.pop("parent", None)
        parent = None
        if parent_id is not None:
            parent = _resolve_parent(workspace, parent_id)
            if parent is None:
                return _hierarchy_error_response(
                    PageHierarchyError("PAGE_PARENT_NOT_FOUND", "Parent page does not exist.")
                )
            try:
                validate_page_parent(
                    Page(workspace=workspace, is_global=True),
                    parent,
                    workspace=workspace,
                )
            except PageHierarchyError as exc:
                return _hierarchy_error_response(exc)

        page = Page.objects.create(
            workspace=workspace,
            owned_by=request.user,
            is_global=True,
            parent=parent,
            access=Page.PUBLIC_ACCESS,
            name=data.pop("name", ""),
            description_html=data.pop("description_html", "<p></p>"),
            description_json=data.pop("description_json", {}),
            **data,
        )

        page_transaction.delay(
            new_description_html=page.description_html,
            old_description_html=None,
            page_id=page.id,
        )
        emit_wiki_event(
            page,
            WikiEvent.PAGE_CREATED,
            actor=request.user,
            payload={
                "parent_page_id": str(page.parent_id) if page.parent_id else None,
                "source": "service_access_token",
            },
        )
        return Response(WikiPageAPISerializer(page).data, status=status.HTTP_201_CREATED)


class WikiPageDetailAPIEndpoint(BaseAPIView):
    """Retrieve or update one Workspace/Company Wiki page."""

    service_scope = "wiki.pages"

    def _authorize_read(self, request, workspace):
        if is_service_principal(request):
            return authorize_service_request(request, workspace.slug, self.service_scope), None

        role = resolve_workspace_role(workspace.id, request.user.id)
        allowed = role is not None or company_wiki_open_read(workspace)
        return allowed, role

    def get(self, request, slug, page_id):
        workspace = _workspace(slug)
        if workspace is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        allowed, role = self._authorize_read(request, workspace)
        if not allowed:
            return Response(
                {"error": "You do not have access to this workspace Wiki."},
                status=status.HTTP_403_FORBIDDEN,
            )

        page = _wiki_page(workspace, page_id)
        if page is None:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        if not is_service_principal(request) and not can_view_page(
            request.user,
            page,
            workspace,
            workspace_role=role,
        ):
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(WikiPageAPISerializer(page).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, page_id):
        workspace = _workspace(slug)
        if workspace is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        denied = _service_write_denied(request, slug)
        if denied is not None:
            return denied

        unsupported = _reject_unsupported_write_fields(request)
        if unsupported is not None:
            return unsupported

        page = _wiki_page(workspace, page_id, include_archived=False)
        if page is None:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        if page.is_locked:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = WikiPageWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        old_parent_id = page.parent_id
        old_description_html = page.description_html

        if "parent" in data:
            parent_id = data.pop("parent")
            parent = None
            if parent_id is not None:
                parent = _resolve_parent(workspace, parent_id)
                if parent is None:
                    return _hierarchy_error_response(
                        PageHierarchyError("PAGE_PARENT_NOT_FOUND", "Parent page does not exist.")
                    )
                try:
                    validate_page_parent(page, parent, workspace=workspace)
                except PageHierarchyError as exc:
                    return _hierarchy_error_response(exc)
            page.parent = parent

        for field, value in data.items():
            setattr(page, field, value)
        page.save()

        if "description_html" in data and page.description_html != old_description_html:
            page_transaction.delay(
                new_description_html=page.description_html,
                old_description_html=old_description_html,
                page_id=page.id,
            )

        emit_wiki_event(page, WikiEvent.PAGE_UPDATED, actor=request.user, payload={"source": "service_access_token"})
        if page.parent_id != old_parent_id:
            emit_wiki_event(
                page,
                WikiEvent.PAGE_MOVED,
                actor=request.user,
                payload={
                    "old_parent_page_id": str(old_parent_id) if old_parent_id else None,
                    "source": "service_access_token",
                },
            )

        return Response(WikiPageAPISerializer(page).data, status=status.HTTP_200_OK)


class WikiPageLifecycleAPIEndpoint(BaseAPIView):
    """Archive, restore, lock or unlock a Wiki page with wiki.pages:write."""

    service_scope = "wiki.pages"

    def post(self, request, slug, page_id, action):
        workspace = _workspace(slug)
        if workspace is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        denied = _service_write_denied(request, slug)
        if denied is not None:
            return denied

        page = _wiki_page(workspace, page_id)
        if page is None:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        if action == "archive":
            if page.archived_at is None:
                UserFavorite.objects.filter(
                    entity_type="page",
                    entity_identifier=page.id,
                    workspace=workspace,
                ).delete()
                unarchive_archive_page_and_descendants(page.id, timezone.now())
                page.refresh_from_db()
                emit_wiki_event(
                    page,
                    WikiEvent.PAGE_ARCHIVED,
                    actor=request.user,
                    payload={"source": "service_access_token"},
                )
        elif action == "unarchive":
            if page.archived_at is not None:
                if page.parent_id and page.parent and page.parent.archived_at:
                    page.parent = None
                    page.save(update_fields=["parent", "updated_at"])
                unarchive_archive_page_and_descendants(page.id, None)
                page.refresh_from_db()
                emit_wiki_event(
                    page,
                    WikiEvent.PAGE_RESTORED,
                    actor=request.user,
                    payload={"source": "service_access_token"},
                )
        elif action == "lock":
            if not page.is_locked:
                page.is_locked = True
                page.save(update_fields=["is_locked", "updated_at"])
                emit_wiki_event(
                    page,
                    WikiEvent.PAGE_LOCKED,
                    actor=request.user,
                    payload={"source": "service_access_token"},
                )
        elif action == "unlock":
            if page.is_locked:
                page.is_locked = False
                page.save(update_fields=["is_locked", "updated_at"])
                emit_wiki_event(
                    page,
                    WikiEvent.PAGE_UNLOCKED,
                    actor=request.user,
                    payload={"source": "service_access_token"},
                )
        else:
            return Response({"error": "Unsupported action"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(WikiPageAPISerializer(page).data, status=status.HTTP_200_OK)
