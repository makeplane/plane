# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json
from django.core.serializers.json import DjangoJSONEncoder

# Django imports
from django.db.models import (
    Exists,
    OuterRef,
    Q,
    Value,
    UUIDField,
    Count,
    Case,
    When,
    IntegerField,
)
from django.http import StreamingHttpResponse
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import (
    PageSerializer,
    PageDetailSerializer,
    PageBinaryUpdateSerializer,
)
from plane.db.models import (
    Page,
    PageLog,
    UserFavorite,
    ProjectMember,
    ProjectPage,
    Project,
    UserRecentVisit,
)
from plane.utils.error_codes import ERROR_CODES

# Local imports
from ..base import BaseAPIView, BaseViewSet
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.page_version_task import track_page_version
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.bgtasks.copy_s3_object import copy_s3_objects_of_description_and_assets
from plane.bgtasks.webhook_task import dispatch_page_webhook, model_activity
from plane.app.permissions import ProjectPagePermission
from plane.utils.host import base_host
from plane.utils.page import unarchive_archive_page_and_descendants


class PageViewSet(BaseViewSet):
    """Project page CRUD for the internal app API."""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectPagePermission]
    search_fields = ["name"]

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(parent__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .prefetch_related("projects")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .prefetch_related("labels")
            .order_by("-is_favorite", "-created_at")
            .annotate(
                project=Exists(
                    ProjectPage.objects.filter(page_id=OuterRef("id"), project_id=self.kwargs.get("project_id"))
                )
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
                    ArrayAgg("projects__id", distinct=True, filter=~Q(projects__id=True)),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .filter(project=True)
            .distinct()
        )

    def create(self, request, slug, project_id):
        """Create a page in the project and announce it to webhook subscribers."""
        serializer = PageSerializer(
            data=request.data,
            context={
                "project_id": project_id,
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
            # Dispatch the webhook for the page creation
            dispatch_page_webhook(request, slug, serializer.data["id"], verb="created")
            page = self.get_queryset().get(pk=serializer.data["id"])
            serializer = PageDetailSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, slug, project_id, page_id):
        """Update page properties and/or content, fanning out the matching webhooks."""
        try:
            page = Page.objects.get(
                pk=page_id,
                workspace__slug=slug,
                projects__id=project_id,
                project_pages__deleted_at__isnull=True,
            )

            if page.is_locked:
                return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

            parent = request.data.get("parent", None)
            if parent:
                _ = Page.objects.get(
                    pk=parent,
                    workspace__slug=slug,
                    projects__id=project_id,
                    project_pages__deleted_at__isnull=True,
                )

            # Only update access if the page owner is the requesting  user
            if page.access != request.data.get("access", page.access) and page.owned_by_id != request.user.id:
                return Response(
                    {"error": "Access cannot be updated since this page is owned by someone else"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = PageDetailSerializer(page, data=request.data, partial=True)
            page_description = page.description_html
            # Keyed on presence rather than truthiness so an empty body would
            # still count as a content change. PageDetailSerializer rejects a
            # blank description_html today, so this is defensive: it keeps the
            # branch correct if that field is ever made blankable, as it already
            # is on the model and in the public API.
            content_changed = "description_html" in request.data
            # description_html is held back from the property fan-out: content is
            # high-frequency, so it goes down the debounced path below instead of
            # emitting an undebounced webhook per edit.
            property_data = {key: value for key, value in request.data.items() if key != "description_html"}
            # Snapshot the page before the write so the fan-out can diff which
            # properties (name, access, …) changed — but only when a property
            # actually changed, and without description_html: model_activity does
            # not diff it, and a large page body would otherwise be carried in
            # every Celery message.
            current_instance = (
                json.dumps(
                    {key: value for key, value in PageDetailSerializer(page).data.items() if key != "description_html"},
                    cls=DjangoJSONEncoder,
                )
                if property_data
                else None
            )
            if serializer.is_valid():
                serializer.save()
                # capture the page transaction, recording the value that was
                # actually stored rather than the raw request body
                if content_changed:
                    page_transaction.delay(
                        new_description_html=serializer.instance.description_html,
                        old_description_html=page_description,
                        page_id=page_id,
                    )

                # Dispatch a "page" webhook (action=update) for every changed
                # property. model_activity diffs request.data against the
                # snapshot and fans out one update event per changed field.
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
        except Page.DoesNotExist:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def retrieve(self, request, slug, project_id, page_id=None):
        """Return a single page, recording the visit."""
        page = self.get_queryset().filter(pk=page_id).first()
        project = Project.objects.get(pk=project_id)
        track_visit = request.query_params.get("track_visit", "true").lower() == "true"

        """
        if the role is guest and guest_view_all_features is false and owned by is not
        the requesting user then dont show the page
        """

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not page.owned_by == request.user
        ):
            return Response(
                {"error": "You are not allowed to view this page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page is None:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            issue_ids = PageLog.objects.filter(page_id=page_id, entity_name="issue").values_list(
                "entity_identifier", flat=True
            )
            data = PageDetailSerializer(page).data
            data["issue_ids"] = issue_ids
            if track_visit:
                recent_visited_task.delay(
                    slug=slug,
                    entity_name="page",
                    entity_identifier=page_id,
                    user_id=request.user.id,
                    project_id=project_id,
                )
            return Response(data, status=status.HTTP_200_OK)

    def lock(self, request, slug, project_id, page_id):
        """Lock a page so it can no longer be edited."""
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # Report the page's real prior state — locking an already-locked page
        # must not claim it changed from unlocked.
        was_locked = page.is_locked
        page.is_locked = True
        page.save()
        dispatch_page_webhook(
            request, slug, page_id, verb="updated", field="is_locked", old_value=was_locked, new_value=True
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def unlock(self, request, slug, project_id, page_id):
        """Unlock a page so it can be edited again."""
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        was_locked = page.is_locked
        page.is_locked = False
        page.save()
        dispatch_page_webhook(
            request, slug, page_id, verb="updated", field="is_locked", old_value=was_locked, new_value=False
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def access(self, request, slug, project_id, page_id):
        """Switch a page between public and private (owner only)."""
        access = request.data.get("access", 0)
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # Only update access if the page owner is the requesting user
        if page.access != request.data.get("access", page.access) and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_access = page.access
        page.access = access
        page.save()
        dispatch_page_webhook(
            request, slug, page_id, verb="updated", field="access", old_value=old_access, new_value=access
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def list(self, request, slug, project_id):
        queryset = self.get_queryset()
        project = Project.objects.get(pk=project_id)
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
        ):
            queryset = queryset.filter(owned_by=request.user)
        pages = PageSerializer(queryset, many=True).data
        return Response(pages, status=status.HTTP_200_OK)

    def archive(self, request, slug, project_id, page_id):
        """Archive a page and its descendants."""
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # only the owner or admin can archive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        UserFavorite.objects.filter(
            entity_type="page",
            entity_identifier=page_id,
            project_id=project_id,
            workspace__slug=slug,
        ).delete()

        # One value for the SQL update, the webhook and the response so all three
        # agree (previously datetime.now() was called twice, yielding two
        # slightly different values). archived_at is a DateField, so resolve the
        # UTC date here rather than handing the database a datetime and relying
        # on the session time zone to cast it — and a naive server-local clock
        # could land on the wrong calendar day around midnight.
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

    def unarchive(self, request, slug, project_id, page_id):
        """Restore a page and its descendants."""
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # only the owner or admin can un archive the page
        if (
            ProjectMember.objects.filter(
                project_id=project_id, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can un archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # if parent archived then page will be un archived breaking hierarchy
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])

        old_archived_at = page.archived_at
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

    def destroy(self, request, slug, project_id, page_id):
        """Delete an archived page owned by the caller or a project admin."""
        page = Page.objects.get(
            pk=page_id,
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

        # remove parent from all the children
        _ = Page.objects.filter(
            parent_id=page_id,
            projects__id=project_id,
            workspace__slug=slug,
            project_pages__deleted_at__isnull=True,
        ).update(parent=None)

        page.delete()
        # Dispatch the webhook for the page deletion
        dispatch_page_webhook(request, slug, page.id, verb="deleted")
        # Delete the user favorite page
        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_type="page",
        ).delete()
        # Delete the page from recent visit
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_name="page",
        ).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def summary(self, request, slug, project_id):
        queryset = (
            Page.objects.filter(workspace__slug=slug)
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(parent__isnull=True)
            .filter(Q(owned_by=request.user) | Q(access=0))
            .annotate(
                project=Exists(
                    ProjectPage.objects.filter(page_id=OuterRef("id"), project_id=self.kwargs.get("project_id"))
                )
            )
            .filter(project=True)
            .distinct()
        )

        project = Project.objects.get(pk=project_id)
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.GUEST.value,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
        ):
            queryset = queryset.filter(owned_by=request.user)

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


class PageFavoriteViewSet(BaseViewSet):
    model = UserFavorite

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, page_id):
        """Add the page to the requesting user's favorites."""
        _ = UserFavorite.objects.create(
            project_id=project_id,
            entity_identifier=page_id,
            entity_type="page",
            user=request.user,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, page_id):
        """Remove the page from the requesting user's favorites."""
        page_favorite = UserFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_type="page",
        )
        page_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PagesDescriptionViewSet(BaseViewSet):
    """Read and persist a page's rich-text/Yjs document."""

    permission_classes = [ProjectPagePermission]

    def retrieve(self, request, slug, project_id, page_id):
        """Stream the page's Yjs document back as a binary attachment."""
        page = Page.objects.get(
            Q(owned_by=self.request.user) | Q(access=0),
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )
        binary_data = page.description_binary

        def stream_data():
            if binary_data:
                yield binary_data
            else:
                yield b""

        response = StreamingHttpResponse(stream_data(), content_type="application/octet-stream")
        response["Content-Disposition"] = 'attachment; filename="page_description.bin"'
        return response

    def partial_update(self, request, slug, project_id, page_id):
        """Persist the page's document content — the live collab server's flush target."""
        page = Page.objects.get(
            Q(owned_by=self.request.user) | Q(access=0),
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

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

            # Capture the page transaction. The serializer sanitizes
            # description_html, so record the value that was actually stored
            # rather than the raw request body.
            # Keyed on presence, not truthiness: description_html is blankable
            # and the serializer stores "" verbatim, so a flush that empties the
            # page is a real content change. Testing truthiness skipped the
            # transaction for exactly that flush — and the transaction is what
            # deletes the PageLog rows for mentions and assets the edit removed,
            # so clearing a page left its entire log behind.
            if "description_html" in request.data:
                page_transaction.delay(
                    new_description_html=page.description_html,
                    old_description_html=old_description_html,
                    page_id=page_id,
                )

            # Run background tasks
            track_page_version.delay(
                page_id=page_id,
                existing_instance=existing_instance,
                user_id=request.user.id,
            )

            # Dispatch a "page" webhook (action=update) for the content change.
            # This endpoint is what the live (Yjs) collab server flushes into on
            # every store cycle (~10s), so the delivery is debounced per page to
            # avoid a webhook per flush during an active editing session.
            # Only fire when content actually travelled in the request: a live
            # flush always carries the document, but a payload with no content
            # field at all changed nothing and must not emit an update. The
            # binary and json forms count too — a binary-only flush is still a
            # real content change.
            # Name the content field that actually travelled rather than always
            # claiming description_html: a binary-only or json-only flush is a
            # real content change, but reporting it as an HTML edit misdescribes
            # it to subscribers. Preference order puts the human-readable body
            # first when more than one form is sent, as the live server does.
            changed_content_fields = [
                content_field
                for content_field in ("description_html", "description_binary", "description_json")
                if content_field in request.data
            ]
            if changed_content_fields:
                dispatch_page_webhook(
                    request,
                    slug,
                    page_id,
                    verb="updated",
                    field=changed_content_fields[0],
                    debounce=True,
                )
            return Response({"message": "Updated successfully"})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PageDuplicateEndpoint(BaseAPIView):
    """Copy a page, its content and its project links."""

    permission_classes = [ProjectPagePermission]

    def post(self, request, slug, project_id, page_id):
        """Duplicate the page as a new page owned by the caller."""
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # check for permission
        if page.access == Page.PRIVATE_ACCESS and page.owned_by_id != request.user.id:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        # get all the project ids where page is present
        project_ids = ProjectPage.objects.filter(page_id=page_id).values_list("project_id", flat=True)

        page.pk = None
        page.name = f"{page.name} (Copy)"
        page.description_binary = None
        page.owned_by = request.user
        page.created_by = request.user
        page.updated_by = request.user
        page.save()

        for project_id in project_ids:
            ProjectPage.objects.create(
                workspace_id=page.workspace_id,
                project_id=project_id,
                page_id=page.id,
                created_by_id=page.created_by_id,
                updated_by_id=page.updated_by_id,
            )

        # Duplicating a page creates a new page, so it fires a "created" webhook
        # just like PageViewSet.create does.
        dispatch_page_webhook(request, slug, page.id, verb="created")

        page_transaction.delay(
            new_description_html=page.description_html,
            old_description_html=None,
            page_id=page.id,
        )

        # Copy the s3 objects uploaded in the page
        copy_s3_objects_of_description_and_assets.delay(
            entity_name="PAGE",
            entity_identifier=page.id,
            project_id=project_id,
            slug=slug,
            user_id=request.user.id,
        )

        page = (
            Page.objects.filter(pk=page.id)
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg("projects__id", distinct=True, filter=~Q(projects__id=True)),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .first()
        )
        serializer = PageDetailSerializer(page)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
