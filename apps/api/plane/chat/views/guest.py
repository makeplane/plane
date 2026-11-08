# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Per-guest chat grants: which guests may open DMs. Workspace admins only."""

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions.base import ROLE
from plane.chat.exceptions import BadRequest, Forbidden, NotFound
from plane.chat.models import ChatGuestPermission
from plane.chat.permissions import is_workspace_admin
from plane.chat.serializers import ChatGuestPermissionSerializer
from plane.chat.views.base import ChatBaseEndpoint
from plane.db.models import WorkspaceMember


class GuestAdminEndpoint(ChatBaseEndpoint):
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        # plane.app's WorkSpaceAdminPermission also lets members through, so check the role here.
        if not is_workspace_admin(self.role):
            raise Forbidden("Only a workspace admin can manage guests' chat access.")


class GuestDmAccessListEndpoint(GuestAdminEndpoint):
    def get(self, request, slug):
        """Every guest who has been granted DM access in this workspace."""
        grants = ChatGuestPermission.objects.filter(workspace__slug=slug, can_open_dms=True).order_by("created_at")
        return Response(ChatGuestPermissionSerializer(grants, many=True).data)


class GuestDmAccessEndpoint(GuestAdminEndpoint):
    def put(self, request, slug, user_id):
        """Let an active guest of this workspace open DMs and group DMs. Granting twice is a no-op."""
        role = (
            WorkspaceMember.objects.filter(workspace__slug=slug, member_id=user_id, is_active=True)
            .values_list("role", flat=True)
            .first()
        )
        if role is None:
            raise NotFound("Guest not found.")
        if role >= ROLE.MEMBER.value:
            raise BadRequest("Workspace members and admins can already open DMs.")

        # get_or_create re-reads the row if a concurrent grant inserted it first.
        grant, _ = ChatGuestPermission.objects.get_or_create(
            workspace=self.workspace, user_id=user_id, defaults={"can_open_dms": True}
        )
        if not grant.can_open_dms:
            grant.can_open_dms = True
            grant.save(update_fields=["can_open_dms", "updated_at", "updated_by"])
        return Response(ChatGuestPermissionSerializer(grant).data)

    def delete(self, request, slug, user_id):
        """Stop a guest opening new DMs. DMs others opened with them keep working. Revoking twice is a no-op."""
        if not WorkspaceMember.objects.filter(workspace__slug=slug, member_id=user_id).exists():
            raise NotFound("Guest not found.")
        for grant in ChatGuestPermission.objects.filter(workspace__slug=slug, user_id=user_id, can_open_dms=True):
            grant.can_open_dms = False
            grant.save(update_fields=["can_open_dms", "updated_at", "updated_by"])
        return Response(status=status.HTTP_204_NO_CONTENT)
