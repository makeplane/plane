# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE
from plane.app.views.base import BaseAPIView
from plane.db.models import Page, Project, ProjectPage


class PageLiveAccessEndpoint(BaseAPIView):
    """Tell the live server whether the session user may open a page's collaboration socket.

    Hocuspocus loads a document once and hands it to every later connection without fetching
    it again, so the live server asks here on every connection with the user's own cookie.
    The rules mirror ProjectPagePermission: an active project member, only the owner for a
    private page, and guests only reach their own pages unless the project enables
    guest_view_all_features. A denial is always a 404 so it never confirms the page exists.

    `?action=view` answers {project_id, read_only}; `?action=edit` answers {project_id} only for a
    user who may change the page. Lock and archive are left to the editor: a read-only flag
    would outlast an unlock. It reads the primary (BaseAPIView.use_read_replica is False), so a
    revoked membership is never granted from a lagging replica.
    """

    def get(self, request, slug, page_id):
        action = request.query_params.get("action")
        if action not in ("view", "edit"):
            return Response({"error": "action must be view or edit"}, status=status.HTTP_400_BAD_REQUEST)

        links = ProjectPage.objects.filter(
            page_id=page_id,
            workspace__slug=slug,
            deleted_at__isnull=True,
            page__deleted_at__isnull=True,
            project__deleted_at__isnull=True,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            project__project_projectmember__deleted_at__isnull=True,
        ).values_list("project_id", "project__project_projectmember__role", "page__owned_by_id", "page__access")

        read_only_link = None
        for project_id, role, owner_id, access in links:
            is_owner = owner_id == request.user.id
            if not is_owner:
                if access == Page.PRIVATE_ACCESS:
                    continue
                if (
                    role == ROLE.GUEST.value
                    and not Project.objects.filter(pk=project_id, guest_view_all_features=True).exists()
                ):
                    continue
            # Guests may view pages they do not own but, like PATCH on the page, never edit them.
            read_only = not is_owner and role == ROLE.GUEST.value
            if action == "edit":
                if read_only:
                    continue
                return Response({"project_id": str(project_id)})
            if read_only:
                # a page linked to several projects: keep looking for a link that allows editing
                read_only_link = read_only_link or project_id
                continue
            return Response({"project_id": str(project_id), "read_only": False})

        if read_only_link:
            return Response({"project_id": str(read_only_link), "read_only": True})
        return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
