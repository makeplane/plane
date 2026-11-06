# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Pages (workspace and project), collections, work item ↔ page links, estimates.

How page content reaches the web editor
---------------------------------------
The editor never reads `description_html`. It opens a Yjs document through the
live server (apps/live), which loads `description_binary`; only when that binary
is empty does it rebuild the document from `description_html` and `name` and
write every format back (apps/live/src/extensions/database.ts, fetchDocument).
Plane relies on exactly this when it creates a page (the web app sends no
binary) and when it duplicates one (PageDuplicateEndpoint sets
`description_binary = None`).

So an API write of `name` or `description_html` stores the sanitized HTML and
clears `description_binary` (and `description_json`), and the editor shows the
new content on its next load. The title lives in the Yjs document too, which is
why a rename also clears it.

A document that is open in an editor is held in the live server's memory, and
its next save would overwrite the API write with the old content. Before writing,
`release_live_document` therefore asks the live servers to let go of it, with the
same Redis admin command they use among themselves (`force_close` on the
`hocuspocus:admin` channel), and waits until no live server is subscribed to the
document's channel (`hocuspocus:<page id>`) any more, which happens after the
document has been stored and unloaded. Connected editors are told the page was
closed and reload it, now built from the new HTML. If the document is still held
after the timeout, the API answers 502 and writes nothing, as plane-sdk documents.
An editor can reconnect between that release and the write and load the old
content, so after writing the API releases the document once more: the editor
reloads it, now built from the new content.

Collections and who can see a page
----------------------------------
A public page filed in a private collection is visible only to the collection's
members (and its owner). Moving a page into or out of a private collection
therefore changes who can see it, so only the page's owner may do that; and a page
that leaves a private collection without moving into another one (the collection
is deleted, or the page is removed from it) becomes private to its owner rather
than visible to the whole workspace.
"""

import json
import logging
import time
from datetime import datetime

import redis
from django.db import connection, transaction
from django.db.models import Case, Exists, IntegerField, OuterRef, Q, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from plane.api.views.estimate import (
    EstimatePointDetailAPIEndpoint,
    EstimatePointListCreateAPIEndpoint,
    ProjectEstimateAPIEndpoint,
)
from plane.app.views.page.base import unarchive_archive_page_and_descendants
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.page_version_task import track_page_version
from plane.db.models import (
    Issue,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    UserFavorite,
    UserRecentVisit,
    WorkspaceMember,
)
from plane.nexus.models.page import (
    COLLECTION_PRIVATE,
    COLLECTION_PUBLIC,
    MEMBER_EDIT,
    Collection,
    CollectionMember,
    PageCollection,
    WorkItemPage,
)
from plane.nexus.serializers.page import (
    CollectionCreateSerializer,
    CollectionMemberCreateSerializer,
    CollectionMemberUpdateSerializer,
    CollectionPageUpdateSerializer,
    CollectionPagesAddSerializer,
    CollectionUpdateSerializer,
    NexusEstimateSerializer,
    PageCreateSerializer,
    PageUpdateSerializer,
    WorkItemPageCreateSerializer,
    annotate_pages,
    collection_branch_page_data,
    collection_data,
    collection_member_data,
    collection_page_data,
    page_data,
    work_item_page_data,
)
from plane.settings.redis import redis_instance
from plane.utils.content_validator import validate_html_content
from plane.utils.permissions import ProjectEntityPermission

from .base import NexusAPIView

logger = logging.getLogger("plane.api")

ADMIN, MEMBER, GUEST = 20, 15, 5

# ── Live collaboration server ────────────────────────────────────────────────

LIVE_ADMIN_CHANNEL = "hocuspocus:admin"
LIVE_DOCUMENT_CHANNEL = "hocuspocus:{}"
LIVE_RELEASE_TIMEOUT = 6.0
LIVE_RELEASE_POLL = 0.1


def _live_subscribers(client, page_id) -> int:
    return int(client.pubsub_numsub(LIVE_DOCUMENT_CHANNEL.format(page_id))[0][1])


def release_live_document(page_id) -> bool:
    """Make every live server store and unload the page's Yjs document.

    Returns False when a live server still holds it after the timeout. Without
    Redis no live server can be running, so there is nothing to release.
    """
    try:
        client = redis_instance()
        if not _live_subscribers(client, page_id):
            return True
        client.publish(
            LIVE_ADMIN_CHANNEL,
            json.dumps(
                {
                    "command": "force_close",
                    "docId": str(page_id),
                    "reason": "admin_request",
                    "code": 4000,
                    "originServer": "plane-api",
                    "timestamp": timezone.now().isoformat(),
                }
            ),
        )
        deadline = time.monotonic() + LIVE_RELEASE_TIMEOUT
        while time.monotonic() < deadline:
            time.sleep(LIVE_RELEASE_POLL)
            if not _live_subscribers(client, page_id):
                return True
        return False
    except redis.RedisError as exc:
        logger.warning("Live document release skipped, Redis unavailable: %s", exc)
        return True


def clean_html(html):
    """Plane's own sanitizer (the one the description endpoint uses), or an error."""
    if not html:
        return "<p></p>", None
    ok, error, cleaned = validate_html_content(html)
    if not ok:
        return None, error
    return (cleaned if cleaned is not None else html), None


