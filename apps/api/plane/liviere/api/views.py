# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Project pages in the public API (/api/v1), following the contract of plane-sdk 0.3.1.
# Based on makeplane/plane#9528 (RemoYukoff); guest scoping and content reset from #9774
# (rclod), the archived-page check from #8865 (nprodromou). Semantics mirror
# plane/app/views/page/base.py (PageViewSet, PagesDescriptionViewSet). Content and title of pages
# opened in the editor change through the live server (plane/liviere/live_client.py).

# Python imports
import json
from datetime import datetime

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Prefetch, Q

# Third party imports
from rest_framework import serializers, status
from rest_framework.response import Response

# Module imports
from plane.api.views.base import BaseAPIView
from plane.app.permissions import ROLE, ProjectPagePermission
from plane.app.views.page.base import unarchive_archive_page_and_descendants
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.page_version_task import track_page_version
from plane.db.models import Page, Project, ProjectMember, ProjectPage, UserFavorite, UserRecentVisit
from plane.liviere.activity.record import record_page_archive
from plane.liviere.live_client import LiveUnavailable, apply_page_edit, publish_page_update
from plane.liviere.pages import api_changes_blocked, api_changes_blocked_response, is_owner_or_admin
from plane.utils.exception_logger import log_exception

from .serializers import WRITABLE_FIELDS, PageDetailSerializer, PageSerializer


def project_pages(slug, project_id, user):
    """Pages of the project visible to the user, like PageViewSet: public ones and own private ones."""
    queryset = (
        Page.objects.filter(
            workspace__slug=slug,
            project_pages__project_id=project_id,
            project_pages__deleted_at__isnull=True,
            project_pages__project__archived_at__isnull=True,
        )
        .filter(Q(owned_by=user) | Q(access=Page.PUBLIC_ACCESS))
        .prefetch_related(
            Prefetch(
                "project_pages",
                queryset=ProjectPage.objects.filter(deleted_at__isnull=True),
                to_attr="active_project_pages",
            )
        )
        .order_by("-created_at")
    )

    # A guest sees only own pages unless the project shares all features with guests
    member = ProjectMember.objects.filter(
        workspace__slug=slug, project_id=project_id, member=user, is_active=True
    ).first()
    if member and member.role == ROLE.GUEST.value:
        project = Project.objects.get(pk=project_id)
        if not project.guest_view_all_features:
            queryset = queryset.filter(owned_by=user)
    return queryset


def external_id_conflict(slug, project_id, external_id, external_source, exclude_id=None):
    queryset = Page.objects.filter(
        workspace__slug=slug,
        project_pages__project_id=project_id,
        project_pages__deleted_at__isnull=True,
        external_id=external_id,
        external_source=external_source,
    )
    if exclude_id:
        queryset = queryset.exclude(pk=exclude_id)
    return queryset.first()


