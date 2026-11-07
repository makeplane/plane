# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""What the caller may do in this workspace's chat, so the web app can show or hide its controls."""

from rest_framework.response import Response

from plane.chat.permissions import can_create_channels, can_open_dms, is_workspace_admin
from plane.chat.views.base import ChatBaseEndpoint


class ChatMeEndpoint(ChatBaseEndpoint):
    def get(self, request, slug):
        """The caller's workspace role and chat abilities. The other endpoints enforce the same rules."""
        return Response(
            {
                "workspace_role": self.role,
                "is_workspace_admin": is_workspace_admin(self.role),
                "can_create_channels": can_create_channels(self.role),
                "can_open_dms": can_open_dms(request.user, self.workspace.id, self.role),
            }
        )