# ── Roles and visibility ─────────────────────────────────────────────────────


def workspace_role(user, slug):
    return (
        WorkspaceMember.objects.filter(workspace__slug=slug, member=user, is_active=True)
        .values_list("role", flat=True)
        .first()
    )


def project_role(user, slug, project_id):
    return (
        ProjectMember.objects.filter(workspace__slug=slug, project_id=project_id, member=user, is_active=True)
        .values_list("role", flat=True)
        .first()
    )


class WikiPermission(BasePermission):
    """Workspace pages and collections: workspace admins and members. Guests do
    not see the wiki, as in Plane."""

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False
        return workspace_role(request.user, view.workspace_slug) in (ADMIN, MEMBER)


def visible_collections(user, slug):
    return (
        Collection.objects.filter(workspace__slug=slug)
        .filter(
            Q(access=COLLECTION_PUBLIC)
            | Q(owned_by=user)
            | Exists(CollectionMember.objects.filter(collection_id=OuterRef("pk"), member=user))
        )
        .distinct()
    )


def collection_user_access(collection, user):
    """The user's CollectionMemberAccessEnum level, or None when the collection is hidden from them."""
    if collection.owned_by_id == user.id:
        return MEMBER_EDIT
    member = CollectionMember.objects.filter(collection=collection, member=user).first()
    if member:
        return member.access
    if collection.access == COLLECTION_PUBLIC:
        return MEMBER_EDIT
    return None


def wiki_pages(user, slug):
    """Workspace pages the user may see: their own, and public ones that are not
    filed in a collection hidden from them."""
    return (
        annotate_pages(Page.objects.filter(workspace__slug=slug, is_global=True))
        .filter(
            Q(owned_by=user)
            | Q(access=Page.PUBLIC_ACCESS)
            & (
                Q(nexus_collection_id__isnull=True)
                | Q(nexus_collection_id__in=visible_collections(user, slug).values("id"))
            )
        )
        .select_related("workspace")
    )


def project_pages(user, slug, project_id, role):
    """Project pages the user may see, following PageViewSet: their own and public
    ones; a guest only their own unless the project lets guests view everything."""
    qs = annotate_pages(
        Page.objects.filter(workspace__slug=slug).filter(
            Exists(ProjectPage.objects.filter(page_id=OuterRef("pk"), project_id=project_id))
        )
    )
    if role == GUEST and not Project.objects.filter(pk=project_id, guest_view_all_features=True).exists():
        return qs.filter(owned_by=user)
    return qs.filter(Q(owned_by=user) | Q(access=Page.PUBLIC_ACCESS))


def descendant_ids(page_id):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            WITH RECURSIVE descendants AS (
                SELECT id FROM pages WHERE parent_id = %s AND deleted_at IS NULL
                UNION ALL
                SELECT pages.id FROM pages, descendants
                WHERE pages.parent_id = descendants.id AND pages.deleted_at IS NULL
            )
            SELECT id FROM descendants
            """,
            [page_id],
        )
        return [row[0] for row in cursor.fetchall()]


def private_collection_blockers(user, page_ids, target):
    """Public pages, among `page_ids` and their sub-pages (which are filed along with
    them), that filing into `target` would move into or out of a private collection
    and that `user` does not own. Only a page's owner may change who can see it."""
    ids = set(page_ids)
    for page_id in page_ids:
        ids.update(descendant_ids(page_id))
    current = dict(PageCollection.objects.filter(page_id__in=ids).values_list("page_id", "collection_id"))
    private = set(
        Collection.objects.filter(pk__in={*current.values(), target.id}, access=COLLECTION_PRIVATE).values_list(
            "id", flat=True
        )
    )
    blockers = []
    for page_id in (
        Page.objects.filter(pk__in=ids, access=Page.PUBLIC_ACCESS).exclude(owned_by=user).values_list("id", flat=True)
    ):
        source = current.get(page_id)
        if source != target.id and (target.id in private or source in private):
            blockers.append(str(page_id))
    return blockers