class PageListCreateAPIEndpoint(BaseAPIView):
    """List and create project pages."""

    model = Page
    serializer_class = PageSerializer
    permission_classes = [ProjectPagePermission]
    use_read_replica = True

    def get(self, request, slug, project_id):
        queryset = project_pages(slug, project_id, request.user)
        for field in ("external_id", "external_source"):
            if request.GET.get(field):
                queryset = queryset.filter(**{field: request.GET.get(field)})
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: PageSerializer(pages, many=True, fields=self.fields, expand=self.expand).data,
        )

    def post(self, request, slug, project_id):
        data = {key: value for key, value in request.data.items() if key in WRITABLE_FIELDS}
        serializer = PageDetailSerializer(
            data=data,
            context={"project_id": project_id, "user_id": request.user.id},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        external_id = serializer.validated_data.get("external_id")
        external_source = serializer.validated_data.get("external_source")
        if external_id and external_source:
            existing = external_id_conflict(slug, project_id, external_id, external_source)
            if existing:
                return Response(
                    {
                        "error": "Page with the same external id and external source already exists",
                        "id": str(existing.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        with transaction.atomic():
            page = serializer.save()
            transaction.on_commit(
                lambda: page_transaction.delay(
                    new_description_html=page.description_html,
                    old_description_html=None,
                    page_id=str(page.id),
                )
            )

        page = project_pages(slug, project_id, request.user).get(pk=page.id)
        return Response(PageDetailSerializer(page).data, status=status.HTTP_201_CREATED)


class PageDetailAPIEndpoint(BaseAPIView):
    """Retrieve, update (PUT and PATCH, both partial) and delete a project page."""

    model = Page
    serializer_class = PageDetailSerializer
    permission_classes = [ProjectPagePermission]
    use_read_replica = True

    def get(self, request, slug, project_id, page_id):
        page = project_pages(slug, project_id, request.user).get(pk=page_id)
        return Response(
            PageDetailSerializer(page, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_200_OK,
        )

    def put(self, request, slug, project_id, page_id):
        # plane-sdk sends updates as PUT with only the changed fields
        return self.patch(request, slug, project_id, page_id)

    def patch(self, request, slug, project_id, page_id):
        page = project_pages(slug, project_id, request.user).get(pk=page_id)
        if api_changes_blocked(page):
            return api_changes_blocked_response()
        data = {key: value for key, value in request.data.items() if key in WRITABLE_FIELDS}

        if page.archived_at:
            return Response({"error": "Archived page cannot be edited"}, status=status.HTTP_400_BAD_REQUEST)
        if page.is_locked:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

        # Locking and unlocking is done in the app only; an API key may set is_locked when creating a page
        if "is_locked" in data:
            try:
                requested_lock = serializers.BooleanField().to_internal_value(data.pop("is_locked"))
            except serializers.ValidationError:
                return Response({"is_locked": ["Must be a valid boolean."]}, status=status.HTTP_400_BAD_REQUEST)
            if requested_lock != page.is_locked:
                return Response({"error": "is_locked can only be changed in the app"}, status=status.HTTP_403_FORBIDDEN)

        serializer = PageDetailSerializer(
            page,
            data=data,
            partial=True,
            context={"project_id": project_id, "user_id": request.user.id},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        validated = serializer.validated_data

        # Only the owner can change the access
        if "access" in validated and validated["access"] != page.access and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        external_id = validated.get("external_id", page.external_id)
        external_source = validated.get("external_source", page.external_source)
        if ("external_id" in validated or "external_source" in validated) and external_id and external_source:
            existing = external_id_conflict(slug, project_id, external_id, external_source, exclude_id=page.id)
            if existing:
                return Response(
                    {
                        "error": "Page with the same external id and external source already exists",
                        "id": str(existing.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        # Unchanged values are not writes: keep the editor state as it is
        if validated.get("description_html") == page.description_html:
            validated.pop("description_html")
        if validated.get("name") == page.name:
            validated.pop("name")

        old_description_html = page.description_html
        content_changed = "description_html" in validated
        name_changed = "name" in validated
        live_update = None

        with transaction.atomic():
            # Serialize writes to the page while live computes the edit
            serializer.instance = Page.objects.select_for_update().get(pk=page.id)
            if (content_changed or name_changed) and serializer.instance.description_binary:
                # The page has a Yjs document (it was opened in the editor): content and title change as a
                # Yjs edit on that document, never by rebuilding it from HTML. Live applies the edit (to the
                # open document if there is one) and returns the result; it is stored here in one write.
                try:
                    edited = apply_page_edit(
                        page.id,
                        serializer.instance.description_binary,
                        description_html=validated["description_html"] if content_changed else None,
                        name=validated["name"] if name_changed else None,
                    )
                except LiveUnavailable as e:
                    log_exception(e)
                    return Response(
                        {"error": "The collaboration server is unavailable. Nothing was written, retry later."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )
                editor_state = {
                    "description_binary": edited["description_binary"],
                    "description_json": edited["description_json"],
                }
                if content_changed:
                    editor_state["description_html"] = edited["description_html"]
                page = serializer.save(**editor_state)
                live_update = edited["update"]
            else:
                page = serializer.save()

            if content_changed:
                existing_instance = json.dumps({"description_html": old_description_html}, cls=DjangoJSONEncoder)
                new_description_html = page.description_html
                transaction.on_commit(
                    lambda: (
                        page_transaction.delay(
                            new_description_html=new_description_html,
                            old_description_html=old_description_html,
                            page_id=str(page_id),
                        ),
                        track_page_version.delay(
                            page_id=str(page_id),
                            existing_instance=existing_instance,
                            user_id=str(request.user.id),
                        ),
                    )
                )
            if live_update:
                transaction.on_commit(lambda: publish_page_update(page_id, live_update))

        page = project_pages(slug, project_id, request.user).get(pk=page_id)
        return Response(PageDetailSerializer(page).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, page_id):
        page = project_pages(slug, project_id, request.user).get(pk=page_id)
        if api_changes_blocked(page):
            return api_changes_blocked_response()

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not is_owner_or_admin(request, page, project_id):
            return Response(
                {"error": "Only admin or owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            # Detach the children, like the internal destroy
            Page.objects.filter(
                parent_id=page_id,
                projects__id=project_id,
                workspace__slug=slug,
                project_pages__deleted_at__isnull=True,
            ).update(parent=None)
            page.delete()
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


class PageArchiveUnarchiveAPIEndpoint(BaseAPIView):
    """Archive (POST) and unarchive (DELETE) a page together with its nested pages."""

    model = Page
    permission_classes = [ProjectPagePermission]

    def post(self, request, slug, project_id, page_id):
        page = project_pages(slug, project_id, request.user).get(pk=page_id)
        if api_changes_blocked(page):
            return api_changes_blocked_response()
        if not is_owner_or_admin(request, page, project_id):
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
        archived_at = datetime.now()
        unarchive_archive_page_and_descendants(page_id, archived_at)
        record_page_archive(page_id, request.user)
        return Response({"archived_at": str(archived_at)}, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, page_id):
        page = project_pages(slug, project_id, request.user).get(pk=page_id)
        if api_changes_blocked(page):
            return api_changes_blocked_response()
        if not is_owner_or_admin(request, page, project_id):
            return Response(
                {"error": "Only the owner or admin can unarchive the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # An archived parent would leave the page hidden: detach it, like the internal unarchive
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        unarchive_archive_page_and_descendants(page_id, None)
        record_page_archive(page_id, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