def keep_private(page_ids):
    """Pages leaving a private collection for no other collection stay hidden from
    the workspace: their access becomes private, so only their owners see them."""
    Page.objects.filter(pk__in=page_ids, access=Page.PUBLIC_ACCESS).update(access=Page.PRIVATE_ACCESS)


# ── Pages ────────────────────────────────────────────────────────────────────


class _PageScope:
    """What differs between workspace and project pages; the views share the rest."""

    def visible_pages(self, request):
        raise NotImplementedError

    def can_edit(self, request, page) -> bool:
        return True

    def is_admin(self, request) -> bool:
        raise NotImplementedError

    def get_page(self, request, page_id):
        return get_object_or_404(self.visible_pages(request), pk=page_id)

    def respond(self, request, page_id, http_status=status.HTTP_200_OK):
        return Response(page_data(self.visible_pages(request).get(pk=page_id)), status=http_status)

    # shared operations

    def update_page(self, request, page_id):
        page = self.get_page(request, page_id)
        serializer = PageUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        if not self.can_edit(request, page):
            return self.error("You do not have edit access to this page.", http_status=status.HTTP_403_FORBIDDEN)
        if page.is_locked and set(data) - {"is_locked"}:
            return self.error("Page is locked", code="PAGE_LOCKED")
        if page.archived_at:
            return self.error("Page is archived", code="PAGE_ARCHIVED")
        if "access" in data and data["access"] != page.access and page.owned_by_id != request.user.id:
            return self.error("Access cannot be updated since this page is owned by someone else")

        old_html = page.description_html
        content_changes = False
        if "description_html" in data:
            html, error = clean_html(data.pop("description_html"))
            if error:
                return self.error(error)
            content_changes = content_changes or html != page.description_html
            page.description_html = html
        if "name" in data and data["name"] != page.name:
            content_changes = True
        for field, value in data.items():
            setattr(page, field, value)

        if content_changes:
            if not release_live_document(page.id):
                return self.error(
                    "The page is open in the editor and the live collaboration server did not release it. "
                    "Nothing was written; try again.",
                    code="LIVE_SERVER_BUSY",
                    http_status=status.HTTP_502_BAD_GATEWAY,
                )
            # The live server rebuilds the Yjs document from description_html and name.
            page.description_binary = None
            page.description_json = {}
        page.save()
        if content_changes and not release_live_document(page.id):
            # An editor reconnected between the release above and this write, and the live
            # server would not let go of the copy it loaded. The write itself is stored.
            logger.warning("Live document %s still held after an API write", page.id)

        if content_changes and page.description_html != old_html:
            page_transaction.delay(
                new_description_html=page.description_html, old_description_html=old_html, page_id=str(page.id)
            )
            track_page_version.delay(
                page_id=str(page.id),
                existing_instance=json.dumps({"description_html": old_html}),
                user_id=str(request.user.id),
            )
        return self.respond(request, page.id)

    def archive_page(self, request, page_id):
        page = self.get_page(request, page_id)
        if page.owned_by_id != request.user.id and not self.is_admin(request):
            return self.error("Only the owner or admin can archive the page")
        UserFavorite.objects.filter(
            entity_type="page", entity_identifier=page.id, workspace__slug=self.workspace_slug
        ).delete()
        now = datetime.now()
        unarchive_archive_page_and_descendants(page.id, now)
        return Response({"archived_at": str(now)}, status=status.HTTP_200_OK)

    def unarchive_page(self, request, page_id):
        page = self.get_page(request, page_id)
        if page.owned_by_id != request.user.id and not self.is_admin(request):
            return self.error("Only the owner or admin can un archive the page")
        if page.parent_id and page.parent.archived_at:
            page.parent = None
            page.save(update_fields=["parent"])
        unarchive_archive_page_and_descendants(page.id, None)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete_page(self, request, page_id):
        page = self.get_page(request, page_id)
        if page.archived_at is None:
            return self.error("The page should be archived before deleting")
        if page.owned_by_id != request.user.id and not self.is_admin(request):
            return self.error("Only admin or owner can delete the page", http_status=status.HTTP_403_FORBIDDEN)
        with transaction.atomic():
            Page.objects.filter(parent_id=page.id).update(parent=None)
            now = timezone.now()
            PageCollection.objects.filter(page=page).update(deleted_at=now)
            WorkItemPage.objects.filter(page=page).update(deleted_at=now)
            page.delete()
            UserFavorite.objects.filter(entity_identifier=page.id, entity_type="page").delete()
            UserRecentVisit.objects.filter(entity_identifier=page.id, entity_name="page").delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def new_page(self, request, data, html, **extra):
        return Page.objects.create(
            workspace_id=extra.pop("workspace_id"),
            name=data["name"],
            description_html=html,
            # No binary: the live server builds it from the HTML on first open,
            # exactly as for a page created in the web app.
            description_binary=None,
            owned_by=request.user,
            access=data.get("access", Page.PUBLIC_ACCESS),
            color=data.get("color", ""),
            is_locked=data.get("is_locked", False),
            view_props=data.get("view_props") or {"full_width": False},
            logo_props=data.get("logo_props") or {},
            external_id=data.get("external_id"),
            external_source=data.get("external_source"),
            **extra,
        )


class WorkspacePageScope(_PageScope):
    def visible_pages(self, request):
        return wiki_pages(request.user, self.workspace_slug)

    def is_admin(self, request):
        return workspace_role(request.user, self.workspace_slug) == ADMIN

    def can_edit(self, request, page):
        if page.owned_by_id == request.user.id:
            return True
        link = PageCollection.objects.filter(page=page).select_related("collection").first()
        return link is None or collection_user_access(link.collection, request.user) == MEMBER_EDIT


class ProjectPageScope(_PageScope):
    def role(self, request):
        if not hasattr(self, "_role"):
            self._role = project_role(request.user, self.workspace_slug, self.project_id)
        return self._role

    def visible_pages(self, request):
        return project_pages(request.user, self.workspace_slug, self.project_id, self.role(request))

    def is_admin(self, request):
        return self.role(request) == ADMIN


class WorkspacePageListEndpoint(WorkspacePageScope, NexusAPIView):
    permission_classes = [WikiPermission]

    def get(self, request, slug):
        return self.paginated(request, self.visible_pages(request).order_by("-created_at"), _PageRows)

    def post(self, request, slug):
        serializer = PageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        html, error = clean_html(data["description_html"])
        if error:
            return self.error(error)

        parent, collection = None, None
        if data.get("parent_id"):
            parent = self.visible_pages(request).filter(pk=data["parent_id"]).first()
            if parent is None:
                return self.error("Parent page not found", http_status=status.HTTP_404_NOT_FOUND)
            link = PageCollection.objects.filter(page=parent).select_related("collection").first()
            collection = link.collection if link else None
        elif data.get("collection_id"):
            collection = visible_collections(request.user, slug).filter(pk=data["collection_id"]).first()
            if collection is None:
                return self.error("Collection not found", http_status=status.HTTP_404_NOT_FOUND)
        if collection is not None and collection_user_access(collection, request.user) != MEMBER_EDIT:
            return self.error("You do not have edit access to this collection.", http_status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            page = self.new_page(
                request, data, html, workspace_id=self.get_workspace().id, is_global=True, parent=parent
            )
            if collection is not None:
                PageCollection.objects.create(workspace_id=page.workspace_id, collection=collection, page=page)
        page_transaction.delay(new_description_html=html, old_description_html=None, page_id=str(page.id))
        return self.respond(request, page.id, status.HTTP_201_CREATED)


class WorkspacePageDetailEndpoint(WorkspacePageScope, NexusAPIView):
    permission_classes = [WikiPermission]

    def get(self, request, slug, page_id):
        return Response(page_data(self.get_page(request, page_id)))

    def put(self, request, slug, page_id):
        return self.update_page(request, page_id)

    patch = put

    def delete(self, request, slug, page_id):
        return self.delete_page(request, page_id)


class WorkspacePageArchiveEndpoint(WorkspacePageScope, NexusAPIView):
    permission_classes = [WikiPermission]

    def post(self, request, slug, page_id):
        return self.archive_page(request, page_id)

    def delete(self, request, slug, page_id):
        return self.unarchive_page(request, page_id)


class ProjectPageListEndpoint(ProjectPageScope, NexusAPIView):
    permission_classes = [ProjectEntityPermission]

    def get(self, request, slug, project_id):
        return self.paginated(request, self.visible_pages(request).order_by("-created_at"), _PageRows)

    def post(self, request, slug, project_id):
        project = self.get_project()
        serializer = PageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        if data.get("collection_id"):
            return self.error("Collections hold workspace pages only. Omit project_id, or omit collection_id.")
        html, error = clean_html(data["description_html"])
        if error:
            return self.error(error)
        parent = None
        if data.get("parent_id"):
            parent = self.visible_pages(request).filter(pk=data["parent_id"]).first()
            if parent is None:
                return self.error("Parent page not found", http_status=status.HTTP_404_NOT_FOUND)

        # The same rows PageSerializer.create writes for the web app.
        with transaction.atomic():
            page = self.new_page(request, data, html, workspace_id=project.workspace_id, parent=parent)
            ProjectPage.objects.create(
                workspace_id=project.workspace_id,
                project_id=project.id,
                page_id=page.id,
                created_by_id=page.created_by_id,
                updated_by_id=page.updated_by_id,
            )
        page_transaction.delay(new_description_html=html, old_description_html=None, page_id=str(page.id))
        return self.respond(request, page.id, status.HTTP_201_CREATED)


class ProjectPageDetailEndpoint(ProjectPageScope, NexusAPIView):
    permission_classes = [ProjectEntityPermission]

    def get(self, request, slug, project_id, page_id):
        return Response(page_data(self.get_page(request, page_id)))

    def put(self, request, slug, project_id, page_id):
        return self.update_page(request, page_id)

    patch = put

    def delete(self, request, slug, project_id, page_id):
        return self.delete_page(request, page_id)


class ProjectPageArchiveEndpoint(ProjectPageScope, NexusAPIView):
    permission_classes = [ProjectEntityPermission]

    def post(self, request, slug, project_id, page_id):
        return self.archive_page(request, page_id)

    def delete(self, request, slug, project_id, page_id):
        return self.unarchive_page(request, page_id)


class _PageRows:
    """Adapts page_data to NexusAPIView.paginated's serializer_class(rows, many=True).data."""

    def __init__(self, rows, many=True):
        self.data = [page_data(row) for row in rows]


# ── Work item ↔ page links ───────────────────────────────────────────────────


class _WorkItemPageRows:
    def __init__(self, rows, many=True):
        self.data = [work_item_page_data(row) for row in rows]


class WorkItemPageEndpoint(NexusAPIView):
    permission_classes = [ProjectEntityPermission]

    def get_issue(self, work_item_id):
        return get_object_or_404(
            Issue.objects, pk=work_item_id, project_id=self.project_id, workspace__slug=self.workspace_slug
        )

    def links(self, request, issue):
        return (
            WorkItemPage.objects.filter(
                issue=issue,
                project_id=self.project_id,
                workspace__slug=self.workspace_slug,
                page__deleted_at__isnull=True,
            )
            .filter(Q(page__owned_by=request.user) | Q(page__access=Page.PUBLIC_ACCESS))
            .select_related("page")
        )

    def get(self, request, slug, project_id, work_item_id):
        issue = self.get_issue(work_item_id)
        return self.paginated(request, self.links(request, issue).order_by("-created_at"), _WorkItemPageRows)

    def post(self, request, slug, project_id, work_item_id):
        issue = self.get_issue(work_item_id)
        serializer = WorkItemPageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        page_id = serializer.validated_data["page_id"]
        role = project_role(request.user, slug, project_id)
        page = project_pages(request.user, slug, project_id, role).filter(pk=page_id).first()
        if page is None and workspace_role(request.user, slug) in (ADMIN, MEMBER):
            page = wiki_pages(request.user, slug).filter(pk=page_id).first()
        if page is None:
            return self.error("Page not found", http_status=status.HTTP_404_NOT_FOUND)
        link, created = WorkItemPage.objects.get_or_create(
            issue=issue,
            page=page,
            defaults={"project_id": issue.project_id, "workspace_id": issue.workspace_id},
        )
        return Response(work_item_page_data(link), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class WorkItemPageDetailEndpoint(WorkItemPageEndpoint):
    def get(self, request, slug, project_id, work_item_id, work_item_page_id):
        issue = self.get_issue(work_item_id)
        return Response(work_item_page_data(get_object_or_404(self.links(request, issue), pk=work_item_page_id)))

    def delete(self, request, slug, project_id, work_item_id, work_item_page_id):
        issue = self.get_issue(work_item_id)
        link = get_object_or_404(self.links(request, issue), pk=work_item_page_id)
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Collections ──────────────────────────────────────────────────────────────


class _CollectionBase(NexusAPIView):
    permission_classes = [WikiPermission]

    def get_collection(self, request, collection_id):
        return get_object_or_404(visible_collections(request.user, self.workspace_slug), pk=collection_id)

    def render(self, request, collection, http_status=status.HTTP_200_OK):
        return Response(self.render_data(request, collection), status=http_status)

    def render_data(self, request, collection):
        has_pages = PageCollection.objects.filter(collection=collection, page__deleted_at__isnull=True).exists()
        return collection_data(collection, collection_user_access(collection, request.user), has_pages)

    def forbidden(self, what="edit this collection"):
        return self.error(f"You do not have permission to {what}.", http_status=status.HTTP_403_FORBIDDEN)


class CollectionListEndpoint(_CollectionBase):
    def get(self, request, slug):
        rows = visible_collections(request.user, slug).order_by("sort_order", "created_at")
        return Response([self.render_data(request, row) for row in rows])

    def post(self, request, slug):
        serializer = CollectionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        workspace = self.get_workspace()
        with transaction.atomic():
            collection = Collection.objects.create(
                workspace=workspace,
                name=data["name"],
                access=data.get("access", COLLECTION_PUBLIC),
                logo_props=data.get("logo_props") or {},
                owned_by=request.user,
            )
            CollectionMember.objects.create(
                workspace=workspace, collection=collection, member=request.user, access=MEMBER_EDIT
            )
        return self.render(request, collection, status.HTTP_201_CREATED)


class CollectionDetailEndpoint(_CollectionBase):
    def get(self, request, slug, collection_id):
        return self.render(request, self.get_collection(request, collection_id))

    def patch(self, request, slug, collection_id):
        collection = self.get_collection(request, collection_id)
        if isinstance(request.data, dict) and "access" in request.data:
            return self.error("A collection's access cannot be changed after creation.")
        if collection_user_access(collection, request.user) != MEMBER_EDIT:
            return self.forbidden()
        serializer = CollectionUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for field, value in serializer.validated_data.items():
            setattr(collection, field, value)
        collection.save()
        return self.render(request, collection)

    def delete(self, request, slug, collection_id):
        collection = self.get_collection(request, collection_id)
        if collection.owned_by_id != request.user.id and workspace_role(request.user, slug) != ADMIN:
            return self.forbidden("delete this collection")
        archive = request.query_params.get("archive_pages", "true").lower() != "false"
        if collection.access == COLLECTION_PRIVATE:
            archive = True
        now = timezone.now()
        with transaction.atomic():
            links = PageCollection.objects.filter(collection=collection)
            page_ids = list(links.values_list("page_id", flat=True))
            if archive:
                for page_id in page_ids:
                    unarchive_archive_page_and_descendants(page_id, datetime.now())
            if collection.access == COLLECTION_PRIVATE:
                keep_private(page_ids)
            links.update(deleted_at=now)
            CollectionMember.objects.filter(collection=collection).update(deleted_at=now)
            collection.deleted_at = now
            collection.save(update_fields=["deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionMemberListEndpoint(_CollectionBase):
    def get(self, request, slug, collection_id):
        collection = self.get_collection(request, collection_id)
        rows = CollectionMember.objects.filter(collection=collection).order_by("created_at")
        return Response([collection_member_data(row) for row in rows])

    def post(self, request, slug, collection_id):
        collection = self.get_collection(request, collection_id)
        if collection_user_access(collection, request.user) != MEMBER_EDIT:
            return self.forbidden("manage this collection's members")
        serializer = CollectionMemberCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        if not WorkspaceMember.objects.filter(workspace__slug=slug, member_id=data["member"], is_active=True).exists():
            return self.error("The user is not a member of this workspace.")
        if CollectionMember.objects.filter(collection=collection, member_id=data["member"]).exists():
            return self.error("The user is already a member of this collection.", code="ALREADY_MEMBER")
        row = CollectionMember.objects.create(
            workspace_id=collection.workspace_id, collection=collection, member_id=data["member"], access=data["access"]
        )
        return Response(collection_member_data(row), status=status.HTTP_201_CREATED)


class CollectionMemberDetailEndpoint(_CollectionBase):
    def get_member(self, request, collection_id, member_id):
        collection = self.get_collection(request, collection_id)
        row = get_object_or_404(CollectionMember.objects, pk=member_id, collection=collection)
        return collection, row

    def patch(self, request, slug, collection_id, member_id):
        collection, row = self.get_member(request, collection_id, member_id)
        if collection_user_access(collection, request.user) != MEMBER_EDIT:
            return self.forbidden("manage this collection's members")
        serializer = CollectionMemberUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if row.member_id == collection.owned_by_id:
            return self.error("The owner's access cannot be changed.")
        row.access = serializer.validated_data["access"]
        row.save()
        return Response(collection_member_data(row))

    def delete(self, request, slug, collection_id, member_id):
        collection, row = self.get_member(request, collection_id, member_id)
        if collection_user_access(collection, request.user) != MEMBER_EDIT:
            if row.member_id != request.user.id:
                return self.forbidden("manage this collection's members")
            if collection.access == COLLECTION_PUBLIC:
                # Without the row a member falls back to the public default (edit), so leaving
                # would lift the access an editor set.
                return self.error(
                    "You cannot leave a public collection: everyone in the workspace can open it. "
                    "Ask one of its editors to change your access instead.",
                    http_status=status.HTTP_403_FORBIDDEN,
                )
        if row.member_id == collection.owned_by_id:
            return self.error("The owner cannot be removed from the collection.")
        row.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class _BranchRows:
    def __init__(self, rows, many=True):
        self.data = [collection_branch_page_data(row) for row in rows]


def _file_with_descendants(link, collection):
    """Keep a page's sub-pages in the collection the page is filed in."""
    for child_id in descendant_ids(link.page_id):
        child = PageCollection.objects.filter(page_id=child_id).first()
        if child is None:
            PageCollection.objects.create(workspace_id=link.workspace_id, collection=collection, page_id=child_id)
        elif child.collection_id != collection.id:
            child.collection = collection
            child.save(update_fields=["collection", "updated_at"])


class CollectionPageListEndpoint(_CollectionBase):
    def get(self, request, slug, collection_id):
        collection = self.get_collection(request, collection_id)
        visible = wiki_pages(request.user, slug).filter(archived_at__isnull=True).values("id")
        rows = PageCollection.objects.filter(collection=collection, page_id__in=visible).select_related("page")
        parent_id = request.query_params.get("parent_id")
        rows = rows.filter(page__parent_id=parent_id) if parent_id else rows.filter(page__parent__isnull=True)
        if search := request.query_params.get("search"):
            rows = rows.filter(page__name__icontains=search)
        return self.paginated(request, rows.order_by("sort_order", "created_at"), _BranchRows)

    def post(self, request, slug, collection_id):
        collection = self.get_collection(request, collection_id)
        if collection_user_access(collection, request.user) != MEMBER_EDIT:
            return self.forbidden()
        serializer = CollectionPagesAddSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        page_ids = list(dict.fromkeys(serializer.validated_data["page_ids"]))
        sort_orders = serializer.validated_data.get("sort_orders") or {}
        pages = {page.id: page for page in wiki_pages(request.user, slug).filter(pk__in=page_ids)}
        missing = [str(pid) for pid in page_ids if pid not in pages]
        if missing:
            return self.error(
                f"Workspace page(s) not found: {', '.join(missing)}", http_status=status.HTTP_404_NOT_FOUND
            )
        elsewhere = PageCollection.objects.filter(page_id__in=page_ids).exclude(collection=collection)
        if elsewhere.exists():
            names = ", ".join(str(row.page_id) for row in elsewhere)
            return self.error(
                f"Page(s) already filed in another collection: {names}. Move them with "
                "PATCH collections/<collection_id>/pages/<page_collection_id>/.",
                code="PAGE_IN_OTHER_COLLECTION",
            )
        blockers = private_collection_blockers(request.user, page_ids, collection)
        if blockers:
            return self.error(
                "Filing these pages would change who can see them, and only a page's owner can do that "
                f"(sub-pages are filed with their parent). Not yours: {', '.join(blockers)}.",
                code="NOT_PAGE_OWNER",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        rows = []
        with transaction.atomic():
            for pid in page_ids:
                row = PageCollection.objects.filter(page_id=pid, collection=collection).first()
                order = sort_orders.get(str(pid))
                if row is None:
                    row = PageCollection.objects.create(
                        workspace_id=collection.workspace_id,
                        collection=collection,
                        page_id=pid,
                        **({"sort_order": order} if order is not None else {}),
                    )
                elif order is not None:
                    row.sort_order = order
                    row.save(update_fields=["sort_order", "updated_at"])
                _file_with_descendants(row, collection)
                rows.append(row)
        return Response([collection_page_data(row) for row in rows], status=status.HTTP_201_CREATED)


class CollectionPageDetailEndpoint(_CollectionBase):
    def get_link(self, request, collection_id, page_collection_id):
        collection = self.get_collection(request, collection_id)
        visible = wiki_pages(request.user, self.workspace_slug).values("id")
        row = get_object_or_404(
            PageCollection.objects, pk=page_collection_id, collection=collection, page_id__in=visible
        )
        return collection, row

    def patch(self, request, slug, collection_id, page_collection_id):
        collection, row = self.get_link(request, collection_id, page_collection_id)
        if collection_user_access(collection, request.user) != MEMBER_EDIT:
            return self.forbidden()
        serializer = CollectionPageUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        with transaction.atomic():
            if data.get("collection") and data["collection"] != collection.id:
                target = visible_collections(request.user, slug).filter(pk=data["collection"]).first()
                if target is None:
                    return self.error("Collection not found", http_status=status.HTTP_404_NOT_FOUND)
                if collection_user_access(target, request.user) != MEMBER_EDIT:
                    return self.forbidden("file pages in the target collection")
                blockers = private_collection_blockers(request.user, [row.page_id], target)
                if blockers:
                    return self.error(
                        "Moving this page would change who can see it, and only a page's owner can do that "
                        f"(sub-pages move with their parent). Not yours: {', '.join(blockers)}.",
                        code="NOT_PAGE_OWNER",
                        http_status=status.HTTP_403_FORBIDDEN,
                    )
                row.collection = target
                _file_with_descendants(row, target)
            if "sort_order" in data:
                row.sort_order = data["sort_order"]
            row.save()
        return Response(collection_page_data(row))

    def delete(self, request, slug, collection_id, page_collection_id):
        collection, row = self.get_link(request, collection_id, page_collection_id)
        if collection_user_access(collection, request.user) != MEMBER_EDIT:
            return self.forbidden()
        with transaction.atomic():
            children = PageCollection.objects.filter(page_id__in=descendant_ids(row.page_id), collection=collection)
            if collection.access == COLLECTION_PRIVATE:
                keep_private([row.page_id, *children.values_list("page_id", flat=True)])
            children.delete(soft=False)
            row.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionPageSearchEndpoint(_CollectionBase):
    """Workspace pages that can be added: visible, not archived, filed nowhere."""

    def get(self, request, slug, collection_id):
        self.get_collection(request, collection_id)
        pages = wiki_pages(request.user, slug).filter(archived_at__isnull=True, nexus_collection_id__isnull=True)
        if search := request.query_params.get("search"):
            pages = pages.filter(name__icontains=search)
        return Response(
            [
                {"id": str(page.id), "name": page.name, "logo_props": page.logo_props}
                for page in pages.order_by("name")[:100]
            ]
        )


# ── Estimates (Plane's own public views, unregistered in CE) ─────────────────


class NexusProjectEstimateEndpoint(ProjectEstimateAPIEndpoint):
    """CE's estimate view. A project can hold several estimates (the web app
    keeps old ones when switching), so "the" estimate is the active one."""

    serializer_class = NexusEstimateSerializer

    def get_queryset(self):
        active = Project.objects.filter(pk=self.project_id).values_list("estimate_id", flat=True).first()
        return (
            super()
            .get_queryset()
            .annotate(nexus_active=Case(When(pk=active, then=1), default=0, output_field=IntegerField()))
            .order_by("-nexus_active", "-last_used", "-created_at")
        )

    def delete(self, request, slug, project_id):
        estimate = self.get_queryset().first()
        if estimate is not None:
            Project.objects.filter(pk=project_id, estimate_id=estimate.id).update(estimate=None)
        return super().delete(request, slug, project_id)


class NexusEstimatePointListCreateEndpoint(EstimatePointListCreateAPIEndpoint):
    pass


class NexusEstimatePointDetailEndpoint(EstimatePointDetailAPIEndpoint):
    pass
